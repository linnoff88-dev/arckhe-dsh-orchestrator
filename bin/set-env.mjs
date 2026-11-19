#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const [file, key] = process.argv.slice(2);
if (!file || !key || !/^[A-Z][A-Z0-9_]*$/.test(key)) process.exit(2);
const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const value = Buffer.concat(chunks).toString('utf8').replace(/[\r\n]+$/g, '');
const lines = existsSync(file) ? readFileSync(file, 'utf8').split(/\r?\n/) : [];
const next = [];
let replaced = false;
for (const line of lines) {
  if (line.startsWith(`${key}=`)) {
    if (!replaced) next.push(`${key}=${value}`);
    replaced = true;
  } else if (line !== '' || next.length) next.push(line);
}
if (!replaced) next.push(`${key}=${value}`);
writeFileSync(file, `${next.join('\n').replace(/\n+$/,'')}\n`, { mode:0o600 });
