// 見積書・請求書の金額計算。AIに計算させず、ここで決める。
// 使い方： node 道具/計算.mjs "棚の製作,1,88000,10" "木材（持ち込み）,3,1200,10"
//   1行に「品名,数量,単価（税抜）,税率」。税率は 10 か 8。
// 消費税は、インボイスの決まりに合わせて「税率ごとに1回だけ」端数を切り捨てる。
import { yen, logTool } from './共通.mjs';

const lines = process.argv.slice(2);
if (!lines.length) { console.log('例： node 道具/計算.mjs "棚の製作,1,88000,10"'); process.exit(1); }

const items = [], errors = [];
for (const l of lines) {
  const [name, q, p, r] = l.split(',').map(s => (s || '').trim());
  const qty = Number(q), price = Number(String(p).replace(/[¥,円]/g, '')), rate = Number(r || 10);
  if (!name || !(qty > 0) || !(price >= 0) || ![8, 10].includes(rate)) { errors.push(l); continue; }
  items.push({ name, qty, price, rate, amount: qty * price });
}
if (errors.length) { console.log('読めなかった行：' + errors.join(' ／ ')); process.exit(1); }

console.log('■ 明細（税抜）');
items.forEach(i => console.log(`  ${i.name}${i.rate === 8 ? '※' : ''}　${i.qty} × ${yen(i.price)} ＝ ${yen(i.amount)}`));
const sub = items.reduce((s, i) => s + i.amount, 0);
let tax = 0;
console.log(`■ 小計（税抜）：${yen(sub)}`);
for (const rate of [10, 8]) {
  const base = items.filter(i => i.rate === rate).reduce((s, i) => s + i.amount, 0);
  if (!base) continue;
  const t = Math.floor(base * rate / 100);
  tax += t;
  console.log(`■ ${rate}%対象 ${yen(base)}　消費税 ${yen(t)}`);
}
console.log(`■ 合計（税込）：${yen(sub + tax)}`);
if (items.some(i => i.rate === 8)) console.log('  ※ は軽減税率（8%）の品');
await logTool('tool-keisan', `金額の計算（${items.length}行・合計 ${yen(sub + tax)}）`);
