import { Component, computed, input, model } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.scss',
})
export class StarRating {
  readonly max = input(5);
  readonly label = input('Rating');

  readonly value = model(0);

  protected readonly stars = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));

  protected rate(star: number): void {
    this.value.set(star);
  }
}
