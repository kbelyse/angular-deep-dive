import { TestBed } from '@angular/core/testing';
import { Route } from '@angular/router';
import { of } from 'rxjs';

import { SelectivePreloadingStrategy } from './selective-preloading-strategy';

describe('SelectivePreloadingStrategy', () => {
  it('should resolve via Angular DI as a root-provided singleton', () => {
    const a = TestBed.inject(SelectivePreloadingStrategy);
    const b = TestBed.inject(SelectivePreloadingStrategy);
    expect(a).toBeInstanceOf(SelectivePreloadingStrategy);
    expect(a).toBe(b);
  });

  let strategy: SelectivePreloadingStrategy;

  beforeEach(() => {
    strategy = new SelectivePreloadingStrategy();
  });

  it('should preload a route flagged with data.preload', () =>
    new Promise<void>((resolve) => {
      const route: Route = { path: 'posts', data: { preload: true } };
      const load = vi.fn(() => of('loaded'));

      strategy.preload(route, load).subscribe((value) => {
        expect(load).toHaveBeenCalled();
        expect(value).toBe('loaded');
        resolve();
      });
    }));

  it('should skip a route without the preload flag, never calling load', () =>
    new Promise<void>((resolve) => {
      const route: Route = { path: 'feedback' };
      const load = vi.fn(() => of('loaded'));

      strategy.preload(route, load).subscribe((value) => {
        expect(load).not.toHaveBeenCalled();
        expect(value).toBeNull();
        resolve();
      });
    }));

  it('should skip a route with data.preload explicitly false', () =>
    new Promise<void>((resolve) => {
      const route: Route = { path: 'counter', data: { preload: false } };
      const load = vi.fn(() => of('loaded'));

      strategy.preload(route, load).subscribe((value) => {
        expect(load).not.toHaveBeenCalled();
        expect(value).toBeNull();
        resolve();
      });
    }));
});
