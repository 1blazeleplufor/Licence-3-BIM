/* Pont redresseur générique (utilisé par les fiches 1 et 2) */
TD.bridge = function (svg, o) {
  // o = { xs:[...], top:[labels], bot:[labels], topKind, botKind, inputs:'source'|'phases', loadLabel }
  const { C, el, txt, vdevice, resistor, acSource } = TD;
  svg.innerHTML = '';
  const yP = 40, yN = 262, yM = 150, xL = 400, xs = o.xs;
  const wires = el('g', { fill: 'none', stroke: C.ink, 'stroke-width': 2 }, svg);
  el('path', { d: `M${xs[0]} ${yP} H${xL} V112 M${xL} 188 V${yN} H${xs[0]}` }, wires);
  xs.forEach(x => el('path', { d: `M${x} ${yP} V85 M${x} 105 V195 M${x} 215 V${yN}` }, wires));
  xs.forEach(x => { el('circle', { cx: x, cy: yP, r: 3, fill: C.ink }, svg); el('circle', { cx: x, cy: yN, r: 3, fill: C.ink }, svg); el('circle', { cx: x, cy: yM, r: 3.2, fill: C.ink }, svg); });
  resistor(svg, xL, 112, 188, '');
  txt(svg, xL + 22, 150, 'R', { 'text-anchor': 'start', 'font-weight': 600 });
  txt(svg, xL + 22, 168, 'charge', { 'text-anchor': 'start', 'font-size': 11, fill: C.muted });
  // flèche de tension u
  el('path', { d: `M${xL - 30} 186 V118`, stroke: C.green, 'stroke-width': 2, fill: 'none' }, svg);
  el('path', { d: `M${xL - 35} 122 L${xL - 30} 112 L${xL - 25} 122 Z`, fill: C.green }, svg);
  txt(svg, xL - 42, 155, 'u', { fill: C.green, 'font-weight': 700, 'font-size': 15 });
  txt(svg, xs[0] - 4, yP - 14, '+', { 'font-weight': 700, fill: C.muted });
  txt(svg, xs[0] - 4, yN + 22, '−', { 'font-weight': 700, fill: C.muted });
  const top = xs.map((x, k) => vdevice(svg, x, 95, o.top[k], o.topKind, 'up', 'left'));
  const bot = xs.map((x, k) => vdevice(svg, x, 205, o.bot[k], Array.isArray(o.botKind) ? o.botKind[k] : o.botKind, 'up', 'left'));
  if (o.inputs === 'source') {
    el('path', { d: `M${xs[0]} ${yM} H${(xs[0] + xs[1]) / 2 - 22} M${(xs[0] + xs[1]) / 2 + 22} ${yM} H${xs[1]}`, stroke: C.ink, 'stroke-width': 2 }, svg);
    acSource(svg, (xs[0] + xs[1]) / 2, yM, 'v');
    txt(svg, xs[0] + 14, yM - 6, 'A', { 'font-size': 11, fill: C.muted, 'text-anchor': 'start' });
    txt(svg, xs[1] - 14, yM - 6, 'B', { 'font-size': 11, fill: C.muted, 'text-anchor': 'end' });
  } else {
    xs.forEach((x, k) => {
      el('path', { d: `M${x} ${yM} H${x + 30}`, stroke: C.ink, 'stroke-width': 2 }, svg);
      el('circle', { cx: x + 34, cy: yM, r: 4.5, fill: '#fff', stroke: C.blue, 'stroke-width': 2 }, svg);
      txt(svg, x + 34, yM + 20, 'v' + (k + 1), { fill: C.blue, 'font-weight': 600, 'font-size': 12 });
    });
  }
  const dotsG = el('g', {}, svg), dots = [];
  for (let k = 0; k < 26; k++) dots.push(el('circle', { r: 3.6, fill: C.green, opacity: 0 }, dotsG));
  let off = 0;
  return {
    top, bot,
    flow(xTop, xBot, rate, dt) { // points de courant sur le chemin continu
      if (xTop == null || xBot == null || rate <= 0) { dots.forEach(d => d.setAttribute('opacity', 0)); return; }
      const pts = [[xTop, yM], [xTop, yP], [xL, yP], [xL, yN], [xBot, yN], [xBot, yM]];
      const seg = []; let L = 0; for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], b = pts[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, l, L]); L += l; }
      off = (off + dt * 140 * rate) % 40;
      dots.forEach((d, k) => {
        const s = k * 40 + off; if (s > L) { d.setAttribute('opacity', 0); return; }
        const [a, b, l, s0] = seg.find(g => s <= g[3] + g[2]) || seg[seg.length - 1], u = (s - s0) / l;
        d.setAttribute('cx', a[0] + (b[0] - a[0]) * u); d.setAttribute('cy', a[1] + (b[1] - a[1]) * u); d.setAttribute('opacity', 0.85);
      });
    }
  };
};

