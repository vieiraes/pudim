(function () {
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const THEME_KEY = 'pudim-portal-theme';

  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', function () {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const current = root.getAttribute('data-theme') || (prefersDark ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  const navToggle = document.getElementById('nav-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  function closeNav() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  navToggle.addEventListener('click', function () {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  overlay.addEventListener('click', closeNav);
  sidebar.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  document.querySelectorAll('.tabs').forEach(function (tabs) {
    const buttons = tabs.querySelectorAll('.tab-btn');
    const panelContainer = tabs.parentElement;
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        const target = btn.getAttribute('data-tab');
        panelContainer.querySelectorAll('.tab-panel').forEach(function (panel) {
          panel.classList.toggle('active', panel.getAttribute('data-panel') === target);
        });
      });
    });
  });

  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const text = btn.getAttribute('data-copy');
      navigator.clipboard.writeText(text).then(function () {
        const original = btn.textContent;
        btn.textContent = 'Copiado!';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 1500);
      });
    });
  });

  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.sidebar nav a');

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px' });

    sections.forEach(function (section) { observer.observe(section); });
  }
})();

(function () {
  const container = document.getElementById('scripts-container');
  const template = document.getElementById('script-card-template');
  if (!container || !template) return;

  const cards = new Map();

  const ANSI_COLORS = {
    30: '#6e7681', 31: '#ff7b72', 32: '#3fb950', 33: '#d29922',
    34: '#58a6ff', 35: '#bc8cff', 36: '#39c5cf', 37: '#b1bac4',
    90: '#6e7681', 91: '#ffa198', 92: '#56d364', 93: '#e3b341',
    94: '#79c0ff', 95: '#d2a8ff', 96: '#56d4dd', 97: '#f0f6fc',
  };

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function ansiToHtml(raw) {
    const text = escapeHtml(raw);
    const parts = text.split(/\x1b\[([0-9;]*)m/);
    let html = '';
    let open = false;
    let bold = false;
    let color = null;
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        html += parts[i];
        continue;
      }
      const codes = parts[i].split(';').filter(Boolean).map(Number);
      if (codes.length === 0) codes.push(0);
      codes.forEach(function (code) {
        if (code === 0) { bold = false; color = null; } else if (code === 1) { bold = true; } else if (ANSI_COLORS[code]) { color = ANSI_COLORS[code]; }
      });
      if (open) { html += '</span>'; open = false; }
      if (bold || color) {
        const style = [];
        if (color) style.push('color:' + color);
        if (bold) style.push('font-weight:600');
        html += '<span style="' + style.join(';') + '">';
        open = true;
      }
    }
    if (open) html += '</span>';
    return html;
  }

  function setStatus(card, state, label) {
    const labels = { ocioso: 'ocioso', rodando: 'rodando', concluido: 'concluído', falhou: 'falhou' };
    card.statusEl.textContent = label || labels[state] || state;
    card.statusEl.className = 'script-status' + (state === 'rodando' ? ' running' : state === 'falhou' ? ' failed' : state === 'concluido' ? ' done' : '');
  }

  function setRunningUi(card, isRunning) {
    card.runBtn.disabled = isRunning;
    card.stopBtn.disabled = !isRunning;
    if (isRunning) setStatus(card, 'rodando');
  }

  function appendLog(card, text) {
    const el = card.terminalEl;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 12;
    el.innerHTML += ansiToHtml(text);
    if (atBottom) el.scrollTop = el.scrollHeight;
  }

  function runScript(name) {
    const card = cards.get(name);
    card.terminalEl.innerHTML = '';
    fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name }),
    }).then(function (r) {
      return r.json().then(function (data) { return { ok: r.ok, data: data }; });
    }).then(function (result) {
      if (!result.ok) {
        setStatus(card, 'falhou', result.data.error);
        return;
      }
      setRunningUi(card, true);
    });
  }

  function stopScript(name) {
    fetch('/api/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name }),
    });
  }

  function renderCard(script) {
    const fragment = template.content.cloneNode(true);
    const el = fragment.querySelector('.script-card');
    el.dataset.name = script.name;
    fragment.querySelector('.script-title').textContent = script.name + ' — ' + script.command;
    fragment.querySelector('.script-description').textContent = script.description;

    const warningEl = fragment.querySelector('.script-warning');
    if (script.name === 'hooks') {
      warningEl.textContent = 'Isso grava/atualiza .git/hooks/pre-commit no seu repositório local.';
      warningEl.hidden = false;
    }

    const runBtn = fragment.querySelector('.run-btn');
    const stopBtn = fragment.querySelector('.stop-btn');
    const statusEl = fragment.querySelector('.script-status');
    const terminalEl = fragment.querySelector('.terminal');

    const card = { runBtn: runBtn, stopBtn: stopBtn, statusEl: statusEl, terminalEl: terminalEl };
    cards.set(script.name, card);

    runBtn.addEventListener('click', function () { runScript(script.name); });
    stopBtn.addEventListener('click', function () { stopScript(script.name); });

    setRunningUi(card, script.running);
    container.appendChild(fragment);
  }

  function handleEvent(entry) {
    const card = cards.get(entry.name);
    if (!card) return;
    if (entry.event === 'start') {
      setRunningUi(card, true);
    } else if (entry.event === 'log') {
      appendLog(card, entry.text);
    } else if (entry.event === 'done') {
      setRunningUi(card, false);
      setStatus(card, entry.exitCode === 0 ? 'concluido' : 'falhou', entry.exitCode === 0 ? 'concluído' : 'falhou (código ' + entry.exitCode + ')');
    } else if (entry.event === 'error') {
      setRunningUi(card, false);
      setStatus(card, 'falhou', 'erro: ' + entry.text);
    }
  }

  function connectStream() {
    const source = new EventSource('/api/logs');
    source.onmessage = function (ev) {
      let entry;
      try {
        entry = JSON.parse(ev.data);
      } catch (_) {
        return;
      }
      handleEvent(entry);
    };
  }

  fetch('/api/scripts').then(function (r) { return r.json(); }).then(function (data) {
    data.scripts.forEach(renderCard);
    connectStream();
  });
})();
