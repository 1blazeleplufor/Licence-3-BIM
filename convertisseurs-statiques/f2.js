/* ======================= Fiche 2 : redresseurs commandés ======================= */
(() => {
const { C, $, fmt, scope, transport, seg, slider } = TD;
const V = 230, Vh = V * Math.SQRT2, R = 50, I_L = 5, D2R = Math.PI / 180, PW = 8 * D2R;
const sim = { mode: 'mixte', load: 'R', alpha: 60 * D2R, dur: 9 };
sim.span = () => 720;
let br = null;

function build() {
  br = TD.bridge($('f2-sch'), sim.mode === 'mixte'
    ? { xs: [130, 250], top: ['T1', 'T2'], bot: ['D3', 'D4'], topKind: 'thyr', botKind: 'diode', inputs: 'source' }
    : { xs: [130, 250], top: ['T1', 'T2'], bot: ['T3', 'T4'], topKind: 'thyr', botKind: 'thyr', inputs: 'source' });
}

/* état à l'angle th (degrés) */
function st(tdeg) {
  const th = tdeg * D2R, pm = ((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), a = sim.alpha, v = Vh * Math.sin(th);
  let top = null, bot = null, u = 0, fw = false; // top/bot : 0 = gauche, 1 = droite
  if (sim.load === 'R') {
    if (pm < Math.PI && pm >= a) { top = 0; bot = 1; u = v; }
    else if (pm >= Math.PI && pm - Math.PI >= a) { top = 1; bot = 0; u = -v; }
  } else if (sim.mode === 'mixte') {
    if (pm >= a && pm < Math.PI) { top = 0; bot = 1; u = v; }
    else if (pm >= Math.PI && pm < Math.PI + a) { top = 0; bot = 0; u = 0; fw = true; }
    else if (pm >= Math.PI + a) { top = 1; bot = 0; u = -v; }
    else { top = 1; bot = 1; u = 0; fw = true; }
  } else {
    const x = ((pm - a) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    if (x < Math.PI) { top = 0; bot = 1; u = v; } else { top = 1; bot = 0; u = -v; }
  }
  const on = top !== null, i = !on ? 0 : sim.load === 'R' ? u / R : I_L;
  const g1 = pm >= a && pm < a + PW, g2 = pm >= Math.PI + a && pm < Math.PI + a + PW;
  return { v, u, i, top, bot, fw, on, pm, iT1: top === 0 ? i : 0, g1, g2 };
}
const avg = () => (sim.mode === 'tout' && sim.load === 'L') ? 2 * Vh * Math.cos(sim.alpha) / Math.PI : Vh * (1 + Math.cos(sim.alpha)) / Math.PI;

sim.draw = (dt = 0) => {
  const s = st(sim.t), names = sim.mode === 'mixte' ? [['T1', 'T2'], ['D3', 'D4']] : [['T1', 'T2'], ['T3', 'T4']];
  br.top.forEach((d, k) => d.set(s.top === k ? 'on' : 'off')); br.bot.forEach((d, k) => d.set(s.bot === k ? 'on' : 'off'));
  br.top.forEach((d, k) => d.gate.setAttribute('stroke-width', (k === 0 ? s.g1 : s.g2) ? 5 : 2));
  if (sim.mode === 'tout') br.bot.forEach((d, k) => d.gate.setAttribute('stroke-width', (k === 1 ? s.g1 : s.g2) ? 5 : 2));
  br.flow(s.on ? [130, 250][s.top] : null, s.on ? [130, 250][s.bot] : null, sim.load === 'R' ? s.i / (Vh / R) : 0.7, dt);
  const cond = s.on ? `${names[0][s.top]} et ${names[1][s.bot]} passants` : 'Tout est bloqué';
  $('f2-badge').textContent = cond; $('f2-badge').style.background = s.on ? (s.fw ? C.orange : C.green) : C.red;
  const Ueff = V * Math.sqrt(Math.max(0, 1 - sim.alpha / Math.PI + Math.sin(2 * sim.alpha) / (2 * Math.PI)));
  $('f2-vals').innerHTML = `<div><span>θ = ωt</span><b>${Math.round(sim.t % 360)}°</b></div><div><span>v(t)</span><b>${fmt(s.v, 0)} V</b></div><div><span>u(t)</span><b>${fmt(s.u, 0)} V</b></div><div><span>i(t)</span><b>${fmt(s.i, 2)} A</b></div><div><span>⟨u⟩ théorique</span><b>${fmt(avg(), 1)} V</b></div>` + (sim.load === 'R' ? `<div><span>U efficace</span><b>${fmt(Ueff, 0)} V</b></div>` : '');
  const deg = Math.round(sim.alpha / D2R), pmd = s.pm / D2R;
  let m;
  if (!s.on) m = `Aucun thyristor n'a encore reçu d'impulsion dans cette alternance (θ &lt; α = ${deg}°) : i = 0 et u = 0. Les thyristors supportent la tension du réseau.`;
  else if (s.fw) m = `<b>Roue libre</b> : l'inductance maintient le courant, qui se referme par ${names[0][s.top]} et ${names[1][s.bot]} (même bras). La charge est court-circuitée : u = 0, aucun échange d'énergie avec le réseau.`;
  else if (s.g1 || s.g2) m = `Impulsion de gâchette à θ = ${s.g1 ? deg : 180 + deg}° : v<sub>AK</sub> &gt; 0 et i<sub>G</sub> présent, le thyristor s'amorce. La charge est reliée au réseau.`;
  else if (s.u < 0) m = `La tension v a changé de signe mais le courant, imposé par l'inductance, continue de passer dans ${names[0][s.top]} et ${names[1][s.bot]} : u devient <b>négative</b>. C'est ce qui permet au pont tout thyristors de renvoyer de l'énergie au réseau.`;
  else m = `${names[0][s.top]} et ${names[1][s.bot]} conduisent : la charge reçoit u = ${pmd < 180 ? 'v' : '−v'}. Le thyristor reste passant sans courant de gâchette jusqu'à l'annulation du courant${sim.load === 'L' ? ' ou l’amorçage du thyristor suivant' : ''}.`;
  $('f2-msg').innerHTML = m;
  // zones
  const sh = []; let s0 = null, kind = null;
  for (let k = 0; k <= 1440; k++) { const t = k / 2, x = st(t), kk = !x.on ? null : x.fw ? 'fw' : 'net'; if (kk !== kind || k === 1440) { if (kind) sh.push([s0, t, kind === 'fw' ? '#fdf0d8' : '#d6f2e2']); s0 = t; kind = kk; } }
  const ticks = [0, 90, 180, 270, 360, 450, 540, 630, 720].map(t => [t, t + '°']);
  const imax = sim.load === 'R' ? 7 : 6;
  TD.scope($('f2-scope'), { h: 400, span: 720, cursor: sim.t, ticks, N: 900, panels: [
    { w: 1.5, min: -350, max: 350, yticks: [-300, 0, 300], label: 'tensions (V)', shade: sh, traces: [{ f: t => avg(), c: C.green, w: 1, dash: [5, 4], nodot: true }, { f: t => st(t).v, c: C.blue }, { f: t => st(t).u, c: C.green, w: 3.5 }] },
    { w: 0.45, min: -0.2, max: 1.7, yticks: [], label: 'i_G', traces: [{ f: t => st(t).g1 ? 1 : 0, c: C.violet, w: 2 }, { f: t => st(t).g2 ? 1 : 0, c: '#b59be0', w: 2 }] },
    { w: 0.8, min: -0.3, max: imax, yticks: [0, sim.load === 'R' ? 3 : 2.5, sim.load === 'R' ? 6 : 5], label: 'i_T1 (A)', shade: sh, traces: [{ f: t => st(t).iT1, c: C.orange }] }
  ] });
};

transport('f2', sim);
slider('f2-alpha', v => { sim.alpha = v * D2R; if (br) sim.draw(); }, v => v + '°');
seg('f2-mode', v => { sim.mode = v; build(); sim.draw(); });
seg('f2-load', v => { sim.load = v; sim.draw(); });
build();
TD.register('commande', sim);
const cfg = (mode, load, a) => () => { TD.pick('f2-mode', mode); TD.pick('f2-load', load); TD.setSlider('f2-alpha', a); };
TD.stepper('f2', sim, [
  { title: 'Avant l’impulsion : tout est bloqué', setup: cfg('mixte', 'R', 60), t: 30,
    text: '<p>Pont mixte (T1, T2 en haut ; D3, D4 en bas), charge résistive, α = 60°.</p><p>À θ = 30°, v &gt; 0 donc v<sub>AK</sub> de T1 est positive : la <b>première condition</b> d’amorçage est remplie. Mais aucune impulsion n’a encore été envoyée sur la gâchette : T1 reste <b>bloqué</b>. Aucun courant ne circule : <b>u = 0</b>.</p>',
    obs: 'Quelle tension supporte T1 à cet instant ?', ans: 'Toute la tension du réseau : v<sub>T1</sub> = v ≈ 160 V (positive). Le thyristor « attend » son impulsion.' },
  { title: 'θ = α : impulsion sur T1, amorçage', setup: cfg('mixte', 'R', 60), t: 62,
    text: '<p>À θ = α = 60°, le circuit de commande envoie une impulsion i<sub>G1</sub> (graphique du milieu). Les <b>deux conditions</b> sont réunies : T1 s’amorce.</p><p>D4 conduit aussi (sa cathode est reliée à B, le point le plus bas). Chemin : A → T1 → R → D4 → B, et <b>u = v</b>.</p>',
    obs: 'Que devient u brusquement à cet instant ?', ans: 'u passe de 0 à v ≈ 280 V : on voit un front vertical sur la courbe verte.' },
  { title: 'Conduction sans courant de gâchette', setup: cfg('mixte', 'R', 60), t: 120,
    text: '<p>L’impulsion est terminée (i<sub>G1</sub> = 0), mais T1 reste passant : c’est l’<b>effet mémoire</b>. Il suffit que le courant reste supérieur au courant de maintien I<sub>H</sub>.</p>',
    obs: 'Le courant dans T1 est-il nul ?', ans: 'Non : i<sub>T1</sub> = u/R ≈ 5,6 A. Le thyristor conduit sans aucun courant de gâchette.' },
  { title: 'θ = 180° : blocage naturel', setup: cfg('mixte', 'R', 60), t: 200,
    text: '<p>À θ = 180°, v s’annule : sur une charge résistive le courant s’annule aussi, T1 se <b>bloque</b> tout seul (commutation naturelle).</p><p>Entre 180° et 180° + α, v &lt; 0 et T2 n’a pas encore reçu d’impulsion : tout est bloqué, u = 0.</p>',
    obs: 'Si on envoyait maintenant une impulsion sur T1, que se passerait-il ?', ans: 'Rien : v<sub>AK</sub> de T1 est négative, la première condition n’est pas remplie.' },
  { title: 'θ = 180° + α : T2 et D3 conduisent', setup: cfg('mixte', 'R', 60), t: 245,
    text: '<p>Impulsion sur T2 à 240°. B est maintenant le point le plus haut : T2 et D3 conduisent. Chemin : B → T2 → R → D3 → A, <b>u = −v &gt; 0</b>.</p><p>Le courant dans la charge garde le même sens : c’est toujours du redressement.</p>',
    obs: 'Combien d’impulsions de gâchette y a-t-il par période ?', ans: 'Deux : une pour T1 à α, une pour T2 à 180° + α.' },
  { title: 'Effet de l’angle α sur ⟨u⟩', setup: cfg('mixte', 'R', 120), t: 150,
    text: '<p>Avec α = 120°, le thyristor est amorcé plus tard : la partie de sinusoïde transmise à la charge est plus petite.</p><p>⟨u⟩ = V̂(1 + cos α)/π passe de 155 V (α = 60°) à environ 52 V (α = 120°). <b>On règle la tension continue avec α</b>.</p>',
    obs: 'Lire la valeur de ⟨u⟩ théorique affichée.', ans: '⟨u⟩ ≈ 51,8 V. Pour α = 0 on retrouverait 207 V (pont à diodes), pour α = 180° on aurait 0 V.' },
  { title: 'Charge inductive : la roue libre', setup: cfg('mixte', 'L', 60), t: 30,
    text: '<p>Charge très inductive (moteur avec inductance de lissage) : le courant ne peut pas s’annuler brusquement. Entre 0 et α, il continue de circuler par <b>T2 et D4</b> (même bras droit).</p><p>La charge est court-circuitée : <b>u = 0</b>, sans échange d’énergie avec le réseau. C’est la <b>roue libre</b> (zone orangée).</p>',
    obs: 'Quelle est la valeur du courant dans la charge ?', ans: 'i = 5 A : le courant ne s’annule jamais avec une charge très inductive (conduction continue).' },
  { title: 'Pont tout thyristors : u devient négative', setup: cfg('tout', 'L', 60), t: 205,
    text: '<p>Pont tout thyristors (T1 à T4), charge inductive. Il n’y a plus de diode pour faire la roue libre : T1 et T4 restent passants après 180°, jusqu’à l’amorçage de T2 et T3 à 240°.</p><p>Entre 180° et 240°, v &lt; 0 mais T1-T4 conduisent : <b>u = v &lt; 0</b>.</p>',
    obs: 'Quel est le signe de u et de i à cet instant ? Que dire de la puissance reçue par la charge ?', ans: 'u &lt; 0 et i &gt; 0 : p = u·i &lt; 0 pendant ce court instant, la charge rend de l’énergie au réseau.' },
  { title: 'α > 90° : fonctionnement en onduleur assisté', setup: cfg('tout', 'L', 120), t: 340,
    text: '<p>Avec α = 120°, ⟨u⟩ = 2V̂ cos α/π ≈ −104 V : la valeur moyenne est <b>négative</b> alors que le courant reste positif.</p><p>La puissance moyenne va de la charge vers le réseau : le pont fonctionne en <b>onduleur assisté</b>. Il faut que la charge soit une machine en génératrice (par exemple un moteur de levage qui retient une charge en descente).</p>',
    obs: 'Pourquoi ne peut-on pas obtenir ce fonctionnement avec un pont mixte ?', ans: 'Les diodes du pont mixte assurent la roue libre dès que u voudrait devenir négative : u ≥ 0, donc ⟨u⟩ ≥ 0.' }
]);
})();
