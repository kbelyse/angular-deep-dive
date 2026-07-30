import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Favorites } from '../favorites';
import { Tab } from '../tabs/tab';
import { Tabs } from '../tabs/tabs';
import { RecentPosts } from './recent-posts/recent-posts';

@Component({
  selector: 'app-home',
  imports: [RouterLink, RecentPosts, Tabs, Tab],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly favorites = inject(Favorites);
}
