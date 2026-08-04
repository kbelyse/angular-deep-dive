import { TestBed } from '@angular/core/testing';

import { Favorites } from './favorites';

describe('Favorites', () => {
  let favorites: Favorites;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    favorites = TestBed.inject(Favorites);
  });

  afterEach(() => {
    localStorage.clear();
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

  it('should hydrate its initial state from localStorage', () => {
    localStorage.setItem('favorite-paths', JSON.stringify(['/counter', '/feedback']));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const hydrated = TestBed.inject(Favorites);

    expect(hydrated.all()).toEqual(['/counter', '/feedback']);
  });

  it('should persist toggles to localStorage', () => {
    favorites.toggle('/counter');
    TestBed.flushEffects();

    expect(JSON.parse(localStorage.getItem('favorite-paths') ?? '[]')).toEqual(['/counter']);
  });

  it('should start empty when localStorage holds malformed JSON', () => {
    localStorage.setItem('favorite-paths', '{not valid json');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const hydrated = TestBed.inject(Favorites);

    expect(hydrated.all()).toEqual([]);
  });
});
