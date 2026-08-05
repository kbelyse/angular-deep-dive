import { Injectable, signal } from '@angular/core';

export interface ErrorLogEntry {
  readonly message: string;
  readonly timestamp: number;
}

const MAX_ENTRIES = 50;

@Injectable({ providedIn: 'root' })
export class ErrorLog {
  private readonly entries = signal<readonly ErrorLogEntry[]>([]);

  readonly all = this.entries.asReadonly();

  record(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.entries.update((current) =>
      [...current, { message, timestamp: Date.now() }].slice(-MAX_ENTRIES),
    );
  }
}
