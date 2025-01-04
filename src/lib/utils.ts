import SwarmNodeAI from '../index'
import { BuildStatusEnum } from '../resources'
import { debug } from './logger'

export async function waitForBuildCompletion(
  swarmnode: SwarmNodeAI,
  agentBuilderJobId: string,
  timeoutMs: number = 300000,
): Promise<string> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    const builds = await swarmnode.builds.list({
      agent_builder_job_id: agentBuilderJobId,
    })
    const build = builds.getItems()[0]

    if (!build) {
      throw new Error('Build not found')
    }

    if (build.status === BuildStatusEnum.success) {
      return build.id
    }

    if (build.status === BuildStatusEnum.failure) {
      debug.error('waitForBuildCompletion build failure:', build)
      throw new Error('Build failed')
    }
  }

  throw new Error('Build timeout exceeded')
}

export const isRunningInBrowser = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof navigator !== 'undefined'
  )
}

export function safeJSON<T = unknown>(text: string): T | undefined {
  try {
    return JSON.parse(text) as T
  } catch (error: unknown) {
    debug.error('safeJSON error:', error)
    return undefined
  }
}

/**
 * Delay execution for a given number of milliseconds
 * @param ms - The number of milliseconds to delay
 * @returns A promise that resolves after the given delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
