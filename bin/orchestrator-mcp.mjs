#!/usr/bin/env node
import readline from 'node:readline';

const base = process.env.ORCHESTRATOR_URL || 'http://127.0.0.1:3000';
const token = process.env.ORCHESTRATOR_TOKEN || '';

const tools = [
  {
    name:'list_sessions',
    description:'Lista sessões locais de Codex, Claude Code e shell.',
    inputSchema:{ type:'object', properties:{}, additionalProperties:false }
  },
  {
    name:'start_session',
    description:'Inicia uma sessão interativa persistente. Use worktree para trabalhos paralelos em repositórios Git.',
    inputSchema:{ type:'object', required:['agent','cwd'], properties:{
      agent:{ type:'string', enum:['codex','claude','shell'] }, cwd:{ type:'string' }, name:{ type:'string' },
      prompt:{ type:'string' }, worktree:{ type:'boolean' }, base:{ type:'string' }
    }, additionalProperties:false }
  },
  {
    name:'session_output',
    description:'Obtém a saída textual recente de uma sessão.',
    inputSchema:{ type:'object', required:['id'], properties:{ id:{type:'string'}, lines:{type:'integer',minimum:20,maximum:5000} }, additionalProperties:false }
  },
  {
    name:'send_to_session',
    description:'Envia uma instrução a uma sessão interativa e pressiona Enter.',
    inputSchema:{ type:'object', required:['id','input'], properties:{ id:{type:'string'}, input:{type:'string'} }, additionalProperties:false }
  },
  {
    name:'stop_session',
    description:'Interrompe e encerra uma sessão.',
    inputSchema:{ type:'object', required:['id'], properties:{ id:{type:'string'} }, additionalProperties:false }
  }
];

async function api(route, options = {}) {
  const response = await fetch(`${base}${route}`, {
    ...options,
    headers:{ 'content-type':'application/json', authorization:`Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

async function callTool(name, args) {
  if (name === 'list_sessions') return api('/api/sessions');
  if (name === 'start_session') return api('/api/sessions', { method:'POST', body:JSON.stringify(args) });
  if (name === 'session_output') return api(`/api/sessions/${encodeURIComponent(args.id)}/output?lines=${args.lines || 500}`);
  if (name === 'send_to_session') return api(`/api/sessions/${encodeURIComponent(args.id)}/input`, { method:'POST', body:JSON.stringify({input:args.input}) });
  if (name === 'stop_session') return api(`/api/sessions/${encodeURIComponent(args.id)}/stop`, { method:'POST', body:'{}' });
  throw new Error(`ferramenta desconhecida: ${name}`);
}

function respond(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

const input = readline.createInterface({ input:process.stdin, terminal:false });
input.on('line', async (line) => {
  let request;
  try {
    request = JSON.parse(line);
    if (request.method === 'notifications/initialized') return;
    if (request.method === 'initialize') {
      return respond({ jsonrpc:'2.0', id:request.id, result:{
        protocolVersion:request.params?.protocolVersion || '2025-06-18',
        capabilities:{ tools:{ listChanged:false } },
        serverInfo:{ name:'dsh-orchestrator', version:'0.1.0' }
      }});
    }
    if (request.method === 'ping') return respond({ jsonrpc:'2.0', id:request.id, result:{} });
    if (request.method === 'tools/list') return respond({ jsonrpc:'2.0', id:request.id, result:{tools} });
    if (request.method === 'tools/call') {
      try {
        const result = await callTool(request.params.name, request.params.arguments || {});
        return respond({ jsonrpc:'2.0', id:request.id, result:{ content:[{type:'text',text:JSON.stringify(result,null,2)}] } });
      } catch (error) {
        return respond({ jsonrpc:'2.0', id:request.id, result:{ isError:true, content:[{type:'text',text:error.message}] } });
      }
    }
    respond({ jsonrpc:'2.0', id:request.id, error:{code:-32601,message:'Método não encontrado'} });
  } catch (error) {
    respond({ jsonrpc:'2.0', id:request?.id ?? null, error:{code:-32700,message:error.message} });
  }
});
