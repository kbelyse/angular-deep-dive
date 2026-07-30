import { TestBed } from '@angular/core/testing';

import { HttpLoading } from './http-loading';

describe('HttpLoading', () => {
  let httpLoading: HttpLoading;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    httpLoading = TestBed.inject(HttpLoading);
  });

  it('should start out not loading', () => {
    expect(httpLoading.isLoading()).toBe(false);
  });

  it('should report loading while a request is pending', () => {
    httpLoading.start();

    expect(httpLoading.isLoading()).toBe(true);
  });

  it('should stop reporting loading once every pending request finishes', () => {
    httpLoading.start();
    httpLoading.start();
    httpLoading.stop();

    expect(httpLoading.isLoading()).toBe(true);

    httpLoading.stop();

    expect(httpLoading.isLoading()).toBe(false);
  });

  it('should never go negative when stopped more times than started', () => {
    httpLoading.stop();
    httpLoading.stop();
    httpLoading.start();

    expect(httpLoading.isLoading()).toBe(true);
  });
});
