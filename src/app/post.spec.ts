import { readingTime } from './post';

describe('readingTime', () => {
  it('should round up to the nearest whole minute', () => {
    const body = Array(201).fill('word').join(' ');
    expect(readingTime(body)).toBe(2);
  });

  it('should never report less than one minute', () => {
    expect(readingTime('A short sentence.')).toBe(1);
    expect(readingTime('')).toBe(1);
  });

  it('should collapse repeated whitespace when counting words', () => {
    const body = Array(200).fill('word').join('   \n');
    expect(readingTime(body)).toBe(1);
  });
});
