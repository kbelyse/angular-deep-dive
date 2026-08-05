import { Component, computed, input, signal } from '@angular/core';
import { RowHighlight } from '../row-highlight';

let nextTabId = 0;

@Component({
  selector: 'app-tab',
  hostDirectives: [RowHighlight],
  styleUrl: './tab.scss',
  template: `
    @if (active()) {
      <div role="tabpanel" [id]="panelId()" [attr.aria-labelledby]="tabId()" tabindex="0">
        <ng-content />
      </div>
    }
  `,
})
export class Tab {
  readonly title = input.required<string>();

  private readonly uid = nextTabId++;
  readonly panelId = computed(() => `tabpanel-${this.uid}`);
  readonly tabId = computed(() => `tab-${this.uid}`);

  private readonly activeState = signal(false);
  readonly active = this.activeState.asReadonly();

  activate(): void {
    this.activeState.set(true);
  }

  deactivate(): void {
    this.activeState.set(false);
  }
}
