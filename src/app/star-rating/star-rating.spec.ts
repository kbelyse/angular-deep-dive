import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StarRating } from './star-rating';

describe('StarRating', () => {
  let component: StarRating;
  let fixture: ComponentFixture<StarRating>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRating],
    }).compileComponents();

    fixture = TestBed.createComponent(StarRating);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function nativeEl(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function buttons(): HTMLButtonElement[] {
    return Array.from(nativeEl().querySelectorAll('button'));
  }

  it('should default to 5 stars, none pressed', () => {
    const stars = buttons();
    expect(stars).toHaveLength(5);
    expect(stars.every((button) => button.getAttribute('aria-pressed') === 'false')).toBe(true);
  });

  it('should respect a smaller max input', () => {
    fixture.componentRef.setInput('max', 3);
    fixture.detectChanges();

    expect(buttons()).toHaveLength(3);
  });

  it('should render an initial value passed in via [value]', () => {
    fixture.componentRef.setInput('value', 3);
    fixture.detectChanges();

    const stars = buttons();
    expect(stars[0].getAttribute('aria-pressed')).toBe('true');
    expect(stars[2].getAttribute('aria-pressed')).toBe('true');
    expect(stars[3].getAttribute('aria-pressed')).toBe('false');
  });

  it('should update value() and press every star up to the click', () => {
    buttons()[2].click();
    fixture.detectChanges();

    expect(component.value()).toBe(3);
    const stars = buttons();
    expect(stars[0].getAttribute('aria-pressed')).toBe('true');
    expect(stars[2].getAttribute('aria-pressed')).toBe('true');
    expect(stars[3].getAttribute('aria-pressed')).toBe('false');
  });

  it('should emit valueChange when a star is clicked, the model() two-way binding hook', () => {
    const valueChangeSpy = vi.fn();
    component.value.subscribe(valueChangeSpy);

    buttons()[1].click();

    expect(valueChangeSpy).toHaveBeenCalledWith(2);
  });

  it('should give each star a distinct accessible name', () => {
    const labels = buttons().map((button) => button.getAttribute('aria-label'));
    expect(labels).toEqual(['1 star', '2 stars', '3 stars', '4 stars', '5 stars']);
  });
});
