export const logError = (message: string, error?: unknown): void => {
  // In a real production app, this would send to Sentry, DataDog, etc.
  console.error(`[ERROR] ${message}`, error || '');
};

