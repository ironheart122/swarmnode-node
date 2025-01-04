import { type Page } from '../pagination'
import { APIResource } from '../resource'
import type { ExecutionInfo } from './executions'

export class AgentExecutorCronJobs extends APIResource {
  static readonly BASE_PATH = 'agent-executor-cron-jobs'

  async list(
    params?: AgentExecutorCronJobListParams,
    options?: { page?: number },
  ): Promise<Page<AgentExecutorCronJobInfo, EnhancedAgentExecutorCronJob>> {
    return this._client.getAPIList<
      AgentExecutorCronJobInfo,
      EnhancedAgentExecutorCronJob
    >(
      `/v1/${AgentExecutorCronJobs.BASE_PATH}/`,
      {
        query: {
          ...params,
          ...(options?.page ? { page: String(options.page) } : {}),
        },
      },
      (agentExecutorCronJob) => this.enhanceAgentExecutorCronJob(agentExecutorCronJob),
    )
  }

  async retrieve(id: string): Promise<EnhancedAgentExecutorCronJob> {
    const agentExecutorCronJob = await this._client.get<AgentExecutorCronJobInfo>(
      `/v1/${AgentExecutorCronJobs.BASE_PATH}/${id}/`,
    )

    return this.enhanceAgentExecutorCronJob(agentExecutorCronJob)
  }

  async create(
    params: CreateAgentExecutorCronJobParams,
  ): Promise<EnhancedAgentExecutorCronJob> {
    const agentExecutorCronJob = await this._client.post<
      CreateAgentExecutorCronJobParams,
      AgentExecutorCronJobInfo
    >(`/v1/${AgentExecutorCronJobs.BASE_PATH}/create/`, {
      body: params,
    })

    return this.enhanceAgentExecutorCronJob(agentExecutorCronJob)
  }

  async update(
    id: string,
    params: UpdateAgentExecutorCronJobParams,
  ): Promise<EnhancedAgentExecutorCronJob> {
    const agentExecutorCronJob = await this._client.patch<
      UpdateAgentExecutorCronJobParams,
      AgentExecutorCronJobInfo
    >(`/v1/${AgentExecutorCronJobs.BASE_PATH}/${id}/update/`, {
      body: params,
    })

    return this.enhanceAgentExecutorCronJob(agentExecutorCronJob)
  }

  async remove(id: string): Promise<void> {
    return this._client.delete(`/v1/${AgentExecutorCronJobs.BASE_PATH}/${id}/delete/`)
  }

  private enhanceAgentExecutorCronJob(
    agentExecutorCronJob: AgentExecutorCronJobInfo,
  ): EnhancedAgentExecutorCronJob {
    return {
      ...agentExecutorCronJob,
      stream: () => {
        return this._client.stream(
          `/v1/execution-stream/${agentExecutorCronJob.execution_stream_address}/`,
        )
      },
    }
  }
}

export const AgentExecutorCronJobStatusEnum = {
  suspended: 'suspended',
  running: 'running',
} as const

/**
 * Represents the status of an agent executor cron job
 * @typedef {keyof typeof AgentExecutorCronJobStatusEnum} AgentExecutorCronJobStatus
 */
export type AgentExecutorCronJobStatus = keyof typeof AgentExecutorCronJobStatusEnum

/**
 * Information about an agent executor cron job
 * @interface AgentExecutorCronJobInfo
 */
export interface AgentExecutorCronJobInfo {
  /** Unique identifier of the cron job */
  id: string
  /** ID of the agent this cron job belongs to */
  agent_id: string
  /** Name of the cron job */
  name: string
  /** Current status of the cron job */
  status: AgentExecutorCronJobStatus
  /** Cron expression defining the schedule */
  expression: string
  /** Address for streaming execution results */
  execution_stream_address: string
  /** Creation timestamp */
  created: string
  /** Last modification timestamp */
  modified: string
}

/**
 * Parameters for listing agent executor cron jobs
 * @interface AgentExecutorCronJobListParams
 */
export interface AgentExecutorCronJobListParams {
  /** Optional filter by agent ID */
  agent_id?: string
}

/**
 * Parameters for creating a new agent executor cron job
 * @interface CreateAgentExecutorCronJobParams
 */
export interface CreateAgentExecutorCronJobParams {
  /** Name of the cron job */
  name: string
  /** Cron expression defining the schedule */
  expression: string
  /** ID of the agent to associate with this cron job */
  agent_id: string
}

/**
 * Parameters for updating an existing agent executor cron job
 * @interface UpdateAgentExecutorCronJobParams
 */
export interface UpdateAgentExecutorCronJobParams {
  /** New name for the cron job */
  name?: string
  /** New status for the cron job */
  status?: AgentExecutorCronJobStatus
}

/**
 * Enhanced agent executor cron job with streaming capability
 * @interface EnhancedAgentExecutorCronJob
 * @extends {AgentExecutorCronJobInfo}
 */
export interface EnhancedAgentExecutorCronJob extends AgentExecutorCronJobInfo {
  /** Function to stream execution results */
  stream(): AsyncGenerator<ExecutionInfo, void, unknown>
}
