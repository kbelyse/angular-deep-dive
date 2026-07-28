import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Post, parsePosts } from '../../post';

const RECENT_POSTS_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=3';

@Component({
  selector: 'app-recent-posts',
  imports: [],
  templateUrl: './recent-posts.html',
  styleUrl: './recent-posts.scss',
})
export class RecentPosts {
  protected readonly postsResource = httpResource<Post[]>(() => RECENT_POSTS_URL, {
    defaultValue: [],
    parse: parsePosts,
  });
}
