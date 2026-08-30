# Сборка и отладка

## Зависимости и компиляция

```bash
npm ci
npm run compile
npm run watch          # параллельно с F5 / Run Extension
```

## Extension Development Host

1. Откройте папку репозитория в VS Code / Cursor.
2. **Run → Start Debugging** (конфиг **Run Extension** из `.vscode/launch.json`).

## Сборка `.vsix`

```bash
npm run vsix           # recompile + vsce package → docs-tasks-<version>.vsix
```

Установка: **Extensions → ⋮ → Install from VSIX…**.

## Версия в `package.json`

Перед локальной сборкой:

```bash
npm run version:patch   # 0.1.0 → 0.1.1
npm run version:minor   # 0.1.0 → 0.2.0
npm run version:major   # 0.1.0 → 1.0.0
```

Скрипты используют `--no-git-tag-version` — без автокоммита и тега npm.

[← Оглавление](./README.md) · [Релизы →](./releases.md)
