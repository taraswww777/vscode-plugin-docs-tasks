# Релизы (GitHub Releases)

Страница релизов: [github.com/taraswww777/vscode-plugin-docs-tasks/releases](https://github.com/taraswww777/vscode-plugin-docs-tasks/releases).

## CI

При push в **`master`** — workflow [`.github/workflows/release.yml`](../../.github/workflows/release.yml). Ручной запуск: **Actions → Release → Run workflow**.

Последовательность:

1. **patch**-версия в `package.json` (`0.1.0` → `0.1.1`).
2. Сборка и `vsce package` → `docs-tasks-<version>.vsix`.
3. Push `package.json` / `package-lock.json` с меткой **`[skip ci]`** (повторный прогон не стартует).
4. GitHub Release `v<version>` с прикреплённым `.vsix` и автогенерируемыми release notes.

## Настройка (один раз)

GitHub → **Settings → Actions → General → Workflow permissions** → **Read and write permissions** (нужно для push коммита с версией и создания Release).

Секреты не требуются — используется встроенный `GITHUB_TOKEN`.

## Marketplace (вручную, без CI)

Автопубликация в Marketplace отключена. При необходимости загрузите `.vsix` вручную:

- [Управление расширениями издателя `taraswww777`](https://marketplace.visualstudio.com/manage/publishers/taraswww777)
- Страница расширения: [Docs Tasks](https://marketplace.visualstudio.com/items?itemName=taraswww777.docs-tasks)

[← Сборка и отладка](./build.md) · [Оглавление](./README.md)
