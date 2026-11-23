/* ======================= Fiche 3 : hacheur série ======================= */
(() => {
const { C, $, fmt, el, txt, vdevice, resistor, transport, slider } = TD;
const V = 200, R = 10;
const sim = { alpha: 0.5, L: 20, f: 1, dur: 9 };
sim.span = () => 3 / sim.f; // ms (f en kHz)

/* ---- schéma ---- */
const svg = $('f3-sch');
const yT = 60, yB = 240, xS = 60, xD = 230, xR = 400;
const w = el('g', { fill: 'none', stroke: C.ink, 'stroke-width': 2 }, svg);
el('path', { d: `M${xS} 138 V${yT} H150 M200 ${yT} H262 M326 ${yT} H${xR} V112 M${xR} 188 V${yB} H${xS} V162` }, w);
el('path', { d: `M${xD} ${yT} V140 M${xD} 160 V${yB}` }, w);
el('path', { d: 'M262 60 a8 8 0 0 1 16 0 a8 8 0 0 1 16 0 a8 8 0 0 1 16 0 a8 8 0 0 1 16 0', 'stroke-width': 2.2 }, w);
txt(svg, 294, 42, 'L', { 'font-weight': 700 });
el('line', { x1: xS - 18, y1: 140, x2: xS + 18, y2: 140, stroke: C.ink, 'stroke-width': 2 }, svg);
el('line', { x1: xS - 9, y1: 152, x2: xS + 9, y2: 152, stroke: C.ink, 'stroke-width': 5 }, svg);
el('rect', { x: xS - 18, y: 153, width: 36, height: 7, fill: '#fcfcfd' }, svg);
el('line', { x1: xS, y1: 155, x2: xS, y2: 162, stroke: C.ink, 'stroke-width': 2 }, svg);
txt(svg, xS - 26, 136, '+', { 'font-weight': 700, fill: C.muted });
txt(svg, xS - 22, 190, 'V', { 'font-weight': 700, fill: C.blue, 'text-anchor': 'end' });
txt(svg, xS - 22, 206, '200 V', { 'font-size': 11, fill: C.muted, 'text-anchor': 'end' });
el('circle', { cx: 150, cy: yT, r: 3.5, fill: C.ink }, svg); el('circle', { cx: 200, cy: yT, r: 3.5, fill: C.ink }, svg);
const lever = el('line', { x1: 150, y1: yT, x2: 198, y2: yT, stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
txt(svg, 175, 22, 'H', { 'font-weight': 700, fill: C.violet });
txt(svg, 175, 84, 'interrupteur', { 'font-size': 10.5, fill: C.muted });
txt(svg, 175, 97, 'commandé', { 'font-size': 10.5, fill: C.muted });
const diode = vdevice(svg, xD, 150, 'D', 'diode', 'up', 'left');
el('circle', { cx: xD, cy: yT, r: 3, fill: C.ink }, svg); el('circle', { cx: xD, cy: yB, r: 3, fill: C.ink }, svg);
resistor(svg, xR, 112, 188, '');
txt(svg, xR + 22, 155, 'R', { 'text-anchor': 'start', 'font-weight': 700 });
el('path', { d: `M${xD + 28} 226 V82`, stroke: C.green, 'stroke-width': 2, fill: 'none' }, svg);
el('path', { d: `M${xD + 23} 86 L${xD + 28} 76 L${xD + 33} 86 Z`, fill: C.green }, svg);
txt(svg, xD + 40, 158, 'u', { fill: C.green, 'font-weight': 700, 'font-size': 15, 'text-anchor': 'start' });
const iArrow = el('g', {}, svg);
el('path', { d: `M340 48 H372`, stroke: C.blue, 'stroke-width': 2 }, iArrow);
el('path', { d: `M370 43 L380 48 L370 53 Z`, fill: C.blue }, iArrow);
txt(iArrow, 356, 40, 'i', { fill: C.blue, 'font-weight': 700 });
const msg2 = txt(svg, 235, 282, '', { 'font-size': 13, 'font-weight': 600 });
const dotsG = el('g', {}, svg), dots = []; for (let k = 0; k < 30; k++) dots.push(el('circle', { r: 3.6, opacity: 0 }, dotsG));
let off = 0;
function flow(pts, rate, col, dt) {
  const seg = []; let L = 0; for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], b = pts[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, l, L]); L += l; }
  off = (off + dt * 150 * rate) % 40;
  dots.forEach((d, k) => { const s = (k * 40 + off) % L; if (k * 40 > L) { d.setAttribute('opacity', 0); return; } const [a, b, l, s0] = seg.find(g => s <= g[3] + g[2]) || seg[seg.length - 1], u = (s - s0) / l; d.setAttribute('cx', a[0] + (b[0] - a[0]) * u); d.setAttribute('cy', a[1] + (b[1] - a[1]) * u); d.setAttribute('opacity', .85); d.setAttribute('fill', col); });
}

/* ---- modèle R-L exact en régime permanent ---- */
function model() {
  const T = 1 / sim.f, tau = sim.L / R, a = sim.alpha; // ms
  const Imax = V / R * (1 - Math.exp(-a * T / tau)) / (1 - Math.exp(-T / tau)), Imin = Imax * Math.exp(-(1 - a) * T / tau);
  return { T, tau, a, Imax, Imin };
}
let M = model();
function at(t) {
  const tp = ((t % M.T) + M.T) % M.T, on = tp < M.a * M.T;
  const i = on ? V / R + (M.Imin - V / R) * Math.exp(-tp / M.tau) : M.Imax * Math.exp(-(tp - M.a * M.T) / M.tau);
  return { on, u: on ? V : 0, i, iH: on ? i : 0, iD: on ? 0 : i };
}

sim.draw = (dt = 0) => {
  M = model();
  const s = at(sim.t);
  lever.setAttribute('x2', s.on ? 198 : 192); lever.setAttribute('y2', s.on ? yT : 34); lever.setAttribute('stroke', s.on ? C.green : C.red);
  diode.set(s.on ? 'off' : 'on');
  const rate = s.i / 20 + 0.15;
  flow(s.on ? [[xS, 162], [xS, yB], [xR, yB], [xR, yT], [xS, yT], [xS, 138]].reverse() : [[xD, yB], [xD, yT], [xR, yT], [xR, yB], [xD, yB]], rate, s.on ? C.green : C.orange, dt);
  msg2.textContent = s.on ? 'H fermé : la source alimente la charge' : 'H ouvert : roue libre par la diode D';
  msg2.setAttribute('fill', s.on ? C.green : C.orange);
  $('f3-badge').textContent = s.on ? 'Phase 1 : H fermé, D bloquée' : 'Phase 2 : H ouvert, D conduit';
  $('f3-badge').style.background = s.on ? C.green : C.orange;
  const di = M.Imax - M.Imin, diTh = sim.alpha * (1 - sim.alpha) * V / (sim.L * sim.f);
  $('f3-vals').innerHTML = `<div><span>u(t)</span><b>${fmt(s.u, 0)} V</b></div><div><span>i(t)</span><b>${fmt(s.i, 2)} A</b></div><div><span>⟨u⟩ = αV</span><b>${fmt(sim.alpha * V, 0)} V</b></div><div><span>⟨i⟩ = ⟨u⟩/R</span><b>${fmt(sim.alpha * V / R, 1)} A</b></div><div><span>Δi relevée</span><b>${fmt(di, 2)} A</b></div><div><span>Δi ≈ α(1−α)V/(Lf)</span><b>${fmt(diTh, 2)} A</b></div>`;
  $('f3-msg').innerHTML = s.on
    ? 'H est fermé : u = V = 200 V. La diode est polarisée en inverse. L’inductance stocke de l’énergie, <b>le courant croît</b>.'
    : 'H est ouvert : l’inductance s’oppose à l’annulation du courant et le fait passer par la diode de roue libre. u = 0, <b>le courant décroît</b> sans s’annuler.';
  const span = sim.span(), ticks = [0, 1, 2, 3].map(k => [k * M.T, k === 0 ? '0' : (k === 1 ? 'T' : k + 'T') + ` = ${fmt(k * M.T, k * M.T < 10 ? 1 : 0)} ms`]);
  const sh = []; for (let k = 0; k < 3; k++) sh.push([k * M.T, (k + sim.alpha) * M.T, '#e6f4ec']);
  TD.scope($('f3-scope'), { h: 430, span, cursor: sim.t, ticks, N: 900, panels: [
    { w: 0.4, min: -0.2, max: 1.7, yticks: [], label: 'commande de H', shade: sh, traces: [{ f: t => at(t).on ? 1 : 0, c: C.violet }] },
    { w: 0.9, min: -15, max: 250, yticks: [0, 100, 200], label: 'u (V)', shade: sh, traces: [{ f: () => sim.alpha * V, c: C.green, w: 1, dash: [5, 4], nodot: true }, { f: t => at(t).u, c: C.green, w: 3 }] },
    { w: 1, min: 0, max: 21, yticks: [0, 5, 10, 15, 20], label: 'i (A)', shade: sh, traces: [{ f: () => sim.alpha * V / R, c: C.blue, w: 1, dash: [5, 4], nodot: true }, { f: t => at(t).i, c: C.blue, w: 2.5 }] },
    { w: 0.9, min: -0.5, max: 21, yticks: [0, 10, 20], label: 'i_H et i_D (A)', shade: sh, traces: [{ f: t => at(t).iH, c: C.orange }, { f: t => at(t).iD, c: C.red }] }
  ] });
};

transport('f3', sim);
slider('f3-alpha', v => { sim.alpha = v; }, v => v.toFixed(2).replace('.', ','));
slider('f3-L', v => { sim.L = v; }, v => v + ' mH');
slider('f3-f', v => { sim.f = v; sim.t = sim.t % sim.span(); }, v => fmt(v, 1) + ' kHz');
TD.register('hacheur', sim);
const cfg = (a, L, f) => () => { TD.setSlider('f3-alpha', a); TD.setSlider('f3-L', L); TD.setSlider('f3-f', f); };
TD.stepper('f3', sim, [
  { title: 'Phase 1 : H fermé, la source alimente la charge', setup: cfg(0.5, 20, 1), t: 0.1,
    text: '<p>V = 200 V, charge R = 10 Ω en série avec L = 20 mH, f = 1 kHz (T = 1 ms), α = 0,5.</p><p>H est fermé : la charge est reliée directement à la source, <b>u = V = 200 V</b>. La cathode de la diode est à +200 V et son anode à 0 : v<sub>D</sub> = −200 V, <b>D est bloquée</b>.</p><p>Loi des mailles : V = R·i + L·di/dt. Comme V &gt; R·i, di/dt &gt; 0 : <b>le courant croît</b>.</p>',
    obs: 'Dans quel composant passe le courant de la charge ?', ans: 'Dans le transistor H : i<sub>H</sub> = i, i<sub>D</sub> = 0 (dernier graphique).' },
  { title: 'Fin de la phase 1 : le courant est maximal', setup: cfg(0.5, 20, 1), t: 0.49,
    text: '<p>Juste avant l’ouverture de H (t = αT = 0,5 ms), le courant atteint sa valeur maximale I<sub>max</sub> ≈ 11,2 A. L’inductance a stocké l’énergie ½·L·I².</p>',
    obs: 'Lire la valeur de i à cet instant.', ans: 'i ≈ 11,2 A : c’est I<sub>max</sub>.' },
  { title: 'Phase 2 : H ouvert, roue libre par la diode', setup: cfg(0.5, 20, 1), t: 0.6,
    text: '<p>H s’ouvre. Le courant dans l’inductance ne peut pas s’annuler brusquement : il force le passage par la diode D, qui devient <b>passante</b>. C’est la <b>roue libre</b>.</p><p>u = 0. Loi des mailles : 0 = R·i + L·di/dt, donc di/dt &lt; 0 : <b>le courant décroît</b>. L’inductance rend son énergie à la résistance.</p>',
    obs: 'Que se passerait-il si la diode n’était pas là ?', ans: 'Le courant devrait s’annuler instantanément : L·di/dt deviendrait énorme et créerait une surtension qui détruirait le transistor.' },
  { title: 'Fin de la phase 2 : le courant est minimal', setup: cfg(0.5, 20, 1), t: 0.99,
    text: '<p>Juste avant la fermeture suivante de H, le courant atteint I<sub>min</sub> ≈ 8,8 A. Il ne s’est pas annulé : la <b>conduction est continue</b>.</p><p>Ondulation : Δi = I<sub>max</sub> − I<sub>min</sub> ≈ 2,5 A. La formule approchée α(1 − α)V/(Lf) donne aussi 2,5 A.</p>',
    obs: 'Calculer la valeur moyenne approchée du courant (I<sub>max</sub> + I<sub>min</sub>)/2.', ans: '(11,2 + 8,8)/2 = 10 A = ⟨u⟩/R = 100/10.' },
  { title: 'Augmenter α : la tension moyenne augmente', setup: cfg(0.8, 20, 1), t: 0.4,
    text: '<p>Avec α = 0,8, H est fermé 80 % du temps : <b>⟨u⟩ = αV = 160 V</b> et ⟨i⟩ = 16 A.</p><p>C’est ainsi qu’on règle la vitesse d’un moteur à courant continu : la vitesse est presque proportionnelle à ⟨u⟩.</p>',
    obs: 'Le transistor conduit-il plus ou moins longtemps que la diode ?', ans: 'Plus longtemps : 80 % de la période pour H, 20 % pour D. ⟨i<sub>H</sub>⟩ = 0,8 × 16 = 12,8 A.' },
  { title: 'Augmenter L : moins d’ondulation', setup: cfg(0.5, 60, 1), t: 0.3,
    text: '<p>Avec L = 60 mH (trois fois plus), l’ondulation est divisée par environ 3 : Δi ≈ 0,8 A. Le courant est mieux « lissé », le couple du moteur est plus régulier.</p>',
    obs: 'Comparer Δi relevée et Δi calculée.', ans: 'Environ 0,83 A dans les deux cas : la formule Δi = α(1 − α)V/(Lf) est vérifiée.' },
  { title: 'Augmenter f : moins d’ondulation', setup: cfg(0.5, 20, 4), t: 0.1,
    text: '<p>Avec f = 4 kHz (T = 0,25 ms), les phases sont 4 fois plus courtes : le courant a moins le temps de varier, Δi ≈ 0,6 A.</p><p>Inconvénient : le transistor commute 4 fois plus souvent, ses <b>pertes par commutation</b> augmentent.</p>',
    obs: 'Combien vaut maintenant ⟨u⟩ ? Pourquoi ?', ans: 'Toujours 100 V : ⟨u⟩ = αV ne dépend pas de la fréquence.' }
]);
})();
