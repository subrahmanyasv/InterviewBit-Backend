/**
 * A simple console logger module that mimics the Winston logger interface (info, error, warn)
 * but only prints to the standard console. This is useful for debugging or simplifying logging
 * without file transports.
 *
 * It adds basic color coding for readability.
 */

// ANSI color codes
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
  };
  
  /**
   * Logs an info-level message to the console.
   * @param message - The main log message.
   * @param meta - Optional additional data to log.
   */
  const info = (message: string, ...meta: unknown[]): void => {
    const timestamp = new Date().toISOString();
    console.log(
      `${timestamp} ${colors.green}[INFO]${colors.reset} ${message}`,
      ...meta
    );
  };
  
  /**
   * Logs a warning-level message to the console.
   * @param message - The main log message.
   * @param meta - Optional additional data to log.
   */
  const warn = (message: string, ...meta: unknown[]): void => {
    const timestamp = new Date().toISOString();
    console.warn(
      `${timestamp} ${colors.yellow}[WARN]${colors.reset} ${message}`,
      ...meta
    );
  };
  
  /**
   * Logs an error-level message to the console.
   * @param message - The main log message.
   * @param meta - Optional additional data to log (e.g., an error object).
   */
  const error = (message: string, ...meta: unknown[]): void => {
    const timestamp = new Date().toISOString();
    console.error(
      `${timestamp} ${colors.red}[ERROR]${colors.reset} ${message}`,
      ...meta
    );
  };
  
  const logger = {
    info,
    warn,
    error,
  };
  
  export default logger;