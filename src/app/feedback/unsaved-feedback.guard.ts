import { CanDeactivateFn } from '@angular/router';
import { Feedback } from './feedback';

export const unsavedFeedbackGuard: CanDeactivateFn<Feedback> = (component) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }
  return window.confirm('You have unsaved changes. Leave this page?');
};
