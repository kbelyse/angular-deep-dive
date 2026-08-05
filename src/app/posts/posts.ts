import { Component, computed, effect, inject, linkedSignal, NgZone, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { debounceTime, interval } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { ReadingTime } from '../reading-time';
import { RowHighlight } from '../row-highlight';
import { Post, parsePosts } from '../post';

@Component({
  selector: 'app-posts',
  imports: [RowHighlight, RouterLink, ReadingTime],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
})
export class Posts {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly ngZone = inject(NgZone);

  protected readonly postsResource = httpResource<Post[]>(
    () => `${this.apiBaseUrl}/posts?_limit=10`,
    { defaultValue: [], parse: parsePosts },
  );

  private readonly now = signal(Date.now());
  private readonly lastFetchedAt = signal<number | null>(null);

  protected readonly lastUpdatedLabel = computed(() => {
    const fetchedAt = this.lastFetchedAt();
    if (fetchedAt === null) {
      return '';
    }
    const seconds = Math.max(0, Math.round((this.now() - fetchedAt) / 1000));
    if (seconds < 5) {
      return 'Updated just now';
    }
    if (seconds < 60) {
      return `Updated ${seconds}s ago`;
    }
    return `Updated ${Math.round(seconds / 60)}m ago`;
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

  constructor() {
    this.ngZone.runOutsideAngular(() => {
      interval(1000)
        .pipe(takeUntilDestroyed())
        .subscribe(() => this.now.set(Date.now()));
    });

    effect(() => {
      if (this.postsResource.status() === 'resolved') {
        this.lastFetchedAt.set(Date.now());
      }
    });
  }

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
