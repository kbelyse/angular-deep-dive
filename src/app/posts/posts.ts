import { Component, computed, linkedSignal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { RowHighlight } from '../row-highlight';
import { Post, parsePosts } from '../post';

const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=10';

@Component({
  selector: 'app-posts',
  imports: [RowHighlight, RouterLink],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
})
export class Posts {
  protected readonly postsResource = httpResource<Post[]>(() => POSTS_URL, {
    defaultValue: [],
    parse: parsePosts,
  });

  protected readonly selectedPostId = linkedSignal(() => this.postsResource.value()[0]?.id ?? null);

  protected readonly selectedPost = computed(
    () => this.postsResource.value().find((post) => post.id === this.selectedPostId()) ?? null,
  );

  protected readonly readingMinutes = computed(() => {
    const body = this.selectedPost()?.body ?? '';
    const wordCount = body.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  });

  protected select(id: number): void {
    this.selectedPostId.set(id);
  }

  protected retry(): void {
    this.postsResource.reload();
  }
}
