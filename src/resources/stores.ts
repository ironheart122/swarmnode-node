import type { JsonValue } from 'type-fest'

import { type Page } from '../pagination'
import { APIResource } from '../resource'

export class Stores extends APIResource {
  static readonly BASE_PATH = 'stores'

  /**
   * Lists all stores with pagination support
   * @param {Object} [options] - Pagination options
   * @param {number} [options.page] - Page number to retrieve
   * @returns {Promise<Page<StoreInfo>>} Paginated list of stores
   * @example
   * const storesPage = await client.stores.list({ page: 1 });
   */
  async list(options?: { page?: number }): Promise<Page<StoreInfo>> {
    return this._client.getAPIList<StoreInfo>(`/v1/${Stores.BASE_PATH}`, {
      query: options?.page ? { page: String(options.page) } : undefined,
    })
  }

  /**
   * Creates a new store
   * @param {CreateStoreParams} params - Store creation parameters
   * @returns {Promise<Store>} Created store information
   * @example
   * const store = await client.stores.create({ name: 'My Store' });
   */
  async create(params: CreateStoreParams): Promise<Store> {
    return this._client.post<CreateStoreParams, Store>(
      `/v1/${Stores.BASE_PATH}/create/`,
      {
        body: params,
      },
    )
  }

  /**
   * Retrieves a store by its ID
   * @param {string} id - Unique identifier of the store
   * @returns {Promise<Store>} Retrieved store information
   * @throws {Error} When store is not found
   * @example
   * const store = await client.stores.retrieve('store_123');
   */
  async retrieve(id: string): Promise<Store> {
    return this._client.get<Store>(`/v1/${Stores.BASE_PATH}/${id}/`)
  }

  /**
   * Updates a store by its ID
   * @param {string} id - Unique identifier of the store
   * @param {UpdateStoreParams} params - Store update parameters
   * @returns {Promise<Store>} Updated store information
   * @throws {Error} When store is not found
   * @example
   * const store = await client.stores.update('store_123', { name: 'New Name' });
   */
  async update(id: string, params: UpdateStoreParams): Promise<Store> {
    return this._client.patch<UpdateStoreParams, Store>(
      `/v1/${Stores.BASE_PATH}/${id}/update/`,
      {
        body: params,
      },
    )
  }

  /**
   * Deletes a store by its ID
   * @param {string} id - Unique identifier of the store
   * @returns {Promise<void>}
   * @throws {Error} When store is not found
   * @example
   * await client.stores.remove('store_123');
   */
  async remove(id: string): Promise<void> {
    return this._client.delete<void>(`/v1/${Stores.BASE_PATH}/${id}/delete/`)
  }
}

/**
 * Basic store information
 * @interface StoreInfo
 * @property {string} id - Unique identifier of the store
 * @property {string} name - Name of the store
 * @property {JsonValue} data - Custom data associated with the store
 * @property {string} created - ISO 8601 timestamp of when the store was created
 */
export interface StoreInfo {
  id: string
  name: string
  data: JsonValue
  created: string
}

/**
 * Complete store information
 * @interface Store
 * @property {string} id - Unique identifier of the store
 * @property {string} name - Name of the store
 * @property {JsonValue} data - Custom data associated with the store
 * @property {string} created - ISO 8601 timestamp of when the store was created
 */
export interface Store {
  id: string
  name: string
  data: JsonValue
  created: string
}

/**
 * Parameters for creating a store
 * @interface CreateStoreParams
 * @property {string} name - Name of the store
 */
export interface CreateStoreParams {
  name: string
}

/**
 * Parameters for updating a store
 * @interface UpdateStoreParams
 * @property {string} [name] - New name for the store
 */
export interface UpdateStoreParams {
  name?: string
}
