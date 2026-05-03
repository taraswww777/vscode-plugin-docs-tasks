import * as vscode from 'vscode';
import { isValidStatus } from './validateFrontmatter';
import { patchStatus } from './frontmatterFile';
import { todayYYYYMMDDLocal } from './dateToday';
import { openMetadataEditor } from './metadataPanel';
import type { TaskIndex } from './taskIndex';

export function wireKanbanWebview(options: {
  webview: vscode.Webview;
  index: TaskIndex;
  bucket: vscode.Disposable[];
}): void {
  const { webview, index, bucket } = options;

  const pushTasks = () => {
    void webview.postMessage({ type: 'tasks', tasks: index.getSnapshot() });
  };

  bucket.push(index.onDidChange(pushTasks));

  bucket.push(
    webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type === 'ready') {
        pushTasks();
        return;
      }
      if (msg?.type === 'openFile') {
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(String(msg.uri)));
        await vscode.window.showTextDocument(doc, { preview: true });
        return;
      }
      if (msg?.type === 'editMeta') {
        openMetadataEditor(vscode.Uri.parse(String(msg.uri)), async () => {
          await index.refreshImmediate();
          pushTasks();
        });
        return;
      }
      if (msg?.type === 'drop') {
        const uriStr = String(msg.uri || '');
        const status = String(msg.status || '');
        if (!uriStr || !isValidStatus(status)) {
          void vscode.window.showWarningMessage('Docs Tasks: неверный статус для переноса.');
          return;
        }
        try {
          await patchStatus(vscode.Uri.parse(uriStr), status, todayYYYYMMDDLocal());
          await index.refreshImmediate();
          pushTasks();
        } catch (e) {
          const m = e instanceof Error ? e.message : String(e);
          void vscode.window.showErrorMessage(`Docs Tasks: не удалось обновить статус — ${m}`);
        }
      }
    }),
  );

  queueMicrotask(pushTasks);
}
