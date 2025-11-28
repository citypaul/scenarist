import type { APIRoute } from 'astro';

export const prerender = false;

const FALLBACK_SCRIPT = '// Analytics unavailable\nwindow.plausible = function() {};';

export const GET: APIRoute = async () => {
  try {
    const response = await fetch('https://plausible.io/js/script.js');

    if (!response.ok) {
      return new Response(FALLBACK_SCRIPT, {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    const body = await response.text();

    return new Response(body, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control':
          response.headers.get('Cache-Control') ?? 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Analytics script proxy error:', error);
    return new Response(FALLBACK_SCRIPT, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
};
