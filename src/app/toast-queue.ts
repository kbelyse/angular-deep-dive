import { Injectable, signal } from '@angular/core';

export interface Toast {
  readonly id: number;
  readonly message: string;
}

const DEFAULT_DURATION_MS = 4000;

@Injectable({ providedIn: 'root' })
export class ToastQueue {
  private readonly toasts = signal<readonly Toast[]>([]);

  readonly all = this.toasts.asReadonly();

  private nextId = 0;

  show(message: string, durationMs = DEFAULT_DURATION_MS): void {
    const id = this.nextId++;
    this.toasts.update((current) => [...current, { id, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
  }
}
