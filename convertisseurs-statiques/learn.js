/* Outils d'autonomie : pas à pas, vérification des réponses, QCM, parcours, progression */
(() => {
const { $ } = TD;
const store = {
  get(k, d) { try { const v = localStorage.getItem('cs-td-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('cs-td-' + k, JSON.stringify(v)); } catch (e) {} }
};
TD.store = store;

/* sélection programmée d'un bouton de segment ou d'un curseur */
TD.pick = (segId, v) => { const b = document.querySelector(`#${segId} button[data-v="${v}"]`); if (b && !b.classList.contains('on')) b.click(); };
TD.setSlider = (id, v) => { const s = $(id); if (!s) return; s.value = v; s.dispatchEvent(new Event('input')); };

/* ---------- Pas à pas ----------
 steps = [{ title, setup(sim), t, text, obs, ans }] */
TD.stepper = (prefix, sim, steps) => {
  const box = $(prefix + '-step'); if (!box) return;
  let k = -1;
  const render = () => {
    const dots = steps.map((s, i) => `<button class="dot${i === k ? ' on' : ''}${i < k ? ' done' : ''}" data-i="${i}" title="Étape ${i + 1} : ${s.title.replace(/"/g, '')}">${i + 1}</button>`).join('');
    const head = `<div class="st-head"><b>Mode pas à pas</b><span class="st-count">${k < 0 ? steps.length + ' étapes' : 'Étape ' + (k + 1) + ' / ' + steps.length}</span><div class="dots">${dots}</div><span class="sp"></span><button class="st-btn" data-go="prev" ${k <= 0 ? 'disabled' : ''}>◀ Précédente</button><button class="st-btn main" data-go="next" ${k >= steps.length - 1 ? 'disabled' : ''}>${k < 0 ? 'Commencer ▶' : 'Suivante ▶'}</button></div>`;
    let body;
    if (k < 0) body = `<p class="st-intro">Le pas à pas fige l'animation aux <b>instants clés</b> du fonctionnement. À chaque étape : lire l'explication, regarder le schéma et les courbes, puis répondre à la question « À observer » avant de vérifier. On peut à tout moment relancer l'animation avec le bouton Lecture.</p>`;
    else { const s = steps[k]; body = `<h4>${s.title}</h4><div class="st-text">${s.text}</div>` + (s.obs ? `<div class="st-obs"><b>À observer :</b> ${s.obs}<details><summary>Vérifier ma réponse</summary><div>${s.ans}</div></details></div>` : ''); }
    box.innerHTML = head + body;
    box.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go === 'next' ? k + 1 : k - 1));
    box.querySelectorAll('.dot').forEach(b => b.onclick = () => go(+b.dataset.i));
  };
  const go = i => {
    k = Math.max(0, Math.min(steps.length - 1, i)); const s = steps[k];
    if (s.setup) s.setup(sim);
    sim.setPlaying(false); sim.t = s.t; const sc = $(prefix + '-scrub'); if (sc) sc.value = Math.round(s.t / sim.span() * 1000);
    sim.draw(0); render();
  };
  render();
};

/* ---------- Vérification des résultats numériques ---------- */
function initChecks() {
  document.querySelectorAll('.chk').forEach(c => {
    const a = parseFloat(c.dataset.a), tol = parseFloat(c.dataset.tol || '0.03'), unit = c.dataset.u || '';
    c.innerHTML = `<input type="text" inputmode="decimal" placeholder="?" aria-label="ma réponse"><span class="unit">${unit}</span><button type="button">Vérifier</button><span class="res"></span>`;
    const inp = c.querySelector('input'), res = c.querySelector('.res');
    const check = () => {
      const x = parseFloat(inp.value.replace(/\s/g, '').replace(',', '.').replace('−', '-'));
      if (isNaN(x)) { res.textContent = 'Écrire un nombre'; res.className = 'res'; return; }
      const ok = Math.abs(x - a) <= Math.max(tol * Math.abs(a), 0.011);
      res.textContent = ok ? '✓ Juste' : (Math.abs(x - a) <= 0.15 * Math.abs(a) ? '≈ Presque : vérifier les arrondis' : '✗ Pas encore : relire le coup de pouce');
      res.className = 'res ' + (ok ? 'ok' : 'no');
    };
    c.querySelector('button').onclick = check; inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  });
}

/* ---------- QCM ---------- */
function initQcm() {
  document.querySelectorAll('.qcm').forEach(q => {
    const key = 'qcm-' + q.dataset.key, items = [...q.querySelectorAll('.qq')], score = q.querySelector('.score');
    const answered = {};
    const upd = () => {
      const n = Object.keys(answered).length, good = Object.values(answered).filter(Boolean).length;
      score.innerHTML = n < items.length ? `Réponses : ${n} / ${items.length}` : `<b>Score : ${good} / ${items.length}</b> — ${good === items.length ? 'Bravo, la fiche est maîtrisée.' : good >= items.length - 1 ? 'Très bien. Relire l’explication de la question manquée.' : 'Revoir le pas à pas et la partie « Fonctionnement détaillé », puis recommencer.'} <button type="button" class="redo">Recommencer</button>`;
      if (n === items.length) { store.set(key, good + '/' + items.length); const r = score.querySelector('.redo'); if (r) r.onclick = reset; }
    };
    const reset = () => { for (const k in answered) delete answered[k]; items.forEach(it => { it.classList.remove('ok', 'no'); it.querySelectorAll('input').forEach(i => { i.checked = false; i.disabled = false; }); it.querySelectorAll('label').forEach(l => l.classList.remove('good', 'bad')); }); upd(); };
    items.forEach((it, idx) => {
      it.querySelectorAll('input').forEach(inp => inp.addEventListener('change', () => {
        const ok = inp.value === it.dataset.ok; answered[idx] = ok;
        it.classList.toggle('ok', ok); it.classList.toggle('no', !ok);
        it.querySelectorAll('input').forEach(i => { i.disabled = true; const l = i.closest('label'); if (i.value === it.dataset.ok) l.classList.add('good'); else if (i === inp) l.classList.add('bad'); });
        upd();
      }));
    });
    upd();
  });
}

/* ---------- Parcours à cocher ---------- */
function initTodo() {
  document.querySelectorAll('ul.todo').forEach(ul => {
    const key = 'todo-' + ul.dataset.key, saved = store.get(key, []), boxes = [...ul.querySelectorAll('input')];
    boxes.forEach((b, i) => { b.checked = !!saved[i]; b.addEventListener('change', () => store.set(key, boxes.map(x => x.checked))); });
  });
}
/* ---------- Progression sur l'accueil ---------- */
TD.progress = () => {
  const el = $('progress'); if (!el) return;
  const names = [['f1', 'redresseur', '1 · Redresseurs à diodes'], ['f2', 'commande', '2 · Redresseurs commandés'], ['f3', 'hacheur', '3 · Hacheur'], ['f4', 'onduleur', '4 · Onduleur'], ['f5', 'gradateur', '5 · Gradateur']];
  el.innerHTML = '<table><tr><th>Fiche</th><th>Parcours</th><th>QCM</th></tr>' + names.map(([k, id, n]) => {
    const t = store.get('todo-' + k, []), done = t.filter(Boolean).length, total = document.querySelectorAll(`ul.todo[data-key="${k}"] input`).length;
    const q = store.get('qcm-' + k, '—');
    return `<tr><td><a href="#${id}">${n}</a></td><td><span class="pbar"><i style="width:${total ? done / total * 100 : 0}%"></i></span> ${done} / ${total}</td><td>${q}</td></tr>`;
  }).join('') + '</table><p class="note">La progression est enregistrée dans ce navigateur uniquement.</p>';
};
/* ---------- Chronomètre de séance (3 h) ---------- */
const SCHED = [
  { id: 'accueil', name: 'Accueil', a: 0, b: 5 },
  { id: 'redresseur', name: 'Fiche 1 · Redresseurs à diodes', a: 5, b: 35 },
  { id: 'commande', name: 'Fiche 2 · Redresseurs commandés', a: 35, b: 70 },
  { id: 'pause', name: 'Pause', a: 70, b: 80 },
  { id: 'hacheur', name: 'Fiche 3 · Hacheur', a: 80, b: 110 },
  { id: 'onduleur', name: 'Fiche 4 · Onduleur', a: 110, b: 145 },
  { id: 'gradateur', name: 'Fiche 5 · Gradateur', a: 145, b: 170 },
  { id: 'bilan', name: 'Bilan', a: 170, b: 180 }
];
const ORDER = ['accueil', 'redresseur', 'commande', 'hacheur', 'onduleur', 'gradateur', 'bilan'];
const hm = m => Math.floor(m / 60) + ':' + String(Math.floor(m % 60)).padStart(2, '0');
function tickTimer() {
  const el = $('timer'); if (!el) return;
  const start = store.get('start', null);
  document.querySelectorAll('table.plan tr').forEach(r => r.classList.remove('now'));
  if (!start) { el.textContent = '⏱ Séance non démarrée'; el.className = 'timer'; el.href = '#accueil'; return; }
  const m = (Date.now() - start) / 60000;
  if (m >= 180) { el.textContent = '⏱ 3:00 · Séance terminée'; el.className = 'timer'; el.href = '#bilan'; return; }
  const k = SCHED.findIndex(s => m >= s.a && m < s.b), cur = SCHED[k];
  const row = document.querySelectorAll('table.plan tr')[k + 1]; if (row) row.classList.add('now');
  const here = (location.hash || '#accueil').slice(1);
  if (cur.id === 'pause') { el.textContent = `⏱ ${hm(m)} · Pause jusqu'à 1:20`; el.className = 'timer pause'; el.href = '#hacheur'; return; }
  const late = ORDER.indexOf(here) < ORDER.indexOf(cur.id);
  el.href = '#' + cur.id;
  el.textContent = late ? `⏱ ${hm(m)} · En retard : passer à ${cur.name}` : `⏱ ${hm(m)} · ${cur.name} jusqu'à ${hm(cur.b)}`;
  el.className = 'timer ' + (late ? 'late' : 'ok');
}
function initTimer() {
  const st = $('t-start'), rs = $('t-reset');
  if (st) st.onclick = () => { if (!store.get('start', null)) store.set('start', Date.now()); st.textContent = '▶ Séance en cours'; tickTimer(); };
  if (rs) rs.onclick = () => { store.set('start', null); if (st) st.textContent = '▶ Démarrer la séance'; tickTimer(); };
  if (st && store.get('start', null)) st.textContent = '▶ Séance en cours';
  tickTimer(); setInterval(tickTimer, 5000); window.addEventListener('hashchange', tickTimer);
}
const progressAll = () => { TD.progress(); const p2 = $('progress2'), p = $('progress'); if (p2 && p) p2.innerHTML = p.innerHTML; };
document.addEventListener('DOMContentLoaded', () => { initChecks(); initQcm(); initTodo(); progressAll(); initTimer(); window.addEventListener('hashchange', progressAll); });
})();
