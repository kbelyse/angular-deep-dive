import { Component, computed, linkedSignal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { ReadingTime } from '../reading-time';
import { RowHighlight } from '../row-highlight';
import { Post, parsePosts } from '../post';

const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=10';

@Component({
  selector: 'app-posts',
  imports: [RowHighlight, RouterLink, ReadingTime],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
})
export class Posts {
  protected readonly postsResource = httpResource<Post[]>(() => POSTS_URL, {
    defaultValue: [],
    parse: parsePosts,
  });

  protected readonly query = signal('');

  private readonly debouncedQuery = toSignal(toObservable(this.query).pipe(debounceTime(250)), {
    initialValue: '',
  });

  protected readonly filteredPosts = computed(() => {
    const query = this.debouncedQuery().trim().toLowerCase();
    const posts = this.postsResource.value();
    return query ? posts.filter((post) => post.title.toLowerCase().includes(query)) : posts;
  });

  protected readonly resultsAnnouncement = computed(() => {
    if (!this.debouncedQuery().trim()) {
      return '';
    }
    const count = this.filteredPosts().length;
    return `${count} ${count === 1 ? 'post' : 'posts'} found.`;
  });

  protected readonly selectedPostId = linkedSignal(() => this.postsResource.value()[0]?.id ?? null);

  protected readonly selectedPost = computed(
    () => this.postsResource.value().find((post) => post.id === this.selectedPostId()) ?? null,
  );

  protected select(id: number): void {
    this.selectedPostId.set(id);
  }

  protected onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected retry(): void {
    this.postsResource.reload();
  }
}
