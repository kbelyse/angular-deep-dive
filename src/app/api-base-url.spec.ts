import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from './api-base-url';
import { Posts } from './posts/posts';

describe('API_BASE_URL', () => {
  it('defaults to the real JSONPlaceholder host', () => {
    TestBed.configureTestingModule({});
    expect(TestBed.inject(API_BASE_URL)).toBe('https://jsonplaceholder.typicode.com');
  });

  it('overriding it in a test module redirects every request built from it', async () => {
    await TestBed.configureTestingModule({
      imports: [Posts],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: 'https://example.test/api' },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Posts);
    fixture.detectChanges();

    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('https://example.test/api/posts?_limit=10').flush([]);
    httpMock.verify();
  });
});
