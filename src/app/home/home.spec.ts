import {
  ComponentFixture,
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Favorites } from '../favorites';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let favorites: Favorites;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    favorites = TestBed.inject(Favorites);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a heading', () => {
    const heading = (fixture.nativeElement as HTMLElement).querySelector('h2');
    expect(heading?.textContent).toContain('Home');
  });

  it('should show an empty state when nothing is favorited', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty')?.textContent).toContain('Nothing favorited yet');
    expect(compiled.querySelector('.favorites-list')).toBeNull();
  });

  it('should list favorited pages once some exist', () => {
    favorites.toggle('/counter');
    favorites.toggle('/feedback');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.favorites-list a');
    expect(compiled.querySelector('.empty')).toBeNull();
    expect(links.length).toBe(2);
    expect(links[0].textContent).toContain('/counter');
    expect(links[1].textContent).toContain('/feedback');
  });

  it('should render the Learn more tabs with the Overview panel selected first', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tabButtons = compiled.querySelectorAll('[role="tab"]');

    expect(Array.from(tabButtons).map((b) => b.textContent?.trim())).toEqual([
      'Overview',
      'Keyboard shortcuts',
      'Accessibility',
    ]);
    expect(compiled.querySelector('[role="tabpanel"]')?.textContent).toContain(
      'running log of Angular concepts',
    );
  });

  describe('clear all favorites', () => {
    beforeEach(() => {
      favorites.toggle('/counter');
      favorites.toggle('/feedback');
      fixture.detectChanges();
    });

    function nativeEl(): HTMLElement {
      return fixture.nativeElement as HTMLElement;
    }

    it('should not show a confirm dialog until the button is clicked', () => {
      expect(nativeEl().querySelector('.dialog')).toBeNull();
    });

    it('should open a confirm dialog when Clear all favorites is clicked', () => {
      (nativeEl().querySelector('.clear-favorites') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(nativeEl().querySelector('#confirm-dialog-message')?.textContent).toContain(
        "Remove every favorited page?",
      );
    });

    it('should keep every favorite if the dialog is cancelled', () => {
      (nativeEl().querySelector('.clear-favorites') as HTMLButtonElement).click();
      fixture.detectChanges();

      const [cancel] = nativeEl().querySelectorAll<HTMLButtonElement>('.dialog button');
      cancel.click();
      fixture.detectChanges();

      expect(nativeEl().querySelector('.dialog')).toBeNull();
      expect(favorites.all()).toEqual(['/counter', '/feedback']);
    });

    it('should clear every favorite once confirmed', () => {
      (nativeEl().querySelector('.clear-favorites') as HTMLButtonElement).click();
      fixture.detectChanges();

      const [, confirm] = nativeEl().querySelectorAll<HTMLButtonElement>('.dialog button');
      confirm.click();
      fixture.detectChanges();

      expect(nativeEl().querySelector('.dialog')).toBeNull();
      expect(favorites.all()).toEqual([]);
      expect(nativeEl().querySelector('.empty')?.textContent).toContain('Nothing favorited yet');
    });
  });

  describe('recent posts defer block', () => {
    it('should show the placeholder before the block triggers', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.defer-placeholder')?.textContent).toContain(
        'Recent posts will appear',
      );
    });

    it('should show the loading block while rendering', async () => {
      const [deferBlock] = await fixture.getDeferBlocks();
      await deferBlock.render(DeferBlockState.Loading);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.defer-loading')?.textContent).toContain(
        'Loading recent posts',
      );
    });

    it('should render RecentPosts once the block completes', async () => {
      const [deferBlock] = await fixture.getDeferBlocks();
      await deferBlock.render(DeferBlockState.Complete);

      const httpMock = TestBed.inject(HttpTestingController);
      httpMock
        .expectOne('https://jsonplaceholder.typicode.com/posts?_limit=3')
        .flush([{ id: 1, title: 'Deferred loading', body: '...' }]);
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-recent-posts')).toBeTruthy();
      expect(compiled.querySelector('.recent-posts-list li')?.textContent).toContain(
        'Deferred loading',
      );
      httpMock.verify();
    });
  });
});
