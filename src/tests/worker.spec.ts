import { Consumer, EachMessagePayload, Producer } from 'kafkajs'
import { NodeExecutionManager } from '@worker'
import { connect } from '@kafka'
import { createLogger } from '@utils'
import { LooseObject } from '@/types'

const consumerMock = {
  run: jest.fn(() => {
    return
  }),
}
const producerMock = {
  connect: jest.fn(() => {
    return
  }),
  send: jest.fn(() => {
    return
  }),
}

jest.mock('@kafka', () => {
  return {
    connect: () => {
      return {
        consumer: consumerMock,
        producer: producerMock,
      }
    },
  }
})

const nodeRunMock = jest.fn((_execution_data) => { return {} })
jest.mock('@flowbuild/engine', () => {
  return {
    Nodes: {
      StartNode: class {
        async run(execution_data: LooseObject) {
          return nodeRunMock(execution_data)
        }
      },
      SystemTaskNode: class {
        async run(execution_data: LooseObject) {
          return nodeRunMock(execution_data)
        }
      },
      EventNode: class {
        async run(execution_data: LooseObject) {
          return nodeRunMock(execution_data)
        }
      }
    }
  }
})

let worker: NodeExecutionManager
let consumer: Consumer, producer: Producer

beforeAll(async () => {
  createLogger('test');
  ({ consumer, producer } = connect())
  worker = new NodeExecutionManager()
  NodeExecutionManager.producer = producer
})

it('should correctly RUN consumer connection', async () => {
  await worker.connect(consumer)
  expect(consumerMock.run).toHaveBeenCalledTimes(1)
})

it('should correctly call startProcess action', async () => {
  const eachMessage = worker.eachMessage(worker)
  eachMessage({
    topic: 'start-nodes-topic',
    partition: 1,
    message: { value: '{"nodeSpec": {},"execution_data": {"any":"value"},"workflow_name":"TEST_WORKFLOW","process_id":"TEST_PROCESS_ID","actor":{"id": "TEST_ACTOR_ID"}}' },
  } as unknown as EachMessagePayload)
  expect(nodeRunMock).toHaveBeenCalledTimes(1)
})
