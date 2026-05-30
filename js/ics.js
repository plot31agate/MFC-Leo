// Generates an .ics calendar file from the programme so Leo can import every
// session into his iPhone calendar with a native alarm before each one.
import { trainingDays, resolveRef, typeInfo } from './plan.js';
import { getSettings } from './storage.js';

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
  const blob = new Blob([buildICS(plan)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leo-motherwell-training.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
