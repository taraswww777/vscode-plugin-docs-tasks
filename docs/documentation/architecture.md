# Архитектура

## Индекс и watch

- **Индекс:** `findFiles` по `**/<tasksFolder>/TASK-*.md`; путь — настройка `docs-tasks.tasksFolder` (по умолчанию `docs/tasks`); разбор `gray-matter` (UTF‑8); битый YAML — строка с ошибкой, индекс не падает.
- **Watch:** `**/<tasksFolder>/**/*.md`, debounce ~350 ms.

## Таблица

Webview во вкладке редактора; повторный вызов поднимает существующую вкладку.

- Колонки: `id`, `title`, `status`, `created`, `updated`, `type`, `tags`, `source.issue`, файл, действия.
- Фильтры (логическое **И**), сортировка по заголовку.
- **Presets** (виды) — вкладки сверху, хранятся в `workspaceState`.

## Редактор метаданных

Открывается из таблицы; запись только frontmatter между `---`, основной текст задачи не меняется.

## Content Security Policy

Webview с ограниченным CSP; сырой markdown в DOM не вставляется. Спеки и ссылки — [Справочники → Webview](./references.md#webview).

## История

Критерии MVP — [TASK-4](../tasks/TASK-4.md).

[← Оглавление](./README.md)
