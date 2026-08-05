import { Component, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { API_BASE_URL } from '../../api-base-url';
import { Post, parsePosts } from '../../post';

@Component({
  selector: 'app-recent-posts',
  imports: [],
  templateUrl: './recent-posts.html',
  styleUrl: './recent-posts.scss',
})
export class RecentPosts {
  private readonly apiBaseUrl = inject(API_BASE_URL);

  protected readonly postsResource = httpResource<Post[]>(
    () => `${this.apiBaseUrl}/posts?_limit=3`,
    { defaultValue: [], parse: parsePosts },
  );
}
