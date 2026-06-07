import * as vscode from 'vscode';
import { tableWebviewHtml } from './tableWebviewHtml';
import { wireTableWebview } from './tableWebviewHost';
import { TaskIndex } from './taskIndex';

interface PanelEntry {
  panel: vscode.WebviewPanel;
  bag: vscode.Disposable[];
}

/** Центральная рабочая область (аналог вкладки Git Graph). */
function editorColumn(): vscode.ViewColumn {
  return vscode.ViewColumn.One;
}

let tablePanelState: PanelEntry | undefined;

function openTableInEditorArea(context: vscode.ExtensionContext, index: TaskIndex): void {
  if (tablePanelState) {
    void tablePanelState.panel.reveal(editorColumn(), false);
    return;
  }
  const panel = vscode.window.createWebviewPanel(
    'docsTasksTablePanel',
    'Docs Tasks — таблица',
    editorColumn(),
    { enableScripts: true, retainContextWhenHidden: true },
  );
  panel.webview.html = tableWebviewHtml(panel.webview);
  const bag: vscode.Disposable[] = [];
  panel.onDidDispose(() => {
    vscode.Disposable.from(...bag).dispose();
    tablePanelState = undefined;
  });
  wireTableWebview({
    webview: panel.webview,
    index,
    workspaceState: context.workspaceState,
    bucket: bag,
  });
  tablePanelState = { panel, bag };
}

function registerTasksStatusBar(context: vscode.ExtensionContext): void {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
  item.command = 'docs-tasks.openTablePanel';
  item.text = '$(symbol-class) Docs Tasks';
  item.tooltip = 'Таблица задач';
  item.show();
  context.subscriptions.push(item);
}

export function activate(context: vscode.ExtensionContext): void {
  const index = new TaskIndex();
  index.startWatch();
  context.subscriptions.push(index);

  registerTasksStatusBar(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('docs-tasks.openTablePanel', () => openTableInEditorArea(context, index)),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('docs-tasks.refreshIndex', async () => {
      await index.refreshImmediate();
      void vscode.window.setStatusBarMessage('Docs Tasks: индекс обновлён', 2000);
    }),
  );
}

export function deactivate(): void {
  tablePanelState?.panel.dispose();
}
