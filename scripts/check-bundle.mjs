// CI gate on the built SPA: JS size budget (plan NFR-01) and no server secrets in the bundle.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'apps/web/dist';
const JS_BUDGET_GZIP_KB = 60;
const FORBIDDEN = [/service_role/i, /SUPABASE_SERVICE_ROLE_KEY/, /sb_secret_/];

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

const all = files(DIST).filter((file) => !file.endsWith('.map'));
const js = all.filter((file) => file.endsWith('.js'));
const gzipKb = js.reduce((sum, file) => sum + gzipSync(readFileSync(file)).length, 0) / 1024;

let failed = false;
console.log(`JS (gzip): ${gzipKb.toFixed(1)} KB / budget ${JS_BUDGET_GZIP_KB} KB`);
if (gzipKb > JS_BUDGET_GZIP_KB) failed = true;

for (const file of all.filter((f) => /\.(js|html|css)$/.test(f))) {
  const text = readFileSync(file, 'utf8');
  for (const pattern of FORBIDDEN) {
    if (pattern.test(text)) {
      console.error(`Secret-looking value ${pattern} found in ${file}`);
      failed = true;
    }
  }
  if (file.endsWith('.html') && /<script>(?!\s*<\/script>)|style="/.test(text)) {
    console.error(`Inline script or style in ${file} would break the CSP`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
