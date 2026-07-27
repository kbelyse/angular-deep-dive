import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Favorites } from '../favorites';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let favorites: Favorites;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    favorites = TestBed.inject(Favorites);
    fixture.detectChanges();
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
});
