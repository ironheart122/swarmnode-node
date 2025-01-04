import nodeFetch, { Headers, Response } from 'node-fetch'
import WebSocket from 'ws'

import type { HTTPMethod, RequestOptions } from './client'
import { APIError, WebSocketError } from './error'
import { debug } from './lib/logger'
import { safeJSON } from './lib/utils'

export interface WebSocketOptions {
  timeout?: number
}

export class WebSocketHandler {
  private readonly DEFAULT_TIMEOUT = 600000 // 10 minutes

  constructor(
    private readonly baseURL: string,
    private readonly getAuthHeaders: () => Record<string, string>,
  ) {}

  public async listen<T>(path: string, options: WebSocketOptions = {}): Promise<T> {
    const ws = this.createWebSocket(path)
    const timeout = options.timeout ?? this.DEFAULT_TIMEOUT

    return new Promise<T>((resolve, reject) => {
      const chunks: string[] = []
      const timeoutId = setTimeout(() => {
        reject(new WebSocketError(`WebSocket connection timed out after ${timeout}ms`))
        ws?.close()
      }, timeout)

      ws.on('message', (data: WebSocket.RawData) => chunks.push(data.toString()))

      ws.on('close', () => {
        clearTimeout(timeoutId)
        this.handleWebSocketClose(chunks, resolve, reject)
      })

      ws.on('error', (error) => {
        clearTimeout(timeoutId)
        reject(new WebSocketError('WebSocket connection error', error as Error))
      })
    })
  }

  public async *stream<T>(
    path: string,
    options: WebSocketOptions = {},
  ): AsyncGenerator<T> {
    const ws = this.createWebSocket(path)
    const timeout = options.timeout ?? this.DEFAULT_TIMEOUT
    const queue: string[] = []
    let isConnectionClosed = false

    try {
      this.setupStreamHandlers(ws, queue, () => (isConnectionClosed = true))
      yield* this.processStreamMessages<T>(ws, queue, timeout, () => isConnectionClosed)
    } finally {
      if (ws.readyState !== WebSocket.CLOSED) {
        ws.close()
      }
    }
  }

  private createWebSocket(path: string): WebSocket {
    const url = `wss://${this.baseURL}/ws${path}`
    const ws = new WebSocket(url, { headers: this.getAuthHeaders() })

    ws.on('open', () => debug.log(`WebSocket connected to ${url}`))
    ws.on('error', (error) => debug.error(`WebSocket error on ${url}:`, error))
    ws.on('close', () => debug.log(`WebSocket disconnected from ${url}`))

    return ws
  }

  private handleWebSocketClose<T>(
    chunks: string[],
    resolve: (value: T) => void,
    reject: (error: Error) => void,
  ): void {
    const message = chunks.join('')
    if (!message) {
      reject(new WebSocketError('Connection closed without receiving any message'))
      return
    }

    try {
      resolve(JSON.parse(message) as T)
    } catch (error) {
      reject(
        new WebSocketError('Failed to parse WebSocket message as JSON', error as Error),
      )
    }
  }

  private setupStreamHandlers(ws: WebSocket, queue: string[], onClose: () => void): void {
    ws.on('message', (data: WebSocket.RawData) => queue.push(data.toString()))
    ws.on('error', (error) => {
      throw new WebSocketError('WebSocket stream error', error as Error)
    })
    ws.on('close', onClose)
  }

  private async *processStreamMessages<T>(
    ws: WebSocket,
    queue: string[],
    timeout: number,
    isClosedFn: () => boolean,
  ): AsyncGenerator<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new WebSocketError(`WebSocket connection timed out after ${timeout}ms`))
      }, timeout)
    })

    while (!isClosedFn()) {
      if (queue.length > 0) {
        const message = queue.shift()!
        try {
          yield JSON.parse(message) as T
        } catch (error) {
          throw new WebSocketError(
            'Failed to parse WebSocket message as JSON',
            error as Error,
          )
        }
      } else {
        await Promise.race([
          new Promise<void>((resolve) => {
            ws.once('message', resolve)
            ws.once('close', resolve)
          }),
          timeoutPromise,
        ])
      }
    }
  }
}

export class HTTPHandler {
  constructor(
    private readonly baseURL: string,
    private readonly getAuthHeaders: () => Record<string, string>,
  ) {}

  private getDefaultHeaders(): Record<string, string> {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
    }
  }

  public async request<T>(
    method: HTTPMethod,
    path: string,
    options?: RequestOptions,
  ): Promise<T> {
    const url = this.buildURL(path, options?.query)
    const headers = this.buildHeaders(options?.headers)

    const response = await nodeFetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    })

    return this.handleResponse<T>(response)
  }

  private buildURL(path: string, query?: Record<string, string | undefined>): string {
    const url = new URL(path.startsWith('http') ? path : `https://${this.baseURL}${path}`)
    if (query) {
      Object.entries(query)
        .filter(([_, value]) => value !== undefined)
        .forEach(([key, value]) => url.searchParams.append(key, value as string))
    }
    return url.toString()
  }

  private buildHeaders(customHeaders?: Record<string, string>): Headers {
    return new Headers({
      ...this.getDefaultHeaders(),
      ...customHeaders,
    })
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw await this.createAPIError(response)
    }

    if (response.status === 204) {
      return null as T
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return (await response.json()) as T
    }

    return response.text() as unknown as T
  }

  private async createAPIError(response: Response): Promise<APIError> {
    const headers = Object.fromEntries(response.headers.entries())
    const errText = await response.text()
    const errJSON = safeJSON(errText)

    return APIError.generate(
      response.status,
      errJSON,
      errJSON ? undefined : errText,
      new Headers(headers),
    )
  }
}
