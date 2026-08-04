import { effect, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme-preference';

function prefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

function initialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return prefersDark() ? 'dark' : 'light';
}

@Injectable({ providedIn: 'root' })
export class ThemePreference {
  private readonly theme = signal<Theme>(initialTheme());

  readonly current = this.theme.asReadonly();

  constructor() {
    effect(() => {
      const theme = this.theme();
      localStorage.setItem(STORAGE_KEY, theme);
      document.documentElement.dataset['theme'] = theme;
    });
  }

  toggle(): void {
    this.theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
  }
}
