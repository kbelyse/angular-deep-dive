import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tabs } from './tabs';
import { Tab } from './tab';

@Component({
  imports: [Tabs, Tab],
  template: `
    <app-tabs label="Fruit">
      <app-tab title="Apple">Apple content</app-tab>
      <app-tab title="Banana">Banana content</app-tab>
      <app-tab title="Cherry">Cherry content</app-tab>
    </app-tabs>
  `,
})
class TestHost {}

describe('Tabs', () => {
  let fixture: ComponentFixture<TestHost>;
  let nativeEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    nativeEl = fixture.nativeElement as HTMLElement;
  });

  function tabButtons(): HTMLButtonElement[] {
    return Array.from(nativeEl.querySelectorAll('[role="tab"]'));
  }

  it('should render a tab button per projected app-tab', () => {
    const buttons = tabButtons();
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Apple', 'Banana', 'Cherry']);
  });

  it('should show only the first panel initially', () => {
    expect(nativeEl.querySelector('[role="tabpanel"]')?.textContent).toContain('Apple content');
    expect(nativeEl.textContent).not.toContain('Banana content');
  });

  it('should mark exactly one tab as selected, with a roving tabindex', () => {
    const buttons = tabButtons();
    expect(buttons[0].getAttribute('aria-selected')).toBe('true');
    expect(buttons[0].getAttribute('tabindex')).toBe('0');
    expect(buttons[1].getAttribute('aria-selected')).toBe('false');
    expect(buttons[1].getAttribute('tabindex')).toBe('-1');
  });

  it('should switch panels when a tab is clicked', () => {
    tabButtons()[1].click();
    fixture.detectChanges();

    expect(nativeEl.querySelector('[role="tabpanel"]')?.textContent).toContain('Banana content');
  });

  it('should link each tab button to its panel via aria-controls', () => {
    tabButtons()[1].click();
    fixture.detectChanges();

    const selectedButton = tabButtons()[1];
    const panel = nativeEl.querySelector('[role="tabpanel"]') as HTMLElement;

    expect(selectedButton.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(selectedButton.id);
  });

  it('should move selection and focus with ArrowRight, wrapping past the end', () => {
    const buttons = tabButtons();
    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(tabButtons()[1].getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabButtons()[1]);

    tabButtons()[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    tabButtons()[2].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();

    expect(tabButtons()[0].getAttribute('aria-selected')).toBe('true');
  });

  it('should move selection with ArrowLeft, wrapping before the start', () => {
    tabButtons()[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    fixture.detectChanges();

    expect(tabButtons()[2].getAttribute('aria-selected')).toBe('true');
  });

  it('should jump to the first and last tab with Home and End', () => {
    tabButtons()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(tabButtons()[2].getAttribute('aria-selected')).toBe('true');

    tabButtons()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(tabButtons()[0].getAttribute('aria-selected')).toBe('true');
  });

  it('should ignore unrelated keys', () => {
    tabButtons()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    fixture.detectChanges();

    expect(tabButtons()[0].getAttribute('aria-selected')).toBe('true');
  });

  it('should apply the "Fruit" label passed by the host', () => {
    expect(nativeEl.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe('Fruit');
  });
});

@Component({
  imports: [Tabs, Tab],
  template: `
    <app-tabs>
      <app-tab title="Only">Only content</app-tab>
    </app-tabs>
  `,
})
class UnlabeledHost {}

describe('Tabs without an explicit label', () => {
  it('should fall back to the default "Tabs" aria-label', async () => {
    await TestBed.configureTestingModule({
      imports: [UnlabeledHost],
    }).compileComponents();

    const fixture = TestBed.createComponent(UnlabeledHost);
    fixture.detectChanges();

    const tablist = (fixture.nativeElement as HTMLElement).querySelector('[role="tablist"]');
    expect(tablist?.getAttribute('aria-label')).toBe('Tabs');
  });
});

@Component({
  imports: [Tabs, Tab],
  template: `
    <app-tabs label="Solo">
      <app-tab title="Only">Only content</app-tab>
    </app-tabs>
  `,
})
class SingleTabHost {}

describe('Tabs with a single tab', () => {
  let fixture: ComponentFixture<SingleTabHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleTabHost],
    }).compileComponents();

    fixture = TestBed.createComponent(SingleTabHost);
    fixture.detectChanges();
  });

  it('should wrap ArrowRight back onto the same tab', () => {
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '[role="tab"]',
    ) as HTMLButtonElement;

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(button.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(button);
  });
});
