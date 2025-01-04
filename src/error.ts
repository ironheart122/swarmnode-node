import { type Headers } from 'node-fetch'

export class SwarmNodeError extends Error {}

export class APIError<
  TStatus extends number | undefined = number | undefined,
  THeaders extends Headers | undefined = Headers | undefined,
  TError extends Record<string, unknown> | undefined =
    | Record<string, unknown>
    | undefined,
> extends SwarmNodeError {
  /** HTTP status for the response that caused the error */
  readonly status: TStatus
  /** HTTP headers for the response that caused the error */
  readonly headers: THeaders
  /** JSON body of the response that caused the error */
  readonly error: TError

  constructor(
    status: TStatus,
    error: TError,
    message: string | undefined,
    headers: THeaders,
  ) {
    super(`${APIError.makeMessage(status, error, message)}`)
    this.status = status
    this.headers = headers
    this.error = error
  }

  private static makeMessage(
    status: number | undefined,
    error: Record<string, unknown> | undefined,
    message: string | undefined,
  ): string {
    const msg = error?.message
      ? typeof error.message === 'string'
        ? error.message
        : JSON.stringify(error.message)
      : error
        ? JSON.stringify(error)
        : message

    if (status && msg) {
      return `${status} ${msg}`
    }
    if (status) {
      return `${status} status code (no body)`
    }
    if (msg) {
      return msg
    }
    return '(no status code or body)'
  }

  static generate(
    status: number | undefined,
    errorResponse: object | undefined | unknown,
    message: string | undefined,
    headers: Headers | undefined,
  ): APIError {
    if (!status || !headers) {
      return new APIConnectionError({ message, cause: castToError(errorResponse) })
    }

    const error = errorResponse as Record<string, unknown>

    if (status === 400) {
      return new BadRequestError(status, error, message, headers)
    }

    if (status === 401) {
      return new AuthenticationError(status, error, message, headers)
    }

    if (status === 403) {
      return new PermissionDeniedError(status, error, message, headers)
    }

    if (status === 404) {
      return new NotFoundError(status, error, message, headers)
    }

    if (status === 409) {
      return new ConflictError(status, error, message, headers)
    }

    if (status === 422) {
      return new UnprocessableEntityError(status, error, message, headers)
    }

    if (status === 429) {
      return new RateLimitError(status, error, message, headers)
    }

    if (status >= 500) {
      return new InternalServerError(status, error, message, headers)
    }

    return new APIError(status, error, message, headers)
  }
}

export class APIUserAbortError extends APIError<undefined, undefined, undefined> {
  constructor({ message }: { message?: string } = {}) {
    super(undefined, undefined, message || 'Request was aborted.', undefined)
  }
}

export class APIConnectionError extends APIError<undefined, undefined, undefined> {
  constructor({
    message,
    cause,
  }: {
    message?: string | undefined
    cause?: Error | undefined
  }) {
    super(undefined, undefined, message || 'Connection error.', undefined)
    // in some environments the 'cause' property is already declared
    if (cause) this.cause = cause
  }
}

export class APIConnectionTimeoutError extends APIConnectionError {
  constructor({ message }: { message?: string } = {}) {
    super({ message: message ?? 'Request timed out.' })
  }
}

export class BadRequestError extends APIError<400, Headers> {}

export class AuthenticationError extends APIError<401, Headers> {}

export class PermissionDeniedError extends APIError<403, Headers> {}

export class NotFoundError extends APIError<404, Headers> {}

export class ConflictError extends APIError<409, Headers> {}

export class UnprocessableEntityError extends APIError<422, Headers> {}

export class RateLimitError extends APIError<429, Headers> {}

export class InternalServerError extends APIError<number, Headers> {}

export const castToError = (err: unknown): Error => {
  if (err instanceof Error) return err
  if (typeof err === 'object' && err !== null) {
    try {
      return new Error(JSON.stringify(err))
    } catch {
      /* empty */
    }
  }
  return new Error(String(err))
}

export class WebSocketError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message)
    this.name = 'WebSocketError'
  }
}
