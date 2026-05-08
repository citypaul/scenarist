export const getAppBaseURL = (): string =>
  process.env.NEXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3002";
