import {
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  input,
  signal,
  viewChildren,
} from '@angular/core';

import { Tab } from './tab';

@Component({
  selector: 'app-tabs',
  imports: [Tab],
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
})
export class Tabs {
  readonly label = input('Tabs');

  readonly tabs = contentChildren(Tab);

  private readonly requestedIndex = signal(0);
  readonly selectedIndex = computed(() => {
    const count = this.tabs().length;
    return count === 0 ? 0 : Math.min(this.requestedIndex(), count - 1);
  });

  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  constructor() {
    effect(() => {
      const selected = this.selectedIndex();
      this.tabs().forEach((tab, i) => (i === selected ? tab.activate() : tab.deactivate()));
    });
  }

  select(index: number): void {
    this.requestedIndex.set(index);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const count = this.tabs().length;
    let next: number;

    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % count;
        break;
      case 'ArrowLeft':
        next = (index - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.select(next);
    this.tabButtons()[next]?.nativeElement.focus();
  }
}
