import { effect, Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'post-ratings';
const MIN_RATING = 1;
const MAX_RATING = 5;

function isValidRating(value: unknown): value is number {
  return typeof value === 'number' && value >= MIN_RATING && value <= MAX_RATING;
}

function initialRatings(): ReadonlyMap<string, number> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return new Map();
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      const entries = Object.entries(parsed as Record<string, unknown>);
      if (entries.every(([, value]) => isValidRating(value))) {
        return new Map(entries as [string, number][]);
      }
    }
  } catch {
    // malformed JSON — fall through to an empty map below
  }
  return new Map();
}

@Injectable({ providedIn: 'root' })
export class Ratings {
  private readonly ratings = signal<ReadonlyMap<string, number>>(initialRatings());

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(this.ratings())));
    });
  }

  get(postId: string): number {
    return this.ratings().get(postId) ?? 0;
  }

  set(postId: string, value: number): void {
    this.ratings.update((current) => {
      const next = new Map(current);
      next.set(postId, value);
      return next;
    });
  }
}
