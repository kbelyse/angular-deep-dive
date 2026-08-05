import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { Favorites } from './favorites';
import { HttpLoading } from './http-loading';
import { ThemePreference } from './theme-preference';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Angular Deep Dive');
  });

  it('should mark the active route link with aria-current', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/counter');
    fixture.detectChanges();

    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('nav a');
    expect(links[0].getAttribute('aria-current')).toBeNull();
    expect(links[1].getAttribute('aria-current')).toBe('page');
  });

  it('should toggle the favorite state of the current page', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const favorites = TestBed.inject(Favorites);
    fixture.detectChanges();

    await router.navigateByUrl('/counter');
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '.favorite-toggle',
    ) as HTMLButtonElement;
    expect(button.getAttribute('aria-pressed')).toBe('false');

    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(favorites.isFavorite('/counter')).toBe(true);

    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(favorites.isFavorite('/counter')).toBe(false);
  });

  it('should toggle the theme preference from the header button', () => {
    const fixture = TestBed.createComponent(App);
    const themePreference = TestBed.inject(ThemePreference);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '.theme-toggle',
    ) as HTMLButtonElement;
    const initial = themePreference.current();

    button.click();
    fixture.detectChanges();

    expect(themePreference.current()).not.toBe(initial);
    expect(button.getAttribute('aria-pressed')).toBe(String(themePreference.current() === 'dark'));
  });

  it('should render a skip link as the first focusable element, pointing at #main-content', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const skipLink = compiled.querySelector('a.skip-link') as HTMLAnchorElement;
    const main = compiled.querySelector('main');

    expect(skipLink).toBeTruthy();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(main?.id).toBe('main-content');
    expect(compiled.querySelectorAll('a, button')[0]).toBe(skipLink);
  });

  it('should show the loading bar only while a request is pending', () => {
    const fixture = TestBed.createComponent(App);
    const httpLoading = TestBed.inject(HttpLoading);
    fixture.detectChanges();

    const bar = (fixture.nativeElement as HTMLElement).querySelector('.loading-bar');
    expect(bar?.classList.contains('loading-bar--active')).toBe(false);

    httpLoading.start();
    fixture.detectChanges();
    expect(bar?.classList.contains('loading-bar--active')).toBe(true);

    httpLoading.stop();
    fixture.detectChanges();
    expect(bar?.classList.contains('loading-bar--active')).toBe(false);
  });
});
