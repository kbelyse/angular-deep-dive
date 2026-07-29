export interface Post {
  id: number;
  title: string;
  body: string;
}

function isPost(value: unknown): value is Post {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'number' &&
    typeof candidate['title'] === 'string' &&
    typeof candidate['body'] === 'string'
  );
}

export function parsePosts(value: unknown): Post[] {
  if (!Array.isArray(value) || !value.every(isPost)) {
    throw new Error('Received an unexpected posts response.');
  }
  return value;
}

export function parsePost(value: unknown): Post {
  if (!isPost(value)) {
    throw new Error('Received an unexpected post response.');
  }
  return value;
}
