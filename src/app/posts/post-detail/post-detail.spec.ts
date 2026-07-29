import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostDetail } from './post-detail';

describe('PostDetail', () => {
  let component: PostDetail;
  let fixture: ComponentFixture<PostDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(PostDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a heading', () => {
    const heading = (fixture.nativeElement as HTMLElement).querySelector('h2');
    expect(heading?.textContent).toContain('Post');
  });
});
