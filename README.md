# MFC Pre-Season · Motherwell FC Academy Training Tracker

A simple, phone-friendly web app that follows the **Motherwell FC U19s/2010s
Off-Season Programme** — see what to do each day, read the full session detail,
tick off progress, log protein, and get reminders.

Built as a **static web app** (plain HTML/CSS/JavaScript — no build step, no
server, no accounts). Each player's progress is stored privately on their own
phone.

## For players

1. Open the app link your coach shares (see *Deploy* below) in **Safari**.
2. Tap the **Share** button → **Add to Home Screen**. It now behaves like an app.
3. Open it and complete the quick **setup** — enter your **name** and your
   **daily protein target** (your coach can advise; 140g is a solid default).
4. Go to **Progress → Add session reminders / Add protein reminders**, open the
   downloaded file and tap **Add All** to load the alerts into your calendar.

When a reminder pops up, just tap the app icon to open it and tick things off /
log your protein.

You can change your name or protein target any time on the **Progress** tab
under **Profile**.

## Features

- **Today** – today's session laid out in order (warm-up → activations → run/gym),
  with a colour-coded RPE badge, full exercise tables, and tappable mobility demo videos.
- **Plan** – the whole programme (Weeks 1–4) counting down to pre-season,
  ticking off as you go.
- **Progress** – sessions done, % complete, day streak, 5km benchmark best, and
  protein days. Includes your editable **Profile** and **Backup**.
- **Reminders** – one tap exports every session to the iPhone calendar with an
  alert before each one (configurable time), plus daily protein nudges.
- **Guide** – always-available reference: warm-up, mobility/activation videos,
  gym & run sessions, nutrition, RPE scale, substitutes, and the official club PDFs.
- **Offline** – installs to the home screen (PWA) and works without signal.
- **Backup** – export/restore progress (and profile) as a file.

## Per-player vs shared

- **Shared for everyone:** the training schedule and all session content live in
  `data/plan.json`.
- **Per-player (stored on each phone):** name, daily protein target, completion,
  notes, 5km times and reminder settings. Nothing is sent to a server.

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```
(Use a local server rather than opening `index.html` directly, so the browser can load
the JavaScript modules and `data/plan.json`.)

## Deploy free on GitHub Pages

1. Push this repo/branch to GitHub.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch.**
3. Choose the branch and folder **/(root)**, then **Save**.
4. After a minute the app is live at `https://<user>.github.io/<repo>/`.
5. Share that single link with the squad — each player installs it and sets up
   their own profile.

The `.nojekyll` file ensures Pages serves every file as-is.

## Publish to the App Store / Play Store

The same web app is wrapped for the stores with [Capacitor](https://capacitorjs.com/)
— no rewrite, it bundles these exact files into native iOS/Android shells.

**This part needs a Mac** (Xcode + Android Studio) and developer accounts:
Apple Developer Program (~£79/$99 a year) and Google Play (one-off $25). The
build and store submission can't be done from a Linux/CI box.

```bash
npm install                 # install Capacitor tooling
npm run add:android         # create the android/ project (one-time)
npm run add:ios             # create the ios/ project (one-time, Mac only)

npm run sync                # copy the web app in + sync after any web change
npm run open:android        # build/run/submit from Android Studio
npm run open:ios            # build/run/submit from Xcode
```

- `capacitor.config.json` holds the app id (`com.motherwellfc.preseason`) and name.
- `npm run copy:web` assembles the static app into `www/` (git-ignored); `cap sync`
  pushes it into the native projects. Re-run `npm run sync` whenever the web app changes.
- The `android/` and `ios/` folders are generated on first `cap add` — commit them
  if you want the native shells versioned (see `.gitignore`).
- Native alarms (local notifications) can replace the calendar-export reminders via
  `@capacitor/local-notifications`, already listed as a dependency.

## Editing the training plan

All sessions live in **`data/plan.json`**. It has two parts:

- **`library`** – reusable building blocks (warm-up, mobility, each run, each gym
  session, nutrition, substitutes).
- **`weeks`** – the schedule: each day has a real date, a `type`, an `rpe`, and a list
  of `components` referencing library items (e.g. `"gym.lowers1"`, `"runs.run1b"`).

`proteinTargetG` sets the **default** protein target shown on setup; each player
can override it for themselves. See **`data/plan.schema.md`** for the full shape.
Change a session in one place in the `library` and it updates everywhere it's
used. To roll the programme to new dates, update each day's `date` and the `wc`
(week-commencing) values.

## Credits

Training programme © Motherwell FC (U19s/2010s Off-Season Programme). The source
PDFs are included in the repo and linked from the app's **Guide** tab.
</content>
