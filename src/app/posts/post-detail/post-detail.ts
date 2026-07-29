import { Component, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Post, parsePost } from '../../post';

const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';

@Component({
  selector: 'app-post-detail',
  imports: [],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.scss',
})
export class PostDetail {
  readonly id = input.required<string>();

  protected readonly postResource = httpResource<Post>(() => `${POSTS_URL}/${this.id()}`, {
    parse: parsePost,
  });
}
