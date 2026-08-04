import { TestBed } from '@angular/core/testing';

import { ThemePreference } from './theme-preference';

function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('ThemePreference', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('should default to light when nothing is stored and the system prefers light', () => {
    stubMatchMedia(false);
    TestBed.configureTestingModule({});

    const preference = TestBed.inject(ThemePreference);

    expect(preference.current()).toBe('light');
  });

  it('should default to dark when nothing is stored and the system prefers dark', () => {
    stubMatchMedia(true);
    TestBed.configureTestingModule({});

    const preference = TestBed.inject(ThemePreference);

    expect(preference.current()).toBe('dark');
  });

  it('should prefer a persisted choice over the system preference', () => {
    stubMatchMedia(true);
    localStorage.setItem('theme-preference', 'light');
    TestBed.configureTestingModule({});

    const preference = TestBed.inject(ThemePreference);

    expect(preference.current()).toBe('light');
  });

  it('should flip between light and dark on toggle', () => {
    stubMatchMedia(false);
    TestBed.configureTestingModule({});
    const preference = TestBed.inject(ThemePreference);

    preference.toggle();
    expect(preference.current()).toBe('dark');

    preference.toggle();
    expect(preference.current()).toBe('light');
  });

  it('should persist the toggled theme to localStorage and the document element', () => {
    stubMatchMedia(false);
    TestBed.configureTestingModule({});
    const preference = TestBed.inject(ThemePreference);

    preference.toggle();
    TestBed.flushEffects();

    expect(localStorage.getItem('theme-preference')).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
