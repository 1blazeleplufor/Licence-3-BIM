/* ======================= Fiche 5 : gradateur ======================= */
(() => {
const { C, $, fmt, el, txt, acSource, resistor, transport, seg, slider } = TD;
const V = 230, Vh = V * Math.SQRT2, R = 26.45, D2R = Math.PI / 180, PW = 8, NTOT = 10;
const sim = { mode: 'phase', alpha: 90, n: 4, dur: 10 };
sim.span = () => sim.mode === 'phase' ? 720 : 2 * NTOT * 360; // degrés

/* ---- schéma ---- */
const svg = $('f5-sch');
const yT = 70, yB = 250, xS = 70, xR = 400, xa = 150, xb = 290;
const w = el('g', { fill: 'none', stroke: C.ink, 'stroke-width': 2 }, svg);
el('path', { d: `M${xS} 138 V${yT} H${xa} M${xb} ${yT} H${xR} V122 M${xR} 198 V${yB} H${xS} V182` }, w);
el('path', { d: `M${xa} ${yT} V40 H196 M244 40 H${xb} V${yT} M${xa} ${yT} V100 H196 M244 100 H${xb} V${yT}` }, w);
acSource(svg, xS, 160, '');
txt(svg, xS - 30, 165, 'v', { fill: C.blue, 'font-weight': 700, 'font-size': 15 });
el('circle', { cx: xa, cy: yT, r: 3, fill: C.ink }, svg); el('circle', { cx: xb, cy: yT, r: 3, fill: C.ink }, svg);
function hthyr(cx, cy, dir, name, gUp) {
  const g = el('g', {}, svg), s = dir === 'right' ? 1 : -1;
  const tri = el('polygon', { points: `${cx - 12 * s},${cy - 12} ${cx - 12 * s},${cy + 12} ${cx + 10 * s},${cy}`, fill: '#fff', stroke: C.ink, 'stroke-width': 2 }, g);
  const bar = el('line', { x1: cx + 11 * s, y1: cy - 13, x2: cx + 11 * s, y2: cy + 13, stroke: C.ink, 'stroke-width': 3 }, g);
  const gate = el('path', { d: `M${cx + 5 * s} ${cy + (gUp ? -4 : 4)} L${cx + 16 * s} ${cy + (gUp ? -18 : 18)}`, stroke: C.violet, 'stroke-width': 2, fill: 'none' }, g);
  el('path', { d: `M${cx - 24} ${cy} H${cx - 12} M${cx + 12} ${cy} H${cx + 24}`, stroke: C.ink, 'stroke-width': 2 }, g);
  txt(g, cx - 34 * s, cy + (gUp ? -8 : 20), name, { 'font-weight': 700 });
  return { set(on, pulse) { const col = on ? C.green : C.red; tri.setAttribute('stroke', col); bar.setAttribute('stroke', col); tri.setAttribute('fill', on ? '#d6f2e2' : '#fbe6e6'); gate.setAttribute('stroke-width', pulse ? 5 : 2); } };
}
const T1 = hthyr(220, 40, 'right', 'T1', true), T2 = hthyr(220, 100, 'left', 'T2', false);
resistor(svg, xR, 122, 198, '');
txt(svg, xR + 22, 165, 'R', { 'text-anchor': 'start', 'font-weight': 700 });
el('path', { d: `M${xR - 30} 196 V128`, stroke: C.green, 'stroke-width': 2, fill: 'none' }, svg);
el('path', { d: `M${xR - 35} 132 L${xR - 30} 122 L${xR - 25} 132 Z`, fill: C.green }, svg);
txt(svg, xR - 44, 166, 'u<tspan baseline-shift="sub" font-size="10">c</tspan>', { fill: C.green, 'font-weight': 700, 'font-size': 15 });
const msg2 = txt(svg, 235, 288, '', { 'font-size': 13, 'font-weight': 600 });
const dotsG = el('g', {}, svg), dots = []; for (let k = 0; k < 30; k++) dots.push(el('circle', { r: 3.6, opacity: 0 }, dotsG));
let off = 0;
function flow(pts, rate, dt) {
  if (!pts) { dots.forEach(d => d.setAttribute('opacity', 0)); return; }
  const seg = []; let L = 0; for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], b = pts[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, l, L]); L += l; }
  off = (off + dt * 150 * rate) % 40;
  dots.forEach((d, k) => { if (k * 40 > L) { d.setAttribute('opacity', 0); return; } const s = (k * 40 + off) % L, [a, b, l, s0] = seg.find(g => s <= g[3] + g[2]) || seg[seg.length - 1], u = (s - s0) / l; d.setAttribute('cx', a[0] + (b[0] - a[0]) * u); d.setAttribute('cy', a[1] + (b[1] - a[1]) * u); d.setAttribute('opacity', .85); d.setAttribute('fill', C.green); });
}
const loop1 = [[xS, 138], [xS, yT], [xa, yT], [xa, 40], [xb, 40], [xb, yT], [xR, yT], [xR, yB], [xS, yB], [xS, 182]];
const loop2 = [[xS, 182], [xS, yB], [xR, yB], [xR, yT], [xb, yT], [xb, 100], [xa, 100], [xa, yT], [xS, yT], [xS, 138]];

