import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { HttpLoading } from './http-loading';
import { loadingInterceptor } from './loading-interceptor';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let httpLoading: HttpLoading;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    httpLoading = TestBed.inject(HttpLoading);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should report loading while the request is in flight', () => {
    expect(httpLoading.isLoading()).toBe(false);

    http.get('/api/example').subscribe();
    expect(httpLoading.isLoading()).toBe(true);

    httpMock.expectOne('/api/example').flush({});
    expect(httpLoading.isLoading()).toBe(false);
  });

  it('should stop reporting loading even when the request fails', () => {
    http.get('/api/example').subscribe({ error: () => {} });
    expect(httpLoading.isLoading()).toBe(true);

    httpMock
      .expectOne('/api/example')
      .flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    expect(httpLoading.isLoading()).toBe(false);
  });

  it('should stay loading while any of several concurrent requests are pending', () => {
    http.get('/api/one').subscribe();
    http.get('/api/two').subscribe();

    httpMock.expectOne('/api/one').flush({});
    expect(httpLoading.isLoading()).toBe(true);

    httpMock.expectOne('/api/two').flush({});
    expect(httpLoading.isLoading()).toBe(false);
  });
});
