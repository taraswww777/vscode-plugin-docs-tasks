import * as vscode from 'vscode';
import { kanbanWebviewHtml } from './kanbanWebviewHtml';
import { wireKanbanWebview } from './kanbanWebviewHost';
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
let kanbanPanelState: PanelEntry | undefined;

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

function openKanbanInEditorArea(context: vscode.ExtensionContext, index: TaskIndex): void {
  if (kanbanPanelState) {
    void kanbanPanelState.panel.reveal(editorColumn(), false);
    return;
  }
  const panel = vscode.window.createWebviewPanel(
    'docsTasksKanbanPanel',
    'Docs Tasks — канбан',
    editorColumn(),
    { enableScripts: true, retainContextWhenHidden: true },
  );
  panel.webview.html = kanbanWebviewHtml(panel.webview);
  const bag: vscode.Disposable[] = [];
  panel.onDidDispose(() => {
    vscode.Disposable.from(...bag).dispose();
    kanbanPanelState = undefined;
  });
  wireKanbanWebview({ webview: panel.webview, index, bucket: bag });
  kanbanPanelState = { panel, bag };
}

async function openTasksMenu(context: vscode.ExtensionContext, index: TaskIndex): Promise<void> {
  const choice = await vscode.window.showQuickPick(
    [
      {
        label: '$(list-flat) Таблица',
        description: 'Список задач с фильтрами и пресетами',
        action: 'table' as const,
      },
      {
        label: '$(gallery) Канбан',
        description: 'Статусы и перетаскивание карточек',
        action: 'kanban' as const,
      },
    ],
    {
      title: 'Docs Tasks',
      placeHolder: 'Открыть в центральной области редактора',
    },
  );
  if (!choice) return;
  if (choice.action === 'table') openTableInEditorArea(context, index);
  else openKanbanInEditorArea(context, index);
}

function registerTasksStatusBar(context: vscode.ExtensionContext): void {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
  item.command = 'docs-tasks.openTasksMenu';
  item.text = '$(symbol-class) Docs Tasks';
  item.tooltip = 'Таблица или канбан в центральной области (как Git Graph)';
  item.show();
  context.subscriptions.push(item);
}

export function activate(context: vscode.ExtensionContext): void {
  const index = new TaskIndex();
  index.startWatch(context);
  context.subscriptions.push(index);

  registerTasksStatusBar(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('docs-tasks.openTasksMenu', () => openTasksMenu(context, index)),
  );

  context.subscriptions.push(vscode.commands.registerCommand('docs-tasks.openTablePanel', () => openTableInEditorArea(context, index)));
  context.subscriptions.push(vscode.commands.registerCommand('docs-tasks.openKanbanPanel', () => openKanbanInEditorArea(context, index)));

  context.subscriptions.push(
    vscode.commands.registerCommand('docs-tasks.refreshIndex', async () => {
      await index.refreshImmediate();
      void vscode.window.setStatusBarMessage('Docs Tasks: индекс обновлён', 2000);
    }),
  );
}

export function deactivate(): void {
  tablePanelState?.panel.dispose();
  kanbanPanelState?.panel.dispose();
}
