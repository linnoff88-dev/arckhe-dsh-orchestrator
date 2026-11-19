import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const workspaceRoot = realpathSync(process.env.WORKSPACE_ROOT || '/workspace');
export const stateDir = process.env.ORCHESTRATOR_STATE_DIR || path.join(process.env.HOME || '/home/agent', '.orchestrator');
export const stateFile = path.join(stateDir, 'sessions.json');
export const tmuxSocket = path.join(stateDir, 'tmux.sock');

mkdirSync(stateDir, { recursive: true });

export function assertInsideWorkspace(inputPath) {
  if (!inputPath || typeof inputPath !== 'string') throw new Error('cwd é obrigatório');
  const absolute = path.isAbsolute(inputPath) ? inputPath : path.join(workspaceRoot, inputPath);
  if (!existsSync(absolute)) throw new Error(`diretório não encontrado: ${inputPath}`);
  const resolved = realpathSync(absolute);
  if (resolved !== workspaceRoot && !resolved.startsWith(`${workspaceRoot}${path.sep}`)) {
    throw new Error('o diretório precisa estar dentro de /workspace');
  }
  return resolved;
}

export function cleanName(value, fallback = 'sessao') {
  const cleaned = String(value || fallback)
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return cleaned || fallback;
}

export function newId(name) {
  return `${cleanName(name)}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}

export function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'\\''`)}'`;
}

export function readSessions() {
  try {
    const value = JSON.parse(readFileSync(stateFile, 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export function writeSessions(sessions) {
  const temporary = `${stateFile}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(sessions, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, stateFile);
}

function tmux(args, options = {}) {
  return spawnSync('tmux', ['-S', tmuxSocket, ...args], {
    encoding: 'utf8',
    ...options
  });
}

export function isRunning(id) {
  return tmux(['has-session', '-t', `=${id}`]).status === 0;
}

export function listSessions() {
  return readSessions().map((session) => ({ ...session, running: isRunning(session.id) }));
}

function prepareWorktree(cwd, id, base = 'HEAD') {
  let repo;
  try {
    repo = execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  } catch {
    throw new Error('worktree solicitado, mas cwd não está em um repositório Git');
  }
  repo = assertInsideWorkspace(repo);
  const repoName = cleanName(path.basename(repo), 'repo');
  const targetParent = path.join(workspaceRoot, '.orchestrator-worktrees', repoName);
  const target = path.join(targetParent, id);
  mkdirSync(targetParent, { recursive: true });
  const branch = `orchestrator/${id}`;
  const result = spawnSync('git', ['-C', repo, 'worktree', 'add', '-b', branch, target, base], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || 'falha ao criar worktree').trim());
  return { cwd: target, repo, branch, worktree: target };
}

export function startSession(input) {
  const allowedAgents = new Set(['claude', 'codex', 'shell']);
  const agent = String(input.agent || 'shell');
  if (!allowedAgents.has(agent)) throw new Error('agent deve ser claude, codex ou shell');
  const originalCwd = assertInsideWorkspace(input.cwd || workspaceRoot);
  const id = newId(input.name || agent);
  const location = input.worktree ? prepareWorktree(originalCwd, id, input.base || 'HEAD') : { cwd: originalCwd };
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
  const command = agent === 'shell'
    ? 'exec bash -l'
    : `exec ${agent}${prompt ? ` ${shellQuote(prompt)}` : ''}`;
  const result = tmux(['new-session', '-d', '-s', id, '-c', location.cwd, command]);
  if (result.status !== 0) throw new Error((result.stderr || 'não foi possível iniciar tmux').trim());

  const session = {
    id,
    name: String(input.name || agent).slice(0, 80),
    agent,
    cwd: location.cwd,
    originalCwd,
    createdAt: new Date().toISOString(),
    prompt: prompt.slice(0, 500),
    branch: location.branch || null,
    repo: location.repo || null,
    worktree: location.worktree || null
  };
  const sessions = readSessions();
  sessions.unshift(session);
  writeSessions(sessions.slice(0, 500));
  return { ...session, running: true };
}

export function sendInput(id, input, enter = true) {
  if (!isRunning(id)) throw new Error('sessão não está ativa');
  const pane = `${id}:0.0`;
  const value = String(input ?? '');
  const load = tmux(['load-buffer', '-b', 'orchestrator-input', '-'], { input: value });
  if (load.status !== 0) throw new Error((load.stderr || 'falha ao carregar entrada').trim());
  const paste = tmux(['paste-buffer', '-b', 'orchestrator-input', '-t', pane, '-d']);
  if (paste.status !== 0) throw new Error((paste.stderr || 'falha ao enviar entrada').trim());
  if (enter) tmux(['send-keys', '-t', pane, 'Enter']);
}

export function captureOutput(id, lines = 200) {
  const safeLines = Math.max(20, Math.min(Number(lines) || 200, 5000));
  const result = tmux(['capture-pane', '-p', '-J', '-S', `-${safeLines}`, '-t', `${id}:0.0`]);
  if (result.status !== 0) throw new Error((result.stderr || 'sessão não encontrada').trim());
  return result.stdout.replace(/[\u001b\u009b][[\]()#;?]*(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d\/#&.:=?%@~_]+)*)?\u0007|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g, '');
}

export function stopSession(id) {
  if (!isRunning(id)) return false;
  tmux(['send-keys', '-t', `${id}:0.0`, 'C-c']);
  const result = tmux(['kill-session', '-t', `=${id}`]);
  if (result.status !== 0) throw new Error((result.stderr || 'falha ao parar sessão').trim());
  return true;
}
