import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { PostDetail } from './post-detail';

describe('PostDetail', () => {
  let component: PostDetail;
  let fixture: ComponentFixture<PostDetail>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostDetail],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PostDetail);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    httpMock.expectOne('https://jsonplaceholder.typicode.com/posts/1').flush({
      id: 1,
      title: 'A post',
      body: 'Some body text.',
    });
    expect(component).toBeTruthy();
  });

  it('should render a heading', () => {
    httpMock.expectOne('https://jsonplaceholder.typicode.com/posts/1').flush({
      id: 1,
      title: 'A post',
      body: 'Some body text.',
    });
    const heading = (fixture.nativeElement as HTMLElement).querySelector('h2');
    expect(heading?.textContent).toContain('Post');
  });
});
