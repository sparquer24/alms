export const logError = (message: string, error?: unknown): void => {
  console.error(`[ERROR]: ${message}`, error);
};

export const logDebug = (message: string): void => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[DEBUG]: ${message}`);
  }
};
