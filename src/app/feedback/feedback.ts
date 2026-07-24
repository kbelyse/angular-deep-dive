import { Component, signal } from '@angular/core';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';

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

  protected readonly feedbackForm = form(this.model, (path) => {
    required(path.name, { message: 'Enter your name.' });
    required(path.email, { message: 'Enter your email address.' });
    email(path.email, { message: 'Enter a valid email address.' });
    required(path.message, { message: 'Enter a message.' });
    minLength(path.message, 10, { message: 'Say a bit more — at least 10 characters.' });
  });
}
