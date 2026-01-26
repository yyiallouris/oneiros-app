/**
 * Jungian-grade logger for psychologically sensitive dream data.
 * 
 * Core principle: Dreams are private psyche data. We never log content in production.
 * Only metadata (request IDs, error codes, token counts) should be logged.
 * 
 * Never log:
 * - Dream text/content
 * - Interpretation text
 * - AI responses
 * - User messages
 * - Sexual/trauma imagery
 * 
 * Only log:
 * - Error messages
 * - Request IDs
 * - Model names
 * - Token counts
 * - Error codes
 * - Status codes
 * 
 * Future consideration:
 * - If adding userId/sessionId, hash them before logging (never log raw user identifiers)
 */

export type LogContext = Record<string, any>;

type LogLevel = 'info' | 'warn' | 'error';

// Maximum string length to log in dev mode (prevents accidental dream content leaks)
// Strings longer than this will only log their length
const MAX_STR_LOG = 120;

// Maximum error message length (prevents huge dumps in dev logs)
const MAX_ERROR_MSG = 200;

// Sensitive field names that should never be logged (moved outside function for performance)
// All keys normalized to lowercase for case-insensitive matching
const SENSITIVE_FIELDS = new Set([
  'data',
  'fulldata',
  'content',
  'response',
  'responsetext',
  'dream',
  'dreamcontent',
  'dreamtext',
  'interpretation',
  'messages',
  'conversationhistory',
  'airesponse',
  'usermessage',
  'prompt',
  'payload',
  'body',
  'request',
  'text',
  // Security-sensitive keys (insurance policy)
  'apikey',
  'authorization',
  'token',
  'bearer',
  'secret',
]);

// Key-based redaction: detect sensitive-looking keys (better than value scanning)
// Catches non-standard keys that might contain sensitive content
const keyLooksSensitive = (key: string): boolean => {
  return /dream|content|prompt|message|history|response|interpretation|text|body|payload/i.test(key);
};

/**
 * Determines if a log should be output based on level and environment.
 * - Dev: logs everything
 * - Production: only logs errors
 */
const shouldLog = (level: LogLevel): boolean => {
  if (__DEV__) return true;
  return level === 'error';
};

/**
 * Sanitizes context to remove sensitive fields that should never be logged.
 * Removes fields that commonly contain dream content, AI responses, or user data.
 * Uses key-based redaction (more reliable than value scanning).
 */
