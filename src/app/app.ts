import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Counter } from './counter/counter';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Counter],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Angular Deep Dive');
}
