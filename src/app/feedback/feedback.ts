import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

interface FeedbackFormValue {
  name: string;
  email: string;
  message: string;
}

@Component({
  selector: 'app-feedback',
  imports: [FormField],
  templateUrl: './feedback.html',
  styleUrl: './feedback.scss',
})
export class Feedback {
  private readonly model = signal<FeedbackFormValue>({ name: '', email: '', message: '' });

  protected readonly feedbackForm = form(this.model);
}
