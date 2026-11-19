import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const fixture = mkdtempSync(path.join(tmpdir(), 'dsh-orchestrator-test-'));
const workspace = path.join(fixture, 'workspace');
const outside = path.join(fixture, 'outside');
mkdirSync(workspace);
mkdirSync(outside);
symlinkSync(outside, path.join(workspace, 'escape'));
process.env.WORKSPACE_ROOT = workspace;
process.env.ORCHESTRATOR_STATE_DIR = path.join(fixture, 'state');

const { assertInsideWorkspace, cleanName, newId, shellQuote } = await import('../src/lib.mjs');

test('normaliza nomes de sessão', () => {
  assert.equal(cleanName('Correção da API!'), 'correcao-da-api');
  assert.match(newId('Minha tarefa'), /^minha-tarefa-[a-z0-9]+-[a-f0-9]{6}$/);
});

test('aceita diretório real dentro do workspace', () => {
  const project = path.join(workspace, 'project');
  mkdirSync(project);
  assert.equal(assertInsideWorkspace(project), project);
});

test('bloqueia escape por link simbólico', () => {
  assert.throws(() => assertInsideWorkspace(path.join(workspace, 'escape')), /dentro de \/workspace/);
});

test('escapa argumento para shell POSIX', () => {
  assert.equal(shellQuote("a'b"), "'a'\\''b'");
});
