import APIClient, { type RequestOptions } from './client'

export interface PagePaginatedResponse<T> {
  next: string | null
  previous: string | null
  results: T[]
  total_count: number
  current_page: number
}

export interface CursorPaginatedResponse<T> {
  next: string | null
  previous: string | null
  results: T[]
}

export class Page<T, R = T> implements AsyncIterable<R> {
  constructor(
    private readonly client: APIClient,
    private readonly path: string,
    private readonly response: PagePaginatedResponse<T>,
    private readonly options?: RequestOptions,
    private readonly transformer?: (item: T) => R,
  ) {}

  /**
   * Returns transformed items from the current page
   */
  getItems(): R[] {
    return this.transformer
      ? this.response.results.map(this.transformer)
      : (this.response.results as unknown as R[])
  }

  /**
   * Checks if there is a next page
   */
  hasNextPage(): boolean {
    return !!this.response.next
  }

  /**
   * Returns the current page number
   */
  getCurrentPageNumber(): number {
    return this.response.current_page ?? 1
  }

  /**
   * Fetches the next page
   */
  async getNextPage(): Promise<Page<T, R> | null> {
    if (!this.response.next) {
      return null
    }

    let nextOptions = { ...this.options }

    // For page-based pagination with full URLs
    const nextUrl = new URL(this.response.next)
    nextOptions = {
      ...nextOptions,
      query: Object.fromEntries(nextUrl.searchParams),
    }

    const response = await this.client.get<PagePaginatedResponse<T>>(
      this.path,
      nextOptions,
    )
    return new Page(this.client, this.path, response, nextOptions, this.transformer)
  }

  /**
   * Async iterator for all items across all pages
   */
  async *[Symbol.asyncIterator](): AsyncGenerator<R> {
    let self: Page<T, R> | null = this

    while (true) {
      for (const item of this.getItems()) {
        yield item
      }

      if (!self?.hasNextPage()) {
        break
      }

      self = await self.getNextPage()
    }
  }
}

export class CursorPage<T, R = T> implements AsyncIterable<R> {
  constructor(
    private readonly client: APIClient,
    private readonly path: string,
    private readonly response: CursorPaginatedResponse<T>,
    private readonly options?: RequestOptions,
    private readonly transformer?: (item: T) => R,
  ) {}

  /**
   * Returns transformed items from the current page
   */
  getItems(): R[] {
    return this.transformer
      ? this.response.results.map(this.transformer)
      : (this.response.results as unknown as R[])
  }

  /**
   * Checks if there is a next page
   */
  hasNextPage(): boolean {
    return !!this.response.next
  }

  /**
   * Fetches the next page
   */
  async getNextPage(): Promise<CursorPage<T, R> | null> {
    if (!this.response.next) {
      return null
    }

    let nextOptions = { ...this.options }

    const nextUrl = new URL(this.response.next)
    nextOptions = {
      ...nextOptions,
      query: Object.fromEntries(nextUrl.searchParams),
    }

    const response = await this.client.get<CursorPaginatedResponse<T>>(
      this.path,
      nextOptions,
    )

    return new CursorPage(this.client, this.path, response, nextOptions, this.transformer)
  }

  /**
   * Async iterator for all items across all pages
   */
  async *[Symbol.asyncIterator](): AsyncGenerator<R> {
    let currentPage: CursorPage<T, R> | null = this

    while (true) {
      for (const item of this.getItems()) {
        yield item
      }

      if (!currentPage?.hasNextPage()) {
        break
      }

      currentPage = await currentPage.getNextPage()
    }
  }
}
