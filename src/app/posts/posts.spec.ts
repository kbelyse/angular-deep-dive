import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Posts } from './posts';

const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=10';

describe('Posts', () => {
  let component: Posts;
  let fixture: ComponentFixture<Posts>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Posts],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Posts);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  function nativeEl(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('should create', () => {
    httpMock.expectOne(POSTS_URL).flush([]);
    expect(component).toBeTruthy();
  });

  it('should render a heading', () => {
    httpMock.expectOne(POSTS_URL).flush([]);
    expect(nativeEl().querySelector('h2')?.textContent).toContain('Posts');
  });

  it('should show a loading state before the response arrives', () => {
    expect(nativeEl().querySelector('.status')?.textContent).toContain('Loading posts');
    httpMock.expectOne(POSTS_URL).flush([]);
  });

  it('should render posts once the request resolves', async () => {
    httpMock
      .expectOne(POSTS_URL)
      .flush([{ id: 1, title: 'Signals', body: 'Signals make state explicit.' }]);
    await fixture.whenStable();
    fixture.detectChanges();

    const items = nativeEl().querySelectorAll('.posts-list li');
    expect(items.length).toBe(1);
    expect(items[0].querySelector('h3')?.textContent).toContain('Signals');
    expect(nativeEl().querySelector('.status')?.textContent?.trim()).toBe('');
  });

  it('should link each post to its detail page', async () => {
    httpMock.expectOne(POSTS_URL).flush([{ id: 7, title: 'Deep link', body: 'Goes to /posts/7.' }]);
    await fixture.whenStable();
    fixture.detectChanges();

    const link = nativeEl().querySelector('.posts-list li a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/posts/7');
  });

  it('should reject a malformed response instead of rendering it', async () => {
    httpMock.expectOne(POSTS_URL).flush([{ id: 1, title: 'Missing a body' }]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeEl().querySelector('.error')?.textContent).toContain(
      'Received an unexpected posts response.',
    );
  });

  it('should show an accessible error with a working retry button', async () => {
    httpMock
      .expectOne(POSTS_URL)
      .flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    const error = nativeEl().querySelector('.error');
    expect(error?.getAttribute('role')).toBe('alert');
    expect(error?.textContent).toContain("Couldn't load posts");

    const retryButton = error?.querySelector('button') as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();

    httpMock
      .expectOne(POSTS_URL)
      .flush([{ id: 2, title: 'Retried', body: 'It worked this time.' }]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeEl().querySelector('.error')).toBeNull();
    expect(nativeEl().querySelector('.posts-list li')?.textContent).toContain('Retried');
  });

  it('should preview the first post by default once posts load', async () => {
    httpMock.expectOne(POSTS_URL).flush([
      { id: 1, title: 'First', body: 'First body.' },
      { id: 2, title: 'Second', body: 'Second body.' },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeEl().querySelector('.preview h3')?.textContent).toBe('First');
    const buttons = nativeEl().querySelectorAll('.preview-toggle');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('should switch the preview when a different Preview button is clicked', async () => {
    httpMock.expectOne(POSTS_URL).flush([
      { id: 1, title: 'First', body: 'First body.' },
      { id: 2, title: 'Second', body: 'Second body.' },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const buttons = nativeEl().querySelectorAll<HTMLButtonElement>('.preview-toggle');
    buttons[1].click();
    fixture.detectChanges();

    expect(nativeEl().querySelector('.preview h3')?.textContent).toBe('Second');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('should reset the preview to the new first post after a reload', async () => {
    httpMock.expectOne(POSTS_URL).flush([
      { id: 1, title: 'First', body: 'First body.' },
      { id: 2, title: 'Second', body: 'Second body.' },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    nativeEl().querySelectorAll<HTMLButtonElement>('.preview-toggle')[1].click();
    fixture.detectChanges();
    expect(nativeEl().querySelector('.preview h3')?.textContent).toBe('Second');

    component['postsResource'].reload();
    fixture.detectChanges();
    httpMock.expectOne(POSTS_URL).flush([{ id: 3, title: 'Reloaded', body: 'Reloaded body.' }]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeEl().querySelector('.preview h3')?.textContent).toBe('Reloaded');
  });

  it('should show no preview panel when there are no posts', async () => {
    httpMock.expectOne(POSTS_URL).flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeEl().querySelector('.preview')).toBeNull();
  });

  it('should give each Preview button a distinct accessible name', async () => {
    httpMock.expectOne(POSTS_URL).flush([
      { id: 1, title: 'First', body: 'First body.' },
      { id: 2, title: 'Second', body: 'Second body.' },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const buttons = nativeEl().querySelectorAll('.preview-toggle');
    expect(buttons[0].getAttribute('aria-label')).toBe('Preview First');
    expect(buttons[1].getAttribute('aria-label')).toBe('Preview Second');
  });

  it('should mark the preview panel as an accessible live region', async () => {
    httpMock.expectOne(POSTS_URL).flush([{ id: 1, title: 'First', body: 'First body.' }]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeEl().querySelector('.preview')?.getAttribute('aria-live')).toBe('polite');
  });

  it('should show an estimated reading time in the preview panel', async () => {
    const longBody = Array(250).fill('word').join(' ');
    httpMock.expectOne(POSTS_URL).flush([{ id: 1, title: 'Long post', body: longBody }]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeEl().querySelector('.reading-time')?.textContent).toBe('2 min read');
  });

  describe('search filtering', () => {
    beforeEach(async () => {
      httpMock.expectOne(POSTS_URL).flush([
        { id: 1, title: 'Signals deep dive', body: 'All about signals.' },
        { id: 2, title: 'Routing basics', body: 'All about routes.' },
      ]);
      await fixture.whenStable();
      fixture.detectChanges();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function typeQuery(value: string): void {
      const input = nativeEl().querySelector('.search-field input') as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    it('should not filter before the debounce window elapses', () => {
      typeQuery('signals');
      vi.advanceTimersByTime(100);
      fixture.detectChanges();

      expect(nativeEl().querySelectorAll('.posts-list li').length).toBe(2);
    });

    it('should filter to matching titles once debounced', () => {
      typeQuery('signals');
      vi.advanceTimersByTime(250);
      fixture.detectChanges();

      const items = nativeEl().querySelectorAll('.posts-list li');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain('Signals deep dive');
    });

    it('should match case-insensitively', () => {
      typeQuery('ROUTING');
      vi.advanceTimersByTime(250);
      fixture.detectChanges();

      const items = nativeEl().querySelectorAll('.posts-list li');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain('Routing basics');
    });

    it('should show every post again once the query is cleared', () => {
      typeQuery('signals');
      vi.advanceTimersByTime(250);
      fixture.detectChanges();

      typeQuery('');
      vi.advanceTimersByTime(250);
      fixture.detectChanges();

      expect(nativeEl().querySelectorAll('.posts-list li').length).toBe(2);
      expect(nativeEl().querySelector('.empty')).toBeNull();
    });

    it('should show a no-results message when nothing matches', () => {
      typeQuery('nonexistent');
      vi.advanceTimersByTime(250);
      fixture.detectChanges();

      expect(nativeEl().querySelectorAll('.posts-list li').length).toBe(0);
      expect(nativeEl().querySelector('.empty')?.textContent).toContain(
        'No posts match "nonexistent"',
      );
    });

    it('should announce the result count once the debounce settles', () => {
      const region = nativeEl().querySelector('.visually-hidden[aria-live]');
      expect(region?.textContent).toBe('');

      typeQuery('signals');
      vi.advanceTimersByTime(250);
      fixture.detectChanges();

      expect(region?.textContent).toBe('1 post found.');
    });

    it('should pluralize the announcement for multiple matches', () => {
      typeQuery('s');
      vi.advanceTimersByTime(250);
      fixture.detectChanges();

      const region = nativeEl().querySelector('.visually-hidden[aria-live]');
      expect(region?.textContent).toBe('2 posts found.');
    });
  });
});
