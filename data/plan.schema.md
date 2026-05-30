# `plan.json` schema

The whole programme is data-driven from this one file. Two parts: a **library** of
reusable sessions and a **weeks** schedule that references them.

## Top level

| Field | Type | Notes |
|---|---|---|
| `athlete`, `club`, `ageGroup`, `season` | string | Display only. |
| `preSeasonReturn` | `YYYY-MM-DD` | Shown as the countdown target. |
| `stravaTeamUrl` | url | "Open Strava" / "Log it on Strava" links. |
| `officialPdfs` | `[{label, file}]` | Linked from the Guide tab. `file` is a path in the repo. |
| `dayTypes` | object | `off / recovery / uppers / single / double / preseason` → `{label, colour, blurb}`. |
| `rpeScale` | array | `{range, label, note, colour}` rows for the RPE guide + badge colours. |
| `library` | object | Reusable sessions (see below). |
| `weeks` | array | The schedule (see below). |

## `library`

Each entry has a `kind` that controls how it renders:

- **`routine`** (warm-up): `{ title, subtitle, steps: [{name, detail}] }`
- **`exerciseList`** (mobility, activations): `{ title, subtitle, exercises: [{name, setsReps, videos:[url]}] }`
- **`run`**: `{ title, summary, detail, byWeek?: {"2":"4x4",...}, logMetric?: {key,label,type,pb} }`
- **`gym`**: `{ title, footer?, exercises: [{name, load, rest}] }`
- **`nutrition`**: `{ title, before/during/after: {goal, examples} }`
- **`substitutes`**: `{ title, subtitle, items: [{exercise, alt}] }`

Runs and gyms are grouped under `library.runs.*` and `library.gym.*`; the rest are
top-level keys (`warmup`, `preactivation`, `mobility`, `nutrition`, `substitutes`).

## `weeks`

```jsonc
{
  "week": 1,
  "wc": "2026-05-25",          // week commencing (Monday)
  "title": "Week 1",
  "note": "…",                 // shown when days is empty (rest week)
  "days": [
    {
      "date": "2026-05-30",     // real date → drives "Today", Plan order and reminders
      "type": "double",          // key into dayTypes
      "rpe": "7-8",              // key into rpeScale (for badge colour)
      "title": "Benchmark 5km",  // optional override of the type label
      "components": [            // ordered references into the library
        "warmup", "preactivation", "runs.run1b", "mobility", "gym.lowers1"
      ]
    }
  ]
}
```

### Component references
A component is a dotted path into `library`: `"mobility"`, `"warmup"`,
`"runs.benchmark5k"`, `"gym.uppersCore"`. Order matters — the Today view shows them
1, 2, 3… A day with an empty `components` array renders as a rest/day-off card.

### Notes
- Dates are treated as **local** dates (no timezone surprises).
- A `run` with `byWeek` shows the right sets/reps for that day's `week`.
- A `run` with `logMetric` (e.g. the 5km benchmark) lets Leo record a time that feeds
  the **5km best** stat on the Progress tab.
