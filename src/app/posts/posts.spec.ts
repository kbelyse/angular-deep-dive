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
});
