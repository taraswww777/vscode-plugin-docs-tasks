import matter from 'gray-matter';
import * as vscode from 'vscode';
import { isIsoDateYYYYMMDD, isValidStatus } from './validateFrontmatter';
import type { TaskFrontmatter } from './types';

export interface FrontmatterDraft extends TaskFrontmatter {
  tagsText?: string;
  /** Плоское поля для URL GitHub Issue (YAML: source.issue). */
  sourceIssue?: string;
}

export function normalizeTagsInput(tagsText: string): string[] {
  return tagsText
    .split(/[\n,]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function stringifyTagsForDraft(tags: unknown): string {
  const arr =
    tags == null
      ? []
      : Array.isArray(tags)
        ? tags.map(String)
        : [String(tags)];
  return arr.join(', ');
}

export interface ValidateDraftResult {
  ok: boolean;
  errors: string[];
  fm: TaskFrontmatter;
}

/** Валидация полей перед записью файла */
export function validateDraft(d: FrontmatterDraft): ValidateDraftResult {
  const errors: string[] = [];
  if (!d.id?.trim()) errors.push('id обязательно.');
  if (!d.title?.trim()) errors.push('title обязательно.');
  const st = d.status?.trim();
  if (!isValidStatus(st)) {
    errors.push('status должно быть: backlog | in-progress | done | cancelled');
  }
  if (!isIsoDateYYYYMMDD(d.created?.trim())) {
    errors.push('created должно быть YYYY-MM-DD');
  }
  if (!isIsoDateYYYYMMDD(d.updated?.trim())) {
    errors.push('updated должно быть YYYY-MM-DD');
  }
  if (d.type != null && String(d.type).includes('\n')) {
    errors.push('type не может быть многострочным');
  }
  let sourceOut: unknown;
  if (d.sourceIssue != null && d.sourceIssue.trim()) {
    sourceOut = { issue: d.sourceIssue.trim() };
  } else if (d.source !== undefined) {
    sourceOut = d.source;
  } else {
    sourceOut = undefined;
  }

  let tagsOut: unknown;
  if (d.tagsText != null) {
    tagsOut = normalizeTagsInput(d.tagsText);
  } else if (Array.isArray(d.tags)) {
    tagsOut = d.tags.map(String);
  } else if (d.tags != null) {
    tagsOut = [String(d.tags)];
  } else {
    tagsOut = undefined;
  }

  const fm: TaskFrontmatter = {
    id: d.id!.trim(),
    title: d.title!.trim(),
    status: st,
    created: d.created!.trim(),
    updated: d.updated!.trim(),
    type: d.type?.trim() || undefined,
    tags: tagsOut,
    source: sourceOut,
  };
  return {
    ok: errors.length === 0,
    errors,
    fm,
  };
}

export interface ParsedFile {
  fm: Record<string, unknown>;
  body: string;
}

export async function readParsed(uri: vscode.Uri): Promise<ParsedFile> {
  const buf = await vscode.workspace.fs.readFile(uri);
  const text = new TextDecoder('utf-8').decode(buf);
  const parsed = matter(text);
  return { fm: { ...parsed.data } as Record<string, unknown>, body: parsed.content };
}

export async function writeWithFrontmatter(
  uri: vscode.Uri,
  fm: Record<string, unknown>,
  body: string,
): Promise<void> {
  const output = matter.stringify(body, fm);
  const enc = new TextEncoder();
  await vscode.workspace.fs.writeFile(uri, enc.encode(output));
}

export async function patchStatus(uri: vscode.Uri, status: string, updatedYYYYMMDD: string): Promise<void> {
  const buf = await vscode.workspace.fs.readFile(uri);
  const text = new TextDecoder('utf-8').decode(buf);
  const parsed = matter(text);
  const data = parsed.data as Record<string, unknown>;
  data.status = status;
  data.updated = updatedYYYYMMDD;
  await writeWithFrontmatter(uri, data as unknown as Record<string, unknown>, parsed.content);
}

export function draftFromParsed(fmRec: Record<string, unknown>): FrontmatterDraft {
  const fm = fmRec as unknown as TaskFrontmatter;
  const draft: FrontmatterDraft = {
    ...fm,
    tagsText: stringifyTagsForDraft(fm.tags),
  };
  const src = fm.source as { issue?: string } | undefined;
  if (src?.issue != null && typeof src.issue === 'string') {
    draft.sourceIssue = src.issue;
  }
  return draft;
}
