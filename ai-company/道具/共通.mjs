// 道具どうしで使う部品。CSV の読み書きと、組織図への記録。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const at = (...p) => path.join(ROOT, ...p);

// BOM付き UTF-8 の CSV を、見出しを鍵にした行の一覧にする
export function readCsv(rel) {
  const file = at(rel);
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some(v => v !== '')) rows.push(row);
  const [head = [], ...body] = rows;
  // 見出しの「金額（税込）」は「金額」でも引けるよう、括弧の前も鍵にする
  const keys = head.map(h => h.trim());
  return body.map(r => {
    const o = {};
    keys.forEach((k, i) => { o[k] = (r[i] ?? '').trim(); o[k.replace(/（.*$/, '')] = o[k]; });
    return o;
  });
}

export const yen = n => '¥' + Math.round(n).toLocaleString('ja-JP');
export const num = s => Number(String(s ?? '').replace(/[¥,円\s]/g, '')) || 0;
export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const parseDate = s => { const m = /(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };

// 組織図に「道具が動いた」と残す。失敗しても道具の結果には影響させない
export async function logTool(agent, text) {
  try {
    const { record } = await import('../.claude/hooks/record.mjs');
    record({ t: Date.now(), type: 'tool', agent, text });
  } catch {}
}
