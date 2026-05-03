import type { NormalizedTask, TaskFrontmatter } from './types';

function asStringTagList(tags: unknown): string[] {
  if (tags == null) return [];
  if (Array.isArray(tags)) return tags.map((x) => String(x));
  return [String(tags)];
}

function getSourceIssue(fm: TaskFrontmatter): string | undefined {
  const s = fm.source as { issue?: string } | string | undefined;
  if (!s) return undefined;
  if (typeof s === 'string') return s;
  if (typeof s === 'object' && typeof (s as { issue?: unknown }).issue === 'string') {
    return (s as { issue: string }).issue;
  }
  return undefined;
}

export function normalizeFrontmatter(
  uriString: string,
  pathLabel: string,
  fm: TaskFrontmatter,
): Omit<NormalizedTask, 'parseError' | 'rawFrontmatterPreview'> {
  return {
    uri: uriString,
    pathLabel,
    id: fm.id != null ? String(fm.id) : undefined,
    title: fm.title != null ? String(fm.title) : undefined,
    status: fm.status != null ? String(fm.status) : undefined,
    created: fm.created != null ? String(fm.created) : undefined,
    updated: fm.updated != null ? String(fm.updated) : undefined,
    type: fm.type != null ? String(fm.type) : undefined,
    tags: asStringTagList(fm.tags),
    sourceIssue: getSourceIssue(fm),
  };
}
