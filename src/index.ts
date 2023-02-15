import { connect } from '@kafka'
import { NodeExecutionManager } from '@worker'
import { envs } from '@configs/env'
import { CustomEventNode } from '@worker/nodes'
import { createLogger } from '@utils'

const node_worker_consumed_topics = envs.COSUMED_TOPICS

async function main() {
  createLogger('info')
  const { consumer, producer } = connect()
  const worker = new NodeExecutionManager()

  await producer.connect()
  await consumer.connect()
  for (const topic of node_worker_consumed_topics)
    await consumer.subscribe({ topic, fromBeginning: true })

  await worker.connect(consumer)
  NodeExecutionManager.producer = producer
  CustomEventNode.producer = producer
  // Prompt for manual testing:
  // publishPrompt(orchestrator_consumed_topics[1], producer)
}

main()
