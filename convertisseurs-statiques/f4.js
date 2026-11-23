/* ======================= Fiche 4 : onduleur monophasé ======================= */
(() => {
const { C, $, fmt, el, txt, vdevice, transport, seg, slider } = TD;
const V = 48, R = 10, L = 30, T = 20; // V, ohms, mH, ms
const sim = { mode: 'sym', tau: 1 / 6, m: 15, r: 0.8, dur: 10 };
sim.span = () => 2 * T;

/* ---- schéma ---- */
const svg = $('f4-sch');
const yP = 40, yN = 262, yM = 150, xA = 170, xB = 330, xS = 52;
const w = el('g', { fill: 'none', stroke: C.ink, 'stroke-width': 2 }, svg);
el('path', { d: `M${xS} 138 V${yP} H${xB} M${xS} 162 V${yN} H${xB}` }, w);
el('line', { x1: xS - 16, y1: 140, x2: xS + 16, y2: 140, stroke: C.ink, 'stroke-width': 2 }, svg);
el('line', { x1: xS - 8, y1: 152, x2: xS + 8, y2: 152, stroke: C.ink, 'stroke-width': 5 }, svg);
el('rect', { x: xS - 18, y: 153, width: 36, height: 8, fill: '#fcfcfd' }, svg);
el('line', { x1: xS, y1: 155, x2: xS, y2: 162, stroke: C.ink, 'stroke-width': 2 }, svg);
txt(svg, xS + 14, 132, '+', { 'font-weight': 700, fill: C.muted });
txt(svg, xS + 26, 182, 'V = 48 V', { 'font-size': 11.5, fill: C.blue, 'font-weight': 600, 'text-anchor': 'start' });
// interrupteurs K = transistor (levier) + diode antiparallèle
function K(x, cy, name) {
  const g = el('g', {}, svg), y0 = cy - 24, y1 = cy + 24;
  el('path', { d: `M${x} ${cy < yM ? yP : yM} V${y0} M${x} ${y1} V${cy < yM ? yM : yN} M${x} ${y0} H${x + 30} V${cy - 7} M${x} ${y1} H${x + 30} V${cy + 7}`, stroke: C.ink, 'stroke-width': 2, fill: 'none' }, g);
  el('circle', { cx: x, cy: y0, r: 3, fill: C.ink }, g); el('circle', { cx: x, cy: y1, r: 3, fill: C.ink }, g);
  const lever = el('line', { x1: x, y1: y1, x2: x, y2: y0, stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
  const d = vdevice(g, x + 30, cy, '', 'diode', 'up', 'right');
  d.tri.setAttribute('transform', `translate(${x + 30} ${cy}) scale(.7) translate(${-(x + 30)} ${-cy})`);
  d.bar.setAttribute('transform', `translate(${x + 30} ${cy}) scale(.7) translate(${-(x + 30)} ${-cy})`);
  txt(g, x - 14, cy + 5, name, { 'text-anchor': 'end', 'font-weight': 700 });
  txt(g, x + 44, cy + 4, 'D' + name.slice(1), { 'text-anchor': 'start', 'font-size': 11, fill: C.muted });
  return { set(closed, tOn, dOn) {
    lever.setAttribute('x2', closed ? x : x - 16); lever.setAttribute('y2', closed ? y0 : y0 + 8);
    lever.setAttribute('stroke', tOn ? C.green : closed ? C.ink : '#c3c8d1');
    d.set(dOn ? 'on' : 'idle');
  } };
}
const Ks = { 1: K(xA, 95, 'K1'), 2: K(xB, 95, 'K2'), 3: K(xA, 205, 'K3'), 4: K(xB, 205, 'K4') };
[xA, xB].forEach(x => el('circle', { cx: x, cy: yM, r: 3.5, fill: C.ink }, svg));
el('path', { d: `M${xA} ${yM} H200 M240 ${yM} H254 M318 ${yM} H${xB}`, stroke: C.ink, 'stroke-width': 2, fill: 'none' }, svg);
el('rect', { x: 200, y: yM - 9, width: 40, height: 18, rx: 2, fill: '#fff', stroke: C.ink, 'stroke-width': 2 }, svg);
el('path', { d: `M254 ${yM} a8 8 0 0 1 16 0 a8 8 0 0 1 16 0 a8 8 0 0 1 16 0 a8 8 0 0 1 16 0`, stroke: C.ink, 'stroke-width': 2.2, fill: 'none' }, svg);
txt(svg, 220, yM + 4, 'R', { 'font-weight': 700, 'font-size': 11 }); txt(svg, 286, yM - 13, 'L', { 'font-weight': 700, 'font-size': 12 });
el('path', { d: `M302 ${yM - 26} H186`, stroke: C.green, 'stroke-width': 2, fill: 'none' }, svg);
el('path', { d: `M190 ${yM - 31} L180 ${yM - 26} L190 ${yM - 21} Z`, fill: C.green }, svg);
txt(svg, 245, yM - 32, 'u', { fill: C.green, 'font-weight': 700, 'font-size': 15 });
const iArr = el('g', {}, svg);
const msg2 = txt(svg, 250, 290, '', { 'font-size': 12.5, 'font-weight': 600 });
txt(svg, 410, 60, 'charge', { 'font-size': 11, fill: C.muted }); txt(svg, 410, 74, 'R-L', { 'font-size': 11, fill: C.muted });

/* ---- commande ---- */
const tri = x => 4 * Math.abs(x - Math.floor(x + 0.5)) - 1;
function cmd(t) {
  const ph = ((t % T) + T) % T / T;
  if (sim.mode === 'sym') return ph < 0.5 ? { u: V, k: [1, 4] } : { u: -V, k: [2, 3] };
  if (sim.mode === 'dec') { const a = sim.tau; if (ph < a) return { u: 0, k: [1, 2] }; if (ph < 0.5) return { u: V, k: [1, 4] }; if (ph < 0.5 + a) return { u: 0, k: [3, 4] }; return { u: -V, k: [2, 3] }; }
  const mod = sim.r * Math.sin(2 * Math.PI * ph), car = tri(sim.m * ph);
  return mod >= car ? { u: V, k: [1, 4], mod, car } : { u: -V, k: [2, 3], mod, car };
}
/* ---- simulation du courant R-L et analyse harmonique ---- */
let S = null;
function compute() {
  const N = 4000, dt = T / N, tau = L / R, e = Math.exp(-dt / tau);
  const u = new Float64Array(N), cur = new Float64Array(2 * N);
  for (let k = 0; k < N; k++) u[k] = cmd(k * dt).u;
  let i = 0;
  for (let p = 0; p < 8; p++) for (let k = 0; k < N; k++) { i = u[k] / R + (i - u[k] / R) * e; if (p >= 6) cur[(p - 6) * N + k] = i; }
  const H = sim.mode === 'mli' ? Math.min(2 * sim.m + 7, 70) : 25, harm = [];
  let a1 = 0, b1 = 0, sq = 0;
  for (let n = 1; n <= H; n++) {
    let a = 0, b = 0; for (let k = 0; k < N; k++) { const th = 2 * Math.PI * n * k / N; a += u[k] * Math.cos(th); b += u[k] * Math.sin(th); }
    a *= 2 / N; b *= 2 / N; harm.push(Math.hypot(a, b) / Math.SQRT2); if (n === 1) { a1 = a; b1 = b; }
  }
  for (let k = 0; k < N; k++) sq += u[k] * u[k];
  S = { N, dt, u, cur, harm, a1, b1, Ueff: Math.sqrt(sq / N), U1: Math.hypot(a1, b1) / Math.SQRT2 };
}
const iAt = t => { const k = Math.min(2 * S.N - 1, Math.max(0, Math.floor(t / S.dt))); return S.cur[k]; };
const u1At = t => { const th = 2 * Math.PI * t / T; return S.a1 * Math.cos(th) + S.b1 * Math.sin(th); };

sim.draw = (dt = 0) => {
  if (!S) compute();
  const c = cmd(sim.t), i = iAt(sim.t), cl = new Set(c.k), pos = i >= 0;
  const elems = [];
  // élément qui conduit dans chaque interrupteur fermé, selon le signe du courant
  const cond = { 1: pos ? 'T' : 'D', 3: pos ? 'D' : 'T', 2: pos ? 'D' : 'T', 4: pos ? 'T' : 'D' };
  for (const n of [1, 2, 3, 4]) { const on = cl.has(n); Ks[n].set(on, on && cond[n] === 'T', on && cond[n] === 'D'); if (on) elems.push(cond[n] + n); }
  iArr.innerHTML = '';
  if (Math.abs(i) > 0.05) {
    const x0 = pos ? 205 : 295, x1 = pos ? 295 : 205, y = yM + 20;
    el('path', { d: `M${x0} ${y} H${x1}`, stroke: C.blue, 'stroke-width': 2 }, iArr);
    el('path', { d: pos ? `M${x1 - 10} ${y - 5} L${x1} ${y} L${x1 - 10} ${y + 5} Z` : `M${x1 + 10} ${y - 5} L${x1} ${y} L${x1 + 10} ${y + 5} Z`, fill: C.blue }, iArr);
    txt(iArr, 250, y + 16, `i ${pos ? '> 0' : '< 0'}`, { fill: C.blue, 'font-size': 12, 'font-weight': 600 });
  }
  const back = c.u * i < 0;
  msg2.textContent = c.u === 0 ? 'u = 0 : la charge est court-circuitée' : back ? 'Diodes : la charge renvoie de l’énergie à la source' : 'Transistors : la source alimente la charge';
  msg2.setAttribute('fill', back ? C.orange : c.u === 0 ? C.muted : C.green);
  $('f4-badge').textContent = `K${c.k[0]} et K${c.k[1]} commandés · conduisent : ${elems.join(', ')}`;
  $('f4-badge').style.background = back ? C.orange : C.green;
  $('f4-vals').innerHTML = `<div><span>u(t)</span><b>${fmt(c.u, 0)} V</b></div><div><span>i(t)</span><b>${fmt(i, 2)} A</b></div><div><span>p = u·i</span><b>${fmt(c.u * i, 0)} W</b></div><div><span>U efficace</span><b>${fmt(S.Ueff, 1)} V</b></div><div><span>U<sub>1</sub> fondamental</span><b>${fmt(S.U1, 1)} V</b></div>`;
  let m;
  if (c.u === 0) m = `K${c.k[0]} et K${c.k[1]} sont fermés : la charge est reliée deux fois à la même borne de la source, u = 0. Le courant continue de circuler par ${elems.join(' et ')} : c'est la « roue libre » de l'onduleur.`;
  else if (back) m = `K${c.k[0]} et K${c.k[1]} sont commandés (u = ${c.u > 0 ? '+V' : '−V'}), mais le courant, retardé par l'inductance, est encore de signe opposé. Les transistors ne peuvent pas le conduire : ce sont les <b>diodes</b> ${elems.join(' et ')} qui conduisent. p = u·i &lt; 0 : l'énergie de la bobine retourne à la source.`;
  else m = `K${c.k[0]} et K${c.k[1]} sont fermés et le courant est dans le sens de leurs <b>transistors</b> (${elems.join(', ')}) : la source fournit de l'énergie à la charge, u = ${c.u > 0 ? '+V' : '−V'}.`;
  $('f4-msg').innerHTML = m;
  const sh = []; let s0 = null, inB = false;
  for (let k = 0; k <= 1600; k++) { const t = k / 1600 * 2 * T, b = cmd(t).u * iAt(t) < 0; if (b !== inB || k === 1600) { if (inB) sh.push([s0, t, '#fde8d3']); s0 = t; inB = b; } }
  const ticks = [[0, '0'], [5, 'T/4'], [10, 'T/2'], [15, '3T/4'], [20, 'T = 20 ms'], [25, ''], [30, '3T/2'], [35, ''], [40, '2T']];
  const panels = [];
  if (sim.mode === 'mli') panels.push({ w: 0.8, min: -1.15, max: 1.15, yticks: [-1, 0, 1], label: 'modulante et porteuse', traces: [{ f: t => tri(sim.m * (((t % T) + T) % T) / T), c: C.orange, w: 1.2 }, { f: t => sim.r * Math.sin(2 * Math.PI * t / T), c: C.violet, w: 2.2 }] });
  panels.push({ w: 1, min: -66, max: 66, yticks: [-48, 0, 48], label: 'u (V)', shade: sh, traces: [{ f: u1At, c: '#8fd0aa', w: 2, nodot: true }, { f: t => cmd(t).u, c: C.green, w: 2.5 }] });
  panels.push({ w: 0.8, min: -5.5, max: 5.5, yticks: [-4, 0, 4], label: 'i (A)', shade: sh, traces: [{ f: iAt, c: C.blue, w: 2.5 }] });
  TD.scope($('f4-scope'), { h: sim.mode === 'mli' ? 440 : 330, span: 40, cursor: sim.t, ticks, N: sim.mode === 'mli' ? 2400 : 900, panels });
  TD.bars($('f4-spec'), { h: 170, values: S.harm, max: 45, yticks: [0, 15, 30, 45], unit: ' V', title: 'Spectre de u : valeur efficace de chaque harmonique (vert : fondamental)', labelEvery: sim.mode === 'mli' ? 5 : 2 });
};

transport('f4', sim);
const vis = () => { $('f4-tau-c').style.display = sim.mode === 'dec' ? '' : 'none'; $('f4-m-c').style.display = sim.mode === 'mli' ? '' : 'none'; $('f4-r-c').style.display = sim.mode === 'mli' ? '' : 'none'; };
seg('f4-mode', v => { sim.mode = v; vis(); S = null; sim.draw(); });
slider('f4-tau', v => { sim.tau = v; S = null; }, v => 'T × ' + v.toFixed(2).replace('.', ','));
slider('f4-m', v => { sim.m = v; S = null; }, v => v);
slider('f4-r', v => { sim.r = v; S = null; }, v => v.toFixed(2).replace('.', ','));
vis();
TD.register('onduleur', sim);
const cfg = (mode, o = {}) => () => { TD.pick('f4-mode', mode); if (o.tau != null) TD.setSlider('f4-tau', o.tau); if (o.m != null) TD.setSlider('f4-m', o.m); if (o.r != null) TD.setSlider('f4-r', o.r); };
TD.stepper('f4', sim, [
  { title: 'Commande symétrique · K1 et K4 commandés, mais les diodes conduisent', setup: cfg('sym'), t: 1,
    text: '<p>Source V = 48 V, charge R-L (10 Ω, 30 mH), f = 50 Hz. À t = 0, la commande ferme <b>K1 et K4</b> : la charge reçoit <b>u = +V</b>.</p><p>Mais le courant, retardé par l’inductance, est encore <b>négatif</b> (il vient de la demi-période précédente). Un transistor ne conduit que dans un sens : ce sont les <b>diodes D1 et D4</b> qui conduisent (zone orangée).</p><p>p = u·i &lt; 0 : la bobine rend son énergie à la source.</p>',
    obs: 'Quel est le signe de p = u·i affiché ?', ans: 'p est négative : la charge fournit de l’énergie à la source pendant cette courte phase.' },
  { title: 'Les transistors T1 et T4 prennent le relais', setup: cfg('sym'), t: 5,
    text: '<p>Le courant s’est annulé vers t ≈ 2 ms puis est devenu positif. Il passe maintenant dans le sens des transistors : <b>T1 et T4 conduisent</b>.</p><p>p = u·i &gt; 0 : la source alimente la charge. Loi des mailles : u − V = 0, donc u = +V.</p>',
    obs: 'Quel trajet suit le courant ?', ans: '+ de la source → K1 (T1) → R → L → K4 (T4) → − de la source.' },
  { title: 'T/2 : inversion, D2 et D3 conduisent', setup: cfg('sym'), t: 10.8,
    text: '<p>À t = T/2 = 10 ms, la commande ouvre K1 et K4 et ferme <b>K2 et K3</b> : u = −V.</p><p>Le courant est encore positif : il passe par les <b>diodes D2 et D3</b> et diminue rapidement. L’énergie de la bobine retourne à la source.</p>',
    obs: 'Pourquoi ne faut-il jamais fermer K1 et K3 en même temps ?', ans: 'K1 et K3 sont sur le même bras : la source serait court-circuitée. On laisse un temps mort entre l’ouverture de K1 et la fermeture de K3.' },
  { title: 'T2 et T3 conduisent', setup: cfg('sym'), t: 15,
    text: '<p>Le courant est devenu négatif : <b>T2 et T3</b> conduisent, la source alimente la charge avec u = −V. Le cycle recommence à t = T.</p><p>Bilan : u est un <b>créneau ±V</b> de valeur efficace U = V = 48 V. Le courant est presque triangulaire (exponentielles).</p>',
    obs: 'Combien de phases différentes compte-t-on par période ?', ans: 'Quatre : D1-D4, T1-T4, D2-D3, T2-T3.' },
  { title: 'Les harmoniques de la commande symétrique', setup: cfg('sym'), t: 19.5,
    text: '<p>Le spectre (en bas) décompose u en sinusoïdes : le <b>fondamental</b> à 50 Hz (U<sub>1</sub> ≈ 43,2 V, en vert) et des <b>harmoniques</b> impairs 3, 5, 7… d’amplitude U<sub>1</sub>/n.</p><p>Ces harmoniques à basse fréquence (150, 250 Hz…) traversent facilement l’inductance et déforment le courant : pertes et couples parasites dans un moteur.</p>',
    obs: 'Lire la valeur de l’harmonique 3 sur le spectre.', ans: 'Environ 14,4 V = 43,2/3.' },
  { title: 'Commande décalée · palier à u = 0', setup: cfg('dec', { tau: 0.17 }), t: 1.5,
    text: '<p>Commande décalée avec τ = 0,17 T ≈ 3,4 ms. Au début de la demi-période, la commande ferme <b>K1 et K2</b> (les deux du haut) : la charge est reliée deux fois à la borne +, <b>u = 0</b>.</p><p>Le courant circule en roue libre dans la charge, à travers un transistor et une diode (voir le badge).</p>',
    obs: 'K1 et K2 fermés ensemble provoquent-ils un court-circuit ?', ans: 'Non : ils ne sont pas sur le même bras. Ils relient simplement les deux bornes de la charge au même potentiel.' },
  { title: 'Commande décalée · créneau +V et spectre', setup: cfg('dec', { tau: 0.17 }), t: 7,
    text: '<p>Après τ, K2 s’ouvre et K4 se ferme : <b>K1 et K4</b>, u = +V. Puis T/2 → T/2 + τ : K3-K4 (u = 0) ; et enfin K2-K3 (u = −V).</p><p>Avec τ ≈ T/6, la barre de l’<b>harmonique 3 disparaît presque</b> du spectre. U = V√(1 − 2τ/T) ≈ 39 V.</p>',
    obs: 'Comparer le spectre avec celui de la commande symétrique.', ans: 'Le fondamental baisse un peu (≈ 37 V) mais l’harmonique 3 a quasiment disparu : le courant est plus proche d’une sinusoïde.' },
  { title: 'MLI · comparaison modulante / porteuse', setup: cfg('mli', { m: 15, r: 0.8 }), t: 2.3,
    text: '<p>Le premier graphique montre la <b>modulante</b> (sinusoïde violette à 50 Hz, amplitude r = 0,8) et la <b>porteuse</b> (triangle orange, m = 15 fois plus rapide).</p><p>Modulante &gt; porteuse : K1-K4 fermés, u = +V. Modulante &lt; porteuse : K2-K3, u = −V. Les créneaux sont <b>larges</b> quand la sinusoïde est haute, <b>étroits</b> quand elle est basse.</p>',
    obs: 'Au sommet de la sinusoïde (t = 5 ms), les créneaux positifs sont-ils larges ou étroits ?', ans: 'Larges : u reste presque tout le temps à +V. La moyenne glissante de u suit la sinusoïde.' },
  { title: 'MLI · un courant presque sinusoïdal', setup: cfg('mli', { m: 31, r: 0.8 }), t: 5,
    text: '<p>Avec m = 31, les harmoniques sont rejetés autour du rang 31 (1 550 Hz) sur le spectre. L’inductance de la charge les filtre facilement : le <b>courant est presque sinusoïdal</b>.</p><p>Le fondamental vaut U<sub>1</sub> ≈ r·V/√2 ≈ 27 V. En changeant r on règle la tension, en changeant la fréquence de la modulante on règle la fréquence : c’est le principe du <b>variateur de vitesse</b>.</p>',
    obs: 'Diminuer r à 0,4 : que devient U<sub>1</sub> ?', ans: 'Il est divisé par deux, environ 13,6 V.' }
]);
})();
