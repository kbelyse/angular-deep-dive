import { TestBed } from '@angular/core/testing';

import { ToastQueue } from './toast-queue';

describe('ToastQueue', () => {
  let toastQueue: ToastQueue;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    toastQueue = TestBed.inject(ToastQueue);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start empty', () => {
    expect(toastQueue.all()).toEqual([]);
  });

  it('should add a toast on show', () => {
    toastQueue.show('Favorites cleared.');

    expect(toastQueue.all()).toHaveLength(1);
    expect(toastQueue.all()[0].message).toBe('Favorites cleared.');
  });

  it('should give each toast a distinct id', () => {
    toastQueue.show('First');
    toastQueue.show('Second');

    const ids = toastQueue.all().map((toast) => toast.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('should auto-dismiss after the default duration', () => {
    toastQueue.show('Gone soon');
    expect(toastQueue.all()).toHaveLength(1);

    vi.advanceTimersByTime(4000);

    expect(toastQueue.all()).toEqual([]);
  });

  it('should not dismiss early, before its duration elapses', () => {
    toastQueue.show('Still here', 1000);

    vi.advanceTimersByTime(999);

    expect(toastQueue.all()).toHaveLength(1);
  });

  it('should dismiss a specific toast on request, leaving others', () => {
    toastQueue.show('Keep me', 10_000);
    toastQueue.show('Dismiss me', 10_000);
    const [, second] = toastQueue.all();

    toastQueue.dismiss(second.id);

    expect(toastQueue.all()).toHaveLength(1);
    expect(toastQueue.all()[0].message).toBe('Keep me');
  });
});
