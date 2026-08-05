import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialog } from './confirm-dialog';

@Component({
  imports: [ConfirmDialog],
  template: `
    <button type="button">Open</button>
    <app-confirm-dialog
      [open]="open()"
      message="Delete this item?"
      confirmLabel="Delete"
      cancelLabel="Keep"
      (confirmed)="confirmed.set(true)"
      (cancelled)="cancelled.set(true)"
    />
  `,
})
class TestHost {
  readonly open = signal(false);
  readonly confirmed = signal(false);
  readonly cancelled = signal(false);
}

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function nativeEl(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function dialogButtons(): HTMLButtonElement[] {
    return Array.from(nativeEl().querySelectorAll('.dialog button'));
  }

  it('should not render while closed', () => {
    expect(nativeEl().querySelector('.dialog')).toBeNull();
  });

  it('should render the message and both actions once open', () => {
    host.open.set(true);
    fixture.detectChanges();

    expect(nativeEl().querySelector('#confirm-dialog-message')?.textContent).toBe(
      'Delete this item?',
    );
    const [cancel, confirm] = dialogButtons();
    expect(cancel.textContent).toContain('Keep');
    expect(confirm.textContent).toContain('Delete');
  });

  it('should move focus into the dialog when opened, and back to the trigger on close', () => {
    const trigger = nativeEl().querySelector('button') as HTMLButtonElement;
    trigger.focus();

    host.open.set(true);
    fixture.detectChanges();

    expect(document.activeElement).toBe(dialogButtons()[0]);

    host.open.set(false);
    fixture.detectChanges();

    expect(document.activeElement).toBe(trigger);
  });

  it('should emit confirmed when the confirm button is clicked', () => {
    host.open.set(true);
    fixture.detectChanges();

    dialogButtons()[1].click();

    expect(host.confirmed()).toBe(true);
    expect(host.cancelled()).toBe(false);
  });

  it('should emit cancelled when the cancel button is clicked', () => {
    host.open.set(true);
    fixture.detectChanges();

    dialogButtons()[0].click();

    expect(host.cancelled()).toBe(true);
  });

  it('should emit cancelled when the backdrop is clicked, but not when the dialog itself is', () => {
    host.open.set(true);
    fixture.detectChanges();

    nativeEl().querySelector('.dialog')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(host.cancelled()).toBe(false);

    nativeEl().querySelector('.backdrop')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(host.cancelled()).toBe(true);
  });

  it('should emit cancelled on Escape', () => {
    host.open.set(true);
    fixture.detectChanges();

    nativeEl()
      .querySelector('.dialog')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(host.cancelled()).toBe(true);
  });

  it('should wrap Tab focus from the last button back to the first', () => {
    host.open.set(true);
    fixture.detectChanges();

    const [cancel, confirm] = dialogButtons();
    confirm.focus();

    nativeEl()
      .querySelector('.dialog')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));

    expect(document.activeElement).toBe(cancel);
  });

  it('should wrap Shift+Tab focus from the first button back to the last', () => {
    host.open.set(true);
    fixture.detectChanges();

    const [cancel, confirm] = dialogButtons();
    cancel.focus();

    nativeEl()
      .querySelector('.dialog')
      ?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }),
      );

    expect(document.activeElement).toBe(confirm);
  });
});
