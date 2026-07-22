import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
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
});
