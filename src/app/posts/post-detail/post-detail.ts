import { Component, effect, inject, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../api-base-url';
import { ReadingTime } from '../../reading-time';
import { Post, parsePost } from '../../post';

@Component({
  selector: 'app-post-detail',
  imports: [RouterLink, ReadingTime],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.scss',
})
export class PostDetail {
  private readonly documentTitle = inject(Title);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  readonly id = input.required<string>();

  protected readonly postResource = httpResource<Post>(
    () => `${this.apiBaseUrl}/posts/${this.id()}`,
    { parse: parsePost },
  );

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
}
