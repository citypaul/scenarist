type PlausibleEventOptions = {
  readonly props?: Readonly<Record<string, string | number | boolean>>;
  readonly callback?: () => void;
};

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: {
        props?: Record<string, string | number | boolean>;
        callback?: () => void;
      }
    ) => void;
  }
}

export const trackEvent = (
  eventName: string,
  options?: PlausibleEventOptions
): void => {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(eventName, options);
  }
};
