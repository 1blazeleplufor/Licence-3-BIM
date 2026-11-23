'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const f = (x, d = 2) => (Number.isFinite(x) ? x.toLocaleString('fr-FR', { maximumFractionDigits: d }) : '—');
const box = (label, val, unit = '') => `<div><span>${label}</span><b>${val}${unit ? ' ' + unit : ''}</b></div>`;
const num = (root, k) => parseFloat(String($(`[data-k="${k}"]`, root).value).replace(',', '.'));

/* ---------- QCM ---------- */
const QCM = {
  c1: [
    { q: 'Quelle est la loi d’Ohm ?', o: ['U = R × I', 'U = R / I', 'I = U × R'], a: 0, why: 'La tension aux bornes d’une résistance est égale à R × I.' },
    { q: 'Une résistance de 46 Ω est traversée par 5 A. Quelle tension ?', o: ['9,2 V', '230 V', '51 V'], a: 1, why: 'U = 46 × 5 = 230 V.' },
    { q: 'Quelle tension est considérée comme dangereuse en courant alternatif (local sec) ?', o: ['Au-delà de 50 V', 'Au-delà de 500 V', 'Seulement au-delà de 1000 V'], a: 0, why: 'La limite de très basse tension de sécurité en alternatif est de 50 V (120 V en continu lissé).' },
    { q: 'Le courant dangereux pour le corps humain est surtout lié…', o: ['À l’intensité qui le traverse', 'À la couleur du fil', 'À la fréquence seule'], a: 0, why: 'C’est l’intensité traversant le corps (et la durée) qui provoque les dégâts.' }
  ],
  c2: [
    { q: 'Deux résistances de 10 Ω et 20 Ω en série : résistance équivalente ?', o: ['30 Ω', '6,67 Ω', '15 Ω'], a: 0, why: 'En série, les résistances s’additionnent.' },
    { q: 'Deux résistances de 30 Ω et 60 Ω en parallèle :', o: ['90 Ω', '20 Ω', '45 Ω'], a: 1, why: 'R = (30×60)/(30+60) = 20 Ω.' },
    { q: 'En parallèle, qu’est-ce qui est commun à toutes les branches ?', o: ['La tension', 'Le courant', 'La puissance'], a: 0, why: 'Les branches sont sous la même tension ; les courants s’additionnent (loi des nœuds).' },
    { q: 'Loi des nœuds :', o: ['La somme des courants entrant = somme des courants sortant', 'La somme des tensions = 0 sur un nœud', 'Le courant diminue après chaque nœud'], a: 0, why: 'Au nœud, rien ne s’accumule : ce qui entre ressort.' }
  ],
  c3: [
    { q: 'Tension efficace d’un signal sinusoïdal de 325 V crête ?', o: ['230 V', '460 V', '163 V'], a: 0, why: 'Ueff = Umax/√2 = 325/1,414 ≈ 230 V.' },
    { q: 'En France, la fréquence du réseau est de :', o: ['50 Hz', '60 Hz', '100 Hz'], a: 0, why: '50 Hz, soit une période de 20 ms.' },
    { q: 'Relation entre tension composée U et simple V en triphasé équilibré :', o: ['U = √3 × V', 'U = V / √3', 'U = 3 × V'], a: 0, why: '400 V = √3 × 230 V.' },
    { q: 'Les trois tensions d’un réseau triphasé sont déphasées de :', o: ['120°', '90°', '180°'], a: 0, why: 'Un tiers de période entre chaque phase.' }
  ],
  c4: [
    { q: 'Quelle unité pour la puissance réactive Q ?', o: ['W', 'VA', 'var'], a: 2, why: 'P en W, Q en var, S en VA.' },
    { q: 'Relation entre P, Q et S :', o: ['S² = P² + Q²', 'S = P + Q', 'S = P × Q'], a: 0, why: 'Triangle des puissances.' },
    { q: 'cos φ = ?', o: ['P / S', 'Q / S', 'P / Q'], a: 0, why: 'Rapport de la puissance active sur l’apparente.' },
    { q: 'Pour plusieurs récepteurs, on additionne :', o: ['Les P et les Q', 'Les S', 'Les cos φ'], a: 0, why: 'P et Q s’additionnent ; S se recalcule ensuite avec √(P²+Q²).' }
  ],
  c5: [
    { q: 'À quoi sert la compensation d’énergie réactive ?', o: ['Relever cos φ et réduire le courant appelé', 'Augmenter la tension', 'Réduire la fréquence'], a: 0, why: 'Les condensateurs fournissent Q localement.' },
    { q: 'Formule de la puissance réactive à compenser :', o: ['Qc = P (tan φ1 − tan φ2)', 'Qc = P (cos φ1 − cos φ2)', 'Qc = S − P'], a: 0, why: 'On passe de tan φ1 à tan φ2 cible.' },
    { q: 'Pénalité de facturation si :', o: ['tan φ > 0,4 (cos φ < 0,93)', 'tan φ < 0,4', 'cos φ = 1'], a: 0, why: 'Au-delà de tan φ = 0,4, l’énergie réactive est facturée.' },
    { q: 'Un condensateur de compensation en triangle sur réseau triphasé fournit :', o: ['Qc = 3 C ω U²', 'Qc = C ω U²', 'Qc = C U'], a: 0, why: 'Chaque condensateur est sous U (tension composée) : 3 condensateurs.' }
  ],
  c6: [
    { q: 'Dans « TT », le premier T désigne :', o: ['Le neutre relié à la terre', 'Les masses reliées à la terre', 'Un transformateur'], a: 0, why: '1ʳᵉ lettre : situation du neutre (T = terre, I = isolé).' },
    { q: 'Dans « TN », le N de la 2ᵉ lettre signifie :', o: ['Masses reliées au neutre', 'Neutre isolé', 'Neutre à la terre'], a: 0, why: 'Les masses sont reliées au neutre (via PE/PEN).' },
    { q: 'En IT, au 1ᵉʳ défaut, il faut :', o: ['Signaler (CPI) sans forcément couper', 'Couper immédiatement', 'Ne rien faire jamais'], a: 0, why: 'Le contrôleur permanent d’isolement signale ; on déclenche au 2ᵉ défaut.' },
    { q: 'En TT, la protection est assurée par :', o: ['Un dispositif différentiel', 'Un fusible seul', 'Un contacteur'], a: 0, why: 'Le courant de défaut est faible : on utilise un DDR.' }
  ],
  c7: [
    { q: 'Condition de choix : ', o: ['IB ≤ In ≤ Iz', 'In ≤ IB ≤ Iz', 'Iz ≤ In ≤ IB'], a: 0, why: 'La protection doit supporter le courant d’emploi et protéger le câble.' },
    { q: 'Le courant fictif se calcule par :', o: ['I′z = In / K', 'I′z = In × K', 'I′z = IB × K'], a: 0, why: 'On divise le calibre par le coefficient global K.' },
    { q: 'Que vaut K3 pour un neutre chargé ?', o: ['0,84', '1,12', '0,72'], a: 0, why: 'Le neutre chargé réduit la capacité du câble.' },
    { q: 'Limite de chute de tension (poste privé, usages autres que éclairage) :', o: ['8 %', '3 %', '1 %'], a: 0, why: '6 % éclairage, 8 % autres usages en poste privé.' }
  ]
};
QCM.all = [QCM.c1[1], QCM.c2[1], QCM.c3[0], QCM.c4[1], QCM.c5[1], QCM.c6[2], QCM.c7[1], QCM.c3[2]];

