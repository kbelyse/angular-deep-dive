import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-counter-button',
  imports: [],
  templateUrl: './counter-button.html',
  styleUrl: './counter-button.scss',
})
export class CounterButton {
  readonly label = input.required<string>();
  readonly pressed = output<void>();

  onClick(): void {
    this.pressed.emit();
  }
}
