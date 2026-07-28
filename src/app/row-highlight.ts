import { computed, Directive, signal } from '@angular/core';

@Directive({
  selector: '[appRowHighlight]',
  host: {
    '[class.highlighted]': 'highlighted()',
    '(focusin)': 'focused.set(true)',
    '(focusout)': 'focused.set(false)',
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'hovered.set(false)',
  },
})
export class RowHighlight {
  protected readonly focused = signal(false);
  protected readonly hovered = signal(false);

  protected readonly highlighted = computed(() => this.focused() || this.hovered());
}