function initQcm() {
  $$('[data-qcm]').forEach(boxEl => {
    const key = boxEl.dataset.qcm, items = QCM[key]; if (!items) return;
    boxEl.innerHTML = items.map((it, i) => `<div class="qq"><p>${i + 1}. ${it.q}</p>${it.o.map((o, j) => `<label><input type="radio" name="${key}-${i}" value="${j}"> ${o}</label>`).join('')}<div class="why">${it.why}</div></div>`).join('') + '<div class="score"></div>';
    const qs = $$('.qq', boxEl), score = $('.score', boxEl), done = {};
    const upd = () => {
      const n = Object.keys(done).length, good = Object.values(done).filter(Boolean).length;
      score.innerHTML = n < qs.length ? `Réponses : ${n} / ${qs.length}` : `<b>Score : ${good} / ${qs.length}</b> ${good === qs.length ? '— Bravo !' : '— Relis les explications et recommence.'} <button type="button">Recommencer</button>`;
      const b = $('button', score);
      if (b) b.onclick = () => { for (const k in done) delete done[k]; qs.forEach(q => { q.classList.remove('ok', 'no'); $$('input', q).forEach(i => { i.checked = false; i.disabled = false; }); $$('label', q).forEach(l => l.classList.remove('good', 'bad')); }); upd(); };
    };
    qs.forEach((q, i) => $$('input', q).forEach(inp => inp.addEventListener('change', () => {
      const ok = +inp.value === items[i].a; done[i] = ok; q.classList.toggle('ok', ok); q.classList.toggle('no', !ok);
      $$('input', q).forEach(x => { x.disabled = true; const l = x.closest('label'); if (+x.value === items[i].a) l.classList.add('good'); else if (x === inp) l.classList.add('bad'); });
      upd();
    })));
    upd();
  });
}