const sanitizeContext = (context?: LogContext): LogContext | undefined => {
  if (!context) return undefined;

  // In production, never include context (it may contain sensitive data)
  if (!__DEV__) {
    return undefined;
  }

  // Check if object is a plain object (not array, not special object types)
  const isPlainObject = (value: any): boolean => {
    return Object.prototype.toString.call(value) === '[object Object]';
  };

  const sanitized: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    // Normalize key to lowercase for case-insensitive matching
    // Prevents leaks from variations like "apiKey", "APIKEY", "Authorization", etc.
    const keyLower = key.toLowerCase();
    
    // Skip sensitive fields that might contain dream content or security keys
    if (SENSITIVE_FIELDS.has(keyLower)) {
      continue;
    }

    // Key-based redaction: skip keys that look sensitive (catches non-standard keys)
    // Regex is case-insensitive, so pass original key (keyLower only needed for SENSITIVE_FIELDS Set)
    if (keyLooksSensitive(key)) {
      // Only log length, not content
      if (typeof value === 'string') {
        sanitized[`${key}Length`] = value.length;
      } else if (Array.isArray(value)) {
        sanitized[`${key}Count`] = value.length;
      }
      continue;
    }

    // For strings: avoid logging large text blobs
    if (typeof value === 'string') {
      if (value.length > MAX_STR_LOG) {
        sanitized[`${key}Length`] = value.length;
        continue;
      }
      // Small strings are safe to log
      sanitized[key] = value;
      continue;
    }

    // For arrays/objects, only log metadata (length, count, etc.)
    if (Array.isArray(value)) {
      sanitized[`${key}Count`] = value.length;
    } else if (typeof value === 'object' && value !== null) {
      // Only log safe metadata from objects with proper type checks
      if (typeof (value as any).status === 'number') {
        sanitized[`${key}Status`] = (value as any).status;
      }
      if (typeof (value as any).length === 'number') {
        sanitized[`${key}Length`] = (value as any).length;
      }
      if (typeof (value as any).hasError === 'boolean') {
        sanitized[`${key}HasError`] = (value as any).hasError;
      }
      // Only count keys for plain objects (safer, avoids expensive/unsafe operations)
      if (isPlainObject(value)) {
        try {
          sanitized[`${key}KeysCount`] = Object.keys(value).length;
        } catch {
          // Skip if Object.keys throws (e.g., Proxy with non-enumerable props)
        }
      }
    } else {
      // Only log primitive values that are safe (not content)
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Core logging function with severity levels.
 * 
 * @param level - Log severity: 'info', 'warn', or 'error'
 * @param name - Log name/identifier
 * @param context - Optional context (sanitized in production)
 */
export const log = (
  level: LogLevel,
  name: string,
  context?: LogContext
): void => {
  if (!shouldLog(level)) return;

  // Sanitize context - never log sensitive data in production
  const payload = sanitizeContext(context);

  const prefix = `[APP][${level.toUpperCase()}] ${name}`;

  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(prefix, payload ?? '');
  } else if (level === 'warn') {
    // eslint-disable-next-line no-console
    console.warn(prefix, payload ?? '');
  } else {
    // eslint-disable-next-line no-console
    console.log(prefix, payload ?? '');
  }
};

/**
 * Log an informational event.
 * Only logs in dev mode.
 */
export const logInfo = (name: string, context?: LogContext): void => {
  log('info', name, context);
};

/**
 * Log a warning.
 * Only logs in dev mode.
 */
export const logWarn = (name: string, context?: LogContext): void => {
  log('warn', name, context);
};

/**
 * Helper to create safe context with request metadata.
 * Use this to include requestId and model in logs without logging sensitive content.
 * 
 * @param requestId - Unique request identifier
 * @param model - Model name (optional)
 * @returns Safe context object with requestId and model
 * 
 * @example
 * logError('ai_error', err, withReq('req-123', 'gpt-4'));
 */
export const withReq = (requestId: string, model?: string): LogContext => {
  const ctx: LogContext = { requestId };
  if (model) {
    ctx.model = model;
  }
  return ctx;
};

/**
 * Log an error.
 * Always logs (even in production), but never includes sensitive context.
 * 
 * Optimized to avoid double sanitization (bypasses log() to call console.error directly).
 * 
 * @param name - Error identifier
 * @param error - Error object
 * @param context - Optional context (sanitized - never includes dream content)
 */
export const logError = (name: string, error: any, context?: LogContext): void => {
  if (!shouldLog('error')) return;

  // Extract safe error metadata (name, code, message - all safe, no content)
  let errorMessage = error?.message ?? String(error);
  const errorName = error?.name;
  const errorCode = error?.code;

  // Truncate error message to prevent huge dumps in dev logs
  // Some proxies/APIs return verbose error bodies that shouldn't be logged
  if (typeof errorMessage === 'string' && errorMessage.length > MAX_ERROR_MSG) {
    errorMessage = errorMessage.slice(0, MAX_ERROR_MSG) + '…';
  }

  // Build safe payload - sanitize once, include error metadata
  const payload = __DEV__
    ? { 
        name: errorName, 
        code: errorCode, 
        message: errorMessage, 
        ...sanitizeContext(context) 
      }
    : { 
        name: errorName, 
        code: errorCode, 
        message: errorMessage 
      };

  // eslint-disable-next-line no-console
  console.error(`[APP][ERROR] ${name}`, payload);
};

/**
 * Log a general event.
 * @deprecated Use logInfo() instead for clarity
 */
export const logEvent = (name: string, context?: LogContext): void => {
  logInfo(name, context);
};