import { Feedback } from './feedback';
import { unsavedFeedbackGuard } from './unsaved-feedback.guard';

describe('unsavedFeedbackGuard', () => {
  function fakeFeedback(dirty: boolean): Feedback {
    return { hasUnsavedChanges: () => dirty } as Feedback;
  }

  it('should allow navigation away when the form has no unsaved changes', () => {
    const result = unsavedFeedbackGuard(fakeFeedback(false), {} as never, {} as never, {} as never);

    expect(result).toBe(true);
  });

  it('should ask for confirmation when the form is dirty, and honor "leave"', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const result = unsavedFeedbackGuard(fakeFeedback(true), {} as never, {} as never, {} as never);

    expect(window.confirm).toHaveBeenCalledWith('You have unsaved changes. Leave this page?');
    expect(result).toBe(true);
  });

  it('should ask for confirmation when the form is dirty, and honor "stay"', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const result = unsavedFeedbackGuard(fakeFeedback(true), {} as never, {} as never, {} as never);

    expect(result).toBe(false);
  });
});
