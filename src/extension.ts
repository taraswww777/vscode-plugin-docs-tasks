import * as vscode from 'vscode';
import { tableWebviewHtml } from './tableWebviewHtml';
import { wireTableWebview } from './tableWebviewHost';
import { TaskIndex } from './taskIndex';

interface PanelEntry {
  panel: vscode.WebviewPanel;
  bag: vscode.Disposable[];
}

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
  // 1. Инициализация основной логики плагина (таблица задач)
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

  context.subscriptions.push(
    vscode.commands.registerCommand('docs-tasks.commitWithDate', async () => {
    const workDir = vscode.workspace.rootPath;
    if (!workDir) {
      vscode.window.showWarningMessage('Нет открытого workspace.');
      return;
    }

    // 1. Получаем расширение Git
    const gitExtension = vscode.extensions.getExtension<any>('vscode.git')?.exports;
    if (!gitExtension) {
      vscode.window.showErrorMessage('Не найдено встроенное расширение Git. Убедитесь, что оно включено.');
      return;
    }

    // 2. Получаем API нужной версии (1 — стабильная версия)
    let api;
    try {
      api = gitExtension.getAPI(1);
    } catch (e) {
      vscode.window.showErrorMessage('Ошибка получения API Git: ' + (e instanceof Error ? e.message : String(e)));
      return;
    }

    if (!api) {
      vscode.window.showWarningMessage('API Git недоступно (возможно, репозиторий ещё не загружен).');
      return;
    }

    // 3. ВАЖНО: Проверяем, что repositories существует и это массив
    const repos = api.repositories;

    if (!Array.isArray(repos)) {
      vscode.window.showWarningMessage(`Ожидается массив репозиториев, но получено: ${typeof repos}. Попробуйте перезагрузить окно VS Code.`);
      return;
    }

    if (repos.length === 0) {
      vscode.window.showWarningMessage('В текущем workspace не найдено Git-репозиториев.');
      return;
    }

    // 4. Ищем нужный репо по пути
    const repo = repos.find(r => r.rootUri.fsPath === workDir);

    if (!repo) {
      // Если не нашли по корню workspace, можно попробовать взять первый попавшийся (опционально)
      // const repo = repos[0];
      vscode.window.showWarningMessage('Не удалось найти Git-репозиторий, соответствующий папке проекта.');
      return;
    }

    // 5. Формируем сообщение
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0'); // месяц с 0
    const dd = String(now.getDate()).padStart(2, '0');

    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    const defaultMsg = `${yyyy}-${mm}-${dd} ${hh}-${min}-${ss}`;

    const message = await vscode.window.showInputBox({
      placeHolder: 'Сообщение коммита',
      value: defaultMsg,
      prompt: 'Введите сообщение коммита (дата уже добавлена)',
    });

    if (!message) return; // Отмена

    // 6. Делаем коммит
    try {
      await repo.commit(message, { signOff: false });
      vscode.window.showInformationMessage('Коммит выполнен с датой!');
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      vscode.window.showErrorMessage(`Ошибка при коммите: ${err}`);
    }
  }),
  );
}

export function deactivate(): void {
  tablePanelState?.panel.dispose();
}
