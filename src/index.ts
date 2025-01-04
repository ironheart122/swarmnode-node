import APIClient, { type ClientConfig } from './client'
import { SwarmNodeError } from './error'
import { debug } from './lib/logger'
import { isRunningInBrowser } from './lib/utils'
import {
  AgentBuilderJobs,
  AgentExecutorCronJobs,
  AgentExecutorJobs,
  Agents,
  Builds,
  BuildStatusEnum,
  Executions,
  Stores,
  type BuildInfo,
} from './resources'

const DEFAULT_BUILD_WAIT_TIME = 300000 // 300 seconds

/**
 * Configuration options for the SwarmNodeAI client
 */
export interface SwarmNodeConfig extends ClientConfig {
  /**
   * API key for authentication. Defaults to process.env['SWARMNODE_API_KEY']
   */
  apiKey?: string | null
  /**
   * By default, client-side use is disabled to protect API credentials.
   * Enable only if you're aware of the risks and have adequate safeguards.
   */
  dangerouslyAllowBrowser?: boolean
}

const DEFAULT_BASE_URL = 'api.swarmnode.ai'
const DEFAULT_CONFIG: SwarmNodeConfig = {
  baseURL: process.env.SWARMNODE_API_URL ?? DEFAULT_BASE_URL,
  apiKey: process.env.SWARMNODE_API_KEY ?? null,
  defaultTimeout: 30000, // 30 seconds
}

/**
 * SwarmNodeAI API Client
 *
 * @example
 * ```typescript
 * const client = new SwarmNodeAI({ apiKey: 'your-api-key' });
 * const stores = await client.stores.list();
 * ```
 */
export class SwarmNodeAI extends APIClient {
  private readonly apiKey: string | null | undefined
  private readonly resources: {
    stores: Stores
    agents: Agents
    builds: Builds
    agentBuilderJobs: AgentBuilderJobs
    agentExecutorJobs: AgentExecutorJobs
    agentExecutorCronJobs: AgentExecutorCronJobs
    executions: Executions
  }

