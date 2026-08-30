# Справочники и спецификации

Внешние материалы, на которые опирается расширение. При добавлении команд, иконок, webview и пунктов меню имеет смысл сверяться с ними.

## Иконки (Codicons)

Каталог всех иконок VS Code: [codicon](https://microsoft.github.io/vscode-codicons/dist/codicon.html).

В манифесте и UI иконка задаётся как `$(имя-codicon)`:

| Место | Пример в проекте |
|-------|------------------|
| `package.json` → `contributes.commands[].icon` | `$(archive)`, `$(list-flat)`, `$(refresh)` |
| Строка статуса (`extension.ts`) | `$(symbol-class) Docs Tasks` |

Имя берётся из каталога **без** префикса `codicon-` (в HTML/CSS он есть, в `$(…)` — нет).

## API и манифест расширения

| Тема | Документация | Зачем в Docs Tasks |
|------|--------------|-------------------|
| Обзор API | [Extension API](https://code.visualstudio.com/api) | Точка входа |
| `package.json` | [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest) | `engines`, `activationEvents`, `main` |
| Contribution points | [Contribution Points](https://code.visualstudio.com/api/references/contribution-points) | `commands`, `menus`, `configuration` |
| TypeScript API | [VS Code API Reference](https://code.visualstudio.com/api/references/vscode-api) | `commands`, `window`, `workspace`, `WebviewPanel` |
| Условия в меню | [when clause contexts](https://code.visualstudio.com/api/references/when-clause-contexts) | `scmProvider == git`, `scmResourceGroup` |

## Webview

| Тема | Документация | Зачем в Docs Tasks |
|------|--------------|-------------------|
| Руководство | [Webview API](https://code.visualstudio.com/api/extension-guides/webview) | Таблица, редактор метаданных |
| Обмен сообщениями | [Webview API → messaging](https://code.visualstudio.com/api/extension-guides/webview#scripts-and-message-passing) | `postMessage` / `onDidReceiveMessage` |
| CSP | [Webview API → CSP](https://code.visualstudio.com/api/extension-guides/webview#content-security-policy) | `nonce`, `webview.cspSource` в `*WebviewHtml.ts` |

Подробнее про CSP в контексте проекта — [Архитектура → CSP](./architecture.md#content-security-policy).

## Тема и стили webview

| Тема | Документация | Зачем в Docs Tasks |
|------|--------------|-------------------|
| CSS-переменные темы | [Theme Color](https://code.visualstudio.com/api/references/theme-color) | `--vscode-foreground`, `--vscode-editor-background`, `--vscode-button-background` и т.д. |

Webview наследует тему редактора; хардкод цветов лучше не использовать.

## Git (Commit with Date)

| Тема | Документация | Зачем в Docs Tasks |
|------|--------------|-------------------|
| API встроенного Git | [Git extension API](https://github.com/microsoft/vscode/blob/main/extensions/git/README.md#using-the-git-extension-api) | `vscode.git`, `getAPI(1)`, `repository.commit` |

Команда `docs-tasks.commitWithDate` — см. [Команды](./commands.md#commit-with-date).

## Сборка и публикация

| Тема | Документация | Зачем в Docs Tasks |
|------|--------------|-------------------|
| Публикация | [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) | Ручная загрузка в Marketplace |
| `vsce` | [@vscode/vsce](https://github.com/microsoft/vscode-vsce) | `npm run vsix`, CI |

Процесс в репозитории — [Релизы](./releases.md).

[← Оглавление](./README.md)
