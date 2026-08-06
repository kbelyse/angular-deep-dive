import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable } from 'rxjs';

import { postTitleResolver } from './post-title.resolver';

describe('postTitleResolver', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function runResolver(id: string): Observable<string> {
    const route = { paramMap: convertToParamMap({ id }) } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(
      () => postTitleResolver(route, {} as RouterStateSnapshot) as Observable<string>,
    );
  }

  it('should resolve to just the title, from a request scoped to the id', () => {
    let resolved: string | undefined;
    runResolver('7').subscribe((title) => (resolved = title));

    httpMock
      .expectOne('https://jsonplaceholder.typicode.com/posts/7')
      .flush({ id: 7, title: 'Resolved ahead of time', body: 'Not read by this resolver.' });

    expect(resolved).toBe('Resolved ahead of time');
  });
});
