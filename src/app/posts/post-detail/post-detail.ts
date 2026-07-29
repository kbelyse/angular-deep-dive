import { Component, effect, inject, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Post, parsePost } from '../../post';

const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';

@Component({
  selector: 'app-post-detail',
  imports: [RouterLink],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.scss',
})
export class PostDetail {
  private readonly documentTitle = inject(Title);

  readonly id = input.required<string>();

  protected readonly postResource = httpResource<Post>(() => `${POSTS_URL}/${this.id()}`, {
    parse: parsePost,
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
}
