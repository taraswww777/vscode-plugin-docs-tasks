import matter from 'gray-matter';
import * as vscode from 'vscode';
import { normalizeFrontmatter } from './normalizeTask';
import type { NormalizedTask, TaskFrontmatter } from './types';

const GLOB = '**/docs/tasks/TASK-*.md';

export class TaskIndex implements vscode.Disposable {
  private watchers: vscode.FileSystemWatcher[] = [];
  private debounce?: NodeJS.Timeout;
  private tasks: NormalizedTask[] = [];
  private readonly emitter = new vscode.EventEmitter<NormalizedTask[]>();

  readonly onDidChange = this.emitter.event;

  constructor(private readonly debounceMs = 350) {}

  async refreshImmediate(): Promise<NormalizedTask[]> {
    await this.scan();
    return [...this.tasks];
  }

  startWatch(context: vscode.ExtensionContext): void {
    const scheduleDebouncedGlob = () => this.scheduleDebounced();

    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      const pat = new vscode.RelativePattern(folder, 'docs/tasks/**/*.md');
      const w = vscode.workspace.createFileSystemWatcher(pat);
      const schedule = () => this.scheduleDebounced();
      w.onDidChange(schedule);
      w.onDidCreate(schedule);
      w.onDidDelete(schedule);
      context.subscriptions.push(w);
      this.watchers.push(w);
    }

    vscode.workspace.onDidChangeWorkspaceFolders(scheduleDebouncedGlob, null, context.subscriptions);

    context.subscriptions.push({ dispose: () => this.watchers.forEach((d) => d.dispose()) });
    context.subscriptions.push(this.emitter);

    void this.refreshImmediate();
  }

  getSnapshot(): NormalizedTask[] {
    return [...this.tasks];
  }

  dispose(): void {
    if (this.debounce) clearTimeout(this.debounce);
    this.watchers.forEach((d) => d.dispose());
  }

  private scheduleDebounced(): void {
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      void this.scan();
    }, this.debounceMs);
  }

  private async scan(): Promise<void> {
    const uris = await vscode.workspace.findFiles(GLOB, '**/node_modules/**');
    const next: NormalizedTask[] = [];
    for (const uri of uris) {
      next.push(await this.parseOne(uri));
    }
    this.tasks = next;
    this.emitter.fire(this.getSnapshot());
  }

  private async parseOne(uri: vscode.Uri): Promise<NormalizedTask> {
    try {
      const buf = await vscode.workspace.fs.readFile(uri);
      const text = new TextDecoder('utf-8').decode(buf);
      let parsed: matter.GrayMatterFile<string>;
      try {
        parsed = matter(text);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {
          uri: uri.toString(),
          pathLabel: vscode.workspace.asRelativePath(uri),
          parseError: `YAML/frontmatter: ${msg}`,
          tags: [],
        };
      }
      const data = parsed.data as Record<string, unknown>;
      const fm: TaskFrontmatter = {
        id: data.id != null ? String(data.id) : undefined,
        title: data.title != null ? String(data.title) : undefined,
        status: data.status != null ? String(data.status) : undefined,
        created: data.created != null ? String(data.created) : undefined,
        updated: data.updated != null ? String(data.updated) : undefined,
        type: data.type != null ? String(data.type) : undefined,
        tags: data.tags,
        source: data.source,
      };
      const base = normalizeFrontmatter(uri.toString(), vscode.workspace.asRelativePath(uri), fm);
      return { ...base, parseError: undefined };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        uri: uri.toString(),
        pathLabel: vscode.workspace.asRelativePath(uri),
        parseError: `read/parse: ${msg}`,
        tags: [],
      };
    }
  }
}
