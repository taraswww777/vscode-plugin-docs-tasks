/** YAML/js-yaml date-only: Date в полночь UTC — календарный день без сдвига по TZ. */
function dateFromYamlDateOnly(value: Date): Date {
  return new Date(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
    0,
    0,
    0,
    0,
  );
}

function isYamlDateOnly(value: Date): boolean {
  return (
    value.getUTCHours() === 0 &&
    value.getUTCMinutes() === 0 &&
    value.getUTCSeconds() === 0 &&
    value.getUTCMilliseconds() === 0
  );
}

/** Разбор created/updated из YAML (Date, YYYY-MM-DD, ISO, «YYYY-MM-DD HH:mm», «дд.мм.гггг чч:мм»). */
export function parseTaskDateTime(value: unknown): Date | undefined {
  if (value == null || value === '') return undefined;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    return isYamlDateOnly(value) ? dateFromYamlDateOnly(value) : value;
  }
  const s = String(value).trim();
  if (!s) return undefined;
  const display = /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?$/.exec(s);
  if (display) {
    const d = new Date(
      Number(display[3]),
      Number(display[2]) - 1,
      Number(display[1]),
      display[4] != null ? Number(display[4]) : 0,
      display[5] != null ? Number(display[5]) : 0,
      0,
    );
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(s);
  if (iso) {
    const d = new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      iso[4] != null ? Number(iso[4]) : 0,
      iso[5] != null ? Number(iso[5]) : 0,
      iso[6] != null ? Number(iso[6]) : 0,
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
  const orig = value == null ? '' : value instanceof Date ? '' : String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(orig)) {
    return orig;
  }
  if (value instanceof Date && isYamlDateOnly(value)) {
    const y = value.getUTCFullYear();
    const mo = String(value.getUTCMonth() + 1).padStart(2, '0');
    const da = String(value.getUTCDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
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

/** Нормализация ввода (дд.мм.гггг чч:мм, YYYY-MM-DD, …) в каноническую строку для YAML. */
export function normalizeTaskDateTimeField(value: unknown): string | undefined {
  return serializeTaskDateTime(value);
}
