#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const base = process.env.ORCHESTRATOR_URL || 'http://127.0.0.1:3000';
const token = process.env.ORCHESTRATOR_TOKEN || '';
const [command = 'help', ...args] = process.argv.slice(2);

async function api(route, options = {}) {
  const response = await fetch(`${base}${route}`, {
    ...options,
    headers: { 'content-type':'application/json', authorization:`Bearer ${token}`, ...(options.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function option(name, fallback = '') {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
}

function usage() {
  console.log(`Uso:
  orch list
  orch start <codex|claude|shell> --cwd /workspace/projeto [--name tarefa] [--prompt texto] [--worktree] [--base HEAD]
  orch output <id> [--lines 500]
  orch send <id> <texto>
  orch stop <id>
  orch attach <id>
  orch doctor`);
}

try {
  if (command === 'list') {
    const { sessions } = await api('/api/sessions');
    for (const item of sessions) console.log(`${item.running ? '●' : '○'} ${item.id}\t${item.agent}\t${item.cwd}`);
  } else if (command === 'start') {
    const agent = args[0];
    if (!agent) throw new Error('informe codex, claude ou shell');
    const data = await api('/api/sessions', { method:'POST', body:JSON.stringify({
      agent,
      cwd:option('cwd', '/workspace'),
      name:option('name', agent),
      prompt:option('prompt'),
      base:option('base', 'HEAD'),
      worktree:args.includes('--worktree')
    }) });
    console.log(data.session.id);
  } else if (command === 'output') {
    if (!args[0]) throw new Error('informe o id');
    const data = await api(`/api/sessions/${encodeURIComponent(args[0])}/output?lines=${encodeURIComponent(option('lines', '500'))}`);
    process.stdout.write(data.output);
  } else if (command === 'send') {
    if (!args[0] || args.length < 2) throw new Error('informe o id e o texto');
    await api(`/api/sessions/${encodeURIComponent(args[0])}/input`, { method:'POST', body:JSON.stringify({ input:args.slice(1).join(' ') }) });
  } else if (command === 'stop') {
    if (!args[0]) throw new Error('informe o id');
    console.log(JSON.stringify(await api(`/api/sessions/${encodeURIComponent(args[0])}/stop`, { method:'POST', body:'{}' })));
  } else if (command === 'attach') {
    if (!args[0]) throw new Error('informe o id');
    const state = process.env.ORCHESTRATOR_STATE_DIR || path.join(process.env.HOME, '.orchestrator');
    const result = spawnSync('tmux', ['-S', path.join(state, 'tmux.sock'), 'attach', '-t', `=${args[0]}`], { stdio:'inherit' });
    process.exitCode = result.status ?? 1;
  } else if (command === 'doctor') {
    const health = await fetch(`${base}/api/health`).then((response) => response.json());
    const { sessions } = await api('/api/sessions');
    console.log(`orchestrator: ${health.ok ? 'ok' : 'erro'}\ntoken: ok\nsessões: ${sessions.length}`);
  } else {
    usage();
    if (command !== 'help') process.exitCode = 2;
  }
} catch (error) {
  console.error(`erro: ${error.message}`);
  process.exitCode = 1;
}
