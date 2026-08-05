import { Component, computed, effect, inject, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../api-base-url';
import { ReadingTime } from '../../reading-time';
import { Post, parsePost } from '../../post';
import { Ratings } from '../../ratings';
import { StarRating } from '../../star-rating/star-rating';

@Component({
  selector: 'app-post-detail',
  imports: [RouterLink, ReadingTime, StarRating],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.scss',
})
export class PostDetail {
  private readonly documentTitle = inject(Title);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly ratings = inject(Ratings);

  readonly id = input.required<string>();

  protected readonly postResource = httpResource<Post>(
    () => `${this.apiBaseUrl}/posts/${this.id()}`,
    { parse: parsePost },
  );

  protected readonly rating = computed(() => {
    if (!this.postResource.hasValue()) {
      return 0;
    }
    return this.ratings.get(String(this.postResource.value().id));
  });

  constructor() {
    effect(() => {
      if (this.postResource.hasValue()) {
        this.documentTitle.setTitle(`${this.postResource.value().title} · Angular Deep Dive`);
      }
    });
  }

  protected retry(): void {
    this.postResource.reload();
  }

  protected onRatingChange(value: number): void {
    if (this.postResource.hasValue()) {
      this.ratings.set(String(this.postResource.value().id), value);
    }
  }
}
