'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const f = (x, d = 2) => (Number.isFinite(x) ? x.toLocaleString('fr-FR', { maximumFractionDigits: d }) : '—');
const box = (l, v, u = '') => `<div><span>${l}</span><b>${v}${u ? ' ' + u : ''}</b></div>`;
const num = (r, k) => { const e = $(`[data-k="${k}"]`, r); return e ? parseFloat(String(e.value).replace(',', '.')) : NaN; };

const QCM = {
  q0: [
    { q: 'Sur un réseau 50 Hz, à quelle fréquence est l’harmonique de rang 5 ?', o: ['250 Hz', '55 Hz', '10 Hz'], a: 0, why: 'f<sub>n</sub> = n × f = 5 × 50 = 250 Hz.' },
    { q: 'Un signal carré symétrique contient :', o: ['Seulement les rangs impairs', 'Seulement les rangs pairs', 'Tous les rangs'], a: 0, why: 'Il est impair (a<sub>n</sub> = 0) et ses b<sub>n</sub> de rang pair sont nuls.' },
    { q: 'Pour un signal pair, v(t) = v(−t) :', o: ['b<sub>n</sub> = 0', 'a<sub>n</sub> = 0', 'V<sub>0</sub> = 0'], a: 0, why: 'Il ne reste que des cosinus (fonctions paires).' },
    { q: 'Le THD se calcule en divisant la valeur efficace des harmoniques par :', o: ['celle du fondamental', 'la valeur efficace totale', 'la valeur crête'], a: 0, why: 'THD = √(I₂² + I₃² + …) / I₁.' },
    { q: 'Un pont redresseur triphasé produit surtout les rangs :', o: ['5, 7, 11, 13', '2, 4, 6', '3, 9, 15'], a: 0, why: 'Rangs 6k ± 1.' }
  ],
  q1: [
    { q: 'Le flicker est assimilé à :', o: ['Un creux de tension faible (&lt; 10 %) et lent (&lt; 25 Hz)', 'Une coupure longue', 'Une surtension de foudre'], a: 0, why: 'Il fait scintiller l’éclairage.' },
    { q: 'Limite de déséquilibre U<sub>−</sub>/U<sub>+</sub> :', o: ['2 %', '10 %', '8 %'], a: 0, why: 'Normes européennes et mondiales : &lt; 2 %.' },
    { q: 'Effet de la composante inverse sur un moteur asynchrone :', o: ['Couple inverse (vibrations) et échauffement', 'Augmentation du rendement', 'Aucun'], a: 0, why: 'Elle crée un champ tournant à l’envers.' },
    { q: 'Remède typique contre les coupures :', o: ['ASI, permutation de sources, groupe à temps zéro', 'Self anti-harmonique', 'Réactance série'], a: 0, why: 'Tableau des solutions de ta fiche.' },
    { q: 'Pourquoi le neutre peut-il être surchargé ?', o: ['Les harmoniques de rang 3 des 3 phases s’additionnent', 'Le neutre est plus fin', 'À cause du flicker'], a: 0, why: 'I<sub>N</sub> ≈ 3 × I₃.' }
  ],
  q2: [
    { q: 'Le paratonnerre protège :', o: ['Le bâtiment (écoulement de la foudre à la terre)', 'Les appareils électroniques', 'Le compteur uniquement'], a: 0, why: 'Le parafoudre, lui, protège les équipements.' },
    { q: 'Composant de protection au temps de réponse le plus court :', o: ['Diode Zener', 'Éclateur', 'Fusible'], a: 0, why: 'C’est ce que note ta fiche.' },
    { q: 'Le niveau kéraunique, c’est :', o: ['Le nombre de jours d’orage entendus par an', 'La tension de la foudre', 'La résistance de terre'], a: 0, why: 'N<sub>k</sub> &gt; 25 → zone AQ2.' },
    { q: 'Tenue aux chocs d’un matériel électronique sur un réseau 230/400 V :', o: ['1,5 kV', '6 kV', '4 kV'], a: 0, why: 'Catégorie « tenue réduite ».' },
    { q: 'Une rupture du neutre provoque une surtension :', o: ['Temporaire', 'De manœuvre', 'Atmosphérique'], a: 0, why: 'Classée dans les surtensions temporaires.' }
  ],
  q3: [
    { q: 'cos φ₁ = 0,99 mais PF = 0,70. Pourquoi ?', o: ['À cause des harmoniques (puissance déformante)', 'À cause du réactif', 'L’appareil est faux'], a: 0, why: 'λ = cos φ₁ / √(1 + THD²).' },
    { q: 'Relation entre les puissances avec harmoniques :', o: ['S² = P² + Q² + D²', 'S = P + Q + D', 'S² = P² − Q²'], a: 0, why: 'D est la puissance déformante.' },
    { q: 'Le dipôle LC (0,55 mH, 730 µF) résonne à environ :', o: ['250 Hz (rang 5)', '50 Hz', '1 kHz'], a: 0, why: 'f₀ = 1/(2π√(LC)) ≈ 251 Hz.' },
    { q: 'À 50 Hz, ce dipôle LC se comporte comme :', o: ['Un condensateur (fournit du réactif)', 'Une bobine', 'Un court-circuit'], a: 0, why: 'X<sub>C</sub> = 4,36 Ω &gt; X<sub>L</sub> = 0,17 Ω.' },
    { q: 'Facteur de crête 3,0 et I = 196 A : I<sub>max</sub> ≈', o: ['588 A', '277 A', '196 A'], a: 0, why: '3,0 × 196 = 588 A.' }
  ],
  q4: [
    { q: 'La CEM exige qu’un appareil :', o: ['Ne soit ni bourreau ni victime', 'Porte seulement le logo CE', 'Soit blindé'], a: 0, why: 'Émissions limitées et immunité suffisante.' },
    { q: 'Depuis quand la CEM fait-elle partie du marquage CE ?', o: ['1ᵉʳ janvier 1996', '2014', '1969'], a: 0, why: 'Date donnée par ta fiche.' },
    { q: 'Seul mode de transmission qui peut transporter une composante continue :', o: ['La conduction', 'Le rayonnement', 'Le couplage capacitif'], a: 0, why: 'Il passe par un conducteur commun.' },
    { q: 'En mode commun, la perturbation revient :', o: ['Par la terre, via les capacités parasites', 'Par le neutre', 'Elle ne revient pas'], a: 0, why: 'Le mode différentiel, lui, emprunte Ph et N.' },
    { q: 'En HF, un condensateur se comporte comme :', o: ['Un court-circuit', 'Un circuit ouvert', 'Une résistance fixe'], a: 0, why: '|Z| = 1/(Cω) → 0.' }
  ],
  q5: [
    { q: 'Remède au couplage champ à boucle :', o: ['Réduire la surface, torsader', 'Allonger les câbles', 'Augmenter le courant'], a: 0, why: 'E = S·dB/dt.' },
    { q: 'Remède au couplage champ à fil :', o: ['Blindage relié au 0 V', 'Agrandir la boucle', 'Supprimer la terre'], a: 0, why: 'Le courant capté se dissipe dans le plan de masse.' },
    { q: 'La distance « plébiscitée » contre le couplage capacitif :', o: ['30 cm', '3 cm', '3 m'], a: 0, why: 'Liée à λ/2π.' },
    { q: 'TD2 exo 1, en HF, V₂/V₁ tend vers :', o: ['C₁₂ / (C₁₂ + C₂)', '0', '1'], a: 0, why: 'Diviseur capacitif.' },
    { q: 'Coaxial relié aux deux bouts, en HF le retour se fait :', o: ['Par le blindage', 'Par le plan de masse', 'Par l’âme'], a: 0, why: 'I₂/I₁ → 1.' }
  ],
  q6: [
    { q: 'Câblage des masses recommandé :', o: ['En maillage', 'En étoile', 'Aucune liaison'], a: 0, why: 'Sauf cas très particuliers.' },
    { q: 'La classe B (CISPR) concerne :', o: ['Domestique et hospitalier', 'Industriel', 'Militaire'], a: 0, why: 'C’est la plus sévère.' },
    { q: 'Les perturbations conduites se mesurent avec :', o: ['Un RSIL', 'Un mégohmmètre', 'Une pince ampèremétrique'], a: 0, why: 'Réseau Stabilisateur d’Impédance de Ligne.' },
    { q: 'Le blindage des filtres secteur est :', o: ['Magnétique', 'Thermique', 'Acoustique'], a: 0, why: 'Ta fiche, § 6.4.' },
    { q: '60 dBµV correspondent à :', o: ['1 mV', '60 µV', '1 V'], a: 0, why: '10^(60/20) = 1 000 µV.' }
  ],
  nr: [
    { q: 'I<sub>B</sub> pour 12 kVA en monophasé 230 V :', o: ['52,2 A', '30 A', '17,3 A'], a: 0, why: '12 000 / 230.' },
    { q: '119 A × 0,80 =', o: ['95,2 A', '99 A', '148,8 A'], a: 0, why: 'Attention à la calculatrice !' },
    { q: 'Le coefficient b vaut en monophasé :', o: ['2', '1', '√3'], a: 0, why: 'Aller et retour.' },
    { q: 'Ω/km désigne :', o: ['Une résistance linéique', 'Une résistivité', 'Une impédance de terre'], a: 0, why: 'Résistance d’un kilomètre de conducteur.' }
  ]
};
QCM.all = [QCM.q0[3], QCM.q0[1], QCM.q1[1], QCM.q1[4], QCM.q2[0], QCM.q2[3], QCM.q3[0], QCM.q3[2], QCM.q4[2], QCM.q4[3], QCM.q5[0], QCM.q5[2], QCM.q6[0], QCM.q6[1]];

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

