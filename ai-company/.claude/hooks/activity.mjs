// Claude Code のフックから呼ばれる記録係。
// 社長の指示・割り振り・担当の出動と完了・社長への報告を記録する。
// ここで失敗しても Claude Code の仕事は止めない（何も出力せずに終わる）。
import { record, clip } from './record.mjs';

function toEvent(h) {
  const t = Date.now(), s = h.session_id;
  switch (h.hook_event_name) {
    case 'UserPromptSubmit':
      return { t, s, type: 'order', agent: 'owner', text: clip(h.prompt ?? h.user_input, 80) };
    case 'PreToolUse': // 担当を呼ぶ道具（Agent / Task）を使う直前
      return { t, s, type: 'assign', agent: h.tool_input?.subagent_type || 'general-purpose', text: clip(h.tool_input?.description, 60) };
    case 'SubagentStart':
      return { t, s, type: 'start', agent: h.agent_type, id: h.agent_id };
    case 'SubagentStop':
      return { t, s, type: 'done', agent: h.agent_type, id: h.agent_id, text: clip(h.last_assistant_message, 200) };
    case 'Stop':
      return { t, s, type: 'report', agent: 'matome', text: clip(h.last_assistant_message, 200) };
  }
  return null;
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => { buf += c; });
process.stdin.on('end', () => {
  try {
    const ev = toEvent(JSON.parse(buf));
    if (ev) record(ev);
  } catch {}
  process.exit(0);
});
