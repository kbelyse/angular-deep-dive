import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Favorites } from '../favorites';
import { RecentPosts } from './recent-posts/recent-posts';

@Component({
  selector: 'app-home',
  imports: [RouterLink, RecentPosts],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly favorites = inject(Favorites);
}