/* ======================= Fiche 1 : redresseurs à diodes ======================= */
(() => {
const { C, $, fmt, scope, transport, seg } = TD;
const sim = { mode: 'pd2', dur: 9 };
// PD2 : V = 24 V, R = 12 ohms, temps en ms ; PD3 : V = 230 V (U = 400 V), R = 20 ohms, temps en degrés
const P2 = { V: 24, R: 12 }, P3 = { V: 230, R: 20 };
let br = null;
sim.span = () => sim.mode === 'pd2' ? 40 : 360;

function build() {
  const svg = $('f1-sch');
  br = sim.mode === 'pd2'
    ? TD.bridge(svg, { xs: [130, 250], top: ['D1', 'D2'], bot: ['D3', 'D4'], topKind: 'diode', botKind: 'diode', inputs: 'source' })
    : TD.bridge(svg, { xs: [100, 190, 280], top: ['D1', 'D2', 'D3'], bot: ["D'1", "D'2", "D'3"], topKind: 'diode', botKind: 'diode', inputs: 'phases' });
  $('f1-legend').innerHTML = sim.mode === 'pd2'
    ? '<span><i style="background:#2f6fd6"></i>v(t) secondaire</span><span><i style="background:#1d9a52;height:4px"></i>u(t) charge</span><span><i style="background:#df8516"></i>v<sub>D1</sub>(t)</span><span><i style="background:#7a4cc2"></i>i<sub>D1</sub>(t)</span><span><i style="background:#d6f2e2;height:10px"></i>D1 passante</span>'
    : '<span><i style="background:#2f6fd6"></i>v1</span><span><i style="background:#138a8a"></i>v2</span><span><i style="background:#7a4cc2"></i>v3</span><span><i style="background:#1d9a52;height:4px"></i>u(t)</span><span><i style="background:#df8516"></i>v<sub>D1</sub>(t)</span><span><i style="background:#d6f2e2;height:10px"></i>D1 passante</span>';
}

/* ---- PD2 ---- */
const w2 = 2 * Math.PI / 20; // rad/ms
const pd2 = t => { const Vh = P2.V * Math.SQRT2, v = Vh * Math.sin(w2 * t), u = Math.abs(v), i = u / P2.R, pos = v >= 0; return { v, u, i, pos, vD1: pos ? 0 : v, iD1: pos ? i : 0 }; };
/* ---- PD3 ---- */
const pd3 = t => {
  const Vh = P3.V * Math.SQRT2, th = t * Math.PI / 180;
  const v = [0, 1, 2].map(k => Vh * Math.sin(th - k * 2 * Math.PI / 3));
  const hi = v.indexOf(Math.max(...v)), lo = v.indexOf(Math.min(...v)), u = v[hi] - v[lo], i = u / P3.R;
  return { v, hi, lo, u, i, vD1: v[0] - v[hi], iD1: hi === 0 ? i : 0 };
};

function shadeOf(fn, test, span) { const out = []; let s = null; for (let k = 0; k <= 720; k++) { const t = k / 720 * span, on = test(fn(t)); if (on && s === null) s = t; if ((!on || k === 720) && s !== null) { out.push([s, t, '#d6f2e2']); s = null; } } return out; }

sim.draw = (dt = 0) => {
  if (sim.mode === 'pd2') {
    const s = pd2(sim.t), Vh = P2.V * Math.SQRT2;
    br.top[0].set(s.pos ? 'on' : 'off'); br.bot[1].set(s.pos ? 'on' : 'off');
    br.top[1].set(s.pos ? 'off' : 'on'); br.bot[0].set(s.pos ? 'off' : 'on');
    br.flow(s.pos ? 130 : 250, s.pos ? 250 : 130, s.i / (Vh / P2.R), dt);
    $('f1-badge').textContent = s.pos ? 'D1 et D4 passantes' : 'D2 et D3 passantes';
    $('f1-vals').innerHTML = `<div><span>v(t)</span><b>${fmt(s.v, 1)} V</b></div><div><span>u(t)</span><b>${fmt(s.u, 1)} V</b></div><div><span>i(t)</span><b>${fmt(s.i, 2)} A</b></div><div><span>v<sub>D1</sub></span><b>${fmt(s.vD1, 1)} V</b></div><div><span>⟨u⟩ = 2V̂/π</span><b>${fmt(2 * Vh / Math.PI, 1)} V</b></div>`;
    $('f1-msg').innerHTML = s.pos
      ? 'Alternance positive : le point A est au potentiel le plus élevé. D1 (cathodes communes) et D4 (anodes communes) conduisent ; D2 et D3 sont bloquées. u = v.'
      : 'Alternance négative : le point B est au potentiel le plus élevé. D2 et D3 conduisent ; D1 et D4 sont bloquées et supportent la tension inverse. u = −v : le courant traverse la charge <b>dans le même sens</b>.';
    const sh = shadeOf(pd2, x => x.iD1 > 0, 40);
    scope($('f1-scope'), { h: 380, span: 40, cursor: sim.t, ticks: [[0, '0'], [10, '10 ms'], [20, '20 ms (T)'], [30, '30 ms'], [40, '40 ms']], panels: [
      { w: 1.4, min: -38, max: 38, yticks: [-30, -15, 0, 15, 30], label: 'tensions (V)', shade: sh, traces: [{ f: t => pd2(t).v, c: C.blue }, { f: t => pd2(t).u, c: C.green, w: 3.5 }] },
      { w: 0.8, min: -38, max: 6, yticks: [-30, -15, 0], label: 'v_D1 (V)', shade: sh, traces: [{ f: t => pd2(t).vD1, c: C.orange }] },
      { w: 0.7, min: -0.2, max: 3.2, yticks: [0, 1, 2, 3], label: 'i_D1 (A)', shade: sh, traces: [{ f: t => pd2(t).iD1, c: C.violet }] }
    ] });
  } else {
    const s = pd3(sim.t), Vh = P3.V * Math.SQRT2, names = ['D1', 'D2', 'D3'], bnames = ["D'1", "D'2", "D'3"], xs = [100, 190, 280];
    br.top.forEach((d, k) => d.set(k === s.hi ? 'on' : 'off')); br.bot.forEach((d, k) => d.set(k === s.lo ? 'on' : 'off'));
    br.flow(xs[s.hi], xs[s.lo], s.i / (Vh * Math.sqrt(3) / P3.R), dt);
    $('f1-badge').textContent = `${names[s.hi]} et ${bnames[s.lo]} passantes`;
    $('f1-vals').innerHTML = `<div><span>θ = ωt</span><b>${Math.round(sim.t)}°</b></div><div><span>u = v${s.hi + 1} − v${s.lo + 1}</span><b>${fmt(s.u, 0)} V</b></div><div><span>i(t)</span><b>${fmt(s.i, 1)} A</b></div><div><span>v<sub>D1</sub></span><b>${fmt(s.vD1, 0)} V</b></div><div><span>⟨u⟩ ≈ 1,35 U</span><b>${fmt(3 * Math.sqrt(3) * Vh / Math.PI, 0)} V</b></div>`;
    $('f1-msg').innerHTML = `Groupe à cathodes communes : conduit la diode reliée à la tension la <b>plus haute</b> (v${s.hi + 1}). Groupe à anodes communes : conduit la diode reliée à la tension la <b>plus basse</b> (v${s.lo + 1}). Donc u = v${s.hi + 1} − v${s.lo + 1} = u${s.hi + 1}${s.lo + 1}.`;
    const sh = shadeOf(pd3, x => x.iD1 > 0, 360);
    const ticks = [[0, '0°'], [30, '30°'], [90, '90°'], [150, '150°'], [210, '210°'], [270, '270°'], [330, '330°'], [360, '360°']];
    scope($('f1-scope'), { h: 440, span: 360, cursor: sim.t, ticks, panels: [
      { w: 1.2, min: -360, max: 360, yticks: [-300, 0, 300], label: 'tensions simples (V)', shade: sh, traces: [{ f: t => pd3(t).v[0], c: C.blue }, { f: t => pd3(t).v[1], c: C.teal }, { f: t => pd3(t).v[2], c: C.violet }] },
      { w: 1, min: 0, max: 620, yticks: [0, 200, 400, 540, 600], label: 'u (V)  — ⟨u⟩ = 540 V', shade: sh, traces: [{ f: () => 540, c: C.green, w: 1, dash: [5, 4], nodot: true }, { f: t => pd3(t).u, c: C.green, w: 3.5 }] },
      { w: 0.8, min: -600, max: 30, yticks: [-500, -250, 0], label: 'v_D1 (V)', shade: sh, traces: [{ f: t => pd3(t).vD1, c: C.orange }] }
    ] });
  }
};

transport('f1', sim);
seg('f1-mode', v => { sim.mode = v; sim.t = 0; build(); sim.draw(); });
build();
TD.register('redresseur', sim);
const S2 = () => TD.pick('f1-mode', 'pd2'), S3 = () => TD.pick('f1-mode', 'pd3');
TD.stepper('f1', sim, [
  { title: 'PD2 · Le montage au repos (t = 0)', setup: S2, t: 0.01,
    text: '<p>À t = 0, la tension du secondaire v est nulle. Le pont comporte deux groupes : <b>D1 et D2 à cathodes communes</b> (reliées à la borne + de la charge) et <b>D3 et D4 à anodes communes</b> (reliées à la borne −).</p><p>La source est branchée entre les points A et B. v = v<sub>A</sub> − v<sub>B</sub>.</p>',
    obs: 'Repérer sur le schéma les deux groupes de diodes et les points A et B.', ans: 'D1 et D2 en haut (cathodes vers le +), D3 et D4 en bas (anodes vers le −). A est à gauche entre D1 et D3, B à droite entre D2 et D4.' },
  { title: 'PD2 · Alternance positive : D1 et D4 conduisent', setup: S2, t: 2.5,
    text: '<p>v &gt; 0 : le point A est au potentiel le plus haut, le point B au plus bas.</p><p>Groupe du haut : l’anode de D1 est reliée à A (le plus haut) → <b>D1 passante</b>. Groupe du bas : la cathode de D4 est reliée à B (le plus bas) → <b>D4 passante</b>.</p><p>Chemin du courant : A → D1 → R → D4 → B. Loi des mailles : v − v<sub>D1</sub> − u − v<sub>D4</sub> = 0 avec v<sub>D</sub> = 0, donc <b>u = v</b>.</p>',
    obs: 'Quelle est la tension aux bornes de D2 à cet instant ?', ans: 'D2 a son anode en B et sa cathode au + (relié à A par D1) : v<sub>D2</sub> = v<sub>B</sub> − v<sub>A</sub> = −v &lt; 0. D2 est bloquée, de même que D3.' },
  { title: 'PD2 · Maximum de la tension (t = T/4)', setup: S2, t: 5,
    text: '<p>À t = 5 ms (T/4), v atteint sa valeur maximale V̂ = 24√2 ≈ 33,9 V. Le courant dans la charge est maximal : i = V̂/R ≈ 2,8 A.</p><p>Le courant dans D1 est égal au courant de la charge : i<sub>D1</sub> = i.</p>',
    obs: 'Lire i<sub>D1</sub> sur le troisième graphique à cet instant.', ans: 'i<sub>D1</sub> ≈ 2,8 A, égal à i : D1 et D4 portent tout le courant de la charge.' },
  { title: 'PD2 · Changement d’alternance (t = T/2)', setup: S2, t: 10,
    text: '<p>À t = 10 ms, v s’annule puis devient négative. Le courant s’annule dans D1 et D4, qui se bloquent : c’est une <b>commutation naturelle</b>, aucune commande n’est nécessaire.</p>',
    obs: 'Pourquoi parle-t-on de commutation « naturelle » ?', ans: 'Parce que ce sont les tensions du réseau qui provoquent le changement d’état des diodes, sans aucun circuit de commande.' },
  { title: 'PD2 · Alternance négative : D2 et D3 conduisent', setup: S2, t: 15,
    text: '<p>v &lt; 0 : c’est maintenant B qui est le plus haut et A le plus bas. <b>D2 et D3 conduisent</b>, D1 et D4 sont bloquées.</p><p>Chemin : B → D2 → R → D3 → A. Le courant traverse R <b>dans le même sens</b> qu’à l’alternance précédente : u = −v &gt; 0.</p><p>D1 bloquée supporte v<sub>D1</sub> = v, qui vaut ici −V̂ ≈ −33,9 V : c’est sa <b>tension inverse maximale</b>.</p>',
    obs: 'Quelle est la valeur de v<sub>D1</sub> affichée ?', ans: 'v<sub>D1</sub> ≈ −33,9 V = −V̂. C’est la tension inverse que la diode doit supporter (V<sub>RRM</sub> à choisir au-dessus).' },
  { title: 'PD2 · Bilan : u = |v|', setup: S2, t: 39.9,
    text: '<p>u(t) est formée de « bosses » toutes positives : <b>u = |v|</b>. Sa période est T/2 = 10 ms (100 Hz).</p><p>Valeur moyenne : ⟨u⟩ = 2V̂/π ≈ 21,6 V. Chaque diode conduit une demi-période : ⟨i<sub>D</sub>⟩ = ⟨i⟩/2.</p>',
    obs: 'Compter les bosses de u sur 40 ms.', ans: '4 bosses en 40 ms, soit une toutes les 10 ms : fréquence 100 Hz.' },
  { title: 'PD3 · Le pont triphasé : D1 et D’2 conduisent', setup: S3, t: 60,
    text: '<p>Le pont PD3 a 3 diodes à cathodes communes (D1, D2, D3) et 3 à anodes communes (D’1, D’2, D’3), une par phase.</p><p>À θ = 60°, v1 est la tension la plus haute et v2 la plus basse : <b>D1 et D’2 conduisent</b>, u = v1 − v2 = <b>u12</b>.</p>',
    obs: 'À l’aide du premier graphique, vérifier que v1 est la plus haute et v2 la plus basse.', ans: 'La courbe bleue (v1) est en haut, la courbe verte (v2) est en bas : u = u12 ≈ 560 V.' },
  { title: 'PD3 · Commutation dans le groupe du bas (θ = 90°)', setup: S3, t: 92,
    text: '<p>À θ = 90°, v3 devient plus basse que v2. Dans le groupe à anodes communes, le courant passe de D’2 à <b>D’3</b>. D1 continue de conduire.</p><p>u = v1 − v3 = <b>u13</b>.</p>',
    obs: 'Toutes les combien de degrés une commutation a-t-elle lieu ?', ans: 'Tous les 60° : alternativement dans le groupe du haut et dans celui du bas. u a donc une période de T/6.' },
  { title: 'PD3 · Bilan : chaque diode conduit 120°', setup: S3, t: 153,
    text: '<p>À θ = 150°, v2 devient plus haute que v1 : le courant passe de D1 à <b>D2</b>. D1 a conduit de 30° à 150°, soit <b>120° = T/3</b>.</p><p>u suit l’enveloppe des tensions composées, entre 0,87 Û et Û. ⟨u⟩ ≈ 1,35 U ≈ 540 V. Quand D1 est bloquée, v<sub>D1</sub> = v1 − v<sub>max</sub> peut atteindre −Û = −U√2 ≈ −566 V.</p>',
    obs: 'Sur le dernier graphique, quelle est la valeur la plus négative de v<sub>D1</sub> ?', ans: 'Environ −565 V, soit la valeur maximale d’une tension composée U√2.' }
]);
})();
