import { HttpResponse, delay } from "msw";
import type { ScenaristResponse } from "@scenarist/core";

export const buildResponse = async (
  response: ScenaristResponse,
): Promise<Response> => {
  if (response.delay) {
    await delay(response.delay);
  }

  // Type assertion required: MSW's HttpResponse.json() expects JsonBodyType,
  // but ScenaristResponse.body is typed as 'unknown' to maintain
  // framework-agnostic serialization in core package. The body is guaranteed
  // to be JSON-serializable by ScenaristResponse design contract. We do not
  // perform runtime validation for performance reasons (garbage in, garbage out).
  return HttpResponse.json(response.body as never, {
    status: response.status,
    headers: response.headers,
  });
};
