import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoFocus } from './auto-focus';

@Component({
  imports: [AutoFocus],
  template: `<input appAutoFocus placeholder="name" />`,
})
class TestHost {}

describe('AutoFocus', () => {
  let fixture: ComponentFixture<TestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
  });

  it('should focus its host element after the first render', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(document.activeElement).not.toBe(input);

    fixture.detectChanges();

    expect(document.activeElement).toBe(input);
  });
});
