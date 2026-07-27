import { TestBed } from '@angular/core/testing';

import { Favorites } from './favorites';

describe('Favorites', () => {
  let favorites: Favorites;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    favorites = TestBed.inject(Favorites);
  });

  it('should start with nothing favorited', () => {
    expect(favorites.all()).toEqual([]);
    expect(favorites.isFavorite('/counter')).toBe(false);
  });

  it('should favorite a path on toggle', () => {
    favorites.toggle('/counter');

    expect(favorites.isFavorite('/counter')).toBe(true);
    expect(favorites.all()).toEqual(['/counter']);
  });

  it('should unfavorite an already-favorited path on toggle', () => {
    favorites.toggle('/counter');
    favorites.toggle('/counter');

    expect(favorites.isFavorite('/counter')).toBe(false);
    expect(favorites.all()).toEqual([]);
  });

  it('should track multiple favorited paths independently', () => {
    favorites.toggle('/counter');
    favorites.toggle('/feedback');

    expect(favorites.all()).toEqual(['/counter', '/feedback']);

    favorites.toggle('/counter');

    expect(favorites.all()).toEqual(['/feedback']);
  });
});
