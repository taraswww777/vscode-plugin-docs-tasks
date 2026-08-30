# Docs Tasks

Расширение для **Visual Studio Code** и **Cursor**: таблица по файлам задач `TASK-*.md`, сохранённые виды с фильтрами, редактор YAML **frontmatter** между `---` и быстрый Git-коммит с датой в сообщении.

**Издатель:** `taraswww777` · **Marketplace:** [Docs Tasks](https://marketplace.visualstudio.com/items?itemName=taraswww777.docs-tasks) · **Репозиторий:** [taraswww777/vscode-plugin-docs-tasks](https://github.com/taraswww777/vscode-plugin-docs-tasks)

## Установка

1. [GitHub Releases](https://github.com/taraswww777/vscode-plugin-docs-tasks/releases) — скачайте **`docs-tasks-*.vsix`**, затем палитра **Extensions: Install from VSIX…**.
2. Либо [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=taraswww777.docs-tasks) — **Install** (если расширение опубликовано там вручную).

## Что нужно в проекте

- Открытая папка рабочей области (**File → Open Folder**); поддерживаются multi-root workspaces.
- Файлы **`TASK-*.md`** с YAML frontmatter между первыми строками `---` (по умолчанию каталог `docs/tasks/`).
- Минимальные поля: `id`, `title`, `status`, `created`, `updated`. Статусы: `backlog`, `in-progress`, `done`, `cancelled`.

Путь к каталогу задач настраивается (см. ниже).

## Быстрый старт

| Вход | Действие |
|------|----------|
| Строка состояния слева — **«Docs Tasks»** | Открыть таблицу |
| **Проводник** — кнопка со списком на панели заголовка | Открыть таблицу |
| **Source Control** — кнопка с иконкой архива (Changes / Staged) | Коммит с датой |

Таблица открывается **во вкладке центральной области**; повторный вызов поднимает уже открытую вкладку.

## Возможности

- **Таблица:** колонки `id`, `title`, `status`, `created`, `updated`, `type`, `tags`, `source.issue`, файл; фильтры, сортировка, **сохранённые виды** (вкладки сверху).
- **Редактор метаданных:** из таблицы — правка frontmatter с проверкой; основной текст задачи не меняется.
- **Commit with Date:** коммит **уже добавленных в индекс** (staged) изменений; в сообщение подставляется метка времени `YYYY-MM-DD HH-MM-SS` (можно отредактировать перед подтверждением). Нужен Git-репозиторий в корне workspace.

Индекс обновляется при изменении файлов задач; при необходимости — команда **Обновить индекс** из палитры.

## Команды

| Команда | Где вызвать |
| --- | --- |
| **Docs Tasks: Таблица** | Палитра команд |
| **Docs Tasks: Обновить индекс** | Палитра команд |
| **Docs Tasks: Commit with Date** | Палитра, панель **Source Control** |

## Настройки

| Идентификатор | Описание |
| --- | --- |
| **`docs-tasks.tasksFolder`** | Путь к каталогу с `TASK-*.md` относительно каждого корня workspace (по умолчанию `docs/tasks`). |

## Обратная связь

Ошибки и пожелания: [Issues](https://github.com/taraswww777/vscode-plugin-docs-tasks/issues).

---

**Документация для разработчиков:** [docs/documentation/README.md](./docs/documentation/README.md).
