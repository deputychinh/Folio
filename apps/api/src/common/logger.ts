// One JSON line per log entry, so Vercel log search can filter by field.

type Level = 'info' | 'warn' | 'error';

const quietInTests = process.env.NODE_ENV === 'test';

export function log(level: Level, message: string, fields: Record<string, unknown> = {}): void {
  if (quietInTests && level === 'info') return;
  const line = JSON.stringify({ level, message, time: new Date().toISOString(), ...fields });
  if (level === 'error') console.error(line);
  else console.log(line);
}
