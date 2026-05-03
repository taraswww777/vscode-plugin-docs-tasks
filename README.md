# Docs Tasks (`docs/tasks`)

Расширение для VS Code и Cursor: индекс `**/docs/tasks/TASK-*.md`, таблица с фильтрами и сохранёнными видами, канбан с drag‑and‑drop и редактор блока YAML frontmatter между `---` без порчи основного текста задачи.

**Репозиторий:** [taraswww777/vscode-plugin-docs-tasks](https://github.com/taraswww777/vscode-plugin-docs-tasks). **Publisher:** `taraswww777`.

## Что реализовано

- Индекс: `vscode.workspace.findFiles('**/docs/tasks/TASK-*.md')`, разбор через `gray-matter` (UTF‑8); при ошибке YAML строка задачи попадает в таблицу с полем ошибки без падения индекса.
- Watch: watcher на каждый root `docs/tasks/**/*.md`, пересканирование с debounce ~350 ms.
- Таблица и канбан открываются **во вкладке центральной области редактора**, повторный вызов **поднимает существующую** вкладку.
- Удобный вход: элемент **«Docs Tasks»** в строке статуса (слева) или кнопка **чеклиста** на панели **Проводника** открывает **Quick Pick** («Таблица» / «Канбан»).
- Таблица:
  - колонки: `id`, `title`, `status`, `created`, `updated`, `type`, `tags`, `source.issue`, файл, действия (открыть файл / frontmatter);
  - фильтры (логическое **И** между полями): `title` и `id` — подстрочно без регистра; `status` — точное совпадение или «любой»; `type` и `tag` — подстрочно (для тега достаточно совпасть с любым элементом `tags` в frontmatter);
  - сортировка по клику на заголовок колонки;
  - сохранённые **виды (presets)** — вкладки сверху; хранятся в **`workspaceState`** текущего workspace.
- Канбан: колонки `backlog`, `in-progress`, `done`, `cancelled`; перетаскивание обновляет `status` и **`updated`** (`YYYY-MM-DD`).
- Редактор метаданных из таблицы/канбана с валидацией и записью только frontmatter.

История и критерии MVP — в [TASK-4](./docs/tasks/TASK-4.md).

## Совместимость

`extensionKind`: **ui + workspace**. Нужна открытая папка проекта (**File → Open Folder**); multi-root поддерживается.

## Сборка, отладка, `.vsix`

В **корне этого репозитория**:

```bash
npm ci
npm run compile
npm run watch   # параллельно с F5 / Run Extension
```

### Extension Development Host

1. Открой в VS Code / Cursor папку репозитория `vscode-plugin-docs-tasks`.
2. **Run → Start Debugging** (конфиг **Run Extension** из `.vscode/launch.json`).

### Установка из `.vsix`

```bash
npm run vsix
```

Файл `docs-tasks-*.vsix` появится в корне. Установка: **Extensions → ⋮ → Install from VSIX…**.

### Content Security Policy

Webview задаёт ограниченный CSP; сырой markdown в DOM не вставляется.

## Команды палитры

- `Docs Tasks: Открыть (таблица или канбан)`
- `Docs Tasks: Таблица (центральная область)` / `Канбан (центральная область)`
- `Docs Tasks: Обновить индекс`

## Протокол задач и Cursor

В репозитории лежат примеры задач (`docs/tasks/`) и фрагменты `.cursor/` (правило frontmatter и skill протокола) для единообразного ведения `docs/tasks` вместе с Cursor.
