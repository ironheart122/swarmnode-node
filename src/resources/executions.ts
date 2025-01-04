import type { JsonArray, JsonValue } from 'type-fest'

import { CursorPage } from '../pagination'
import { APIResource } from '../resource'

export class Executions extends APIResource {
  static readonly BASE_PATH = 'executions'

  /**
   * Lists all executions with pagination support
   * @param {ExecutionListParams} [params] - Filter parameters
   * @param {string} [params.agent_id] - Filter executions by agent ID
   * @param {string} [params.agent_executor_job_id] - Filter executions by agent executor job ID
   * @param {string} [params.agent_executor_cron_job_id] - Filter executions by agent executor cron job ID
   * @param {Object} [options] - Pagination options
   * @param {number} [options.page] - Page number to retrieve
   * @returns {Promise<Page<ExecutionInfo>>} Paginated list of executions
   * @example
   * const executionsPage = await client.executions.list(
   *   { agent_id: 'agent_123' },
   *   { page: 1 }
   * );
   */
  async list(
    params?: ExecutionListParams,
    options?: { page?: number },
  ): Promise<CursorPage<ExecutionInfo>> {
    return this._client.getAPICursorList<ExecutionInfo>(`/v1/${Executions.BASE_PATH}`, {
      query: {
        ...params,
        ...(options?.page ? { page: String(options.page) } : {}),
      },
    })
  }

  /**
   * Retrieves an execution by its ID
   * @param {string} id - Unique identifier of the execution
   * @returns {Promise<ExecutionInfo>} Retrieved execution information
   * @throws {Error} When execution is not found
   * @example
   * const execution = await client.executions.retrieve('execution_123');
   */
  async retrieve(id: string): Promise<ExecutionInfo> {
    return this._client.get<ExecutionInfo>(`/v1/${Executions.BASE_PATH}/${id}/`)
  }
}

/**
 * Parameters for filtering executions
 * @interface ExecutionListParams
 * @property {string} [agent_id] - Filter executions by agent ID
 * @property {string} [agent_executor_job_id] - Filter executions by agent executor job ID
 * @property {string} [agent_executor_cron_job_id] - Filter executions by agent executor cron job ID
 */
export interface ExecutionListParams {
  agent_id?: string
  agent_executor_job_id?: string
  agent_executor_cron_job_id?: string
}

/**
 * Possible status values for an execution
 * @type {ExecutionStatus}
 */
export type ExecutionStatus = 'success' | 'in_progress' | 'failure' | 'termination'

/**
 * Information about an execution
 * @interface Execution
 * @property {string} id - Unique identifier of the execution
 * @property {string} agent_id - ID of the agent this execution belongs to
 * @property {string | null | undefined} agent_executor_job_id - ID of the agent executor job, if applicable
 * @property {string | null | undefined} agent_executor_cron_job_id - ID of the agent executor cron job, if applicable
 * @property {ExecutionStatus} status - Current status of the execution
 * @property {string} start - ISO 8601 timestamp of when the execution started
 * @property {string | null} finish - ISO 8601 timestamp of when the execution finished, if completed
 * @property {JsonArray} logs - Array of log entries from the execution
 * @property {JsonValue} return_value - Return value from the execution
 */
export interface ExecutionInfo {
  id: string
  agent_id: string
  agent_executor_job_id: string | null | undefined
  agent_executor_cron_job_id: string | null | undefined
  status: ExecutionStatus
  start: string
  finish: string | null
  logs: JsonArray
  return_value: JsonValue
}
