// Claude Code のフックから呼ばれる記録係。
// K-CEO の指示・スキル（担当）の呼び出し・室長の報告を記録し、組織図に映す。
// ここで失敗しても Claude Code の仕事は止めない（何も出力せずに終わる）。
import { record, clip } from './record.mjs';

// スキルの名前 → 組織図の担当
const ROLE = {
  dandori: 'secretary-a', mail: 'mail-a', kicho: 'keiri-a', getsumatsu: 'keiri-a',
  shorui: 'docs-a', kansa: 'check-a', katazuke: 'filing-a'
};
// 同じ係を増やした時（例：mail-b）も、スキル名の末尾に -b を付ければそのまま映る
const roleOf = skill => ROLE[skill] || ROLE[skill.replace(/-[a-z]$/, '')]?.replace(/-a$/, skill.slice(-2)) || null;

function toEvents(h) {
  const t = Date.now(), s = h.session_id;
  switch (h.hook_event_name) {
    case 'UserPromptSubmit': {
      const text = clip(h.prompt ?? h.user_input, 80);
      const out = [{ t, s, type: 'order', agent: 'owner', text }];
      const m = /^\/([\w-]+)\s*(.*)$/s.exec(text);
      const role = m && roleOf(m[1]);
      if (role) out.push({ t, s, type: 'start', agent: role, text: clip('/' + m[1] + ' ' + m[2], 60) });
      return out;
    }
    case 'PreToolUse': {
      const i = h.tool_input || {};
      if (h.tool_name === 'Skill') {
        const role = roleOf(String(i.skill || '').replace(/^\//, ''));
        return role ? [{ t, s, type: 'start', agent: role, text: clip('/' + i.skill + ' ' + (i.args || ''), 60) }] : [];
      }
      return [{ t, s, type: 'assign', agent: i.subagent_type || 'general-purpose', text: clip(i.description, 60) }];
    }
    case 'SubagentStart':
      return [{ t, s, type: 'start', agent: h.agent_type, id: h.agent_id }];
    case 'SubagentStop':
      return [{ t, s, type: 'done', agent: h.agent_type, id: h.agent_id, text: clip(h.last_assistant_message, 200) }];
    case 'Stop':
      return [{ t, s, type: 'report', agent: 'matome', text: clip(h.last_assistant_message, 300) }];
  }
  return [];
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => { buf += c; });
process.stdin.on('end', () => {
  try { toEvents(JSON.parse(buf)).forEach(record); } catch {}
  process.exit(0);
});
