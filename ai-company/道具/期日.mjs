// 近い支払いと、期日を過ぎた未入金の一覧。AIを使わずに調べる。
// 使い方： node 道具/期日.mjs   （7日先まで。日数を変える時は node 道具/期日.mjs 14）
import { readCsv, yen, num, today, ymd, parseDate, logTool } from './共通.mjs';

const days = Number(process.argv[2]) || 7;
const t0 = today(), limit = new Date(t0.getTime() + days * 86400000);
const W = '日月火水木金土';
const show = d => ymd(d) + '（' + W[d.getDay()] + '）';

const pays = readCsv('台帳/支払い予定.csv')
  .filter(r => !(r['状態'] || '').includes('済'))
  .map(r => ({ ...r, d: parseDate(r['期日']) }))
  .filter(r => r.d && r.d <= limit)
  .sort((a, b) => a.d - b.d);

const unpaid = readCsv('台帳/請求一覧.csv')
  .filter(r => !(r['状態'] || '').includes('済'))
  .map(r => ({ ...r, d: parseDate(r['入金期日']) }))
  .filter(r => r.d && r.d < t0)
  .sort((a, b) => a.d - b.d);

console.log(`■ ${days}日以内に払うもの（${pays.length}件）`);
pays.forEach(r => console.log(`  ${show(r.d)}${r.d < t0 ? ' ※期日を過ぎています' : ''}　${r['支払先']}　${r['内容']}　${yen(num(r['金額']))}`));
if (!pays.length) console.log('  ありません。');

console.log(`■ 入金期日を過ぎた未入金（${unpaid.length}件）`);
unpaid.forEach(r => console.log(`  ${show(r.d)}　${r['請求書番号']}　${r['宛先']}　${yen(num(r['金額']))}`));
if (!unpaid.length) console.log('  ありません。');

await logTool('tool-kijitsu', `期日の確認（支払い${pays.length}件・未入金${unpaid.length}件）`);
