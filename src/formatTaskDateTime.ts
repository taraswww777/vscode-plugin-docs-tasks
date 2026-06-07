/** Разбор created/updated из YAML (Date, YYYY-MM-DD, ISO, «YYYY-MM-DD HH:mm»). */
export function parseTaskDateTime(value: unknown): Date | undefined {
  if (value == null || value === '') return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  const s = String(value).trim();
  if (!s) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(s);
  if (m) {
    const d = new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      m[4] != null ? Number(m[4]) : 0,
      m[5] != null ? Number(m[5]) : 0,
      m[6] != null ? Number(m[6]) : 0,
    );
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Каноническая строка для индекса и сортировки. */
export function serializeTaskDateTime(value: unknown): string | undefined {
  const d = parseTaskDateTime(value);
  if (!d) {
    const s = value == null ? '' : String(value).trim();
    return s || undefined;
  }
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const orig = value == null ? '' : String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(orig)) {
    return orig;
  }
  if (hh === '00' && mm === '00' && d.getSeconds() === 0 && d.getMilliseconds() === 0) {
    return `${y}-${mo}-${da}`;
  }
  return `${y}-${mo}-${da} ${hh}:${mm}`;
}

/** Отображение в таблице: дд.мм.гггг чч:мм */
export function formatTaskDateTimeDisplay(value: unknown): string {
  const d = parseTaskDateTime(value);
  if (!d) return value == null ? '' : String(value).trim();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function taskDateTimeSortKey(value: unknown): number {
  const d = parseTaskDateTime(value);
  return d ? d.getTime() : 0;
}
