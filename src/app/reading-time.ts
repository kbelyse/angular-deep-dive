import { Pipe, PipeTransform } from '@angular/core';
import { readingTime } from './post';

@Pipe({ name: 'readingTime' })
export class ReadingTime implements PipeTransform {
  transform(body: string): string {
    const minutes = readingTime(body);
    return `${minutes} min read`;
  }
}
