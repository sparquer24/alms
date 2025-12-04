export const logError = (message: string, error?: unknown): void => {
};

export const logDebug = (message: string): void => {
  if (process.env.NODE_ENV === 'development') {
  }
};
