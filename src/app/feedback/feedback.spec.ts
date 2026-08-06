import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Feedback } from './feedback';

describe('Feedback', () => {
  let component: Feedback;
  let fixture: ComponentFixture<Feedback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Feedback],
    }).compileComponents();

    fixture = TestBed.createComponent(Feedback);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function nativeEl(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function setValue(id: string, value: string): void {
    const el = nativeEl().querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
    el.value = value;
    el.dispatchEvent(new Event('input'));
    el.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  async function submitForm(): Promise<void> {
    const form = nativeEl().querySelector('form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function fillValidForm(): void {
    setValue('name', 'Ada');
    setValue('email', 'ada@example.com');
    setValue('message', 'Loving Signal Forms so far.');
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a heading', () => {
    expect(nativeEl().querySelector('h2')?.textContent).toContain('Feedback');
  });

  it('should focus the name field on load', () => {
    const nameInput = nativeEl().querySelector('#name');
    expect(document.activeElement).toBe(nameInput);
  });

  it('should disable the submit button until every field is valid', () => {
    const button = nativeEl().querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    fillValidForm();

    expect(button.disabled).toBe(false);
  });

  it('should show an accessible error once a required field is touched and left empty', () => {
    const nameInput = nativeEl().querySelector('#name') as HTMLInputElement;
    nameInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    const error = nativeEl().querySelector('#name-error');
    expect(error?.textContent).toContain('Enter your name.');
    expect(nameInput.getAttribute('aria-invalid')).toBe('true');
    expect(nameInput.getAttribute('aria-describedby')).toBe('name-error');
  });

  it('should reject an invalid email address', () => {
    setValue('email', 'not-an-email');

    const error = nativeEl().querySelector('#email-error');
    expect(error?.textContent).toContain('Enter a valid email address.');
  });

  it('should submit, show a success message, and reset the form', async () => {
    fillValidForm();

    await submitForm();

    expect(nativeEl().querySelector('.success')?.textContent).toContain('Thanks');
    expect((nativeEl().querySelector('#name') as HTMLInputElement).value).toBe('');
  });
});
