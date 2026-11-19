const state = { token: localStorage.getItem('orchestrator-token') || '', sessions: [], selected: null, timer: null };
const $ = (selector) => document.querySelector(selector);

if (location.hash.startsWith('#token=')) {
  state.token = decodeURIComponent(location.hash.slice(7));
  localStorage.setItem('orchestrator-token', state.token);
  history.replaceState(null, '', location.pathname);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${state.token}`, ...(options.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
}

function renderSessions() {
  const target = $('#sessionsList');
  if (!state.sessions.length) {
    target.innerHTML = '<p>Nenhuma sessão criada.</p>';
    return;
  }
  target.innerHTML = state.sessions.map((session) => `
    <article class="card ${state.selected === session.id ? 'active' : ''}" data-id="${escapeHtml(session.id)}">
      <div class="top"><strong>${escapeHtml(session.name)}</strong><span class="status ${session.running ? 'running' : ''}">${session.running ? 'ativa' : 'encerrada'}</span></div>
      <p>${escapeHtml(session.agent)} · ${escapeHtml(session.cwd)}</p>
      ${session.branch ? `<p>branch: ${escapeHtml(session.branch)}</p>` : ''}
    </article>`).join('');
  target.querySelectorAll('.card').forEach((card) => card.addEventListener('click', () => selectSession(card.dataset.id)));
}

async function refresh() {
  try {
    state.sessions = (await api('/api/sessions')).sessions;
    renderSessions();
    if (state.selected) await refreshOutput();
  } catch (error) {
    $('#message').textContent = error.message === 'token inválido ou ausente' ? 'Configure o token do arquivo .env.' : error.message;
  }
}

async function selectSession(id) {
  state.selected = id;
  const session = state.sessions.find((item) => item.id === id);
  $('#terminalTitle').textContent = session?.name || id;
  $('#sessionInput').disabled = !session?.running;
  $('#sendButton').disabled = !session?.running;
  $('#stopButton').disabled = !session?.running;
  renderSessions();
  await refreshOutput();
}

async function refreshOutput() {
  if (!state.selected) return;
  try {
    const data = await api(`/api/sessions/${encodeURIComponent(state.selected)}/output?lines=500`);
    const output = $('#output');
    const wasNearBottom = output.scrollHeight - output.scrollTop - output.clientHeight < 80;
    output.textContent = data.output || '(sem saída)';
    if (wasNearBottom) output.scrollTop = output.scrollHeight;
  } catch (error) {
    $('#output').textContent = error.message;
  }
}

$('#tokenButton').addEventListener('click', () => {
  const value = prompt('Token ORCHESTRATOR_TOKEN:', state.token);
  if (value !== null) {
    state.token = value.trim();
    localStorage.setItem('orchestrator-token', state.token);
    refresh();
  }
});

$('#refreshButton').addEventListener('click', refresh);
$('#createForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    const data = await api('/api/sessions', { method:'POST', body:JSON.stringify({
      agent:form.get('agent'), name:form.get('name'), cwd:form.get('cwd'), prompt:form.get('prompt'),
      worktree:form.get('worktree') === 'on', base:form.get('base')
    }) });
    $('#message').textContent = `Sessão ${data.session.id} iniciada.`;
    await refresh();
    await selectSession(data.session.id);
  } catch (error) { $('#message').textContent = error.message; }
});

$('#inputForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = $('#sessionInput');
  if (!state.selected || !input.value) return;
  try {
    await api(`/api/sessions/${encodeURIComponent(state.selected)}/input`, { method:'POST', body:JSON.stringify({ input:input.value }) });
    input.value = '';
    setTimeout(refreshOutput, 300);
  } catch (error) { $('#message').textContent = error.message; }
});

$('#stopButton').addEventListener('click', async () => {
  if (!state.selected || !confirm('Parar esta sessão?')) return;
  try {
    await api(`/api/sessions/${encodeURIComponent(state.selected)}/stop`, { method:'POST', body:'{}' });
    await refresh();
  } catch (error) { $('#message').textContent = error.message; }
});

refresh();
state.timer = setInterval(refresh, 3000);