const CALC = {
  thd(r) {
    const h1 = num(r, 'h1'), hs = [3, 5, 7, 9, 11, 13].map(n => num(r, 'h' + n) || 0), c = num(r, 'cos');
    const sh = Math.sqrt(hs.reduce((s, x) => s + x * x, 0)), thd = sh / h1, I = Math.sqrt(h1 * h1 + sh * sh);
    const lam = (c > 0 && c <= 1 ? c : 1) / Math.sqrt(1 + thd * thd);
    $('[data-k="out"]', r).innerHTML = box('Harmoniques (efficace)', f(sh), '') + box('THD', f(thd * 100, 1), '%') + box('Valeur efficace totale', f(I), '') + box('Facteur de puissance λ', f(lam, 3)) + box('Neutre (3 × rang 3, si triphasé)', f(3 * (num(r, 'h3') || 0)), '');
    $('[data-k="msg"]', r).textContent = thd > 0.08 ? 'Pour une tension, la limite EN 50160 est 8 % : au-delà, analyse nécessaire.' : 'THD ≤ 8 % : conforme pour une tension (EN 50160).';
  },
  deseq(r) {
    const V = [num(r, 'V1'), num(r, 'V2'), num(r, 'V3')], m = (V[0] + V[1] + V[2]) / 3;
    const di = V.map(v => (v - m) / v * 100), dm = V.map(v => (v - m) / m * 100);
    const ang = [0, -2 * Math.PI / 3, 2 * Math.PI / 3];
    const comp = sgn => { let re = 0, im = 0; V.forEach((v, k) => { const a = ang[k] + sgn * k * 2 * Math.PI / 3; re += v * Math.cos(a); im += v * Math.sin(a); }); return Math.hypot(re, im) / 3; };
    const Up = comp(1), Um = comp(-1), ex = Um / Up * 100;
    const mx = Math.max(...di.map(Math.abs));
    $('[data-k="out"]', r).innerHTML = box('V moyenne', f(m, 1), 'V') + box('ΔU₁ / ΔU₂ / ΔU₃ (÷ Vi)', di.map(x => f(x, 1)).join(' / '), '%') + box('Écart max (÷ Vmoy)', f(Math.max(...dm.map(Math.abs)), 1), '%') + box('U− / U+ exact', f(ex, 2), '%');
    $('[data-k="msg"]', r).textContent = (ex > 2 ? 'Non conforme : U−/U+ > 2 %.' : 'Conforme : U−/U+ ≤ 2 %.') + ' (calcul exact en supposant les phases à 120°)';
  },
  lc(r) {
    const L = num(r, 'L') / 1000, C = num(r, 'C') * 1e-6, fr = num(r, 'f'), V = num(r, 'V'), w = 2 * Math.PI * fr;
    const XL = L * w, XC = 1 / (C * w), Z = Math.abs(XL - XC), f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
    $('[data-k="out"]', r).innerHTML = box('X<sub>L</sub>', f(XL, 3), 'Ω') + box('X<sub>C</sub>', f(XC, 3), 'Ω') + box('Z', f(Z, 3), 'Ω') + box('f₀ résonance', f(f0, 1), 'Hz') + box('Rang accordé', f(f0 / 50, 2)) + box('Q à cette fréquence', f(V * V / Z / 1000, 2), 'kvar');
    $('[data-k="msg"]', r).textContent = XC > XL ? 'À cette fréquence le dipôle est capacitif : il fournit du réactif.' : 'À cette fréquence le dipôle est inductif.';
  },
  pqsd(r) {
    const V = num(r, 'V'), I = num(r, 'I'), I1 = num(r, 'I1'), c = num(r, 'cos'), s = Math.sqrt(1 - c * c);
    const P = V * I1 * c, Q = V * I1 * s, S = V * I, D = Math.sqrt(Math.max(S * S - P * P - Q * Q, 0)), thd = Math.sqrt(Math.max(I * I - I1 * I1, 0)) / I1;
    $('[data-k="out"]', r).innerHTML = box('P', f(P / 1000), 'kW') + box('Q', f(Q / 1000), 'kvar') + box('S', f(S / 1000), 'kVA') + box('D', f(D / 1000), 'kVAD') + box('λ = P/S', f(P / S, 3)) + box('THD<sub>i</sub>', f(thd * 100, 1), '%');
  },
  parasite(r) {
    const L = num(r, 'L'), S = num(r, 'S'), fr = num(r, 'f'), Lh = L * 1e-6;
    const XL = 2 * Math.PI * fr * Lh;
    $('[data-k="out"]', r).innerHTML = box('R (17·L/S)', f(17 * L / S, 1), 'mΩ') + box('Inductance', f(L, 2), 'µH') + box('Impédance Lω', XL < 1 ? f(XL * 1000, 2) + ' mΩ' : f(XL, 1) + ' Ω', '');
  },
  lambda(r) {
    const fr = num(r, 'f') * 1e6, l = 3e8 / fr;
    $('[data-k="out"]', r).innerHTML = box('λ', l < 1 ? f(l * 100, 1) + ' cm' : f(l, 2) + ' m', '') + box('λ / 2π', l / (2 * Math.PI) < 1 ? f(l / (2 * Math.PI) * 100, 1) + ' cm' : f(l / (2 * Math.PI), 2) + ' m', '');
  },
  cpl(r) {
    const C12 = num(r, 'C12') * 1e-12, C2 = num(r, 'C2') * 1e-12, R2 = num(r, 'R2'), fr = num(r, 'f'), V1 = num(r, 'V1'), w = 2 * Math.PI * fr;
    const k = w * R2 * C12 / Math.hypot(1, w * R2 * (C2 + C12)), fc = 1 / (2 * Math.PI * R2 * (C2 + C12));
    $('[data-k="out"]', r).innerHTML = box('|V₂/V₁|', f(k, 4)) + box('|V₂|', k * V1 < 1 ? f(k * V1 * 1000, 2) + ' mV' : f(k * V1, 2) + ' V', '') + box('f<sub>c</sub>', fc > 1e6 ? f(fc / 1e6, 2) + ' MHz' : f(fc / 1e3, 1) + ' kHz', '') + box('Limite HF C₁₂/(C₁₂+C₂)', f(C12 / (C12 + C2), 3));
  },
  dbuv(r) {
    const db = num(r, 'db'), mv = num(r, 'mv');
    const out = Number.isFinite(mv) && mv > 0 ? box('Niveau', f(20 * Math.log10(mv * 1000), 1), 'dBµV') : box('Tension', f(Math.pow(10, db / 20), 0) + ' µV = ' + f(Math.pow(10, db / 20) / 1000, 3) + ' mV', '');
    $('[data-k="out"]', r).innerHTML = out;
  },
  chute(r) {
    const b = num(r, 'b'), rho = num(r, 'rho'), L = num(r, 'L'), I = num(r, 'I'), S = num(r, 'S'), U = num(r, 'U'), lim = num(r, 'lim');
    const u = b * rho * L * I / S, p = u / U * 100;
    $('[data-k="out"]', r).innerHTML = box('Chute u', f(u, 2), 'V') + box('Chute', f(p, 2), '%');
    const sec = [16, 25, 35, 50, 70, 95, 120, 150, 185, 240].find(s => b * rho * L * I / s / U * 100 <= lim);
    $('[data-k="msg"]', r).textContent = Number.isFinite(lim) ? (p <= lim ? 'Conforme à la limite saisie.' : `Dépasse la limite : il faudrait au moins ${sec ? sec + ' mm²' : 'plus de 240 mm²'}.`) : 'Saisis la limite de ta norme pour vérifier.';
  }
};
function initCalc() {
  $$('[data-calc]').forEach(r => { const fn = CALC[r.dataset.calc]; if (!fn) return; fn(r); r.addEventListener('input', () => fn(r)); });
}
document.addEventListener('DOMContentLoaded', () => { initQcm(); initCalc(); });
