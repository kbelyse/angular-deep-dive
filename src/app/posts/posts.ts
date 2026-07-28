import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface Post {
  id: number;
  title: string;
  body: string;
}

const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=10';

function isPost(value: unknown): value is Post {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'number' &&
    typeof candidate['title'] === 'string' &&
    typeof candidate['body'] === 'string'
  );
}

function parsePosts(value: unknown): Post[] {
  if (!Array.isArray(value) || !value.every(isPost)) {
    throw new Error('Received an unexpected posts response.');
  }
  return value;
}

@Component({
  selector: 'app-posts',
  imports: [],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
})
export class Posts {
  protected readonly postsResource = httpResource<Post[]>(() => POSTS_URL, {
    defaultValue: [],
    parse: parsePosts,
  });
}
