// Generates an .ics calendar file from the programme so Leo can import every
// session into his iPhone calendar with a native alarm before each one.
import { trainingDays, resolveRef, typeInfo } from './plan.js';
import { getSettings } from './storage.js';
import { todayISO } from './util.js';

function pad(n) { return String(n).padStart(2, '0'); }

// Build a floating local datetime stamp: YYYYMMDDTHHMMSS
function localStamp(dateIso, time = '09:00') {
  const [h, m] = time.split(':').map(Number);
  return dateIso.replace(/-/g, '') + 'T' + pad(h) + pad(m) + '00';
}

function utcStamp(d = new Date()) {
  return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
         pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
}

function fold(line) {
  // RFC5545: lines should be <=75 octets; fold long ones.
  if (line.length <= 73) return line;
  const chunks = [];
  let s = line;
  while (s.length > 73) { chunks.push(s.slice(0, 73)); s = ' ' + s.slice(73); }
  chunks.push(s);
  return chunks.join('\r\n');
}

function escText(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// One-line summary of a day's components for the calendar description.
function dayDescription(plan, day) {
  const parts = (day.components || []).map((ref) => {
    const node = resolveRef(plan, ref);
    return node ? node.title : ref;
  });
  let desc = parts.join(' → ');
  if (day.rpe) desc += `\n\nRPE: ${day.rpe}`;
  desc += '\n\nRemember: warm up properly, fuel well, and log it on Strava.';
  return desc;
}

export function buildICS(plan) {
  const settings = getSettings();
  const time = settings.reminderTime || '09:00';
  const lead = Number(settings.reminderLeadMin ?? 60);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MFC Leo Training//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Leo · Motherwell Training`,
  ];

  const dtstamp = utcStamp();

  for (const day of trainingDays(plan)) {
    const info = typeInfo(plan, day.type);
    const summary = `⚽ ${info.label}${day.rpe ? ` · RPE ${day.rpe}` : ''}`;
    const start = localStamp(day.date, time);
    // Default 90-minute block.
    const endTime = addMinutes(time, 90);
    const end = localStamp(day.date, endTime);

    lines.push(
      'BEGIN:VEVENT',
      `UID:mfc-${day.date}@leo-training`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      fold(`SUMMARY:${escText(summary)}`),
      fold(`DESCRIPTION:${escText(dayDescription(plan, day))}`),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      fold(`DESCRIPTION:${escText(summary)}`),
      `TRIGGER:-PT${lead}M`,
      'END:VALARM',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + mins;
  return pad(Math.floor(total / 60) % 24) + ':' + pad(total % 60);
}

export function downloadICS(plan) {
  triggerDownload(buildICS(plan), 'leo-motherwell-training.ics');
}

// Daily recurring protein/meal reminders at the configured times.
export function buildProteinICS(plan) {
  const settings = getSettings();
  const times = settings.mealReminderTimes || ['15:00', '18:00', '20:30'];
  const target = plan.proteinTargetG || 140;
  const until = (plan.preSeasonReturn || '2026-12-31').replace(/-/g, '') + 'T235900';
  const startDate = todayISO();
  const dtstamp = utcStamp();

  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MFC Leo Training//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Leo · Protein reminders',
  ];

  times.forEach((t, idx) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:mfc-protein-${idx}-${t.replace(':', '')}@leo-training`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${localStamp(startDate, t)}`,
      `DTEND:${localStamp(startDate, addMinutes(t, 15))}`,
      `RRULE:FREQ=DAILY;UNTIL=${until}`,
      fold(`SUMMARY:${escText(`🍗 Protein check — aim ${target}g`)}`),
      fold(`DESCRIPTION:${escText('Behind on protein? Grab a shake, milk, yoghurt or a meal — then open the app to log it.')}`),
      'BEGIN:VALARM', 'ACTION:DISPLAY', fold(`DESCRIPTION:${escText('Protein check')}`), 'TRIGGER:-PT0M', 'END:VALARM',
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadProteinICS(plan) {
  triggerDownload(buildProteinICS(plan), 'leo-protein-reminders.ics');
}

function triggerDownload(text, filename) {
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
