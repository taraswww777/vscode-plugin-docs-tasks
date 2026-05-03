---
name: task-management-protocol
description: >-
  Единый протокол задач: docs/tasks + GitHub Issues без манифеста.
  Используй при создании, обновлении и закрытии задач.
---

# Протокол задач

1. Задача хранится в `docs/tasks/TASK-<N>.md` (только номер в имени файла; `title` — во frontmatter).
2. Минимум frontmatter: `id`, `title`, `status`, `created`, `updated`.
3. Дополнительно: `type`, `tags`, `source.issue` (полный URL GitHub Issue).
4. Допустимые статусы: `backlog | in-progress | done | cancelled`.
5. При наличии `source.issue` держи двустороннюю связь: ссылка на issue в задаче и ссылка на задачу в issue.
6. При смене `status` обновляй `updated` и статус issue.
