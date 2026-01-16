/**
 * Logger utility with date-time timestamps
 * Wraps console methods to add [YYYY-MM-DD HH:mm:ss] timestamps to logs
 */

function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export const logger = {
  log: (...args: any[]): void => {
    console.log(`[${getTimestamp()}]`, ...args);
  },

  error: (...args: any[]): void => {
    console.error(`[${getTimestamp()}]`, ...args);
  },

  warn: (...args: any[]): void => {
    console.warn(`[${getTimestamp()}]`, ...args);
  },
};
