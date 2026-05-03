import * as vscode from 'vscode';
import { getNonce } from './nonce';

export function kanbanWebviewHtml(webview: vscode.Webview): string {
  const nonce = getNonce();
  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
  ].join('; ');
  const statuses = [
    { key: 'backlog', label: 'backlog' },
    { key: 'in-progress', label: 'in-progress' },
    { key: 'done', label: 'done' },
    { key: 'cancelled', label: 'cancelled' },
  ];
  const colsHtml = statuses
    .map(
      (s) => `
    <div class="col" data-status="${s.key}">
      <div class="colHead">${s.label}</div>
      <div class="colBody" data-status="${s.key}"></div>
    </div>`,
    )
    .join('');
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Docs Tasks — канбан</title>
  <style>
    body { margin: 0; padding: 8px; color: var(--vscode-foreground); background: var(--vscode-editor-background); font: 13px/1.35 var(--vscode-font-family); }
    .board { display: flex; gap: 8px; align-items: flex-start; }
    .col { flex: 1; min-width: 160px; border: 1px solid var(--vscode-panel-border); border-radius: 6px; display: flex; flex-direction: column; max-height: calc(100vh - 40px); }
    .colHead { padding: 6px 8px; font-weight: 600; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-sideBarSectionHeader-background); }
    .colBody { padding: 6px; overflow: auto; flex: 1; }
    .card { border: 1px solid var(--vscode-widget-border); border-radius: 4px; padding: 6px; margin-bottom: 6px; cursor: grab; background: var(--vscode-editor-inactiveSelectionBackground); }
    .card:active { cursor: grabbing; }
    .title { font-weight: 600; }
    .meta { font-size: 11px; opacity: 0.85; margin-top: 4px; }
    .row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; padding: 3px 6px; cursor: pointer; }
    .err { border-color: var(--vscode-inputValidation-errorBorder); }
  </style>
</head>
<body>
  <div class="board" id="board">${colsHtml}</div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let tasks = [];

    function $(sel) { return document.querySelector(sel); }

    function bindDnDOnce() {
      document.querySelectorAll('.colBody').forEach((body) => {
        body.addEventListener('dragover', (ev) => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; });
        body.addEventListener('drop', (ev) => {
          ev.preventDefault();
          const uri = ev.dataTransfer.getData('application/docs-task-uri');
          const status = body.getAttribute('data-status');
          if (uri && status) {
            vscode.postMessage({ type: 'drop', uri, status });
          }
        });
      });
    }

    function render() {
      const map = { backlog: [], 'in-progress': [], done: [], cancelled: [] };
      for (const t of tasks) {
        const st = (t.status || 'backlog').toString();
        const bucket = map[st] ? st : 'backlog';
        map[bucket].push(t);
      }
      for (const k of Object.keys(map)) {
        const body = document.querySelector('.colBody[data-status="' + k + '"]');
        if (!body) continue;
        body.innerHTML = '';
        for (const t of map[k]) {
          const el = document.createElement('div');
          el.className = 'card' + (t.parseError ? ' err' : '');
          el.draggable = !t.parseError;
          el.dataset.uri = t.uri;
          el.innerHTML = '<div class="title"></div><div class="meta"></div><div class="row"></div>';
          el.querySelector('.title').textContent = (t.id || '') + ' — ' + (t.title || t.pathLabel || '');
          el.querySelector('.meta').textContent = t.parseError || [t.type, (t.tags || []).join(', ')].filter(Boolean).join(' · ');
          const row = el.querySelector('.row');
          const b1 = document.createElement('button');
          b1.textContent = 'Файл';
          b1.addEventListener('click', (e) => { e.stopPropagation(); vscode.postMessage({ type: 'openFile', uri: t.uri }); });
          const b2 = document.createElement('button');
          b2.textContent = 'Frontmatter';
          b2.addEventListener('click', (e) => { e.stopPropagation(); vscode.postMessage({ type: 'editMeta', uri: t.uri }); });
          row.appendChild(b1);
          row.appendChild(b2);
          el.addEventListener('dragstart', (ev) => {
            ev.dataTransfer.setData('application/docs-task-uri', t.uri);
            ev.dataTransfer.effectAllowed = 'move';
          });
          body.appendChild(el);
        }
      }
    }

    window.addEventListener('message', (ev) => {
      const msg = ev.data;
      if (msg?.type === 'tasks') {
        tasks = msg.tasks || [];
        render();
      }
    });

    bindDnDOnce();
    vscode.postMessage({ type: 'ready' });
  <\/script>
</body>
</html>`;
}
