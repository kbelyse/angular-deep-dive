import { Component, ElementRef, effect, input, output, viewChildren } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  readonly open = input.required<boolean>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly focusable = viewChildren<ElementRef<HTMLButtonElement>>('focusable');

  private lastFocused: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.open()) {
        this.lastFocused = document.activeElement as HTMLElement | null;
        this.focusable()[0]?.nativeElement.focus();
      } else {
        this.lastFocused?.focus();
      }
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelled.emit();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }

    const buttons = this.focusable().map((ref) => ref.nativeElement);
    if (buttons.length === 0) {
      return;
    }

    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  protected confirm(): void {
    this.confirmed.emit();
  }

  protected cancel(): void {
    this.cancelled.emit();
  }
}
