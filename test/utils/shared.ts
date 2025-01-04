import type SwarmNodeAI from '../../src'

async function deleteAllAgents(swarmnode: SwarmNodeAI): Promise<void> {
  const paginatedAgents = await swarmnode.agents.list()

  const promises: Promise<void>[] = []

  for await (const agent of paginatedAgents) {
    promises.push(swarmnode.agents.remove(agent.id))
  }

  await Promise.all(promises)
}

async function deleteAllStores(swarmnode: SwarmNodeAI): Promise<void> {
  const paginatedStores = await swarmnode.stores.list()

  const promises: Promise<void>[] = []

  for await (const store of paginatedStores) {
    promises.push(swarmnode.stores.remove(store.id))
  }

  await Promise.all(promises)
}

export { deleteAllAgents, deleteAllStores }