/* ---- état ---- */
function st(t) {
  const th = t * D2R, v = Vh * Math.sin(th), pm = ((t % 360) + 360) % 360, per = Math.floor(t / 360);
  if (sim.mode === 'phase') {
    const a = sim.alpha, t1 = pm >= a && pm < 180, t2 = pm >= 180 + a;
    return { v, u: t1 || t2 ? v : 0, t1, t2, g1: pm >= a && pm < a + PW, g2: pm >= 180 + a && pm < 180 + a + PW, pm };
  }
  const win = (per % NTOT) < sim.n, t1 = win && pm < 180, t2 = win && pm >= 180;
  return { v, u: win ? v : 0, t1, t2, win, pm, per };
}
const Ueff = () => sim.mode === 'phase' ? V * Math.sqrt(Math.max(0, 1 - sim.alpha / 180 + Math.sin(2 * sim.alpha * D2R) / (2 * Math.PI))) : V * Math.sqrt(sim.n / NTOT);

sim.draw = (dt = 0) => {
  const s = st(sim.t), on = s.t1 || s.t2;
  T1.set(s.t1, s.g1 || (sim.mode === 'train' && s.win)); T2.set(s.t2, s.g2 || (sim.mode === 'train' && s.win));
  flow(s.t1 ? loop1 : s.t2 ? loop2 : null, Math.abs(s.u) / Vh + 0.2, dt);
  msg2.textContent = s.t1 ? 'T1 conduit (alternance positive)' : s.t2 ? 'T2 conduit (alternance négative)' : 'T1 et T2 bloqués : u_c = 0';
  msg2.setAttribute('fill', on ? C.green : C.red);
  $('f5-badge').textContent = s.t1 ? 'T1 passant' : s.t2 ? 'T2 passant' : 'Thyristors bloqués';
  $('f5-badge').style.background = on ? C.green : C.red;
  const U = Ueff();
  $('f5-vals').innerHTML = `<div><span>v(t)</span><b>${fmt(s.v, 0)} V</b></div><div><span>u<sub>c</sub>(t)</span><b>${fmt(s.u, 0)} V</b></div><div><span>U<sub>c</sub> efficace</span><b>${fmt(U, 0)} V</b></div><div><span>P = U<sub>c</sub>²/R</span><b>${fmt(U * U / R, 0)} W</b></div>` + (sim.mode === 'train' ? `<div><span>α = T<sub>ON</sub>/T<sub>C</sub></span><b>${fmt(sim.n / NTOT, 1)}</b></div>` : `<div><span>⟨u<sub>c</sub>⟩</span><b>0 V</b></div>`);
  if (sim.mode === 'phase') {
    $('f5-msg').innerHTML = s.g1 || s.g2
      ? `Impulsion sur la gâchette de ${s.g1 ? 'T1' : 'T2'} à ${s.g1 ? sim.alpha : 180 + sim.alpha}° : le thyristor s'amorce et la charge reçoit la tension du réseau.`
      : on ? `${s.t1 ? 'T1' : 'T2'} conduit jusqu'au passage par zéro du courant (fin de l'alternance), où il se bloque naturellement. u<sub>c</sub> = v.`
      : `Aucun thyristor amorcé dans cette alternance (retard α = ${sim.alpha}°) : u<sub>c</sub> = 0, les thyristors supportent la tension du réseau. Plus α est grand, plus la valeur efficace U<sub>c</sub> est faible.`;
  } else {
    $('f5-msg').innerHTML = s.win
      ? `Période ${s.per % NTOT + 1} sur ${NTOT} du cycle de commande : signal de commande à 1, les thyristors conduisent pendant des <b>périodes entières</b> (fermeture au passage par zéro).`
      : `Période ${s.per % NTOT + 1} sur ${NTOT} : signal de commande à 0, la charge n'est plus alimentée jusqu'à la fin de T<sub>C</sub>.`;
  }
  const sh = []; let s0 = null, inO = false;
  const span = sim.span(), NS = sim.mode === 'phase' ? 1440 : 4000;
  for (let k = 0; k <= NS; k++) { const t = k / NS * span, o = st(t).u !== 0; if (o !== inO || k === NS) { if (inO) sh.push([s0, t, '#d6f2e2']); s0 = t; inO = o; } }
  const ticks = sim.mode === 'phase' ? [0, 90, 180, 270, 360, 450, 540, 630, 720].map(t => [t, t + '°']) : Array.from({ length: 11 }, (_, k) => [k * 720, k === 0 ? '0' : k === 5 ? 'T_C = 10T' : k === 10 ? '2T_C' : (2 * k) + 'T']);
  const g = sim.mode === 'phase'
    ? { w: 0.45, min: -0.2, max: 1.7, yticks: [], label: 'impulsions i_G1 et i_G2', traces: [{ f: t => st(t).g1 ? 1 : 0, c: C.violet }, { f: t => st(t).g2 ? 1 : 0, c: C.orange }] }
    : { w: 0.45, min: -0.2, max: 1.7, yticks: [], label: 'signal de commande (tout ou rien)', traces: [{ f: t => st(t).win ? 1 : 0, c: C.violet }] };
  TD.scope($('f5-scope'), { h: 340, span, cursor: sim.t, ticks, N: sim.mode === 'phase' ? 900 : 5000, panels: [
    { w: 1.5, min: -350, max: 350, yticks: [-325, 0, 325], label: 'tensions (V)', shade: sh, traces: [{ f: t => st(t).v, c: C.blue, w: 1.5 }, { f: t => st(t).u, c: C.green, w: 3 }] }, g
  ] });
};

