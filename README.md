# Leo · Motherwell FC Pre-Season Training Tracker

A simple, phone-friendly web app for Leo to follow his **Motherwell FC U19s/2010s
Off-Season Programme 26/27** — see what to do each day, read the full session detail,
tick off progress, and get reminders.

Built as a **static web app** (plain HTML/CSS/JavaScript — no build step, no server,
no accounts). All progress is stored privately on Leo's phone.

## Features

- **Today** – today's session laid out in order (warm-up → activations → run/gym),
  with a colour-coded RPE badge, full exercise tables, and tappable mobility demo videos.
- **Plan** – the whole programme (Weeks 1–4) counting down to pre-season on **18 June**,
  ticking off as he goes.
- **Progress** – sessions done, % complete, day streak, and 5km benchmark best time.
- **Reminders** – one tap exports every session to the iPhone calendar with an alert
  before each one (configurable time).
- **Guide** – always-available reference: warm-up, mobility/activation videos, gym &
  run sessions, nutrition, RPE scale, substitutes, and the official club PDFs.
- **Offline** – installs to the home screen (PWA) and works without signal.
- **Backup** – export/restore progress as a file.

## Use it on an iPhone

1. Open the published URL (see *Deploy* below) in **Safari**.
2. Tap the **Share** button → **Add to Home Screen**. It now behaves like an app.
3. Open it, go to **Progress → Add reminders to calendar**, open the downloaded file
   and tap **Add All** to load the sessions into the iPhone calendar.

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```
(Use a local server rather than opening `index.html` directly, so the browser can load
the JavaScript modules and `data/plan.json`.)

## Deploy free on GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch.**
3. Choose the branch (e.g. `main`) and folder **/(root)**, then **Save**.
4. After a minute the app is live at `https://<user>.github.io/<repo>/`.

The `.nojekyll` file ensures Pages serves every file as-is.

## Editing the training plan

All sessions live in **`data/plan.json`**. It has two parts:

- **`library`** – reusable building blocks (warm-up, mobility, each run, each gym
  session, nutrition, substitutes).
- **`weeks`** – the schedule: each day has a real date, a `type`, an `rpe`, and a list
  of `components` referencing library items (e.g. `"gym.lowers1"`, `"runs.run1b"`).

See **`data/plan.schema.md`** for the full shape. Change a session in one place in the
`library` and it updates everywhere it's used. To roll the programme to new dates,
update each day's `date` and the `wc` (week-commencing) values.

## Credits

Training programme © Motherwell FC (U19s/2010s Off-Season Programme 26/27). The two
source PDFs are included in the repo and linked from the app's **Guide** tab.
