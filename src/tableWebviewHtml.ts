import * as vscode from 'vscode';
import { getNonce } from './nonce';

export function tableWebviewHtml(webview: vscode.Webview): string {
  const nonce = getNonce();
  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
  ].join('; ');
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Docs Tasks — таблица</title>
  <style>
    body { margin: 0; padding: 8px; color: var(--vscode-foreground); background: var(--vscode-editor-background); font: 13px/1.35 var(--vscode-font-family); }
    .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px; }
    .tabs { display: flex; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 6px; margin-bottom: 8px; }
    .tab { padding: 4px 8px; cursor: pointer; border-radius: 4px; user-select: none; }
    .tab.active { background: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }
    .tab:hover { background: var(--vscode-list-hoverBackground); }
    input, select, button { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 3px; padding: 3px 6px; }
    button.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border-color: transparent; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid var(--vscode-panel-border); padding: 4px 6px; text-align: left; vertical-align: top; }
    th { cursor: pointer; white-space: nowrap; }
    tr.err { background: color-mix(in srgb, var(--vscode-inputValidation-errorBackground) 60%, transparent); }
    .mono { font-family: var(--vscode-editor-font-family); font-size: 11px; }
    .small { font-size: 11px; opacity: 0.85; }
    .cols label { margin-right: 8px; display: inline-flex; gap: 4px; align-items: center; }
  </style>
