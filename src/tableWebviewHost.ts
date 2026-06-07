import * as vscode from 'vscode';
import { formatTaskDateTimeDisplay, taskDateTimeSortKey } from './formatTaskDateTime';
import { openMetadataEditor } from './metadataPanel';
import { loadPresets, savePresets } from './presetStorage';
import type { TableViewPreset } from './types';
import type { TaskIndex } from './taskIndex';

export function wireTableWebview(options: {
  webview: vscode.Webview;
  index: TaskIndex;
  workspaceState: vscode.Memento;
  bucket: vscode.Disposable[];
  onPersist?: () => void;
}): void {
  const { webview, index, workspaceState, bucket, onPersist } = options;

  let presets = loadPresets(workspaceState);
  let activeIndex = 0;

  const pushTasks = () => {
    const tasks = index.getSnapshot().map((t) => ({
      ...t,
      created: formatTaskDateTimeDisplay(t.created),
      updated: formatTaskDateTimeDisplay(t.updated),
      _createdSort: taskDateTimeSortKey(t.created),
      _updatedSort: taskDateTimeSortKey(t.updated),
    }));
    void webview.postMessage({ type: 'tasks', tasks });
  };

  const pushPresets = () => {
    void webview.postMessage({ type: 'presets', presets, activeIndex });
  };

  bucket.push(index.onDidChange(pushTasks));

  bucket.push(
    webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type === 'ready') {
        pushTasks();
        pushPresets();
        return;
      }
      if (msg?.type === 'persistPresets') {
        presets = msg.presets as TableViewPreset[];
        activeIndex =
          typeof msg.activeIndex === 'number' &&
          msg.activeIndex >= 0 &&
          msg.activeIndex < presets.length
            ? msg.activeIndex
            : 0;
        await savePresets(workspaceState, presets);
        onPersist?.();
        return;
      }
      if (msg?.type === 'openFile') {
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(String(msg.uri)));
        await vscode.window.showTextDocument(doc, { preview: true });
        return;
      }
      if (msg?.type === 'editMeta') {
        void openMetadataEditor(vscode.Uri.parse(String(msg.uri)), async () => {
          await index.refreshImmediate();
          pushTasks();
        });
        return;
      }
    }),
  );

  queueMicrotask(pushTasks);
}
