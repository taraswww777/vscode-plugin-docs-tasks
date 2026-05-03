import * as vscode from 'vscode';
import { getNonce } from './nonce';

export function metadataWebviewHtml(webview: vscode.Webview): string {
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
  <title>Docs Tasks — метаданные</title>
  <style>
    body { margin: 0; padding: 12px; color: var(--vscode-foreground); background: var(--vscode-editor-background); font: 13px/1.45 var(--vscode-font-family); }
    label { display: block; margin-top: 8px; font-size: 12px; }
    input, select, textarea { width: 100%; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 3px; padding: 5px 6px; }
    textarea { min-height: 64px; }
    .row { display:flex; gap:8px; margin-top:12px; }
    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; padding: 6px 10px; cursor: pointer; }
    button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .err { white-space: pre-wrap; padding: 8px; border: 1px solid var(--vscode-inputValidation-errorBorder); background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); border-radius: 4px; margin-top:10px;}
    code.path { font-size:11px; opacity:.85; }
  </style>
</head>
<body>
  <div><code class="path" id="pathLabel"></code></div>
  <label>id <input id="id" /></label>
  <label>title <input id="title" /></label>
  <label>status
    <select id="status">
      <option>backlog</option>
      <option>in-progress</option>
      <option>done</option>
      <option>cancelled</option>
    </select>
  </label>
  <label>created (YYYY-MM-DD) <input id="created" /></label>
  <label>updated (YYYY-MM-DD) <input id="updated" /></label>
  <label>type <input id="type" /></label>
  <label>tags (через запятую) <textarea id="tags"></textarea></label>
  <label>source.issue (URL) <input id="issue" /></label>
  <div class="row">
    <button id="save">Сохранить</button>
    <button class="secondary" id="reload">Откатить</button>
  </div>
  <div id="errors" class="err" style="display:none"></div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const $ = (id) => document.getElementById(id);

    function showErrors(text) {
      const el = $('errors');
      if (!text) { el.style.display = 'none'; el.textContent = ''; return; }
      el.style.display = 'block';
      el.textContent = text;
    }

    window.addEventListener('message', (ev) => {
      const msg = ev.data;
      if (msg?.type === 'load') {
        $('pathLabel').textContent = msg.pathLabel || msg.uri || '';
        const d = msg.draft || {};
        $('id').value = d.id || '';
        $('title').value = d.title || '';
        $('status').value = d.status || 'backlog';
        $('created').value = d.created || '';
        $('updated').value = d.updated || '';
        $('type').value = d.type || '';
        $('tags').value = d.tagsText || '';
        $('issue').value = d.sourceIssue || '';
        showErrors('');
      }
      if (msg?.type === 'errors') {
        showErrors((msg.errors || []).join(String.fromCharCode(10)));
      }
    });

    $('save').addEventListener('click', () => {
      const draft = {
        id: $('id').value,
        title: $('title').value,
        status: $('status').value,
        created: $('created').value,
        updated: $('updated').value,
        type: $('type').value,
        tagsText: $('tags').value,
        sourceIssue: $('issue').value,
      };
      vscode.postMessage({ type: 'save', draft });
    });

    $('reload').addEventListener('click', () => {
      vscode.postMessage({ type: 'reload' });
    });

    vscode.postMessage({ type: 'ready' });
  <\/script>
</body>
</html>`;
}
