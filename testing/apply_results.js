const fs = require('fs');
const csvPath = 'testing/Howler_QA_Test_Plan.csv';
const dataPath = process.argv[2];
if (!dataPath) { console.error('Usage: node apply_results.js <results.json>'); process.exit(1); }

const raw = fs.readFileSync(csvPath, 'utf8');
const lines = raw.split(/\r?\n/).filter(l => l.length > 0);

function splitCSV(line) {
  const re = /("(?:[^"]|"")*"|[^,]*)(,|$)/g;
  const out = [];
  let m;
  while ((m = re.exec(line)) && m[0] !== '') { out.push(m[1]); if (m[2] === '') break; }
  return out;
}
function unquote(f) { return f.startsWith('"') && f.endsWith('"') ? f.slice(1, -1).replace(/""/g, '"') : f; }
function quote(f) { return '"' + String(f).replace(/"/g, '""') + '"'; }

const header = splitCSV(lines[0]).map(unquote);
const rows = lines.slice(1).map(l => splitCSV(l).map(unquote));
const idx = {};
header.forEach((h, i) => idx[h] = i);
const byId = {};
rows.forEach(r => byId[r[0]] = r);

const entries = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
let applied = 0, missing = 0;
for (const e of entries) {
  const r = byId[e.id];
  if (!r) { console.error('MISSING ID:', e.id); missing++; continue; }
  if (e.actual !== undefined) r[idx['Actual Result']] = e.actual;
  if (e.status !== undefined) r[idx['Status']] = e.status;
  if (e.note) r[idx['Notes']] = (r[idx['Notes']] ? r[idx['Notes']] + ' | ' : '') + e.note;
  applied++;
}

fs.writeFileSync(csvPath, header.map(quote).join(',') + '\n' + rows.map(r => r.map(quote).join(',')).join('\n') + '\n');
console.log('Applied:', applied, '| Missing IDs:', missing);
