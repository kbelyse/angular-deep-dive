import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Title } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';

function routeData(path: string): Record<string, unknown> | undefined {
  return routes.find((route) => route.path === path)?.data;
}

describe('app routes', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should render Home at the root path', async () => {
    const harness = await RouterTestingHarness.create('/');
    const compiled = harness.routeNativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Home');
  });

  it('should render the Learn more tabs on Home', async () => {
    const harness = await RouterTestingHarness.create('/');
    const compiled = harness.routeNativeElement as HTMLElement;
    expect(compiled.querySelectorAll('[role="tab"]').length).toBe(3);
  });

  it('should render Counter at /counter', async () => {
    const harness = await RouterTestingHarness.create('/counter');
    const compiled = harness.routeNativeElement as HTMLElement;
    expect(compiled.querySelector('.counter')).toBeTruthy();
  });

  it('should render Feedback at /feedback', async () => {
    const harness = await RouterTestingHarness.create('/feedback');
    const compiled = harness.routeNativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Feedback');
  });

  it('should render Posts at /posts', async () => {
    const harness = await RouterTestingHarness.create('/posts');
    httpMock.expectOne('https://jsonplaceholder.typicode.com/posts?_limit=10').flush([]);
    const compiled = harness.routeNativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Posts');
  });

  it('should render PostDetail at /posts/:id', async () => {
    const harness = await RouterTestingHarness.create('/posts/1');
    httpMock
      .expectOne('https://jsonplaceholder.typicode.com/posts/1')
      .flush({ id: 1, title: 'A post', body: 'Body text.' });
    const compiled = harness.routeNativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Post');
  });

  it('should redirect /posts/:id to /posts when the id is not numeric', async () => {
    await RouterTestingHarness.create('/posts/not-a-number');

    expect(TestBed.inject(Router).url).toBe('/posts');
    httpMock.expectOne('https://jsonplaceholder.typicode.com/posts?_limit=10').flush([]);
  });

  it('should render NotFound for an unknown path', async () => {
    const harness = await RouterTestingHarness.create('/does-not-exist');
    const compiled = harness.routeNativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('not found');
  });

  it('should set the document title per route', async () => {
    await RouterTestingHarness.create('/counter');
    expect(TestBed.inject(Title).getTitle()).toBe('Counter · Angular Deep Dive');
  });

  it('should flag posts and counter for preloading, but not feedback', () => {
    expect(routeData('posts')?.['preload']).toBe(true);
    expect(routeData('counter')?.['preload']).toBe(true);
    expect(routeData('feedback')?.['preload']).toBeUndefined();
  });
});
