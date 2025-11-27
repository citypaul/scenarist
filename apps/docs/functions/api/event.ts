export const onRequest: PagesFunction = async (context) => {
  const response = await fetch('https://plausible.io/api/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': context.request.headers.get('User-Agent') ?? '',
      'X-Forwarded-For': context.request.headers.get('CF-Connecting-IP') ?? '',
    },
    body: context.request.body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
