import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { Favorites } from '../favorites';
import { Tab } from '../tabs/tab';
import { Tabs } from '../tabs/tabs';
import { RecentPosts } from './recent-posts/recent-posts';

@Component({
  selector: 'app-home',
  imports: [RouterLink, RecentPosts, Tabs, Tab, ConfirmDialog],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly favorites = inject(Favorites);

  protected readonly confirmingClear = signal(false);

  protected requestClear(): void {
    this.confirmingClear.set(true);
  }

  protected confirmClear(): void {
    this.favorites.clear();
    this.confirmingClear.set(false);
  }

  protected cancelClear(): void {
    this.confirmingClear.set(false);
  }
}
