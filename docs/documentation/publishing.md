# Публикация в Marketplace

Страница расширения: [Docs Tasks](https://marketplace.visualstudio.com/items?itemName=taraswww777.docs-tasks).

## CI

При push в **`master`** — workflow [`.github/workflows/publish-marketplace.yml`](../../.github/workflows/publish-marketplace.yml). Ручной запуск: **Actions → Publish to VS Code Marketplace → Run workflow**.

Последовательность:

1. **minor**-версия (`0.x.0` → `0.(x+1).0`) в `package.json`.
2. `vsce publish`.
3. Push `package.json` / `package-lock.json` с `[skip ci]` и тег `v0.x.0`.

## Настройка (один раз)

1. [Azure DevOps](https://dev.azure.com/) → **Personal access tokens** → **Marketplace → Manage**.
2. GitHub → **Settings → Secrets and variables → Actions** → секрет **`VSCE_PAT`** (значение — PAT).
3. GitHub → **Settings → Actions → General → Workflow permissions** → **Read and write permissions**.

## Ручная загрузка

[Управление расширениями издателя `taraswww777`](https://marketplace.visualstudio.com/manage/publishers/taraswww777).

[← Сборка и отладка](./build.md) · [Оглавление](./README.md)
