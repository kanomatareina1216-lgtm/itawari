// 事務員の動きを1行ずつ記録し、組織図の画面が読む dashboard/activity.js を作り直す。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, '../../dashboard');
const LOG = path.join(dir, 'activity.jsonl');
const OUT = path.join(dir, 'activity.js');
const KEEP = 1500; // 画面に渡す記録の数（古いものから捨てる）

// 長すぎる文を切る。改行は報告を読みやすくするため残す
export const clip = (s, n) => String(s ?? '').replace(/[ \t　]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim().slice(0, n);

export function record(ev) {
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(LOG, JSON.stringify(ev) + '\n');

  let lines = fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean);
  if (lines.length > KEEP * 2) {
    lines = lines.slice(-KEEP);
    fs.writeFileSync(LOG, lines.join('\n') + '\n');
  }
  const events = lines.slice(-KEEP).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

  // 書きかけのファイルを画面が読まないよう、別名で書いてから差し替える
  const body = 'window.ACTIVITY = ' + JSON.stringify(events) + ';\n';
  const tmp = OUT + '.' + process.pid + '.tmp';
  try {
    fs.writeFileSync(tmp, body);
    fs.renameSync(tmp, OUT);
  } catch {
    try { fs.rmSync(tmp, { force: true }); } catch {}
    fs.writeFileSync(OUT, body);
  }
}
