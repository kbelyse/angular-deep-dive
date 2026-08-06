import { inject } from '@angular/core';
import { ThemePreference } from './theme-preference';

export function warmUpThemePreference(): void {
  inject(ThemePreference);
}
