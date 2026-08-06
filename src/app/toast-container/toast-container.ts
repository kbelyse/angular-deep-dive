import { Component, inject } from '@angular/core';
import { ToastQueue } from '../toast-queue';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
})
export class ToastContainer {
  protected readonly toastQueue = inject(ToastQueue);
}
