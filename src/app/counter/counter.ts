import { Component, computed, signal } from '@angular/core';
import { CounterButton } from './counter-button/counter-button';

@Component({
  selector: 'app-counter',
  imports: [CounterButton],
  templateUrl: './counter.html',
  styleUrl: './counter.scss',
})
export class Counter {
  protected readonly count = signal(0);
  protected readonly doubled = computed(() => this.count() * 2);

  increment(): void {
    this.count.update((value) => value + 1);
  }

  decrement(): void {
    this.count.update((value) => value - 1);
  }

  reset(): void {
    this.count.set(0);
  }
}
