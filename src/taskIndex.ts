import matter from 'gray-matter';
import * as vscode from 'vscode';
import { normalizeFrontmatter } from './normalizeTask';
import type { NormalizedTask, TaskFrontmatter } from './types';

const CONFIG_SECTION = 'docs-tasks';
const TASKS_FOLDER_KEY = 'tasksFolder';
const DEFAULT_TASKS_FOLDER = 'docs/tasks';

function normalizeTasksFolderRelativePath(raw: unknown): string {
  if (typeof raw !== 'string') return DEFAULT_TASKS_FOLDER;
  let s = raw.trim().replace(/\\/g, '/');
  while (s.startsWith('./')) s = s.slice(2);
  s = s.replace(/^\/+/g, '');
  if (!s || s.includes('..')) return DEFAULT_TASKS_FOLDER;
  s = s.replace(/\/+$/g, '');
  return s || DEFAULT_TASKS_FOLDER;
}

function tasksFolderForWorkspaceFolder(workspaceFolder: vscode.WorkspaceFolder): string {
  const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION, workspaceFolder.uri);
  return normalizeTasksFolderRelativePath(cfg.get<string | undefined>(TASKS_FOLDER_KEY));
}

export class TaskIndex implements vscode.Disposable {
  private watchers: vscode.FileSystemWatcher[] = [];
  private disposableBag: vscode.Disposable[] = [];
  private debounce?: NodeJS.Timeout;
  private tasks: NormalizedTask[] = [];
  private readonly emitter = new vscode.EventEmitter<NormalizedTask[]>();

  readonly onDidChange = this.emitter.event;

  constructor(private readonly debounceMs = 350) {}

  async refreshImmediate(): Promise<NormalizedTask[]> {
    await this.scan();
    return [...this.tasks];
  }

  startWatch(): void {
    const scheduleDebouncedGlob = () => this.scheduleDebounced();

    this.disposableBag.push(
      vscode.workspace.onDidChangeWorkspaceFolders(scheduleDebouncedGlob),
    );
    this.disposableBag.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (!e.affectsConfiguration(`${CONFIG_SECTION}.${TASKS_FOLDER_KEY}`)) return;
        void this.onTasksFolderSettingChanged();
      }),
    );

    this.mountWatchers();
    void this.refreshImmediate();

    this.disposableBag.push(this.emitter as vscode.Disposable);
  }

  getSnapshot(): NormalizedTask[] {
    return [...this.tasks];
  }

  dispose(): void {
    if (this.debounce) clearTimeout(this.debounce);
    this.teardownWatchers();
    vscode.Disposable.from(...this.disposableBag).dispose();
    this.disposableBag = [];
  }

  private async onTasksFolderSettingChanged(): Promise<void> {
    this.teardownWatchers();
    this.mountWatchers();
    await this.scan();
  }

  private teardownWatchers(): void {
    for (const w of this.watchers) w.dispose();
    this.watchers = [];
  }

  private mountWatchers(): void {
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      const tp = tasksFolderForWorkspaceFolder(folder);
      const pat = new vscode.RelativePattern(folder, `**/${tp}/**/*.md`);
      const w = vscode.workspace.createFileSystemWatcher(pat);
      const schedule = () => this.scheduleDebounced();
      w.onDidChange(schedule);
      w.onDidCreate(schedule);
      w.onDidDelete(schedule);
      this.watchers.push(w);
    }
  }

  private scheduleDebounced(): void {
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      void this.scan();
    }, this.debounceMs);
  }

  private async scan(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders ?? [];
    if (!folders.length) {
      this.tasks = [];
      this.emitter.fire(this.getSnapshot());
      return;
    }

    const seen = new Set<string>();
    const next: NormalizedTask[] = [];

    for (const folder of folders) {
      const tp = tasksFolderForWorkspaceFolder(folder);
      const pattern = new vscode.RelativePattern(folder, `**/${tp}/TASK-*.md`);
      const uris = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
      for (const uri of uris) {
        if (seen.has(uri.toString())) continue;
        seen.add(uri.toString());
        next.push(await this.parseOne(uri));
      }
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
