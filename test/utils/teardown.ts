import SwarmNodeAI from '../../src'
import { deleteAllAgents, deleteAllStores } from './shared'

export async function teardown(swarmnode: SwarmNodeAI): Promise<void> {
  await deleteAllAgents(swarmnode)
  await deleteAllStores(swarmnode)
}
