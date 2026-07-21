import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Counter } from './counter';

describe('Counter', () => {
  let component: Counter;
  let fixture: ComponentFixture<Counter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Counter],
    }).compileComponents();

    fixture = TestBed.createComponent(Counter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function countText(): string | null | undefined {
    return (fixture.nativeElement as HTMLElement).querySelector('.count')?.textContent;
  }

  function clickButton(index: number): void {
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    (buttons[index] as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start at zero', () => {
    expect(countText()).toContain('0');
  });

  it('should increment when the + button is clicked', () => {
    clickButton(1);
    expect(countText()).toContain('1');
  });

  it('should decrement when the - button is clicked', () => {
    clickButton(0);
    expect(countText()).toContain('-1');
  });

  it('should reset to zero when the reset button is clicked', () => {
    clickButton(1);
    clickButton(1);
    clickButton(2);
    expect(countText()).toContain('0');
  });
});
