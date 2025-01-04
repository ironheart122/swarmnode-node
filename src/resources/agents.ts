import type { JsonValue } from 'type-fest'

import { type Page } from '../pagination'
import { APIResource } from '../resource'
import { AgentExecutorJobs } from './agent-executor-jobs'
import type {
  AgentExecutorJobInfo,
  CreateAgentExecutorJobParams,
} from './agent-executor-jobs'
import type { ExecutionInfo } from './executions'

/**
 * Supported Python versions for agents
 * @type {('3.9'|'3.10'|'3.11'|'3.12')}
 */
export type PythonVersion = '3.9' | '3.10' | '3.11' | '3.12'

export class Agents extends APIResource {
  static readonly BASE_PATH = 'agents'

  /**
   * Lists all agents with pagination support
   * @param {Object} [options] - Pagination options
   * @param {number} [options.page] - Page number to retrieve
   * @returns {Promise<Page<AgentInfo, EnhancedAgent>>} Paginated list of agents with enhanced functionality
   * @example
   * const agentsPage = await client.agents.list({ page: 1 });
   * const agents = agentsPage.getItems();
   * // Iterate through all pages
   * for await (const agent of agentsPage) {
   *   console.log(agent);
   * }
   */
  async list(options?: { page?: number }): Promise<Page<AgentInfo, EnhancedAgent>> {
    return this._client.getAPIList<AgentInfo, EnhancedAgent>(
      `/v1/${Agents.BASE_PATH}`,
      {
        query: options?.page ? { page: String(options.page) } : undefined,
      },
      (agent) => this.enhanceAgent(agent),
    )
  }

  /**
   * Creates a new agent in SwarmNode
   * @param {CreateAgentParams} params - Agent creation parameters
   * @param {string} params.name - Name of the agent
   * @param {string} params.script - Python script content
   * @param {string} [params.requirements] - Python package requirements
   * @param {string} [params.env_vars] - Environment variables for the agent
   * @param {PythonVersion} params.python_version - Python version to use
   * @param {string} params.store_id - ID of the store to associate with
   * @returns {Promise<EnhancedAgent>} Created agent with enhanced functionality
   * @example
   * const agent = await client.agents.create({
   *   name: 'My Agent',
   *   script: 'print("Hello World")',
   *   python_version: '3.11',
   *   store_id: 'store_123'
   * });
   */
  async create(params: CreateAgentParams): Promise<EnhancedAgent> {
    const agent = await this._client.post<CreateAgentParams, AgentInfo>(
      `/v1/${Agents.BASE_PATH}/create/`,
      {
        body: params,
      },
    )

    return this.enhanceAgent(agent)
  }

  /**
   * Retrieves an agent by its ID
   * @param {string} id - Unique identifier of the agent
   * @returns {Promise<EnhancedAgent>} Retrieved agent with enhanced functionality
   * @throws {Error} When agent is not found
   * @example
   * const agent = await client.agents.retrieve('agent_123');
   */
  async retrieve(id: string): Promise<EnhancedAgent> {
    const agent = await this._client.get<AgentInfo>(`/v1/${Agents.BASE_PATH}/${id}/`)

    return this.enhanceAgent(agent)
  }

  /**
   * Updates an existing agent
   * @param {string} id - Unique identifier of the agent
   * @param {UpdateAgentParams} params - Agent update parameters
   * @param {string} [params.name] - New name for the agent
   * @param {string} [params.script] - New Python script content
   * @param {string} [params.requirements] - New Python package requirements
   * @param {string} [params.env_vars] - New environment variables
   * @param {PythonVersion} [params.python_version] - New Python version
   * @param {string} [params.store_id] - New store ID to associate with
   * @returns {Promise<AgentInfo>} Updated agent information
   * @throws {Error} When agent is not found
   * @example
   * const agent = await client.agents.update('agent_123', {
   *   name: 'Updated Agent Name',
   *   script: 'print("Updated")'
   * });
   */
  async update(id: string, params: UpdateAgentParams): Promise<AgentInfo> {
    const agent = await this._client.patch<UpdateAgentParams, AgentInfo>(
      `/v1/${Agents.BASE_PATH}/${id}/update/`,
      {
        body: params,
      },
    )

    return this.enhanceAgent(agent)
  }

  /**
   * Deletes an agent
   * @param {string} id - Unique identifier of the agent to delete
   * @returns {Promise<void>}
   * @throws {Error} When agent is not found
   * @example
   * await client.agents.remove('agent_123');
   */
  async remove(id: string): Promise<void> {
    return this._client.delete<void>(`/v1/${Agents.BASE_PATH}/${id}/delete/`)
  }