/* ---------- Calculateurs ---------- */
const CALC = {
  ohm(root) {
    const get = k => { const v = $(`[data-k="${k}"]`, root).value.trim(); return v === '' ? NaN : parseFloat(v.replace(',', '.')); };
    const u = get('u'), r = get('r'), i = get('i'), msg = $('[data-k="msg"]', root);
    const have = [u, r, i].filter(Number.isFinite).length;
    if (have < 2) { msg.textContent = 'Entre deux valeurs.'; return; }
    if (have === 3) { msg.textContent = `Vérification : R × I = ${f(r * i)} V (U saisie : ${f(u)} V).`; return; }
    if (!Number.isFinite(u)) msg.textContent = `U = R × I = ${f(r * i)} V`;
    else if (!Number.isFinite(r)) msg.textContent = i === 0 ? 'I ne peut pas être nul.' : `R = U / I = ${f(u / i)} Ω`;
    else msg.textContent = r === 0 ? 'R ne peut pas être nulle.' : `I = U / R = ${f(u / r, 3)} A`;
  },
  res(root) {
    const U = num(root, 'U'), R = n => num(root, 'R' + n);
    const par = (a, b) => (a * b) / (a + b);
    const [r1, r2, r3, r4, r5, r6, r7, r8] = [1, 2, 3, 4, 5, 6, 7, 8].map(R);
    const r678 = r6 + r7 + r8, rin = 1 / (1 / r4 + 1 / r5 + 1 / r678), r3s = r3 + rin, r2p = par(r2, r3s);
    const req = r1 + r2p, I = U / req;
    const u2 = I * r2p, i3 = u2 / r3s, u4 = i3 * rin, i5 = u4 / r5;
    $('[data-k="out"]', root).innerHTML = box('R équivalente', f(req), 'Ω') + box('Courant total I', f(I, 3), 'A') + box('Courant dans R1', f(I, 3), 'A')
      + box('Courant dans R3', f(i3, 3), 'A') + box('Courant dans R5', f(i5, 3), 'A') + box('Tension aux bornes de R2', f(u2), 'V');
  },
  puiss(root) {
    const mode = $('[data-k="mode"]', root).value, U = num(root, 'U'), P = num(root, 'P') * 1000, c = num(root, 'cos');
    const S = P / c, Q = Math.sqrt(Math.max(S * S - P * P, 0)), I = mode === 'tri' ? S / (Math.sqrt(3) * U) : S / U;
    $('[data-k="out"]', root).innerHTML = box('S', f(S / 1000), 'kVA') + box('Q', f(Q / 1000), 'kvar') + box('tan φ', f(Q / P, 3)) + box('Courant I', f(I), 'A') + box('φ', f(Math.acos(c) * 180 / Math.PI, 1), '°');
  },
  bilan(root) {
    const tb = $('[data-k="rows"]', root);
    const addRow = (name = '', p = '', c = '') => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><input type="text" value="${name}" placeholder="Récepteur"></td><td><input type="number" step="any" value="${p}"></td><td><input type="number" step="0.01" min="0.01" max="1" value="${c}"></td><td class="r q">0</td>`;
      tb.appendChild(tr); tr.addEventListener('input', calc);
    };
    const calc = () => {
      let P = 0, Q = 0;
      $$('tr', tb).forEach(tr => {
        const ins = $$('input', tr), p = parseFloat(ins[1].value), c = parseFloat(ins[2].value);
        const q = Number.isFinite(p) && c > 0 && c <= 1 ? p * Math.tan(Math.acos(c)) : NaN;
        $('.q', tr).textContent = f(q);
        if (Number.isFinite(p)) P += p; if (Number.isFinite(q)) Q += q;
      });
      const S = Math.hypot(P, Q), U = num(root, 'U'), tri = $('[data-k="mode"]', root).value === 'tri';
      const I = (S * 1000) / (tri ? Math.sqrt(3) * U : U);
      $('[data-k="out"]', root).innerHTML = box('P total', f(P), 'kW') + box('Q total', f(Q), 'kvar') + box('S = √(P²+Q²)', f(S), 'kVA') + box('cos φ global', f(P / S, 3)) + box('Courant', f(I), 'A');
    };
    addRow('Récepteur 1', 5, 0.8); addRow('Récepteur 2', 3, 0.9);
    $('[data-k="add"]', root).onclick = () => { addRow(); calc(); };
    $$('.in input,.in select', root).forEach(e => e.addEventListener('input', calc)); calc();
  },
  comp(root) {
    const mode = $('[data-k="mode"]', root).value, U = num(root, 'U'), fr = num(root, 'f'), P = num(root, 'P') * 1000, c1 = num(root, 'c1'), c2 = num(root, 'c2');
    const t = c => Math.tan(Math.acos(c)), w = 2 * Math.PI * fr;
    const Qc = P * (t(c1) - t(c2)), msg = $('[data-k="msg"]', root);
    let out = box('tan φ1 → tan φ2', `${f(t(c1), 3)} → ${f(t(c2), 3)}`) + box('Qc', f(Qc / 1000), 'kvar');
    if (mode === 'tri') out += box('C (couplage Δ)', f(Qc / (3 * w * U * U) * 1e6), 'µF/phase') + box('C (couplage Y)', f(Qc / (w * U * U) * 1e6), 'µF/phase');
    else out += box('C', f(Qc / (w * U * U) * 1e6), 'µF');
    $('[data-k="out"]', root).innerHTML = out;
    msg.textContent = Qc < 0 ? 'cos φ visé inférieur à l’actuel : rien à compenser.' : (t(c2) > 0.4 ? 'Attention : tan φ visé > 0,4, la pénalité de réactif s’applique.' : 'tan φ visé ≤ 0,4 : pas de pénalité.');
  },
  neutre(root) {
    const reg = $('[data-k="reg"]', root).value, U0 = num(root, 'U0');
    ['tt', 'tn', 'it'].forEach(k => { $(`div[data-k="${k}"]`, root).hidden = k !== reg; });
    let Id, Uc, msg;
    if (reg === 'tt') { const Rn = num(root, 'Rn'), Ra = num(root, 'Ra'); Id = U0 / (Rn + Ra); Uc = Ra * Id; msg = 'TT : courant faible, il faut un différentiel (Ra ≤ 50 V / IΔn).'; }
    else if (reg === 'tn') { const L = num(root, 'L'), S = num(root, 'S'), rho = num(root, 'rho'); const R = rho * 2 * L / S; Id = 0.8 * U0 / R; Uc = 0.8 * U0 / 2; msg = 'TN : Id = 0,8·U0 / (R phase + R PE), même section ; le disjoncteur doit déclencher (Id ≥ Im).'; }
    else { const RA = num(root, 'RA'), Rn = num(root, 'Rn2'), Ze = num(root, 'Ze'); Id = U0 / (RA + Rn + Ze); Uc = RA * Id; msg = 'IT, 1ᵉʳ défaut : courant très faible, le CPI signale ; on déclenche au 2ᵉ défaut.'; }
    $('[data-k="out"]', root).innerHTML = box('Courant de défaut Id', f(Id, 3), 'A') + box('Tension de contact', f(Uc), 'V') + box('Seuil 50 V', Uc > 50 ? 'dépassé' : 'respecté');
    $('[data-k="msg"]', root).textContent = msg;
  },
  cable(root) {
    const TB = { PR: [[1.5, 23], [2.5, 32], [4, 42], [6, 54], [10, 75], [16, 100], [25, 127], [35, 158], [50, 192], [70, 246], [95, 298], [120, 346], [150, 399]],
      PVC: [[1.5, 18.5], [2.5, 25], [4, 34], [6, 43], [10, 60], [16, 80], [25, 101], [35, 126], [50, 153], [70, 196], [95, 238], [120, 276], [150, 319]] };
    const K1 = { PVC: { 20: 1.12, 25: 1.06, 30: 1, 35: 0.94, 40: 0.87 }, PR: { 20: 1.08, 25: 1.04, 30: 1, 35: 0.96, 40: 0.91 } };
    const K2 = { 1: 1, 2: 0.88, 3: 0.82, 4: 0.77, 5: 0.75, 6: 0.73, 9: 0.72 };
    const CAL = [10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];
    const Pu = num(root, 'Pu'), eta = num(root, 'eta'), c = num(root, 'cos'), U = num(root, 'U'), L = num(root, 'L');
    const iso = $('[data-k="iso"]', root).value, T = $('[data-k="T"]', root).value, N = $('[data-k="N"]', root).value, n = $('[data-k="neutre"]', root).value === '1';
    const Pa = Pu / eta, IB = Pa * 1000 / (Math.sqrt(3) * U * c), In = CAL.find(x => x >= IB) || NaN;
    const K = K1[iso][T] * K2[N] * (n ? 0.84 : 1), Iz = In / K;
    const row = TB[iso].find(r => r[1] >= Iz), S = row ? row[0] : NaN;
    const dU = row ? Math.sqrt(3) * 0.0225 * L * IB * c / S : NaN, pc = dU / U * 100;
    $('[data-k="out"]', root).innerHTML = box('Pa', f(Pa), 'kW') + box('IB', f(IB, 1), 'A') + box('In', f(In, 0), 'A') + box('K', f(K, 3)) + box('I′z', f(Iz, 1), 'A')
      + box('Section', row ? f(S, 1) : 'trop élevée', row ? 'mm²' : '') + box('ΔU', f(dU, 1), 'V') + box('ΔU %', f(pc, 2), '%');
    $('[data-k="msg"]', root).textContent = row ? (row[1] / Iz < 1.05 ? 'Marge très faible : prendre la section au-dessus en pratique.' : 'Section validée si ΔU % reste sous 6–8 % (poste privé).') : 'Au-delà des tableaux : passer en câbles en parallèle.';
  }
};
function initCalc() {
  $$('[data-calc]').forEach(root => {
    const fn = CALC[root.dataset.calc]; if (!fn) return;
    fn(root);
    if (root.dataset.calc !== 'bilan') root.addEventListener('input', () => fn(root));
  });
}
document.addEventListener('DOMContentLoaded', () => { initQcm(); initCalc(); const c = document.querySelector('nav a.cur'); if (c) c.parentElement.scrollLeft = c.offsetLeft - 60; });
