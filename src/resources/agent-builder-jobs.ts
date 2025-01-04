import { type Page } from '../pagination'
import { APIResource } from '../resource'

export class AgentBuilderJobs extends APIResource {
  static readonly BASE_PATH = 'agent-builder-jobs'

  /**
   * Lists all agent builder jobs with pagination support
   * @param {AgentBuilderJobListParams} [params] - Filter parameters
   * @param {string} [params.agent_id] - Filter jobs by agent ID
   * @param {Object} [options] - Pagination options
   * @param {number} [options.page] - Page number to retrieve
   * @returns {Promise<Page<AgentBuilderJobInfo>>} Paginated list of agent builder jobs
   * @example
   * const jobsPage = await client.agentBuilderJobs.list(
   *   { agent_id: 'agent_123' },
   *   { page: 1 }
   * );
   */
  async list(
    params?: AgentBuilderJobListParams,
    options?: { page?: number },
  ): Promise<Page<AgentBuilderJobInfo>> {
    return this._client.getAPIList<AgentBuilderJobInfo>(
      `/v1/${AgentBuilderJobs.BASE_PATH}`,
      {
        query: {
          ...params,
          ...(options?.page ? { page: String(options.page) } : {}),
        },
      },
    )
  }

  /**
   * Retrieves an agent builder job by its ID
   * @param {string} id - Unique identifier of the agent builder job
   * @returns {Promise<AgentBuilderJobInfo>} Retrieved agent builder job information
   * @throws {Error} When agent builder job is not found
   * @example
   * const job = await client.agentBuilderJobs.retrieve('job_123');
   */
  async retrieve(id: string): Promise<AgentBuilderJobInfo> {
    return this._client.get<AgentBuilderJobInfo>(
      `/v1/${AgentBuilderJobs.BASE_PATH}/${id}/`,
    )
  }
}

/**
 * Information about an agent builder job
 * @interface AgentBuilderJobInfo
 * @property {string} id - Unique identifier of the agent builder job
 * @property {string} agent_id - ID of the agent this job belongs to
 * @property {string} created - ISO 8601 timestamp of when the job was created
 */
export interface AgentBuilderJobInfo {
  id: string
  agent_id: string
  created: string
}

/**
 * Parameters for filtering agent builder jobs
 * @interface AgentBuilderJobListParams
 * @property {string} [agent_id] - Filter jobs by agent ID
 */
export interface AgentBuilderJobListParams {
  agent_id?: string
}
