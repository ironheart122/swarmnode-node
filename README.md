# TypeScript SDK for the SwarmNode AI API

The SwarmNode TypeScript SDK provides convenient access to the SwarmNode REST API from any Node.js 20+ application. The SDK includes rich type definitions and enables receiving real-time executions
via WebSockets.

## Prerequisites

- [Node.js 20 or later](https://github.com/nvm-sh/nvm)
- [PNPM](https://pnpm.io/installation#prerequisites)

## Installation

You can install the SDK using `npm` or `bun` or `pnpm`:

```bash
npm install @swarmnode-ai/sdk
```

or

```bash
bun add @swarmnode-ai/sdk
```

or

```bash
pnpm add @swarmnode-ai/sdk
```

## Usage

### Create an Agent

```ts
import SwarmNodeAI, { type SwarmNodeConfig } from '@swarmnode-ai/sdk'

const config: SwarmNodeConfig = {
  apiKey: process.env.SWARMNODE_API_KEY,
}

const swarmnode = new SwarmNodeAI(config)

const agent = await swarmnode.agents.create({
  name: 'testagent5878',
  script: "def main():\n    print('hello world')\n",
  python_version: '3.12',
  store_id: store.id,
})
```

### Execute an agent

```ts
import SwarmNodeAI, { type SwarmNodeConfig } from '@swarmnode-ai/sdk'

const config: SwarmNodeConfig = {
  apiKey: process.env.SWARMNODE_API_KEY,
}

const swarmnode = new SwarmNodeAI(config)

const agentExecutorJob = await swarmnode.agentExecutorJobs.create({
  agent_id: 'abce1234',
  payload: {
    key: 'value',
  },
})

// OR

const agent = await swarmnode.agents.retrieve('abce1234')
await agent.execute({
  payload: {
    key: 'value',
  },
})
```

### Create a Cron Job

```ts
import SwarmNodeAI, { type SwarmNodeConfig } from '@swarmnode-ai/sdk'

const config: SwarmNodeConfig = {
  apiKey: process.env.SWARMNODE_API_KEY,
}

const swarmnode = new SwarmNodeAI(config)

const agentExecutorCronJob = await swarmnode.agentExecutorCronJobs.create({
  agent_id: agent.id,
  name: 'cron-job',
  expression: '* * * * *', // every minute
})
```

### Pagination

```ts
import SwarmNodeAI, { type SwarmNodeConfig } from '@swarmnode-ai/sdk'

const config: SwarmNodeConfig = {
  apiKey: process.env.SWARMNODE_API_KEY,
}

const swarmnode = new SwarmNodeAI(config)

const stores = await swarmnode.stores.list()

for await (const store of stores) {
  console.log(store)
}

const nextPage = await stores.getNextPage()
```

These are only a few examples of what you can do with the SDK. Check out the examples folder for more examples.

For complete API reference and more examples, please visit:

- [API Reference](https://swarmnode.ai/docs/api/v1/introduction)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
