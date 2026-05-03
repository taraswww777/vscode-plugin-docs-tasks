/** Protocol statuses for docs/tasks. */
export const TASK_STATUSES = ['backlog', 'in-progress', 'done', 'cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface TaskFrontmatter {
  id?: string;
  title?: string;
  status?: string;
  created?: string;
  updated?: string;
  type?: string;
  tags?: unknown;
  source?: unknown;
}

export interface NormalizedTask {
  uri: string;
  pathLabel: string;
  /** Present when YAML/frontmatter частично или полностью невалиден. */
  parseError?: string;
  rawFrontmatterPreview?: string;
  id?: string;
  title?: string;
  status?: string;
  created?: string;
  updated?: string;
  type?: string;
  tags: string[];
  sourceIssue?: string;
}

/** Пресеты табличного вида хранятся на уровень workspace (workspaceState). */
export interface TableViewPreset {
  id: string;
  name: string;
  filters: TableFiltersState;
  sort: TableSortState;
  visibleColumns: string[];
}

export interface TableFiltersState {
  /** Подстрочный поиск по title (case-insensitive). */
  titleSubstring: string;
  status: string;
  /** Совпадение тега: подстрочное сравнение с любым тегом. */
  tag: string;
  type: string;
  idSubstring: string;
}

export interface TableSortState {
  column:
    | 'id'
    | 'title'
    | 'status'
    | 'created'
    | 'updated'
    | 'type'
    | 'tags'
    | 'sourceIssue';
  dir: 'asc' | 'desc';
}
