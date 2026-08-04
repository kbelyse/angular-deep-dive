import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Favorites } from './favorites';
import { HttpLoading } from './http-loading';
import { ThemePreference } from './theme-preference';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Angular Deep Dive');

  private readonly router = inject(Router);
  private readonly favorites = inject(Favorites);
  protected readonly httpLoading = inject(HttpLoading);
  protected readonly themePreference = inject(ThemePreference);

  protected readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected isCurrentPageFavorite(): boolean {
    return this.favorites.isFavorite(this.currentPath());
  }

  protected toggleFavorite(): void {
    this.favorites.toggle(this.currentPath());
  }
}
