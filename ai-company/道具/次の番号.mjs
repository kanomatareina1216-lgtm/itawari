// 書類の次の番号を出す。AIを使わずに数える。
// 使い方： node 道具/次の番号.mjs 請求書   （見積書／請求書／納品書）
import fs from 'node:fs';
import { at, logTool } from './共通.mjs';

const KIND = { 見積書: 'EST', 請求書: 'INV', 納品書: 'DLV' };
const kind = process.argv[2];
if (!KIND[kind]) { console.log('種類を「見積書」「請求書」「納品書」から選んでください。'); process.exit(1); }

const year = new Date().getFullYear();
const head = `${KIND[kind]}-${year}-`;
let max = 0;
const dir = at('書類', kind);
if (fs.existsSync(dir)) {
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith(head)) max = Math.max(max, Number(f.slice(head.length, head.length + 4)) || 0);
  }
}
const next = head + String(max + 1).padStart(4, '0');
console.log(next);
await logTool('tool-bangou', `${kind}の番号 ${next}`);
