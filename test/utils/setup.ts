import SwarmNodeAI from '../../src'
import { isExecutionResult } from '../../src/resources/agents'
import { deleteAllStores } from './shared'

export interface TestData {
  storeId: string
  agentId: string
  agentBuilderJobId: string
  buildId: string
  agentExecutorJobId: string | null | undefined
  executionId: string
}

export async function setup(swarmnode: SwarmNodeAI): Promise<TestData> {
  // Clean up any existing stores to start with a clean slate
  await deleteAllStores(swarmnode)

  // Create test store
  const store = await swarmnode.stores.create({
    name: 'teststore',
  })

  // Create test agent
  const agent = await swarmnode.agents.create({
    name: 'testagent',
    script: "def main():\n    print('hello world')\n",
    python_version: '3.9',
    store_id: store.id,
  })

  // Get the agent builder job
  const agentBuilderJobs = await swarmnode.agentBuilderJobs.list({
    agent_id: agent.id,
  })

  const agentBuilderJob = agentBuilderJobs.getItems()[0]

  if (!agentBuilderJob) {
    throw new Error('Agent builder job not found')
  }

  // Wait for build completion
  const build = await swarmnode.waitForBuildCompletion(agent.id)

  if (!build) {
    throw new Error('Build not found')
  }

  const execution = await agent.execute({
    wait: true,
  })

  // Type narrowing to ensure we have an ExecutionResult
  if (!isExecutionResult(execution)) {
    throw new Error('execution is not an ExecutionResult')
  }

  return {
    storeId: store.id,
    agentId: agent.id,
    agentBuilderJobId: agentBuilderJob.id,
    agentExecutorJobId: execution.data?.agent_executor_job_id,
    buildId: build.id,
    executionId: execution.data.id,
  }
}