</head>
<body>
  <div class="tabs" id="tabs"></div>
  <div class="row">
    <button class="primary" id="addPreset">+ Вид</button>
    <button id="dupPreset">Дублировать вид</button>
    <input id="renamePreset" placeholder="Имя вида" style="min-width:160px" />
    <button id="applyRename">Переименовать</button>
  </div>
  <div class="row small">Фильтры (логическое И между полями):</div>
  <div class="row">
    <label>title <input id="fTitle" placeholder="подстрока" style="min-width:180px" /></label>
    <label>id <input id="fId" placeholder="подстрока" style="min-width:120px" /></label>
    <label>status
      <select id="fStatus">
        <option value="">(любой)</option>
        <option>backlog</option>
        <option>in-progress</option>
        <option>done</option>
        <option>cancelled</option>
      </select>
    </label>
    <label>type <input id="fType" placeholder="подстрока" style="min-width:120px" /></label>
    <label>tag <input id="fTag" placeholder="подстрока" style="min-width:120px" /></label>
  </div>
  <div class="row cols small" id="colToggles"></div>
  <div style="overflow:auto; max-height: calc(100vh - 220px);">
    <table id="grid">
      <thead><tr id="thead"></tr></thead>
      <tbody id="tbody"></tbody>
    </table>
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let tasks = [];
    let presets = [];
    let active = 0;

    const $ = (id) => document.getElementById(id);

    function activePreset() {
      return presets[active] || presets[0];
    }

    function persist() {
      vscode.postMessage({ type: 'persistPresets', presets, activeIndex: active });
    }

    function debounce(fn, ms) {
      let t;
      return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    }

    const schedulePersist = debounce(persist, 400);

    function renderTabs() {
      const host = $('tabs');
      host.innerHTML = '';
      presets.forEach((p, i) => {
        const el = document.createElement('div');
        el.className = 'tab' + (i === active ? ' active' : '');
        el.textContent = p.name || ('Вид ' + (i + 1));
        el.title = p.id;
        el.addEventListener('click', () => {
          active = i;
          syncFiltersFromPreset();
          renderTabs();
          renderCols();
          renderHead();
          renderBody();
        });
        host.appendChild(el);
      });
    }

    function syncFiltersFromPreset() {
      const p = activePreset();
      if (!p) return;
      $('fTitle').value = p.filters.titleSubstring || '';
      $('fId').value = p.filters.idSubstring || '';
      $('fStatus').value = p.filters.status || '';
      $('fType').value = p.filters.type || '';
      $('fTag').value = p.filters.tag || '';
      $('renamePreset').value = p.name || '';
    }

    function syncPresetFromFilters() {
      const p = activePreset();
      if (!p) return;
      p.filters.titleSubstring = $('fTitle').value.trim();
      p.filters.idSubstring = $('fId').value.trim();
      p.filters.status = $('fStatus').value;
      p.filters.type = $('fType').value.trim();
      p.filters.tag = $('fTag').value.trim();
      schedulePersist();
    }

    const COLS = [
      { key: 'id', label: 'id' },
      { key: 'title', label: 'title' },
      { key: 'status', label: 'status' },
      { key: 'created', label: 'created' },
      { key: 'updated', label: 'updated' },
      { key: 'type', label: 'type' },
      { key: 'tags', label: 'tags' },
      { key: 'sourceIssue', label: 'source.issue' },
      { key: '_path', label: 'file' },
      { key: '_actions', label: '' },
    ];

    function visibleKeys() {
      const p = activePreset();
      const set = new Set(p?.visibleColumns || []);
      return COLS.filter((c) => c.key === '_path' || c.key === '_actions' || set.has(c.key));
    }

    function renderCols() {
      const host = $('colToggles');
      host.innerHTML = '';
      const p = activePreset();
      if (!p) return;
      COLS.filter((c) => !c.key.startsWith('_')).forEach((c) => {
        const lab = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = p.visibleColumns.includes(c.key);
        cb.addEventListener('change', () => {
          if (cb.checked) {
            if (!p.visibleColumns.includes(c.key)) p.visibleColumns.push(c.key);
          } else {
            p.visibleColumns = p.visibleColumns.filter((k) => k !== c.key);
          }
          schedulePersist();
          renderHead();
          renderBody();
        });
        lab.appendChild(cb);
        lab.appendChild(document.createTextNode(' ' + c.label));
        host.appendChild(lab);
      });
    }

    function renderHead() {
      const tr = $('thead');
      tr.innerHTML = '';
      const p = activePreset();
      visibleKeys().forEach((c) => {
        const th = document.createElement('th');
        if (c.key === '_actions') {
          th.textContent = '';
        } else if (c.key === '_path') {
          th.textContent = 'file';
        } else {
          th.textContent = c.label + (p && p.sort.column === c.key ? (p.sort.dir === 'asc' ? ' ▲' : ' ▼') : '');
          th.addEventListener('click', () => {
            if (!p) return;
            if (p.sort.column === c.key) {
              p.sort.dir = p.sort.dir === 'asc' ? 'desc' : 'asc';
            } else {
              p.sort.column = c.key;
              p.sort.dir = 'asc';
            }
            schedulePersist();
            renderHead();
            renderBody();
          });
        }
        tr.appendChild(th);
      });
    }

    function norm(s) { return (s || '').toString().toLowerCase(); }

    function rowMatches(t, f) {
      if (f.titleSubstring && !norm(t.title).includes(norm(f.titleSubstring))) return false;
      if (f.idSubstring && !norm(t.id).includes(norm(f.idSubstring))) return false;
      if (f.status && String(t.status || '') !== f.status) return false;
      if (f.type && !norm(t.type).includes(norm(f.type))) return false;
      if (f.tag) {
        const want = norm(f.tag);
        const ok = (t.tags || []).some((x) => norm(x).includes(want) || norm(x) === want);
        if (!ok) return false;
      }
      return true;
    }

    function cmp(a, b, col, dir) {
      const va = col === 'tags' ? (a.tags || []).join(',') : a[col];
      const vb = col === 'tags' ? (b.tags || []).join(',') : b[col];
      const sa = va == null ? '' : String(va);
      const sb = vb == null ? '' : String(vb);
      if (sa < sb) return dir === 'asc' ? -1 : 1;
      if (sa > sb) return dir === 'asc' ? 1 : -1;
      return 0;
    }

    function renderBody() {
      const p = activePreset();
      const tbody = $('tbody');
      tbody.innerHTML = '';
      if (!p) return;
      const f = p.filters;
      const list = tasks.filter((t) => rowMatches(t, f));
      list.sort((a, b) => {
        const col = p.sort.column;
        if (col === '_path' || col === '_actions' || col === 'sourceIssue') {
          // fallback
        }
        return cmp(a, b, col, p.sort.dir);
      });
      for (const t of list) {
        const tr = document.createElement('tr');
        if (t.parseError) tr.className = 'err';
        for (const c of visibleKeys()) {
          const td = document.createElement('td');
          if (c.key === '_actions') {
            const b1 = document.createElement('button');
            b1.textContent = 'Файл';
            b1.addEventListener('click', (e) => { e.stopPropagation(); vscode.postMessage({ type: 'openFile', uri: t.uri }); });
            const b2 = document.createElement('button');
            b2.textContent = 'Frontmatter';
            b2.addEventListener('click', (e) => { e.stopPropagation(); vscode.postMessage({ type: 'editMeta', uri: t.uri }); });
            td.appendChild(b1);
            td.appendChild(document.createTextNode(' '));
            td.appendChild(b2);
          } else if (c.key === '_path') {
            td.className = 'mono small';
            td.textContent = t.pathLabel || '';
          } else if (c.key === 'tags') {
            td.textContent = (t.tags || []).join(', ');
          } else if (c.key === 'title') {
            td.textContent = t.parseError ? ('⚠ ' + (t.title || '')) : (t.title || '');
          } else {
            td.textContent = t[c.key] == null ? '' : String(t[c.key]);
            if (t.parseError && c.key === 'status') {
              td.textContent = (td.textContent ? td.textContent + ' — ' : '') + t.parseError;
            }
          }
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
    }

    function wireFilters() {
      ['fTitle','fId','fStatus','fType','fTag'].forEach((id) => {
        $(id).addEventListener('input', () => { syncPresetFromFilters(); renderBody(); });
        $(id).addEventListener('change', () => { syncPresetFromFilters(); renderBody(); });
      });
    }

    $('addPreset').addEventListener('click', () => {
      const base = activePreset();
      const copy = JSON.parse(JSON.stringify(base || {}));
      copy.id = 'preset_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
      copy.name = 'Новый вид';
      presets.push(copy);
      active = presets.length - 1;
      syncFiltersFromPreset();
      renderTabs();
      renderCols();
      renderHead();
      renderBody();
      persist();
    });

    $('dupPreset').addEventListener('click', () => {
      const base = activePreset();
      if (!base) return;
      const copy = JSON.parse(JSON.stringify(base));
      copy.id = 'preset_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
      copy.name = (base.name || 'Вид') + ' (копия)';
      presets.push(copy);
      active = presets.length - 1;
      syncFiltersFromPreset();
      renderTabs();
      renderCols();
      renderHead();
      renderBody();
      persist();
    });

    $('applyRename').addEventListener('click', () => {
      const p = activePreset();
      if (!p) return;
      const v = $('renamePreset').value.trim();
      if (v) p.name = v;
      renderTabs();
      persist();
    });

    window.addEventListener('message', (ev) => {
      const msg = ev.data;
      if (msg?.type === 'tasks') {
        tasks = msg.tasks || [];
        renderBody();
      }
      if (msg?.type === 'presets') {
        presets = msg.presets || [];
        active = typeof msg.activeIndex === 'number' ? msg.activeIndex : 0;
        renderTabs();
        syncFiltersFromPreset();
        renderCols();
        renderHead();
        renderBody();
      }
    });

    wireFilters();
    vscode.postMessage({ type: 'ready' });
  <\/script>
</body>
</html>`;
}
