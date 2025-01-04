import type { JsonArray } from 'type-fest'

import { type Page } from '../pagination'
import { APIResource } from '../resource'

/**
 * Information about a build
 * @interface BuildInfo
 * @property {string} id - Unique identifier of the build
 * @property {string} agent_builder_job_id - ID of the agent builder job this build belongs to
 * @property {BuildStatus} status - Current status of the build
 * @property {JsonArray} logs - Build execution logs
 * @property {string} created - ISO 8601 timestamp of when the build was created
 */
export interface BuildInfo {
  id: string
  agent_builder_job_id: string
  status: BuildStatus
  logs: JsonArray
  created: string
}

/**
 * Parameters for filtering builds
 * @interface BuildListParams
 * @property {string} [agent_builder_job_id] - Filter builds by agent builder job ID
 */
export interface BuildListParams {
  agent_builder_job_id?: string
}

/**
 * Possible build status values
 * @enum {string}
 */
export const BuildStatusEnum = {
  success: 'success',
  in_progress: 'in_progress',
  failure: 'failure',
} as const

export type BuildStatus = keyof typeof BuildStatusEnum

export class Builds extends APIResource {
  static readonly BASE_PATH = 'builds'

  /**
   * Lists all builds with pagination support
   * @param {BuildListParams} [params] - Filter parameters
   * @param {string} [params.agent_builder_job_id] - Filter builds by agent builder job ID
   * @param {Object} [options] - Pagination options
   * @param {number} [options.page] - Page number to retrieve
   * @returns {Promise<Page<BuildInfo>>} Paginated list of builds
   * @example
   * const buildsPage = await client.builds.list(
   *   { agent_builder_job_id: 'job_123' },
   *   { page: 1 }
   * );
   */
  async list(
    params?: BuildListParams,
    options?: { page?: number },
  ): Promise<Page<BuildInfo>> {
    return this._client.getAPIList<BuildInfo>(`/v1/${Builds.BASE_PATH}`, {
      query: { ...params, ...(options?.page ? { page: String(options.page) } : {}) },
    })
  }

  /**
   * Retrieves a build by its ID
   * @param {string} id - Unique identifier of the build
   * @returns {Promise<BuildInfo>} Retrieved build information
   * @throws {Error} When build is not found
   * @example
   * const build = await client.builds.retrieve('build_123');
   */
  async retrieve(id: string): Promise<BuildInfo> {
    return this._client.get<BuildInfo>(`/v1/${Builds.BASE_PATH}/${id}/`)
  }
}
