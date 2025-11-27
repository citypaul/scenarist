import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();

  const response = await fetch('https://plausible.io/api/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': request.headers.get('User-Agent') ?? '',
      'X-Forwarded-For': request.headers.get('CF-Connecting-IP') ?? '',
    },
    body,
  });

  const responseBody = await response.text();

  return new Response(responseBody, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