  /**
   * Creates a new SwarmNodeAI client instance
   * @throws {SwarmNodeError} When attempting to use in browser without explicit permission
   */
  constructor(config: Partial<SwarmNodeConfig> = {}) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config }

    SwarmNodeAI.validateEnvironment(mergedConfig.dangerouslyAllowBrowser)

    super(mergedConfig)

    this.apiKey = mergedConfig.apiKey

    // Initialize all resources at once to ensure they're only created once
    this.resources = {
      stores: new Stores(this),
      agents: new Agents(this),
      builds: new Builds(this),
      agentBuilderJobs: new AgentBuilderJobs(this),
      agentExecutorJobs: new AgentExecutorJobs(this),
      agentExecutorCronJobs: new AgentExecutorCronJobs(this),
      executions: new Executions(this),
    }
  }

  /**
   * Access to Stores API endpoints
   * @returns {Stores} The Stores API resource instance
   */
  public get stores(): Stores {
    return this.resources.stores
  }

  /**
   * Access to Agents API endpoints
   * @returns {Agents} The Agents API resource instance
   */
  public get agents(): Agents {
    return this.resources.agents
  }

  /**
   * Access to Builds API endpoints
   * @returns {Builds} The Builds API resource instance
   */
  public get builds(): Builds {
    return this.resources.builds
  }

  /**
   * Access to Agent Builder Jobs API endpoints
   * @returns {AgentBuilderJobs} The Agent Builder Jobs API resource instance
   */
  public get agentBuilderJobs(): AgentBuilderJobs {
    return this.resources.agentBuilderJobs
  }

  /**
   * Access to Agent Executor Jobs API endpoints
   * @returns {AgentExecutorJobs} The Agent Executor Jobs API resource instance
   */
  public get agentExecutorJobs(): AgentExecutorJobs {
    return this.resources.agentExecutorJobs
  }

  /**
   * Access to Agent Executor Cron Jobs API endpoints
   * @returns {AgentExecutorCronJobs} The Agent Executor Cron Jobs API resource instance
   */
  public get agentExecutorCronJobs(): AgentExecutorCronJobs {
    return this.resources.agentExecutorCronJobs
  }

  /**
   * Access to Executions API endpoints
   * @returns {Executions} The Executions API resource instance
   */
  public get executions(): Executions {
    return this.resources.executions
  }

  /**
   * Waits for an agent's build process to complete
   * @param {string} agentId - The unique identifier of the agent
   * @param {number} [timeoutMs=DEFAULT_BUILD_WAIT_TIME] - Maximum time to wait in milliseconds before timing out
   * @returns {Promise<BuildInfo | undefined>} The build info if it completes successfully, otherwise undefined
   * @throws {Error} When agent builder job is not found
   * @throws {Error} When build is not found
   * @throws {Error} When build fails
   * @throws {Error} When build times out
   */
  public async waitForBuildCompletion(
    agentId: string,
    timeoutMs: number = DEFAULT_BUILD_WAIT_TIME,
  ): Promise<BuildInfo | undefined> {
    const agentBuilderJobs = await this.agentBuilderJobs.list({
      agent_id: agentId,
    })

    // Assuming the first item is the pending job - need confirmation from the SNAI Dev team
    const agentBuilderJob = agentBuilderJobs.getItems()[0]

    if (!agentBuilderJob) {
      throw new Error('Agent builder job not found')
    }

    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      const builds = await this.builds.list({ agent_builder_job_id: agentBuilderJob?.id })
      const build = builds.getItems()[0]

      if (!build) {
        continue
      }

      if (build.status === BuildStatusEnum.success) {
        return build
      }

      if (build.status === BuildStatusEnum.failure) {
        debug.error('waitForBuildCompletion build failure:', build)
        throw new Error('Build failed')
      }
    }
  }

  protected override authHeaders(): Record<string, string> {
    if (!this.apiKey) {
      return {}
    }
    return { Authorization: `Bearer ${this.apiKey}` }
  }

  /**
   * Validates the environment and configuration
   * @throws {SwarmNodeError} When attempting to use in browser without explicit permission
   */
  private static validateEnvironment(dangerouslyAllowBrowser?: boolean): void {
    if (!dangerouslyAllowBrowser && isRunningInBrowser()) {
      throw new SwarmNodeError(
        'Browser-like environments are disabled by default to prevent exposing your secret API credentials.\n\n' +
          "If you're aware of the risks and have implemented proper safeguards,\n" +
          'you can enable this by setting `dangerouslyAllowBrowser` to `true`, e.g.,\n\n' +
          'new SwarmNodeAI({ apiKey, dangerouslyAllowBrowser: true });',
      )
    }
  }
}

export default SwarmNodeAI

export type {
  CreateAgentParams,
  AgentInfo,
  EnhancedAgent,
  AgentExecuteResult,
  PythonVersion,
  StoreInfo,
  Store,
  CreateStoreParams,
  UpdateStoreParams,
  BuildInfo,
  BuildStatus,
  BuildListParams,
  AgentBuilderJobInfo,
  AgentBuilderJobListParams,
  AgentExecutorJobInfo,
  CreateAgentExecutorJobParams,
  AgentExecutorJobListParams,
  AgentExecutorCronJobInfo,
  AgentExecutorCronJobStatus,
  CreateAgentExecutorCronJobParams,
  UpdateAgentExecutorCronJobParams,
  EnhancedAgentExecutorCronJob,
  ExecutionInfo,
  ExecutionStatus,
} from './resources'

export { BuildStatusEnum, AgentExecutorCronJobStatusEnum } from './resources'

export {
  SwarmNodeError,
  APIError,
  APIConnectionError,
  APIConnectionTimeoutError,
  APIUserAbortError,
  BadRequestError,
  AuthenticationError,
  PermissionDeniedError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  RateLimitError,
  InternalServerError,
} from './error'

export type { PagePaginatedResponse, CursorPaginatedResponse } from './pagination'
export { Page, CursorPage } from './pagination'
