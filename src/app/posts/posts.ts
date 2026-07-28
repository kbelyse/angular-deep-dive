import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface Post {
  id: number;
  title: string;
  body: string;
}

const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=10';

@Component({
  selector: 'app-posts',
  imports: [],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
})
export class Posts {
  protected readonly postsResource = httpResource<Post[]>(() => POSTS_URL, { defaultValue: [] });
}
