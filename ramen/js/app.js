/* Slurp — ramen scoring club. Plain JS, no build step. */
(() => {
  'use strict';

  // ── config ──────────────────────────────────────────────────
  const CRITERIA = [
    { key: 'broth',    name: 'Broth',        sub: 'depth, balance, aroma',      emoji: '🍲', weight: 30 },
    { key: 'noodles',  name: 'Noodles',      sub: 'texture, bite, slurp',       emoji: '🍜', weight: 25 },
    { key: 'toppings', name: 'Toppings',     sub: 'chashu, menma, nori & co.',  emoji: '🥓', weight: 15 },
    { key: 'egg',      name: 'Ajitama egg',  sub: 'jammy yolk, seasoned white', emoji: '🥚', weight: 10 },
    { key: 'vibe',     name: 'Vibe',         sub: 'presentation, atmosphere',   emoji: '🏮', weight: 10 },
    { key: 'value',    name: 'Value',        sub: 'worth every penny?',         emoji: '💴', weight: 10 },
  ];
  const STYLES = ['Tonkotsu', 'Shoyu', 'Shio', 'Miso', 'Tsukemen', 'Tantanmen', 'Curry', 'Veggie/Vegan', 'Other'];
  const FIRMNESS = ['Yawa (soft)', 'Regular', 'Kata (firm)', 'Bari-kata'];
  const TAGS = ['Umami bomb', 'Rich & creamy', 'Light & clean', 'Garlicky', 'Smoky', 'Salty', 'Fresh noodles', 'Big portion', 'Free kae-dama', 'Long queue', 'Hidden gem', 'Instagram bait'];
  const VERDICTS = [
    [9.5, 'Transcendent'], [9, 'Outstanding'], [8, 'Excellent'], [7, 'Great'],
    [6, 'Solid'], [5, 'Decent'], [4, 'Meh'], [2.5, 'Rough'], [0, 'Avoid'],
  ];
  const BADGES = [
    { id: 'first',    emoji: '🍜', name: 'First Slurp',     req: 'Rate 1 bowl',            test: (S) => S.bowls.length >= 1 },
    { id: 'novice',   emoji: '🥢', name: 'Noodle Novice',   req: 'Rate 5 bowls',           test: (S) => S.bowls.length >= 5 },
    { id: 'scholar',  emoji: '🍥', name: 'Broth Scholar',   req: 'Rate 15 bowls',          test: (S) => S.bowls.length >= 15 },
    { id: 'sensei',   emoji: '🏮', name: 'Ramen Sensei',    req: 'Rate 30 bowls',          test: (S) => S.bowls.length >= 30 },
    { id: 'explorer', emoji: '🗺️', name: 'Style Explorer',  req: 'Try 4 styles',           test: (S) => S.styles >= 4 },
    { id: 'wanderer', emoji: '🌏', name: 'Wanderer',        req: 'Visit 5 places',         test: (S) => S.places >= 5 },
    { id: 'perfect',  emoji: '💯', name: 'Perfect Bowl',    req: 'Score a 9.5+',           test: (S) => S.best >= 9.5 },
    { id: 'spice',    emoji: '🔥', name: 'Spice Demon',     req: 'Max the spice',          test: (S) => S.maxSpice >= 3 },
    { id: 'shooter',  emoji: '📸', name: 'Bowl Paparazzi',  req: 'Photograph 10 bowls',    test: (S) => S.photos >= 10 },
    { id: 'spender',  emoji: '💸', name: 'Big Spender',     req: 'Spend £100 total',       test: (S) => S.spend >= 100 },
  ];
  const GUIDE = [
    { emoji: '🐷', title: 'Tonkotsu', body: 'Pork-bone broth boiled for hours until milky and rich. Look for: <strong>silky body without greasiness</strong>, deep porky sweetness, thin firm noodles (Hakata style). Ask for kae-dama — a noodle refill for your leftover broth.' },
    { emoji: '🫖', title: 'Shoyu', body: 'Soy-sauce based, usually a clear brown chicken or dashi broth. The oldest ramen style. Look for: <strong>clarity, aroma, and balance</strong> — salt should lift the broth, not drown it.' },
    { emoji: '🧂', title: 'Shio', body: 'Salt-based and the lightest of the classics. Nowhere for a kitchen to hide — <strong>the broth quality is fully exposed</strong>. A great shio is a sign of a serious shop.' },
    { emoji: '🌽', title: 'Miso', body: 'Born in Sapporo. Fermented bean paste makes it hearty, nutty and sweet, often with corn and butter. Look for: <strong>toasted depth, wavy medium-thick noodles</strong> that grip the broth.' },
    { emoji: '🍝', title: 'Tsukemen', body: 'Dipping ramen — thick cold noodles served beside an intense, almost gravy-like broth. Dip, slurp, repeat. Finish by asking for <strong>soup-wari</strong> (dashi to dilute the leftover dip so you can drink it).' },
    { emoji: '🌶️', title: 'Tantanmen', body: 'Japan\'s take on Sichuan dan dan noodles — sesame, chilli oil, minced pork. Look for: <strong>creamy sesame + real chilli kick</strong> in balance, not just heat.' },
    { emoji: '🥢', title: 'How to slurp', body: 'Slurping is correct — it aerates the broth and cools the noodles. Eat noodles <strong>first and fast</strong> (they overcook in the bowl in ~5 minutes), then toppings, then decide if the broth deserves finishing. Finishing the broth is the highest compliment.' },
    { emoji: '⚖️', title: 'How we score', body: 'Each bowl is scored 0–10 on six criteria with weights: <strong>Broth 30%, Noodles 25%, Toppings 15%, Egg 10%, Vibe 10%, Value 10%</strong>. The overall is the weighted average. 8+ is a destination bowl. 9.5+ is once-a-year stuff.' },
  ];

  // ── state ───────────────────────────────────────────────────
  let bowls = [];
  let raters = [];
  let currentRater = '';
  let editingId = null;
  let form = null; // live form state
  let view = 'bowls';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const haptic = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* no-op */ } };

  // ── scoring helpers ─────────────────────────────────────────
  function overall(scores) {
    let sum = 0, w = 0;
    for (const c of CRITERIA) {
      const v = scores[c.key];
      if (typeof v === 'number') { sum += v * c.weight; w += c.weight; }
    }
    return w ? Math.round((sum / w) * 10) / 10 : 0;
  }
  const fmtScore = (s) => (Math.round(s * 10) / 10).toFixed(1);
  function verdict(s) { for (const [min, word] of VERDICTS) if (s >= min) return word; return ''; }
  function scoreColor(s) {
    // 0 → dull red, 10 → glowing gold
    const t = Math.max(0, Math.min(1, s / 10));
    const h = 6 + t * 38, sat = 62 + t * 30, l = 50 + t * 8;
    return `hsl(${h}, ${sat}%, ${l}%)`;
  }
  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ── view switching ──────────────────────────────────────────
  const VIEWS = ['bowls', 'ranks', 'rate', 'stats', 'guide'];
  function switchView(name) {
    view = name;
    for (const v of VIEWS) $(`view-${v}`).hidden = v !== name;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.view === name));
    window.scrollTo({ top: 0 });
    if (name === 'bowls') renderBowls();
    if (name === 'ranks') renderRanks();
    if (name === 'stats') renderStats();
    if (name === 'rate' && !editingId) resetForm();
    haptic();
  }

  // ── rate form ───────────────────────────────────────────────
  function blankForm() {
    const scores = {};
    for (const c of CRITERIA) scores[c.key] = 7;
    return {
      place: '', area: '', date: new Date().toISOString().slice(0, 10),
      style: 'Tonkotsu', scores, firmness: 'Regular', spice: 0,
      tags: [], price: '', notes: '', again: true,
      photo: null, thumb: null,
    };
  }

  function buildForm() {
    // style chips
    $('style-chips').innerHTML = STYLES.map((s) =>
      `<button type="button" class="chip" data-style="${esc(s)}">${esc(s)}</button>`).join('');
    $('style-chips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-style]');
      if (!b) return;
      form.style = b.dataset.style;
      paintStyleChips(); haptic();
    });

    // sliders
    $('sliders').innerHTML = CRITERIA.map((c) => `
      <div class="srow">
        <div class="srow-top">
          <span class="srow-name">${c.emoji} ${c.name}<span class="wtag">${c.weight}%</span><small>${c.sub}</small></span>
          <span class="srow-val" id="val-${c.key}">7.0</span>
        </div>
        <input type="range" min="0" max="10" step="0.5" value="7" data-crit="${c.key}" aria-label="${c.name} score" />
      </div>`).join('');
    $('sliders').addEventListener('input', (e) => {
      const r = e.target.closest('[data-crit]');
      if (!r) return;
      form.scores[r.dataset.crit] = parseFloat(r.value);
      paintSlider(r); paintDial(); haptic(4);
    });

    // firmness
    $('firmness-seg').innerHTML = FIRMNESS.map((f) =>
      `<button type="button" data-firm="${esc(f)}">${esc(f.split(' ')[0])}</button>`).join('');
    $('firmness-seg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-firm]');
      if (!b) return;
      form.firmness = b.dataset.firm;
      paintFirmness(); haptic();
    });

    // spice
    $('spice-row').innerHTML = ['🚫', '🌶️', '🌶️', '🌶️'].map((em, i) =>
      `<button type="button" data-spice="${i}" aria-label="Spice ${i}">${em}</button>`).join('');
    $('spice-row').addEventListener('click', (e) => {
      const b = e.target.closest('[data-spice]');
      if (!b) return;
      form.spice = parseInt(b.dataset.spice, 10);
      paintSpice(); haptic();
    });

    // tags
    $('tag-chips').innerHTML = TAGS.map((t) =>
      `<button type="button" class="chip" data-tag="${esc(t)}">${esc(t)}</button>`).join('');
    $('tag-chips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tag]');
      if (!b) return;
      const t = b.dataset.tag;
      const i = form.tags.indexOf(t);
      if (i >= 0) form.tags.splice(i, 1); else form.tags.push(t);
      paintTags(); haptic();
    });

    // simple inputs
    $('f-place').addEventListener('input', () => {
      form.place = $('f-place').value;
      const known = bowls.find((b) => b.place.toLowerCase() === form.place.trim().toLowerCase());
      if (known) {
        if (!$('f-area').value && known.area) { form.area = known.area; $('f-area').value = known.area; }
      }
    });
    $('f-area').addEventListener('input', () => { form.area = $('f-area').value; });
    $('f-date').addEventListener('input', () => { form.date = $('f-date').value; });
    $('f-price').addEventListener('input', () => { form.price = $('f-price').value; });
    $('f-notes').addEventListener('input', () => { form.notes = $('f-notes').value; });
    $('f-again').addEventListener('change', () => { form.again = $('f-again').checked; haptic(); });

    // photo
    $('photo-input').addEventListener('change', onPhotoPicked);
    $('photo-remove').addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      form.photo = null; form.thumb = null;
      paintPhoto();
    });

    // actions
    $('btn-save').addEventListener('click', saveBowl);
    $('btn-cancel').addEventListener('click', () => { editingId = null; resetForm(); switchView('bowls'); });
  }

  function paintStyleChips() {
    $('style-chips').querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.style === form.style));
  }
  function paintSlider(r) {
    const v = parseFloat(r.value);
    r.style.setProperty('--p', v * 10);
    r.style.setProperty('--tc', scoreColor(v));
    $(`val-${r.dataset.crit}`).textContent = v.toFixed(1);
    $(`val-${r.dataset.crit}`).style.color = scoreColor(v);
  }
  function paintAllSliders() {
    $('sliders').querySelectorAll('[data-crit]').forEach((r) => {
      r.value = form.scores[r.dataset.crit];
      paintSlider(r);
    });
  }
  function paintDial() {
    const s = overall(form.scores);
    const ring = $('dial-ring');
    ring.style.setProperty('--pct', s * 10);
    ring.style.setProperty('--dial-c', scoreColor(s));
    $('dial-num').textContent = fmtScore(s);
    $('dial-word').textContent = verdict(s);
    $('dial-word').style.color = scoreColor(s);
  }
  function paintFirmness() {
    $('firmness-seg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.firm === form.firmness));
  }
  function paintSpice() {
    $('spice-row').querySelectorAll('button').forEach((b) => {
      const i = parseInt(b.dataset.spice, 10);
      b.classList.toggle('on', i === 0 ? form.spice === 0 : (form.spice >= i && i > 0));
    });
  }
  function paintTags() {
    $('tag-chips').querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', form.tags.includes(c.dataset.tag)));
  }
  function paintPhoto() {
    const has = !!form.photo;
    $('photo-preview').hidden = !has;
    $('photo-placeholder').hidden = has;
    $('photo-remove').hidden = !has;
    if (has) $('photo-preview').src = form.photo;
    else $('photo-preview').removeAttribute('src');
  }
  function paintRaters() {
    const chips = raters.map((r) =>
      `<button type="button" class="chip ${r === currentRater ? 'on' : ''}" data-rater="${esc(r)}">${esc(r)}</button>`).join('');
    $('rater-chips').innerHTML = chips + `<button type="button" class="chip chip-add" data-add-rater>＋ Add</button>`;
  }
  function paintForm() {
    $('f-place').value = form.place;
    $('f-area').value = form.area;
    $('f-date').value = form.date;
    $('f-price').value = form.price;
    $('f-notes').value = form.notes;
    $('f-again').checked = form.again;
    paintStyleChips(); paintAllSliders(); paintDial();
    paintFirmness(); paintSpice(); paintTags(); paintPhoto(); paintRaters();
    $('rate-title').textContent = editingId ? 'Edit bowl' : 'Rate a bowl';
    $('btn-save').textContent = editingId ? 'Save changes 🍜' : 'Save this bowl 🍜';
    $('btn-cancel').hidden = !editingId;
    updatePlaceSuggest();
  }
  function resetForm() {
    form = blankForm();
    paintForm();
  }
  function updatePlaceSuggest() {
    const names = [...new Set(bowls.map((b) => b.place))].sort();
    $('place-suggest').innerHTML = names.map((n) => `<option value="${esc(n)}"></option>`).join('');
  }

  // ── photo compression ───────────────────────────────────────
  function onPhotoPicked(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      form.photo = drawScaled(img, 1280, 0.82);
      form.thumb = drawScaled(img, 320, 0.7);
      URL.revokeObjectURL(url);
      paintPhoto();
      toast('Looking tasty 📸');
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast('Could not read that photo'); };
    img.src = url;
    e.target.value = '';
  }
  function drawScaled(img, maxDim, quality) {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    return c.toDataURL('image/jpeg', quality);
  }

  // ── save ────────────────────────────────────────────────────
  async function saveBowl() {
    form.place = $('f-place').value.trim();
    if (!form.place) {
      toast('Give the place a name first 🏮');
      $('f-place').focus();
      return;
    }
    const record = {
      id: editingId || uid(),
      createdAt: editingId ? (bowls.find((b) => b.id === editingId)?.createdAt || Date.now()) : Date.now(),
      place: form.place,
      area: form.area.trim(),
      date: form.date || new Date().toISOString().slice(0, 10),
      style: form.style,
      scores: { ...form.scores },
      overall: overall(form.scores),
      firmness: form.firmness,
      spice: form.spice,
      tags: [...form.tags],
      price: form.price ? parseFloat(form.price) : null,
      notes: form.notes.trim(),
      again: form.again,
      rater: currentRater,
      photo: form.photo,
      thumb: form.thumb,
    };
    await DB.putBowl(record);
    const idx = bowls.findIndex((b) => b.id === record.id);
    if (idx >= 0) bowls[idx] = record; else bowls.push(record);
    const wasEdit = !!editingId;
    editingId = null;
    resetForm();
    confetti();
    toast(wasEdit ? 'Bowl updated ✅' : `Saved — ${fmtScore(record.overall)}/10 ${verdict(record.overall)}!`);
    switchView('bowls');
  }

  // ── bowls list ──────────────────────────────────────────────
  function bowlCard(b) {
    const c = scoreColor(b.overall);
    const thumb = b.thumb || b.photo;
    const meta = [b.style, fmtDate(b.date), b.rater].filter(Boolean).join(' · ');
    return `
      <button class="bowl-card" data-open="${b.id}">
        ${thumb ? `<img class="bowl-thumb" src="${thumb}" alt="" loading="lazy" />` : `<span class="bowl-thumb">🍜</span>`}
        <span class="bowl-mid">
          <span class="bowl-place">${esc(b.place)}</span>
          <span class="bowl-meta">${esc(meta)}</span>
          <span class="bowl-badges">
            ${b.again ? '' : '<span class="mini-tag">🙅 not again</span>'}
            ${b.spice >= 3 ? '<span class="mini-tag">🔥🔥🔥</span>' : ''}
            ${(b.tags || []).slice(0, 2).map((t) => `<span class="mini-tag">${esc(t)}</span>`).join('')}
          </span>
        </span>
        <span class="score-pill" style="background:${c}">${fmtScore(b.overall)}<small>/10</small></span>
      </button>`;
  }

  function renderBowls() {
    const q = $('bowl-search').value.trim().toLowerCase();
    const sort = $('bowl-sort').value;
    let list = bowls.slice();
    if (q) {
      list = list.filter((b) =>
        [b.place, b.area, b.style, b.notes, b.rater, ...(b.tags || [])]
          .filter(Boolean).some((f) => f.toLowerCase().includes(q)));
    }
    list.sort((a, b) => {
      if (sort === 'top') return b.overall - a.overall;
      if (sort === 'low') return a.overall - b.overall;
      if (sort === 'price') return (b.price || 0) - (a.price || 0);
      return (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt;
    });
    $('bowls-empty').hidden = bowls.length > 0;
    $('bowl-list').innerHTML = list.map(bowlCard).join('') ||
      (bowls.length ? `<div class="empty"><div class="empty-art">🔎</div><h2>No matches</h2><p>Nothing found for “${esc(q)}”.</p></div>` : '');
  }

  // ── detail sheet ────────────────────────────────────────────
  function openSheet(id) {
    const b = bowls.find((x) => x.id === id);
    if (!b) return;
    const c = scoreColor(b.overall);
    const bars = CRITERIA.map((cr) => {
      const v = b.scores[cr.key] ?? 0;
      return `
        <div class="sbar-row">
          <span class="sbar-name">${cr.emoji} ${cr.name}</span>
          <span class="sbar-track"><span class="sbar-fill" style="width:${v * 10}%"></span></span>
          <span class="sbar-val">${v.toFixed(1)}</span>
        </div>`;
    }).join('');
    const meta = [b.style, b.area, fmtDate(b.date)].filter(Boolean).join(' · ');
    const detail = [b.firmness && b.firmness !== 'Regular' ? `Noodles: ${b.firmness}` : '', b.spice ? '🌶️'.repeat(b.spice) : '', b.price != null ? `£${b.price.toFixed(2)}` : '', b.rater ? `rated by ${b.rater}` : ''].filter(Boolean).join(' · ');
    $('sheet').innerHTML = `
      <div class="sheet-grab"></div>
      ${b.photo ? `<img class="sheet-photo" src="${b.photo}" alt="Bowl at ${esc(b.place)}" />` : ''}
      <div class="sheet-head">
        <div>
          <div class="sheet-place">${esc(b.place)}</div>
          <div class="sheet-meta">${esc(meta)}</div>
          ${detail ? `<div class="sheet-meta">${esc(detail)}</div>` : ''}
        </div>
        <span class="score-pill" style="background:${c}">${fmtScore(b.overall)}<small>/10</small></span>
      </div>
      <p class="again-line">${b.again ? '💚 Would slurp again' : '🙅 Would not go back'} · <span style="color:${c}">${verdict(b.overall)}</span></p>
      <div class="card" style="margin:10px 0">${bars}</div>
      ${(b.tags || []).length ? `<div class="sheet-tags">${b.tags.map((t) => `<span class="mini-tag">${esc(t)}</span>`).join('')}</div>` : ''}
      ${b.notes ? `<div class="sheet-notes">“${esc(b.notes)}”</div>` : ''}
      <div class="sheet-actions">
        <button class="btn btn-ghost" data-act="share">📤 Share</button>
        <button class="btn btn-ghost" data-act="edit">✏️ Edit</button>
        <button class="btn btn-danger" data-act="delete">🗑️</button>
      </div>`;
    $('sheet').hidden = false;
    $('sheet-backdrop').hidden = false;
    document.body.style.overflow = 'hidden';
    $('sheet').onclick = async (e) => {
      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'edit') {
        closeSheet();
        editingId = b.id;
        form = {
          place: b.place, area: b.area || '', date: b.date, style: b.style,
          scores: { ...b.scores }, firmness: b.firmness || 'Regular', spice: b.spice || 0,
          tags: [...(b.tags || [])], price: b.price != null ? String(b.price) : '',
          notes: b.notes || '', again: b.again !== false, photo: b.photo, thumb: b.thumb,
        };
        switchView('rate');
        paintForm();
      } else if (act.dataset.act === 'delete') {
        if (!confirm(`Delete the bowl at ${b.place}? This can't be undone.`)) return;
        await DB.deleteBowl(b.id);
        bowls = bowls.filter((x) => x.id !== b.id);
        closeSheet();
        renderBowls();
        toast('Bowl deleted');
      } else if (act.dataset.act === 'share') {
        shareBowl(b);
      }
    };
  }
  function closeSheet() {
    $('sheet').hidden = true;
    $('sheet-backdrop').hidden = true;
    document.body.style.overflow = '';
  }

  // ── ranks ───────────────────────────────────────────────────
  function placeStats() {
    const map = new Map();
    for (const b of bowls) {
      const key = b.place.trim().toLowerCase();
      if (!map.has(key)) map.set(key, { name: b.place, area: b.area, bowls: [] });
      map.get(key).bowls.push(b);
    }
    const out = [...map.values()].map((p) => ({
      name: p.name,
      area: p.area,
      count: p.bowls.length,
      avg: p.bowls.reduce((s, b) => s + b.overall, 0) / p.bowls.length,
      best: Math.max(...p.bowls.map((b) => b.overall)),
    }));
    out.sort((a, b) => b.avg - a.avg || b.count - a.count);
    return out;
  }

  function renderRanks() {
    const places = placeStats();
    $('ranks-empty').hidden = places.length > 0;
    if (!places.length) { $('podium').innerHTML = ''; $('rank-list').innerHTML = ''; return; }
    const top = places.slice(0, 3);
    const medals = ['🥇', '🥈', '🥉'];
    const heights = [96, 72, 56];
    const order = top.length === 3 ? [1, 0, 2] : top.length === 2 ? [1, 0] : [0];
    $('podium').innerHTML = order.map((i) => `
      <div class="podium-col" style="animation-delay:${i * 80}ms">
        <span class="podium-medal">${medals[i]}</span>
        <span class="podium-name">${esc(top[i].name)}</span>
        <span class="podium-score">${fmtScore(top[i].avg)}</span>
        <div class="podium-bar" style="height:${heights[i]}px">${i + 1}</div>
      </div>`).join('');
    $('rank-list').innerHTML = places.slice(3).map((p, i) => `
      <div class="rank-row">
        <span class="rank-pos">${i + 4}</span>
        <span class="rank-info">
          <span class="rank-name">${esc(p.name)}</span>
          <div class="rank-meta">${p.count} bowl${p.count > 1 ? 's' : ''}${p.area ? ' · ' + esc(p.area) : ''} · best ${fmtScore(p.best)}</div>
        </span>
        <span class="rank-score" style="color:${scoreColor(p.avg)}">${fmtScore(p.avg)}</span>
      </div>`).join('');
  }

  // ── stats ───────────────────────────────────────────────────
  function renderStats() {
    const n = bowls.length;
    const places = new Set(bowls.map((b) => b.place.trim().toLowerCase())).size;
    const avg = n ? bowls.reduce((s, b) => s + b.overall, 0) / n : 0;
    const spend = bowls.reduce((s, b) => s + (b.price || 0), 0);
    const best = bowls.slice().sort((a, b) => b.overall - a.overall)[0];
    $('stat-grid').innerHTML = [
      [n, 'bowls slurped'],
      [places, places === 1 ? 'place' : 'places'],
      [n ? fmtScore(avg) : '–', 'avg score'],
      [best ? fmtScore(best.overall) : '–', 'best bowl'],
      [spend ? '£' + (Math.round(spend * 100) / 100).toFixed(2).replace(/\.00$/, '') : '£0', 'invested 🍜'],
      [bowls.filter((b) => b.again).length, 'would repeat'],
    ].map(([num, lbl]) => `<div class="stat-tile"><div class="stat-num">${num}</div><div class="stat-lbl">${lbl}</div></div>`).join('');

    // best bowl hero
    $('best-bowl-wrap').innerHTML = best ? `
      <button class="best-bowl" data-open="${best.id}" style="width:100%">
        ${best.photo ? `<img class="bg" src="${best.photo}" alt="" />` : ''}
        <span class="scrim"></span>
        <span class="bb-body">
          <span>
            <span class="bb-kicker">👑 Bowl of honour</span>
            <div class="bb-place">${esc(best.place)}</div>
            <div class="bb-meta">${esc([best.style, fmtDate(best.date)].filter(Boolean).join(' · '))}</div>
          </span>
          <span class="score-pill" style="background:${scoreColor(best.overall)}">${fmtScore(best.overall)}<small>/10</small></span>
        </span>
      </button>` : '';

    // style breakdown
    const byStyle = new Map();
    for (const b of bowls) {
      if (!byStyle.has(b.style)) byStyle.set(b.style, []);
      byStyle.get(b.style).push(b.overall);
    }
    const rows = [...byStyle.entries()]
      .map(([s, arr]) => ({ s, n: arr.length, avg: arr.reduce((a, x) => a + x, 0) / arr.length }))
      .sort((a, b) => b.avg - a.avg);
    $('style-breakdown-card').hidden = !rows.length;
    $('style-breakdown').innerHTML = rows.map((r) => `
      <div class="sbar-row">
        <span class="sbar-name">${esc(r.s)} ×${r.n}</span>
        <span class="sbar-track"><span class="sbar-fill" style="width:${r.avg * 10}%"></span></span>
        <span class="sbar-val">${fmtScore(r.avg)}</span>
      </div>`).join('');

    // badges
    const S = {
      bowls,
      styles: byStyle.size,
      places,
      best: best ? best.overall : 0,
      maxSpice: Math.max(0, ...bowls.map((b) => b.spice || 0)),
      photos: bowls.filter((b) => b.photo).length,
      spend,
    };
    $('badge-grid').innerHTML = BADGES.map((bd) => {
      const got = bd.test(S);
      return `<div class="badge ${got ? '' : 'locked'}">
        <div class="badge-emoji">${bd.emoji}</div>
        <div class="badge-name">${bd.name}</div>
        <div class="badge-req">${bd.req}</div>
      </div>`;
    }).join('');
  }

  // ── share card ──────────────────────────────────────────────
  async function shareBowl(b) {
    const cv = $('share-canvas');
    const W = 1080, H = 1400;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');

    // background
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a120e'); g.addColorStop(1, '#2b1a10');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // photo
    const PH = 760;
    if (b.photo) {
      await new Promise((res) => {
        const img = new Image();
        img.onload = () => {
          const s = Math.max(W / img.width, PH / img.height);
          const w = img.width * s, h = img.height * s;
          ctx.drawImage(img, (W - w) / 2, (PH - h) / 2, w, h);
          res();
        };
        img.onerror = res;
        img.src = b.photo;
      });
      const fade = ctx.createLinearGradient(0, PH - 260, 0, PH);
      fade.addColorStop(0, 'rgba(26,18,14,0)'); fade.addColorStop(1, 'rgba(26,18,14,1)');
      ctx.fillStyle = fade; ctx.fillRect(0, PH - 260, W, 260);
    } else {
      ctx.font = '220px serif'; ctx.textAlign = 'center';
      ctx.fillText('🍜', W / 2, 460);
    }

    const sys = '-apple-system, "Segoe UI", Roboto, sans-serif';
    // place + meta
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f4ece2';
    ctx.font = `800 64px ${sys}`;
    ctx.fillText(b.place.slice(0, 26), 60, PH + 40);
    ctx.fillStyle = '#b39d8c';
    ctx.font = `500 34px ${sys}`;
    ctx.fillText([b.style, b.area, fmtDate(b.date)].filter(Boolean).join(' · ').slice(0, 48), 60, PH + 96);

    // score ring
    const cx = W - 190, cy = PH + 60, R = 110;
    ctx.lineWidth = 26; ctx.lineCap = 'round';
    ctx.strokeStyle = '#3a2c22';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = scoreColor(b.overall);
    ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + (b.overall / 10) * Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#f4ece2'; ctx.textAlign = 'center';
    ctx.font = `800 76px ${sys}`;
    ctx.fillText(fmtScore(b.overall), cx, cy + 14);
    ctx.font = `700 26px ${sys}`; ctx.fillStyle = '#b39d8c';
    ctx.fillText('/ 10 · ' + verdict(b.overall).toUpperCase(), cx, cy + 58);

    // bars
    let y = PH + 190;
    for (const cr of CRITERIA) {
      const v = b.scores[cr.key] ?? 0;
      ctx.textAlign = 'left'; ctx.fillStyle = '#d8c8b8';
      ctx.font = `700 32px ${sys}`;
      ctx.fillText(`${cr.emoji} ${cr.name}`, 60, y + 12);
      const bx = 400, bw = 500;
      ctx.fillStyle = '#3a2c22';
      roundRect(ctx, bx, y - 12, bw, 24, 12); ctx.fill();
      ctx.fillStyle = scoreColor(v);
      roundRect(ctx, bx, y - 12, Math.max(24, bw * v / 10), 24, 12); ctx.fill();
      ctx.textAlign = 'right'; ctx.fillStyle = '#f4ece2';
      ctx.font = `800 32px ${sys}`;
      ctx.fillText(v.toFixed(1), W - 60, y + 12);
      y += 74;
    }

    // footer
    ctx.textAlign = 'center'; ctx.fillStyle = '#7d6a5c';
    ctx.font = `700 30px ${sys}`;
    ctx.fillText('🏮 scored with Slurp — the ramen scoring club', W / 2, H - 50);

    const blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.9));
    const file = new File([blob], `slurp-${b.place.replace(/\W+/g, '-').toLowerCase()}.jpg`, { type: 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `${b.place} — ${fmtScore(b.overall)}/10` });
        return;
      } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('Score card downloaded 📤');
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ── backup ──────────────────────────────────────────────────
  function exportBackup() {
    const payload = { app: 'slurp', version: 1, exportedAt: new Date().toISOString(), raters, bowls };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `slurp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('Backup exported ⬇︎');
  }
  async function importBackup(file) {
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'slurp' || !Array.isArray(data.bowls)) throw new Error('bad file');
      let added = 0;
      for (const b of data.bowls) {
        if (!b.id || !b.place) continue;
        if (!bowls.some((x) => x.id === b.id)) { bowls.push(b); added++; }
        await DB.putBowl(b);
      }
      for (const r of data.raters || []) {
        if (!raters.includes(r)) raters.push(r);
      }
      await DB.setMeta('raters', raters);
      paintRaters(); renderBowls();
      toast(`Restored — ${added} new bowl${added === 1 ? '' : 's'} 🍜`);
    } catch (e) {
      toast('That file didn\'t look like a Slurp backup');
    }
  }

  // ── fun ─────────────────────────────────────────────────────
  let toastTimer = null;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }
  function confetti() {
    const emojis = ['🍜', '🥢', '🍥', '🥚', '🌶️', '🏮', '✨'];
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span');
      s.className = 'confetti';
      s.textContent = emojis[i % emojis.length];
      s.style.left = Math.random() * 100 + 'vw';
      s.style.top = '-40px';
      s.style.animationDelay = (Math.random() * 0.4) + 's';
      s.style.fontSize = (18 + Math.random() * 18) + 'px';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1800);
    }
    haptic(30);
  }

  // ── guide ───────────────────────────────────────────────────
  function renderGuide() {
    $('guide-content').innerHTML = GUIDE.map((g, i) => `
      <details class="guide-item" ${i === 0 ? 'open' : ''}>
        <summary><span class="guide-emoji">${g.emoji}</span>${esc(g.title)}<span class="arrow">›</span></summary>
        <div class="guide-body">${g.body}</div>
      </details>`).join('');
  }

  // ── init ────────────────────────────────────────────────────
  async function init() {
    bowls = await DB.allBowls();
    raters = (await DB.getMeta('raters')) || [];
    currentRater = (await DB.getMeta('currentRater')) || raters[0] || '';

    form = blankForm();
    buildForm();
    renderGuide();
    paintForm();

    // nav
    document.querySelectorAll('.tab').forEach((t) =>
      t.addEventListener('click', () => {
        if (t.dataset.view !== 'rate') editingId = null;
        switchView(t.dataset.view);
      }));
    document.querySelectorAll('[data-goto]').forEach((b) =>
      b.addEventListener('click', () => switchView(b.dataset.goto)));

    // list interactions
    $('bowl-search').addEventListener('input', renderBowls);
    $('bowl-sort').addEventListener('change', renderBowls);
    document.addEventListener('click', (e) => {
      const open = e.target.closest('[data-open]');
      if (open) openSheet(open.dataset.open);
      const addRater = e.target.closest('[data-add-rater]');
      if (addRater) {
        const name = (prompt('Who\'s rating? (e.g. Leo)') || '').trim();
        if (name) {
          if (!raters.includes(name)) raters.push(name);
          currentRater = name;
          DB.setMeta('raters', raters);
          DB.setMeta('currentRater', currentRater);
          paintRaters();
        }
      }
      const rater = e.target.closest('[data-rater]');
      if (rater) {
        currentRater = rater.dataset.rater === currentRater ? '' : rater.dataset.rater;
        DB.setMeta('currentRater', currentRater);
        paintRaters(); haptic();
      }
    });
    $('sheet-backdrop').addEventListener('click', closeSheet);

    // backup
    $('btn-export').addEventListener('click', exportBackup);
    $('btn-import').addEventListener('click', () => $('import-input').click());
    $('import-input').addEventListener('change', (e) => {
      if (e.target.files[0]) importBackup(e.target.files[0]);
      e.target.value = '';
    });

    switchView(bowls.length ? 'bowls' : 'rate');

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  init();
})();
