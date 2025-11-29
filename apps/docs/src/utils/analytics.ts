type PlausibleEventOptions = {
  readonly props?: Record<string, string | number | boolean>;
  readonly callback?: () => void;
};

declare global {
  interface Window {
    plausible?: (event: string, options?: PlausibleEventOptions) => void;
  }
}

export const trackEvent = (
  eventName: string,
  options?: PlausibleEventOptions,
): void => {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(eventName, options);
  }
};
