import type * as vscode from 'vscode';
import type { TableFiltersState, TableSortState, TableViewPreset } from './types';

const KEY = 'docsTasks.presets.v1';

const ALL_COLS = [
  'id',
  'title',
  'status',
  'created',
  'updated',
  'type',
  'tags',
  'sourceIssue',
] as const;

function randId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function freshFilters(): TableFiltersState {
  return { titleSubstring: '', status: '', tag: '', type: '', idSubstring: '' };
}

export function freshSort(): TableSortState {
  return { column: 'updated', dir: 'desc' };
}

export function freshPreset(): TableViewPreset {
  return {
    id: randId('preset'),
    name: 'Новый вид',
    filters: freshFilters(),
    sort: freshSort(),
    visibleColumns: [...ALL_COLS],
  };
}

/** Гарантия: минимум один пресет, все колонки по умолчанию. */
export function loadPresets(memento: vscode.Memento): TableViewPreset[] {
  try {
    const raw = memento.get<unknown>(KEY);
    if (!Array.isArray(raw) || raw.length === 0) {
      return [freshPreset()];
    }
    return raw.map((p, idx) => normalizePresetSlot(p as Partial<TableViewPreset>, idx));
  } catch {
    return [freshPreset()];
  }
}

export async function savePresets(memento: vscode.Memento, presets: TableViewPreset[]): Promise<void> {
  await memento.update(KEY, presets);
}

function normalizePresetSlot(p: Partial<TableViewPreset>, idx: number): TableViewPreset {
  return {
    id: typeof p.id === 'string' && p.id ? p.id : randId(`preset`),
    name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : `Вид ${idx + 1}`,
    filters: {
      ...freshFilters(),
      ...(p.filters ?? {}),
    },
    sort: {
      ...freshSort(),
      ...(p.sort ?? {}),
    },
    visibleColumns:
      Array.isArray(p.visibleColumns) && p.visibleColumns.length ? p.visibleColumns : [...ALL_COLS],
  };
}
