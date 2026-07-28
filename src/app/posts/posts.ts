import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RowHighlight } from '../row-highlight';
import { Post, parsePosts } from '../post';

const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=10';

@Component({
  selector: 'app-posts',
  imports: [RowHighlight],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
})
export class Posts {
  protected readonly postsResource = httpResource<Post[]>(() => POSTS_URL, {
    defaultValue: [],
    parse: parsePosts,
  });

  protected retry(): void {
    this.postsResource.reload();
  }
}
