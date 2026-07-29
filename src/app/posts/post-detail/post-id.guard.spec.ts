import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { postIdGuard } from './post-id.guard';

describe('postIdGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  function runGuard(id: string | null) {
    const route = {
      paramMap: convertToParamMap(id === null ? {} : { id }),
    } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => postIdGuard(route, {} as RouterStateSnapshot));
  }

  it('should allow a plain numeric id', () => {
    expect(runGuard('42')).toBe(true);
  });

  it('should reject a non-numeric id and redirect to /posts', () => {
    const result = runGuard('abc');
    const router = TestBed.inject(Router);

    expect(result).not.toBe(true);
    expect((result as UrlTree).toString()).toBe(router.parseUrl('/posts').toString());
  });

  it('should reject a missing id and redirect to /posts', () => {
    const result = runGuard(null);
    const router = TestBed.inject(Router);

    expect(result).not.toBe(true);
    expect((result as UrlTree).toString()).toBe(router.parseUrl('/posts').toString());
  });
});
