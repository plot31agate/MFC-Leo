// Progress, reminders (calendar export) and settings/backup.
import { stats, getSettings, setSetting, exportData, importData } from '../storage.js';
import { downloadICS } from '../ics.js';
import { typeInfo } from '../plan.js';
import { esc } from '../util.js';

export function renderProgress(container, ctx) {
  const { plan } = ctx;
  const st = stats(plan);
  const s = getSettings();

  const weekBars = plan.weeks.filter((w) => w.days.length).map((w) => {
    const ws = st.byWeek[w.week] || { done: 0, total: 0 };
    const pct = ws.total ? Math.round((ws.done / ws.total) * 100) : 0;
    return `
      <div style="margin-bottom:10px">
        <div class="row-between"><span>${esc(w.title || 'Week ' + w.week)}</span><span class="muted">${ws.done}/${ws.total}</span></div>
        <div class="bar"><span style="width:${pct}%"></span></div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="stat-grid">
      <div class="stat"><div class="stat__num">${st.done}<span style="font-size:16px;color:var(--muted)">/${st.total}</span></div><div class="stat__lbl">Sessions done</div></div>
      <div class="stat stat--amber"><div class="stat__num">${st.percent}%</div><div class="stat__lbl">Complete</div></div>
      <div class="stat"><div class="stat__num">${st.streak} 🔥</div><div class="stat__lbl">Day streak</div></div>
      <div class="stat"><div class="stat__num">${st.pb ? esc(st.pb.display) : '—'}</div><div class="stat__lbl">5km best</div></div>
      <div class="stat stat--wide"><div class="stat__num">${st.proteinDaysHit}</div><div class="stat__lbl">Days you hit ${plan.proteinTargetG || 140}g protein</div></div>
    </div>

    <p class="section-title">By week</p>
    <section class="card">${weekBars}</section>

    <p class="section-title">Reminders</p>
    <section class="card">
      <p class="ex-sub">Add every session to your iPhone calendar with an alert before each one. Open the downloaded file and tap “Add All”.</p>
      <label class="lbl" for="rtime">Reminder time</label>
      <input class="field" id="rtime" type="time" value="${esc(s.reminderTime)}" />
      <label class="lbl" for="rlead">Alert before session</label>
      <select class="field" id="rlead">
        ${[0, 15, 30, 60, 120].map((m) => `<option value="${m}" ${Number(s.reminderLeadMin) === m ? 'selected' : ''}>${m === 0 ? 'At start' : m + ' min before'}</option>`).join('')}
      </select>
      <div style="height:12px"></div>
      <button class="btn btn--primary" id="add-cal">📅 Add reminders to calendar</button>
    </section>

    <p class="section-title">Logging</p>
    <a class="btn btn--ghost" href="${esc(plan.stravaTeamUrl || 'https://www.strava.com')}" target="_blank" rel="noopener">Open Strava ↗</a>
    <p class="footnote">The club logs all runs &amp; gym on Strava — “if you didn't Strava it, it didn't happen.”</p>

    <p class="section-title">Backup</p>
    <section class="card">
      <p class="ex-sub">Your progress is saved on this phone only. Export a backup before changing phone or clearing Safari.</p>
      <button class="btn btn--ghost btn--sm" id="export">⤓ Export backup</button>
      <button class="btn btn--ghost btn--sm" id="import" style="margin-top:8px">⤒ Restore from backup</button>
      <input type="file" id="import-file" accept="application/json,.json" hidden />
    </section>
  `;

  container.querySelector('#rtime').addEventListener('change', (e) => setSetting('reminderTime', e.target.value));
  container.querySelector('#rlead').addEventListener('change', (e) => setSetting('reminderLeadMin', Number(e.target.value)));
  container.querySelector('#add-cal').addEventListener('click', () => downloadICS(plan));

  container.querySelector('#export').addEventListener('click', () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'leo-training-backup.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  const fileInput = container.querySelector('#import-file');
  container.querySelector('#import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      importData(await file.text());
      ctx.refresh();
      alert('Backup restored.');
    } catch (err) {
      alert('Could not read that backup file.');
    }
  });
}
