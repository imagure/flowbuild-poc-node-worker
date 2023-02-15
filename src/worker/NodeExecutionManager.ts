// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Nodes } from '@flowbuild/engine'
import { Consumer, EachMessagePayload, Producer } from 'kafkajs'
import { Action, NodeResult } from '@worker/types'
import { get, log, set } from '@utils'
import { CustomTimerSystemTaskNode, CustomEventNode } from '@worker/nodes'

class NodeExecutionManager {
  static _instance: NodeExecutionManager
  static _producer: Producer

  static get instance(): NodeExecutionManager {
    return NodeExecutionManager._instance
  }

  static set instance(instance: NodeExecutionManager) {
    NodeExecutionManager._instance = instance
  }

  static get producer(): Producer {
    return NodeExecutionManager._producer
  }

  static set producer(producer: Producer) {
    NodeExecutionManager._producer = producer
  }

  static get topics(): { [key: string]: string } {
    return {
      http: 'http-nodes-topic',
      start: 'start-nodes-topic',
      finish: 'finish-nodes-topic',
      form: 'form-request-nodes-topic',
      flow: 'flow-nodes-topic',
      script: 'js-script-task-nodes-topic',
      timer: 'timer-nodes-topic',
      systemtask: 'system-task-nodes-topic',
      usertask: 'user-task-nodes-topic',
      event: 'event-nodes-topic',
    }
  }

  static get nodes(): { [key: string]: typeof Nodes } {
    return {
      'start-nodes-topic': Nodes.StartNode,
      'http-nodes-topic': Nodes.HttpSystemTaskNode,
      'finish-nodes-topic': Nodes.FinishNode,
      'form-request-nodes-topic': Nodes.FormRequestNode,
      'flow-nodes-topic': Nodes.FlowNode,
      'js-script-task-nodes-topic': Nodes.ScriptTaskNode,
      'timer-nodes-topic': CustomTimerSystemTaskNode,
      'user-task-nodes-topic': Nodes.UserTaskNode,
      'event-nodes-topic': CustomEventNode,
      'system-task-nodes-topic': Nodes.SystemTaskNode,
    }
  }

  constructor() {
    if (NodeExecutionManager.instance) {
      return NodeExecutionManager.instance
    }
    NodeExecutionManager.instance = this
    return this
  }

  extractResultToBag(result: NodeResult, spec: Array<string>) {
    if (!spec) {
      return {}
    }
    const bag = {}
    const readValues = spec.map((path) => [path, get(result, path)])
    for (const [path, value] of readValues) {
      set(bag, path, value)
    }
    return bag
  }

  async runAction(topic: string, action: Action) {
    const node = new NodeExecutionManager.nodes[topic](action.node_spec)
    const result = (await node.run({
      ...action.execution_data,
      process_id: action.process_id,
      actor_data: action.actor,
      workflow_name: action.workflow_name,
    })) as NodeResult

    console.info('\nRESULT: ', result)

    const messageValue = {
      result: {
        ...result,
        bag: this.extractResultToBag(result, action.node_spec.extract),
      },
      workflow_name: action.workflow_name,
      process_id: action.process_id,
      actor: action.actor,
    }

    await NodeExecutionManager.producer.send({
      topic: 'orchestrator-result-topic',
      messages: [{ value: JSON.stringify(messageValue) }],
    })
  }

  eachMessage(worker: NodeExecutionManager) {
    return async ({ topic, partition, message }: EachMessagePayload) => {
      const receivedMessage = message.value?.toString() || ''

      log({
        level: 'info',
        message: `Message received on Orchestrator.connect -> ${JSON.stringify({
          partition,
          offset: message.offset,
          value: receivedMessage,
        })}`,
      })

      try {
        const action = JSON.parse(receivedMessage)
        worker.runAction(topic, action)
      } catch (err) {
        console.error(err)
      }
    }
  }

  async connect(consumer: Consumer) {
    await consumer.run({
      eachMessage: this.eachMessage(this),
    })
  }
}

export { NodeExecutionManager }