  /**
   * Enhances an agent with additional functionality
   * @private
   */
  private enhanceAgent(agent: AgentInfo): EnhancedAgent {
    return {
      ...agent,
      /**
       * Executes the agent
       * @param {Object} [options] - Execution options
       * @param {JsonValue} [options.payload] - Payload to execute the agent with
       * @param {boolean} [options.wait=false] - Whether to wait for the execution to complete (default: false)
       * @returns {Promise<AgentExecuteResult>} Result of the agent execution
       * @example
       * const result = await agent.execute({ key: 'value', wait: true });
       */
      execute: async (options?: {
        wait?: boolean
        payload?: JsonValue
      }): Promise<AgentExecuteResult> => {
        const agentExecutorJob = await this._client.post<
          CreateAgentExecutorJobParams,
          AgentExecutorJobInfo
        >(`/v1/${AgentExecutorJobs.BASE_PATH}/create/`, {
          body: {
            agent_id: agent.id,
            payload: options?.payload,
          },
        })

        if (options?.wait) {
          const execution = await this._client.listen<ExecutionInfo>(
            `/v1/execution/${agentExecutorJob.execution_address}/`,
          )
          return {
            type: 'execution',
            data: execution,
          }
        }

        return {
          type: 'agent_executor_job',
          data: agentExecutorJob,
        }
      },
    }
  }
}

/**
 * Information about an agent
 * @interface AgentInfo
 * @property {string} id - Unique identifier of the agent
 * @property {string} name - Name of the agent
 * @property {string} script - Python script content
 * @property {string} requirements - Python package requirements
 * @property {string} env_vars - Environment variables for the agent
 * @property {PythonVersion} python_version - Python version used by the agent
 * @property {string} store_id - ID of the associated store
 * @property {string} created - ISO 8601 timestamp of when the agent was created
 * @property {string} modified - ISO 8601 timestamp of when the agent was last modified
 */
export interface AgentInfo {
  id: string
  name: string
  script: string
  requirements: string
  env_vars: string
  python_version: PythonVersion
  store_id: string
  created: string
  modified: string
}

/**
 * Parameters for creating a new agent
 * @interface CreateAgentParams
 * @property {string} name - Name of the agent
 * @property {string} script - Python script content
 * @property {string} [requirements] - Python package requirements
 * @property {string} [env_vars] - Environment variables for the agent
 * @property {PythonVersion} python_version - Python version to use
 * @property {string} store_id - ID of the store to associate with
 */
export interface CreateAgentParams {
  name: string
  script: string
  requirements?: string
  env_vars?: string
  python_version: PythonVersion
  store_id: string
}

/**
 * Parameters for updating an existing agent
 * @interface UpdateAgentParams
 * @property {string} [name] - New name for the agent
 * @property {string} [script] - New Python script content
 * @property {string} [requirements] - New Python package requirements
 * @property {string} [env_vars] - New environment variables
 * @property {PythonVersion} [python_version] - New Python version
 * @property {string} [store_id] - New store ID to associate with
 */
export interface UpdateAgentParams {
  name?: string
  script?: string
  requirements?: string
  env_vars?: string
  python_version?: PythonVersion
  store_id?: string
}

/**
 * Enhanced agent with additional execution capabilities
 * @interface EnhancedAgent
 * @extends {AgentInfo}
 * @property {Function} execute - Function to execute the agent
 */
export interface EnhancedAgent extends AgentInfo {
  execute(options?: { wait?: boolean; payload?: JsonValue }): Promise<AgentExecuteResult>
}

/**
 * Base interface for execution results
 * @interface ExecuteResult
 * @property {string} type - Type of the execution result
 * @property {T} data - Result data of type T
 */
export interface ExecuteResult<T> {
  type: string
  data: T
}

/**
 * Result of an agent executor job execution
 * @interface AgentExecutorJobResult
 * @extends {ExecuteResult<AgentExecutorJobInfo>}
 * @property {'agent_executor_job'} type - Type identifier for agent executor job results
 * @property {AgentExecutorJobInfo} data - Agent executor job information
 */
export interface AgentExecutorJobResult extends ExecuteResult<AgentExecutorJobInfo> {
  type: 'agent_executor_job'
  data: AgentExecutorJobInfo
}

/**
 * Result of an execution
 * @interface ExecutionResult
 * @extends {ExecuteResult<ExecutionInfo>}
 * @property {'execution'} type - Type identifier for execution results
 * @property {Execution} data - Execution information
 */
export interface ExecutionResult extends ExecuteResult<ExecutionInfo> {
  type: 'execution'
  data: ExecutionInfo
}

/**
 * Union type for possible agent execution results
 * @type {AgentExecutorJobResult | ExecutionResult}
 */
export type AgentExecuteResult = AgentExecutorJobResult | ExecutionResult

/**
 * Type guard for agent executor job results
 * @param {AgentExecuteResult} result - Result to check
 * @returns {boolean} True if the result is an agent executor job result
 */
export function isAgentExecutorJobResult(
  result: AgentExecuteResult,
): result is AgentExecutorJobResult {
  return result.type === 'agent_executor_job'
}

/**
 * Type guard for execution results
 * @param {AgentExecuteResult} result - Result to check
 * @returns {boolean} True if the result is an execution result
 */
export function isExecutionResult(result: AgentExecuteResult): result is ExecutionResult {
  return result.type === 'execution'
}
