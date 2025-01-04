import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import SwarmNodeAI from '../src/index'
import {
  AgentExecutorCronJobStatusEnum,
  isAgentExecutorJobResult,
  isExecutionResult,
} from '../src/resources'
import { setup, teardown, type TestData } from './utils'

const TIMEOUT = 600000

describe('SwarmNodeAI SDK', () => {
  let mySwarmNode: SwarmNodeAI
  let testData: TestData
  let testStoreId: string

  beforeAll(async () => {
    mySwarmNode = new SwarmNodeAI({ apiKey: process.env.SWARMNODE_API_KEY })

    testData = await setup(mySwarmNode)
  }, TIMEOUT)

  afterAll(async () => {
    await teardown(mySwarmNode)
  }, TIMEOUT)

  describe(
    'Builds API',
    () => {
      it('should return a list containing exactly one build', async () => {
        const builds = await mySwarmNode.builds.list()
        expect(builds.getItems().length).toEqual(1)

        const build = builds.getItems()[0]

        expect(build).toBeDefined()
        expect(build?.id).toEqual(testData.buildId)
      })

      it('should successfully retrieve a specific build using its ID', async () => {
        const build = await mySwarmNode.builds.retrieve(testData.buildId)
        expect(build.id).toEqual(testData.buildId)
      })
    },
    TIMEOUT,
  )

  describe(
    'Agent Builder Jobs API',
    () => {
      it('should return a list of builder jobs filtered by agent ID', async () => {
        const agentBuilderJobs = await mySwarmNode.agentBuilderJobs.list({
          agent_id: testData.agentId,
        })
        expect(agentBuilderJobs.getItems().length).toEqual(1)
        const agentBuilderJob = agentBuilderJobs.getItems()[0]
        expect(agentBuilderJob).toBeDefined()
        expect(agentBuilderJob?.id).toEqual(testData.agentBuilderJobId)
      })

      it('should successfully retrieve a specific builder job using its ID', async () => {
        const agentBuilderJob = await mySwarmNode.agentBuilderJobs.retrieve(
          testData.agentBuilderJobId,
        )
        expect(agentBuilderJob.id).toEqual(testData.agentBuilderJobId)
      })
    },
    TIMEOUT,
  )

  describe(
    'Agents API',
    () => {
      let createdAgentID: string

      it(
        'should create an agent with specified configuration and verify build completion',
        async () => {
          const agent = await mySwarmNode.agents.create({
            name: 'testagent2',
            script: "def main():\n    print('hello world')\n",
            requirements: 'requests',
            env_vars: 'FOO=BAR',
            python_version: '3.9',
            store_id: testData.storeId,
          })

          if (!agent) {
            throw new Error('Agent not created')
          }

          await mySwarmNode.waitForBuildCompletion(agent.id)
          expect(agent.name).toBe('testagent2')
          createdAgentID = agent.id
        },
        TIMEOUT,
      )

      it(
        'should list all available agents and verify expected count',
        async () => {
          const agents = await mySwarmNode.agents.list()
          expect(agents.getItems().length).toEqual(2)
        },
        TIMEOUT,
      )

      it(
        'should retrieve an agent by ID and verify its existence',
        async () => {
          const agent = await mySwarmNode.agents.retrieve(createdAgentID)

          if (!agent) {
            throw new Error('Agent not found')
          }

          expect(agent.id).toBe(createdAgentID)
        },
        TIMEOUT,
      )

      it(
        'should update an agent name and verify the change',
        async () => {
          const updatedAgent = await mySwarmNode.agents.update(createdAgentID, {
            name: 'UPDATED',
          })

          if (!updatedAgent) {
            throw new Error('Agent not found')
          }

          expect(updatedAgent.name).toBe('UPDATED')
        },
        TIMEOUT,
      )

      it(
        'should delete an agent and verify removal from list',
        async () => {
          await mySwarmNode.agents.remove(createdAgentID)
          const agents = await mySwarmNode.agents.list()
          expect(agents.getItems().length).toEqual(1)
        },
        TIMEOUT,
      )

      it('should return AgentExecutorJob when wait is false', async () => {
        const agent = await mySwarmNode.agents.retrieve(testData.agentId)
        const result = await agent.execute({ wait: false, payload: { foo: 'bar' } })

        if (!isAgentExecutorJobResult(result)) {
          throw new Error(`Expected AgentExecutorJob but got ${result.type}`)
        }

        expect(result.type).toBe('agent_executor_job')
        expect(result.data.agent_id).toBe(testData.agentId)
        expect(result.data).toHaveProperty('execution_address')
      })

      it('should return Execution when wait is true', async () => {
        const agent = await mySwarmNode.agents.retrieve(testData.agentId)
        const result = await agent.execute({ wait: true })

        if (!isExecutionResult(result)) {
          throw new Error(`Expected Execution but got ${result.type}`)
        }

        expect(result.data.agent_id).toBe(testData.agentId)
        expect(result.data).toHaveProperty('return_value')
      })
    },
    TIMEOUT,
  )

  describe(
    'Stores API',
    () => {
      it('should successfully create a new store with specified name', async () => {
        const store = await mySwarmNode.stores.create({
          name: 'teststore',
        })

        if (!store) {
          throw new Error('Store not created')
        }

        testStoreId = store.id

        expect(store.name).toBe('teststore')
      })

      it('should successfully retrieve a store using its ID', async () => {
        const store = await mySwarmNode.stores.retrieve(testStoreId)

        if (!store) {
          throw new Error('Store not found')
        }

        expect(store.name).toBe('teststore')
      })

      it('should successfully update a store name', async () => {
        const store = await mySwarmNode.stores.update(testStoreId, {
          name: 'updatedstore',
        })

        if (!store) {
          throw new Error('Store not found')
        }

        expect(store.name).toBe('updatedstore')
      })

      it('should return a list of all available stores', async () => {
        const stores = await mySwarmNode.stores.list()

        expect(stores.getItems().length).toEqual(2)
      })

      it('should successfully delete a store and confirm removal', async () => {
        await mySwarmNode.stores.remove(testStoreId)

        const stores = await mySwarmNode.stores.list()

        expect(stores.getItems().length).toEqual(1)
      })
    },
    TIMEOUT,
  )

  describe(
    'Agent Executor Jobs API',
    () => {
      it('should successfully create an executor job with specified agent and payload', async () => {
        const agentExecutorJob = await mySwarmNode.agentExecutorJobs.create({
          agent_id: testData.agentId,
          payload: {
            foo: 'bar',
          },
        })

        if (!agentExecutorJob) {
          throw new Error('Agent Executor Job not found')
        }

        expect(agentExecutorJob.agent_id).toEqual(testData.agentId)
      })

      it('should return a list of executor jobs filtered by agent ID', async () => {
        const agentExecutorJobs = await mySwarmNode.agentExecutorJobs.list({
          agent_id: testData.agentId,
        })

        if (!agentExecutorJobs) {
          throw new Error('Agent Executor Jobs not found')
        }

        expect(agentExecutorJobs.getItems().length).toEqual(4)
      })
    },
    TIMEOUT,
  )

  describe('Execution API', () => {
    it('should return a list of all available executions', async () => {
      const executions = await mySwarmNode.executions.list()

      expect(executions.getItems().length).toEqual(3)
    })

    it('should successfully retrieve a specific execution using its ID', async () => {
      const executionsList = await mySwarmNode.executions.list()
      const firstExecution = executionsList.getItems()[0]

      if (!firstExecution) {
        throw new Error('Execution not found')
      }

      const retrievedExecution = await mySwarmNode.executions.retrieve(firstExecution.id)
      expect(retrievedExecution.id).toEqual(firstExecution.id)
    })
  })

  describe('Agent Executor Cron Jobs API', () => {
    let createdAgentExecutorCronJobId: string

    it('should successfully create a running cron job with specified schedule', async () => {
      const params = {
        agent_id: testData.agentId,
        name: 'testagentcronjob',
        expression: '0 0 * * *',
      }

      const agentExecutorCronJob = await mySwarmNode.agentExecutorCronJobs.create(params)
      expect(agentExecutorCronJob.status).toEqual(AgentExecutorCronJobStatusEnum.running)

      createdAgentExecutorCronJobId = agentExecutorCronJob.id
    })

    it('should return a list of cron jobs filtered by agent ID', async () => {
      const agentExecutorCronJobs = await mySwarmNode.agentExecutorCronJobs.list({
        agent_id: testData.agentId,
      })
      expect(agentExecutorCronJobs.getItems().length).toEqual(1)
    })

    it('should successfully retrieve a specific cron job using its ID', async () => {
      const agentExecutorCronJob = await mySwarmNode.agentExecutorCronJobs.retrieve(
        createdAgentExecutorCronJobId,
      )
      expect(agentExecutorCronJob.agent_id).toEqual(testData.agentId)
    })

    it('should successfully update a cron job name', async () => {
      const agentExecutorCronJob = await mySwarmNode.agentExecutorCronJobs.update(
        createdAgentExecutorCronJobId,
        {
          name: 'updatedagentcronjob',
          status: AgentExecutorCronJobStatusEnum.suspended,
        },
      )

      expect(agentExecutorCronJob.name).toEqual('updatedagentcronjob')
      expect(agentExecutorCronJob.status).toEqual(
        AgentExecutorCronJobStatusEnum.suspended,
      )
    })

    it('should successfully delete a cron job and confirm removal', async () => {
      await mySwarmNode.agentExecutorCronJobs.remove(createdAgentExecutorCronJobId)
      const agentExecutorCronJobs = await mySwarmNode.agentExecutorCronJobs.list({
        agent_id: testData.agentId,
      })
      expect(agentExecutorCronJobs.getItems().length).toEqual(0)
    })
  })
})
