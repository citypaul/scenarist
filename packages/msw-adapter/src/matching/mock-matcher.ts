import type { ScenaristMock } from '@scenarist/core';
import { matchesUrl } from './url-matcher.js';

export const findMatchingMock = (
  mocks: ReadonlyArray<ScenaristMock>,
  method: string,
  url: string
): ScenaristMock | undefined => {
  return mocks.find((mock) => {
    const methodMatches = mock.method.toUpperCase() === method.toUpperCase();
    const urlMatch = matchesUrl(mock.url, url);
    return methodMatches && urlMatch.matches;
  });
};
