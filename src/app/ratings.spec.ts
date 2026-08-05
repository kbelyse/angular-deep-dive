import { TestBed } from '@angular/core/testing';

import { Ratings } from './ratings';

describe('Ratings', () => {
  let ratings: Ratings;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    ratings = TestBed.inject(Ratings);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should default to 0 for a post with no rating', () => {
    expect(ratings.get('1')).toBe(0);
  });

  it('should rate a post', () => {
    ratings.set('1', 4);

    expect(ratings.get('1')).toBe(4);
  });

  it('should track ratings per post independently', () => {
    ratings.set('1', 4);
    ratings.set('2', 2);

    expect(ratings.get('1')).toBe(4);
    expect(ratings.get('2')).toBe(2);
  });

  it('should overwrite a previous rating for the same post', () => {
    ratings.set('1', 4);
    ratings.set('1', 5);

    expect(ratings.get('1')).toBe(5);
  });

  it('should hydrate its initial state from localStorage', () => {
    localStorage.setItem('post-ratings', JSON.stringify({ '1': 4, '2': 2 }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const hydrated = TestBed.inject(Ratings);

    expect(hydrated.get('1')).toBe(4);
    expect(hydrated.get('2')).toBe(2);
  });

  it('should persist a rating to localStorage', () => {
    ratings.set('1', 3);
    TestBed.flushEffects();

    expect(JSON.parse(localStorage.getItem('post-ratings') ?? '{}')).toEqual({ '1': 3 });
  });

  it('should start empty when localStorage holds malformed JSON', () => {
    localStorage.setItem('post-ratings', '{not valid json');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const hydrated = TestBed.inject(Ratings);

    expect(hydrated.get('1')).toBe(0);
  });

  it('should start empty when localStorage holds an out-of-range value', () => {
    localStorage.setItem('post-ratings', JSON.stringify({ '1': 9 }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const hydrated = TestBed.inject(Ratings);

    expect(hydrated.get('1')).toBe(0);
  });
});
