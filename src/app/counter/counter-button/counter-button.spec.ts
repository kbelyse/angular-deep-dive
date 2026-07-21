import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CounterButton } from './counter-button';

describe('CounterButton', () => {
  let component: CounterButton;
  let fixture: ComponentFixture<CounterButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterButton],
    }).compileComponents();

    fixture = TestBed.createComponent(CounterButton);
    fixture.componentRef.setInput('label', '+');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the label', () => {
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button?.textContent).toContain('+');
  });

  it('should emit pressed when clicked', () => {
    const pressedSpy = vi.fn();
    component.pressed.subscribe(pressedSpy);

    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();

    expect(pressedSpy).toHaveBeenCalledOnce();
  });
});
