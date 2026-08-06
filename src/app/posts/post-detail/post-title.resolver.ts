import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../api-base-url';

export const postTitleResolver: ResolveFn<string> = (route) => {
  const http = inject(HttpClient);
  const apiBaseUrl = inject(API_BASE_URL);
  const id = route.paramMap.get('id');
  return http.get<{ title: string }>(`${apiBaseUrl}/posts/${id}`).pipe(map((post) => post.title));
};
