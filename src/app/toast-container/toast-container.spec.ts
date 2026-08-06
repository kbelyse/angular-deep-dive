import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastContainer } from './toast-container';
import { ToastQueue } from '../toast-queue';

describe('ToastContainer', () => {
  let fixture: ComponentFixture<ToastContainer>;
  let toastQueue: ToastQueue;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainer],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainer);
    toastQueue = TestBed.inject(ToastQueue);
    fixture.detectChanges();
  });

  function nativeEl(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('should render nothing while the queue is empty', () => {
    expect(nativeEl().querySelectorAll('.toast')).toHaveLength(0);
  });

  it('should render a toast for each entry in the queue', () => {
    toastQueue.show('Favorites cleared.');
    toastQueue.show('Second toast.');
    fixture.detectChanges();

    const toasts = nativeEl().querySelectorAll('.toast');
    expect(toasts).toHaveLength(2);
    expect(toasts[0].textContent).toBe('Favorites cleared.');
    expect(toasts[1].textContent).toBe('Second toast.');
  });

  it('should expose the container as a polite live region', () => {
    const container = nativeEl().querySelector('.toast-container');
    expect(container?.getAttribute('role')).toBe('status');
    expect(container?.getAttribute('aria-live')).toBe('polite');
  });
});