transport('f5', sim);
const vis = () => { $('f5-alpha-c').style.display = sim.mode === 'phase' ? '' : 'none'; $('f5-n-c').style.display = sim.mode === 'train' ? '' : 'none'; };
seg('f5-mode', v => { sim.mode = v; sim.t = 0; sim.dur = v === 'phase' ? 10 : 16; vis(); sim.draw(); });
slider('f5-alpha', v => { sim.alpha = v; }, v => v + '°');
slider('f5-n', v => { sim.n = v; }, v => v + ' / 10');
vis();
TD.register('gradateur', sim);
const ph = a => () => { TD.pick('f5-mode', 'phase'); TD.setSlider('f5-alpha', a); };
const tr = n => () => { TD.pick('f5-mode', 'train'); TD.setSlider('f5-n', n); };
TD.stepper('f5', sim, [
  { title: 'Avant α : les deux thyristors sont bloqués', setup: ph(90), t: 45,
    text: '<p>Gradateur : T1 (en haut, vers la droite) et T2 (en bas, vers la gauche) sont montés <b>tête-bêche</b>. Charge R = 26,45 Ω (2 000 W sous 230 V), α = 90°.</p><p>À θ = 45°, v &gt; 0 mais T1 n’a pas reçu d’impulsion : il est bloqué. T2 a v<sub>AK</sub> &lt; 0 : bloqué. <b>u<sub>c</sub> = 0</b>.</p>',
    obs: 'Quelle tension supportent les thyristors ?', ans: 'Toute la tension du réseau : v ≈ 230 V à cet instant.' },
  { title: 'θ = α : amorçage de T1', setup: ph(90), t: 93,
    text: '<p>Impulsion sur la gâchette de T1 à 90° (graphique du bas, en violet). v<sub>AK</sub> &gt; 0 et i<sub>G</sub> présent : <b>T1 s’amorce</b>. La charge reçoit u<sub>c</sub> = v.</p>',
    obs: 'Quelle est la valeur de u<sub>c</sub> juste après l’amorçage ?', ans: 'u<sub>c</sub> ≈ V̂ ≈ 325 V : avec α = 90°, l’amorçage a lieu au sommet de la sinusoïde, d’où un front très raide.' },
  { title: 'T1 conduit jusqu’au zéro de courant', setup: ph(90), t: 150,
    text: '<p>L’impulsion est terminée mais T1 reste passant (effet mémoire). Le courant suit la tension : i = u<sub>c</sub>/R.</p>',
    obs: 'Quel trajet suit le courant ?', ans: 'Borne haute de la source → T1 → R → retour à la borne basse de la source.' },
  { title: 'θ = 180° : blocage naturel de T1', setup: ph(90), t: 200,
    text: '<p>À 180°, v et donc i s’annulent : T1 se bloque. v devient négative : T2 a maintenant v<sub>AK</sub> &gt; 0 mais n’a pas encore reçu d’impulsion. u<sub>c</sub> = 0 jusqu’à 180° + α = 270°.</p>',
    obs: 'Combien de degrés dure ce « trou » sans tension ?', ans: 'α = 90°, de 180° à 270°.' },
  { title: 'θ = 180° + α : T2 conduit l’alternance négative', setup: ph(90), t: 300,
    text: '<p>Impulsion sur T2 à 270° (en orange) : T2 s’amorce et conduit le courant dans l’autre sens. u<sub>c</sub> = v &lt; 0.</p><p>Les deux alternances sont identiques au signe près : <b>⟨u<sub>c</sub>⟩ = 0</b> et la fréquence reste 50 Hz. Avec α = 90°, U<sub>c</sub> = V/√2 ≈ 163 V et P = 1 000 W.</p>',
    obs: 'Quel est le sens du courant dans R par rapport à l’alternance positive ?', ans: 'Opposé : contrairement au redresseur, le gradateur fournit un courant alternatif.' },
  { title: 'Petit angle α : forte puissance', setup: ph(30), t: 100,
    text: '<p>Avec α = 30°, presque toute la sinusoïde est transmise : U<sub>c</sub> ≈ 226 V et P ≈ 1 940 W.</p><p>Attention : la relation entre α et P n’est pas linéaire. Il faut utiliser la formule U<sub>c</sub> = V√(1 − α/π + sin 2α / 2π).</p>',
    obs: 'Faire varier α : pour quelle valeur approximative obtient-on 500 W (le quart de P<sub>max</sub>) ?', ans: 'Vers α ≈ 114°.' },
  { title: 'Trains d’ondes : conduction pendant n périodes', setup: tr(4), t: 200,
    text: '<p>Autre commande : le signal de commande (en bas) vaut 1 pendant T<sub>ON</sub> = 4 périodes, puis 0 pendant 6 périodes (T<sub>C</sub> = 10 T).</p><p>Pendant T<sub>ON</sub>, T1 et T2 sont amorcés en permanence, <b>au passage par zéro</b> : la charge reçoit des sinusoïdes complètes.</p>',
    obs: 'u<sub>c</sub> présente-t-elle des fronts raides comme en commande par la phase ?', ans: 'Non : la conduction commence et s’arrête au zéro de tension, d’où très peu de parasites.' },
  { title: 'Trains d’ondes : arrêt jusqu’à la fin de T<sub>C</sub>', setup: tr(4), t: 2200,
    text: '<p>Pendant les 6 périodes suivantes, aucune impulsion : la charge n’est plus alimentée.</p><p>Rapport cyclique α = 4/10 = 0,4 : <b>P = 0,4 × 2 000 = 800 W</b> et U<sub>c</sub> = 230√0,4 ≈ 145 V. Adapté au chauffage (forte inertie), pas à l’éclairage (la lampe clignoterait).</p>',
    obs: 'Régler 7 périodes ON : quelle puissance obtient-on ?', ans: 'P = 0,7 × 2 000 = 1 400 W.' }
]);
})();
