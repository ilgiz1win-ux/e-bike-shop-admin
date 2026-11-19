// All "today / past" logic uses Bishkek time (UTC+6, no DST).
const OFFSET_MS = 6 * 3600e3;

const bishkekDay = (d) => new Date(d.getTime() + OFFSET_MS).toISOString().slice(0, 10);

export function isPastInBishkek(startsAtIso, now = new Date()) {
  return new Date(startsAtIso).getTime() < now.getTime();
}

export function durationText(startIso, endIso, lang) {
  if (!endIso) return '';
  let mins = Math.round((new Date(endIso) - new Date(startIso)) / 60000);
  if (mins <= 0) mins += 1440;
  const h = Math.floor(mins / 60), m = mins % 60;
  if (lang === 'ru') return `${h} ч${m ? ` ${m} мин` : ''}`;
  return `${h} саат${m ? ` ${m} мүн` : ''}`;
}

export function dayLabel(dateIso, lang, now = new Date()) {
  const day = bishkekDay(new Date(dateIso));
  const today = bishkekDay(now);
  const tomorrow = bishkekDay(new Date(now.getTime() + 86400e3));
  const ru = lang === 'ru';
  if (day === today) return ru ? 'Сегодня' : 'Бүгүн';
  if (day === tomorrow) return ru ? 'Завтра' : 'Эртең';
  return day.split('-').reverse().join('.');
}

export const bishkekDate = (d = new Date()) => bishkekDay(d);
