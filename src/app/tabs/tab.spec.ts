import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tab } from './tab';

@Component({
  imports: [Tab],
  template: `<app-tab title="Solo">Solo content</app-tab>`,
})
class TestHost {}

describe('Tab', () => {
  let fixture: ComponentFixture<TestHost>;
  let tab: Tab;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    tab = fixture.debugElement.children[0].componentInstance as Tab;
  });

  function nativeEl(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('should not render its panel while inactive', () => {
    expect(tab.active()).toBe(false);
    expect(nativeEl().querySelector('[role="tabpanel"]')).toBeNull();
  });

  it('should render its panel once activated', () => {
    tab.activate();
    fixture.detectChanges();

    expect(tab.active()).toBe(true);
    expect(nativeEl().querySelector('[role="tabpanel"]')?.textContent).toContain('Solo content');
  });

  it('should hide its panel again once deactivated', () => {
    tab.activate();
    fixture.detectChanges();

    tab.deactivate();
    fixture.detectChanges();

    expect(nativeEl().querySelector('[role="tabpanel"]')).toBeNull();
  });

  it('should link the panel to its tab button via matching ids', () => {
    tab.activate();
    fixture.detectChanges();

    const panel = nativeEl().querySelector('[role="tabpanel"]') as HTMLElement;
    expect(panel.id).toBe(tab.panelId());
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.tabId());
  });
});
