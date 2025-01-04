import { HTTPHandler, WebSocketHandler } from './handlers'
import {
  CursorPage,
  Page,
  type CursorPaginatedResponse,
  type PagePaginatedResponse,
} from './pagination'

export interface ClientConfig {
  baseURL: string
  defaultTimeout?: number
}

export interface RequestOptions<T = unknown> {
  query?: Record<string, string | undefined>
  body?: T
  headers?: Record<string, string>
  signal?: AbortSignal
  timeout?: number
}

export interface WebSocketOptions {
  timeout?: number
}

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

/**
 * Base API client that handles both HTTP and WebSocket communications
 */
export default abstract class APIClient {
  private readonly httpHandler: HTTPHandler
  private readonly wsHandler: WebSocketHandler

  constructor(protected readonly config: ClientConfig) {
    this.httpHandler = new HTTPHandler(config.baseURL, () => this.authHeaders())
    this.wsHandler = new WebSocketHandler(config.baseURL, () => this.authHeaders())
  }

  /**
   * Override this method to provide authentication headers
   */
  protected authHeaders(): Record<string, string> {
    return {}
  }

  /**
   * Performs a GET request
   */
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.httpHandler.request<T>('get', path, options)
  }

  /**
   * Performs a POST request
   */
  post<T, R = unknown>(path: string, options?: RequestOptions<T>): Promise<R> {
    return this.httpHandler.request<R>('post', path, options)
  }

  /**
   * Performs a PUT request
   */
  put<T, R = unknown>(path: string, options?: RequestOptions<T>): Promise<R> {
    return this.httpHandler.request<R>('put', path, options)
  }

  /**
   * Performs a PATCH request
   */
  patch<T, R = unknown>(path: string, options?: RequestOptions<T>): Promise<R> {
    return this.httpHandler.request<R>('patch', path, options)
  }

  /**
   * Performs a DELETE request
   */
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.httpHandler.request<T>('delete', path, options)
  }

  /**
   * Performs a paginated request that returns a Page object
   */
  getAPIList<T, R = T>(
    path: string,
    options?: RequestOptions,
    transformer?: (item: T) => R,
  ): Promise<Page<T, R>> {
    return this.get<PagePaginatedResponse<T>>(path, options).then((response) => {
      return new Page<T, R>(this, path, response, options, transformer)
    })
  }

  /**
   * Performs a paginated request that returns a CursorPage object
   */
  getAPICursorList<T, R = T>(
    path: string,
    options?: RequestOptions,
    transformer?: (item: T) => R,
  ): Promise<CursorPage<T, R>> {
    return this.get<CursorPaginatedResponse<T>>(path, options).then((response) => {
      return new CursorPage<T, R>(this, path, response, options, transformer)
    })
  }

  /**
   * Listens for a single complete message from a WebSocket connection
   */
  listen<T>(path: string, options?: WebSocketOptions): Promise<T> {
    return this.wsHandler.listen<T>(path, options)
  }

  /**
   * Streams WebSocket messages as an async generator
   */
  stream<T>(path: string, options?: WebSocketOptions): AsyncGenerator<T> {
    return this.wsHandler.stream<T>(path, options)
  }
}
