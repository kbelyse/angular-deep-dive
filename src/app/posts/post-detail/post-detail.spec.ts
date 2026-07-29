import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { PostDetail } from './post-detail';

const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';

describe('PostDetail', () => {
  let fixture: ComponentFixture<PostDetail>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostDetail],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PostDetail);
    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function nativeEl(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('should request the post matching the id input', () => {
    httpMock.expectOne(`${POSTS_URL}/1`).flush({ id: 1, title: 'A post', body: 'Body text.' });
  });

  it('should show a loading state before the response arrives', () => {
    expect(nativeEl().querySelector('.status')?.textContent).toContain('Loading post');
    httpMock.expectOne(`${POSTS_URL}/1`).flush({ id: 1, title: 'A post', body: 'Body text.' });
  });

  it('should render the post once the request resolves', async () => {
    httpMock
      .expectOne(`${POSTS_URL}/1`)
      .flush({ id: 1, title: 'Reactive resources', body: 'They refetch on demand.' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeEl().querySelector('article h3')?.textContent).toContain('Reactive resources');
    expect(nativeEl().querySelector('article p')?.textContent).toContain('They refetch on demand.');
  });

  it('should reject a malformed response instead of rendering it', async () => {
    httpMock.expectOne(`${POSTS_URL}/1`).flush({ id: 1, title: 'Missing a body' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeEl().querySelector('.error')?.textContent).toContain(
      'Received an unexpected post response.',
    );
  });

  it('should show an accessible error with a working retry button', async () => {
    httpMock
      .expectOne(`${POSTS_URL}/1`)
      .flush('Not found', { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();

    const error = nativeEl().querySelector('.error');
    expect(error?.getAttribute('role')).toBe('alert');

    const retryButton = error?.querySelector('button') as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();

    httpMock
      .expectOne(`${POSTS_URL}/1`)
      .flush({ id: 1, title: 'Recovered', body: 'It worked on retry.' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeEl().querySelector('.error')).toBeNull();
    expect(nativeEl().querySelector('article h3')?.textContent).toContain('Recovered');
  });

  it('should set the document title to the loaded post once it arrives', async () => {
    httpMock
      .expectOne(`${POSTS_URL}/1`)
      .flush({ id: 1, title: 'Dynamic titles', body: 'Set once data arrives.' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(TestBed.inject(Title).getTitle()).toBe('Dynamic titles · Angular Deep Dive');
  });

  it('should refetch when the id input changes', async () => {
    httpMock.expectOne(`${POSTS_URL}/1`).flush({ id: 1, title: 'First post', body: 'First body.' });
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentRef.setInput('id', '2');
    fixture.detectChanges();

    httpMock
      .expectOne(`${POSTS_URL}/2`)
      .flush({ id: 2, title: 'Second post', body: 'Second body.' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeEl().querySelector('article h3')?.textContent).toContain('Second post');
  });
});
