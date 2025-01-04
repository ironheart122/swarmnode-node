import type { JsonValue } from 'type-fest'

import { CursorPage } from '../pagination'
import { APIResource } from '../resource'

export class AgentExecutorJobs extends APIResource {
  static readonly BASE_PATH = 'agent-executor-jobs'

  async list(
    params?: AgentExecutorJobListParams,
    options?: { page?: number },
  ): Promise<CursorPage<AgentExecutorJobInfo>> {
    return this._client.getAPICursorList<AgentExecutorJobInfo>(
      `/v1/${AgentExecutorJobs.BASE_PATH}`,
      {
        query: {
          ...params,
          ...(options?.page ? { page: String(options.page) } : {}),
        },
      },
    )
  }

  async retrieve(id: string): Promise<AgentExecutorJobInfo> {
    return this._client.get<AgentExecutorJobInfo>(`${AgentExecutorJobs.BASE_PATH}/${id}/`)
  }

  async create(params: CreateAgentExecutorJobParams): Promise<AgentExecutorJobInfo> {
    return this._client.post<CreateAgentExecutorJobParams, AgentExecutorJobInfo>(
      `/v1/${AgentExecutorJobs.BASE_PATH}/create/`,
      {
        body: params,
      },
    )
  }
}

/**
 * Information about an agent executor job
 */
export interface AgentExecutorJobInfo {
  /** Unique identifier of the job */
  id: string
  /** ID of the agent this job belongs to */
  agent_id: string
  /** Address where the execution can be accessed */
  execution_address: string
  /** Timestamp when the job was created */
  created: string
}

/**
 * Parameters for creating a new agent executor job
 */
export interface CreateAgentExecutorJobParams {
  /** ID of the agent to create the job for */
  agent_id: string
  /** Optional payload data to pass to the job */
  payload?: JsonValue
}

/**
 * Parameters for filtering agent executor jobs
 */
export interface AgentExecutorJobListParams {
  /** Filter jobs by agent ID */
  agent_id?: string
}
