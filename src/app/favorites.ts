import { computed, effect, Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'favorite-paths';

function initialPaths(): ReadonlySet<string> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return new Set();
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.every((value) => typeof value === 'string')) {
      return new Set(parsed);
    }
  } catch {
    // malformed JSON — fall through to an empty set below
  }
  return new Set();
}

@Injectable({ providedIn: 'root' })
export class Favorites {
  private readonly paths = signal<ReadonlySet<string>>(initialPaths());

  readonly all = computed(() => Array.from(this.paths()));

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.all()));
    });
  }

  isFavorite(path: string): boolean {
    return this.paths().has(path);
  }

  clear(): void {
    this.paths.set(new Set());
  }

  toggle(path: string): void {
    this.paths.update((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }
}
