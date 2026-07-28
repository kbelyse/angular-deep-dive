import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { RecentPosts } from './recent-posts';

const RECENT_POSTS_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=3';

describe('RecentPosts', () => {
  let fixture: ComponentFixture<RecentPosts>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentPosts],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentPosts);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  function nativeEl(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('should render the fetched post titles', async () => {
    httpMock.expectOne(RECENT_POSTS_URL).flush([{ id: 1, title: 'Deferred loading', body: '...' }]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeEl().querySelector('.recent-posts-list li')?.textContent).toContain(
      'Deferred loading',
    );
  });

  it('should show a short error message if the request fails', async () => {
    httpMock
      .expectOne(RECENT_POSTS_URL)
      .flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeEl().querySelector('.error')?.textContent).toContain("Couldn't load recent posts");
  });
});
