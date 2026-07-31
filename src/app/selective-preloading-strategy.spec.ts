import { Route } from '@angular/router';
import { of } from 'rxjs';

import { SelectivePreloadingStrategy } from './selective-preloading-strategy';

describe('SelectivePreloadingStrategy', () => {
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
});
