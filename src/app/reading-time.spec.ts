import { ReadingTime } from './reading-time';

describe('ReadingTime', () => {
  it('should format the computed minutes as "N min read"', () => {
    const body = Array(400).fill('word').join(' ');
    expect(new ReadingTime().transform(body)).toBe('2 min read');
  });

  it('should report "1 min read" for a short body', () => {
    expect(new ReadingTime().transform('Short.')).toBe('1 min read');
  });
});
