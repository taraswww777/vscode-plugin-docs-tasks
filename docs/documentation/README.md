# Документация Docs Tasks

Материалы для разработчиков и сопровождения расширения. Пользователям расширения достаточно [корневого README](../../README.md).

## Совместимость

`extensionKind`: **ui** и **workspace**. Нужна открытая папка проекта (**File → Open Folder**); поддерживаются multi-root workspaces.

## Реализация (обзор)

- **Индекс:** `vscode.workspace.findFiles` по шаблону `**/<tasksFolder>/TASK-*.md` под каждым корнем workspace; базовый путь задаётся настройкой `docs-tasks.tasksFolder` (по умолчанию `docs/tasks`); разбор через `gray-matter` (UTF‑8); при ошибке YAML строка задачи попадает в таблицу с полем ошибки без падения индекса.
- **Watch:** наблюдатель за `**/<tasksFolder>/**/*.md` в каждом корне workspace, пересканирование с debounce ~350 ms.
- **Панели:** таблица и канбан открываются **во вкладке центральной области редактора**; повторный вызов **поднимает существующую** вкладку.
- **Вход:** элемент **«Docs Tasks»** в строке статуса (слева) или кнопка **чеклиста** на панели **Проводника** открывает **Quick Pick** («Таблица» / «Канбан»).
- **Таблица:** колонки `id`, `title`, `status`, `created`, `updated`, `type`, `tags`, `source.issue`, файл, действия (открыть файл / frontmatter); фильтры (логическое **И**): `title` и `id` — подстрочно без регистра; `status` — точное совпадение или «любой»; `type` и `tag` — подстрочно (для тега достаточно совпасть с любым элементом `tags` в frontmatter); сортировка по клику на заголовок; **виды (presets)** — вкладки сверху; хранятся в **`workspaceState`** текущего workspace.
- **Канбан:** колонки `backlog`, `in-progress`, `done`, `cancelled`; перетаскивание обновляет `status` и **`updated`** (`YYYY-MM-DD`).
- **Редактор метаданных** из таблицы/канбана: валидация и запись только frontmatter между `---`, без изменения основного текста задачи.

История и критерии MVP — в [TASK-4](../tasks/TASK-4.md).

## Сборка, отладка, `.vsix`

В корне репозитория:

```bash
npm ci
npm run compile
npm run watch   # параллельно с F5 / Run Extension
```

### Extension Development Host

1. Откройте в VS Code / Cursor папку репозитория `vscode-plugin-docs-tasks`.
2. **Run → Start Debugging** (конфиг **Run Extension** из `.vscode/launch.json`).

### Установка из `.vsix`

```bash
npm run vsix
```

Файл `docs-tasks-*.vsix` появится в корне. Установка: **Extensions → ⋮ → Install from VSIX…**.

### Публикация в Visual Studio Marketplace

Релиз в Marketplace выполняется **вручную**: на странице управления издателем загружается собранный `.vsix` (требуется вход в учётную запись Microsoft / Azure DevOps):

- [Управление расширениями издателя `taraswww777`](https://marketplace.visualstudio.com/manage/publishers/taraswww777)

## Content Security Policy

Webview задаёт ограниченный CSP; сырой markdown в DOM не вставляется.

## Протокол задач и Cursor в этом репозитории

В репозитории лежат примеры задач (`docs/tasks/`) и фрагменты `.cursor/` (правило frontmatter и skill протокола) для единообразного ведения `docs/tasks` вместе с Cursor — это образец процесса, а не функциональность самого расширения после установки из Marketplace.
