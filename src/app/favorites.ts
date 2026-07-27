import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Favorites {
  private readonly paths = signal<ReadonlySet<string>>(new Set());

  readonly all = computed(() => Array.from(this.paths()));

  isFavorite(path: string): boolean {
    return this.paths().has(path);
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
