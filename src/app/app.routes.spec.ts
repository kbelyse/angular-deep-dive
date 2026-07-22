import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Title } from '@angular/platform-browser';
import { routes } from './app.routes';

describe('app routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
  });

  it('should render Home at the root path', async () => {
    const harness = await RouterTestingHarness.create('/');
    const compiled = harness.routeNativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Home');
  });

  it('should render Counter at /counter', async () => {
    const harness = await RouterTestingHarness.create('/counter');
    const compiled = harness.routeNativeElement as HTMLElement;
    expect(compiled.querySelector('.counter')).toBeTruthy();
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
});
