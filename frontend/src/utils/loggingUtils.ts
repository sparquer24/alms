export const logError = (_message: string, _error?: unknown): void => {
  // Intentionally empty - logging disabled for production
};

export const logDebug = (_message: string): void => {
  if (process.env.NODE_ENV === 'development') {
    // Intentionally empty - debug logging disabled
  }
};
