import type APIClient from './client'

export class APIResource {
  protected _client: APIClient

  constructor(client: APIClient) {
    this._client = client
  }
}
