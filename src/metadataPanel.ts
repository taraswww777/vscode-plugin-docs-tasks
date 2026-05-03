import * as vscode from 'vscode';
import { readParsed, validateDraft, writeWithFrontmatter, draftFromParsed } from './frontmatterFile';
import { metadataWebviewHtml } from './metadataWebviewHtml';

export function openMetadataEditor(uri: vscode.Uri, onSaved: () => void | Promise<void>): void {
  const panel = vscode.window.createWebviewPanel(
    'docsTasksMetadata',
    `Docs Tasks — ${vscode.workspace.asRelativePath(uri)}`,
    vscode.ViewColumn.Active,
    { enableScripts: true, retainContextWhenHidden: true },
  );
  panel.webview.html = metadataWebviewHtml(panel.webview);

  const load = async () => {
    const parsed = await readParsed(uri);
    const draft = draftFromParsed(parsed.fm);
    await panel.webview.postMessage({
      type: 'load',
      uri: uri.toString(),
      pathLabel: vscode.workspace.asRelativePath(uri),
      draft,
    });
  };

  const sub = panel.webview.onDidReceiveMessage(async (msg) => {
    if (msg?.type === 'ready') {
      await load();
      return;
    }
    if (msg?.type === 'reload') {
      await load();
      return;
    }
    if (msg?.type === 'save') {
      const v = validateDraft(msg.draft);
      if (!v.ok) {
        await panel.webview.postMessage({ type: 'errors', errors: v.errors });
        return;
      }
      try {
        const parsed = await readParsed(uri);
        const newFm: Record<string, unknown> = { ...parsed.fm };
        newFm.id = v.fm.id;
        newFm.title = v.fm.title;
        newFm.status = v.fm.status;
        newFm.created = v.fm.created;
        newFm.updated = v.fm.updated;
        if (v.fm.type) newFm.type = v.fm.type;
        else delete newFm.type;

        if (v.fm.tags !== undefined && Array.isArray(v.fm.tags) && v.fm.tags.length > 0) {
          newFm.tags = v.fm.tags;
        } else {
          delete newFm.tags;
        }

        if (v.fm.source !== undefined) newFm.source = v.fm.source;
        else delete newFm.source;

        await writeWithFrontmatter(uri, newFm, parsed.body);
        await Promise.resolve(onSaved());
        panel.dispose();
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        await panel.webview.postMessage({ type: 'errors', errors: [`Запись: ${m}`] });
      }
    }
  });

  panel.onDidDispose(() => sub.dispose());
}
