import SwarmNodeAI from '@swarmnode-ai/sdk'

const swarmNodeAI = new SwarmNodeAI({
  apiKey: process.env.SWARMNODE_API_KEY,
})

async function run(): Promise<void> {
  try {
    // Create a store for the agent
    const store = await swarmNodeAI.stores.create({
      name: 'cron-store',
    })

    // Create an agent with a simple Python script
    const agent = await swarmNodeAI.agents.create({
      name: 'cron-agent',
      script: "def main():\n    print('hello world')\n",
      python_version: '3.12',
      store_id: store.id,
    })

    // Wait for the agent to be built and ready
    console.log('Agent created:', agent)
    console.log('Waiting for build completion...')
    await swarmNodeAI.waitForBuildCompletion(agent.id)
    console.log('Build completed. Agent is ready to execute.')

    // Create a cron job that runs every minute
    console.log('Creating cron job...')
    const cronJob = await swarmNodeAI.agentExecutorCronJobs.create({
      agent_id: agent.id,
      name: 'cron-job',
      expression: '* * * * *', // Runs every minute
    })

    console.log('Cron job created:', cronJob)

    // Stream the execution results
    console.log('Started streaming cron job execution...')
    for await (const line of cronJob.stream()) {
      if (line?.return_value) {
        console.log('Execution result:', line.return_value)
        // Process the execution result (eg., send to webhook or something like that)
        break // Exit after first successful execution (for demo purposes)
      }
    }

    console.log('Cron job execution completed successfully.')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

// Start the example
run().catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
