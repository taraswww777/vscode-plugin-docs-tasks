---
id: TASK-6
title: Конфигурация пути к каталогу TASK-*.md
status: done
created: 2026-05-03
updated: 2026-05-03
type: task
tags: [task, vscode]
---

## Результат

- В `package.json` добавлен параметр **`docs-tasks.tasksFolder`** (`contributes.configuration`): строка по умолчанию `docs/tasks`, `scope: resource` для поддержки нескольких корней рабочей области.
- **`TaskIndex`**: поиск задач выполняется под каждым `WorkspaceFolder` как `**/<настроенный-путь>/TASK-*.md`, исключение `**/node_modules/**` сохранено.
- Файловый watcher пересоздаётся под тот же относительный путь (`**/<путь>/**/*.md`), при изменении настройки — полный перевешив watcher’ов и пересканирование индекса.
- Нормализация значения: приведение слешей, отказ от значений с `..`. Пустые или недопустимые значения сбрасываются на `docs/tasks`.
- **`extension.ts`**: активация вызывает `startWatch()` без `ExtensionContext`; подписки индексатора живут внутри `TaskIndex.dispose()`.
