// 経費の月まとめ。AIを使わずに計算する。
// 使い方： node 道具/集計.mjs 2026-09   （月を省くと今月）
import { readCsv, yen, num, logTool } from './共通.mjs';

const d0 = new Date();
const month = process.argv[2] || d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0');
const rows = readCsv('台帳/経費.csv').filter(r => (r['日付'] || '').replace(/\//g, '-').startsWith(month));

const byKind = {}, byRate = {};
let total = 0;
for (const r of rows) {
  const v = num(r['金額']);
  total += v;
  byKind[r['勘定科目'] || '（科目なし）'] = (byKind[r['勘定科目'] || '（科目なし）'] || 0) + v;
  byRate[r['税率'] || '（税率なし）'] = (byRate[r['税率'] || '（税率なし）'] || 0) + v;
}

console.log(`■ ${month} の経費（${rows.length}件）`);
if (!rows.length) console.log('  記録がありません。');
Object.entries(byKind).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}：${yen(v)}`));
console.log(`  合計（税込）：${yen(total)}`);
if (rows.length) {
  console.log('■ 税率ごと');
  Object.entries(byRate).forEach(([k, v]) => console.log(`  ${k}：${yen(v)}`));
  const noInvoice = rows.filter(r => !/^T\d{13}$/.test(r['インボイス登録番号'] || '')).length;
  console.log(`■ 登録番号の書いていない領収書：${noInvoice}件`);
}
await logTool('tool-shukei', `${month} の経費を集計（${rows.length}件）`);
