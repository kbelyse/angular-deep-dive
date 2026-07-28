import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RowHighlight } from './row-highlight';

@Component({
  imports: [RowHighlight],
  template: `
    <div appRowHighlight>
      <button type="button">focus me</button>
    </div>
  `,
})
class TestHost {}

describe('RowHighlight', () => {
  let fixture: ComponentFixture<TestHost>;
  let row: HTMLElement;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const nativeEl = fixture.nativeElement as HTMLElement;
    row = nativeEl.querySelector('[appRowHighlight]') as HTMLElement;
    button = nativeEl.querySelector('button') as HTMLButtonElement;
  });

  it('should not be highlighted initially', () => {
    expect(row.classList).not.toContain('highlighted');
  });

  it('should highlight when a descendant receives focus', () => {
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();

    expect(row.classList).toContain('highlighted');
  });

  it('should stop highlighting once focus leaves', () => {
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();

    button.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();

    expect(row.classList).not.toContain('highlighted');
  });

  it('should highlight on hover, independent of focus', () => {
    row.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(row.classList).toContain('highlighted');

    row.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(row.classList).not.toContain('highlighted');
  });

  it('should stay highlighted while either focused or hovered', () => {
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    row.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    row.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();

    expect(row.classList).toContain('highlighted');
  });
});
