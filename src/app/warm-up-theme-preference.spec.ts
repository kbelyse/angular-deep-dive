import { TestBed } from '@angular/core/testing';

import { ThemePreference } from './theme-preference';
import { warmUpThemePreference } from './warm-up-theme-preference';

function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('warmUpThemePreference', () => {
  beforeEach(() => {
    localStorage.clear();
    stubMatchMedia(false);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('should construct ThemePreference and apply its theme to the document', () => {
    TestBed.runInInjectionContext(warmUpThemePreference);
    TestBed.flushEffects();

    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('should be the same ThemePreference instance anything else would inject', () => {
    TestBed.runInInjectionContext(warmUpThemePreference);
    const preference = TestBed.inject(ThemePreference);
    preference.toggle();
    TestBed.flushEffects();

    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
