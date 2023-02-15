/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Nodes } from '@flowbuild/engine'
import { Actor } from '@/kafka'
import { LooseObject } from '@/types'
import { RedisClient } from '@redis'
import { Producer } from 'kafkajs'

class CustomEventNode extends Nodes.EventNode {
  private id: any
  private next: any
  private _processError: any
  private _preProcessing: any
  private _spec: any
  private _redis: RedisClient
  static _producer: Producer

  constructor(node_spec: Node) {
    super(node_spec)
    this._redis = new RedisClient()
  }

  static get producer() {
    return CustomEventNode._producer
  }

  static set producer(producer) {
    CustomEventNode._producer = producer
  }

  async run(
    {
      bag,
      input,
      external_input = null,
      actor_data,
      environment = {},
      parameters = {},
      process_id,
      workflow_name,
    }: {
      bag: LooseObject
      input: LooseObject
      external_input: any
      actor_data: Actor
      environment: LooseObject
      parameters: LooseObject
      process_id: string
      workflow_name: string
    },
    _lisp: any
  ) {
    const redis = new RedisClient()

    const execution_data = this._preProcessing({
      bag,
      input,
      actor_data,
      environment,
      parameters,
    })
    try {
      const [event] = this._spec.parameters.events
      if (
        !external_input &&
        event.category === 'signal' &&
        event.family === 'target'
      ) {
        await redis.set(
          `process_targets:${event.definition}:${process_id}`,
          JSON.stringify({
            target: event.definition,
            process_id,
            workflow_name,
          }),
          { EX: 60 }
        )
        return {
          node_id: this.id,
          bag: bag,
          external_input: external_input,
          result: execution_data,
          error: null,
          status: 'waiting',
          next_node_id: this.id,
        }
      }

      if (
        !external_input &&
        event.category === 'signal' &&
        event.family === 'trigger'
      ) {
        const target_process_id = bag.target_process_id
        let target
        if (target_process_id) {
          target = (await redis.get(
            `process_targets:${event.definition}:${target_process_id}`
          )) as LooseObject
        }
        if (target) {
          const payload = {
            workflow_name: target.workflow_name,
            input: { ...execution_data.trigger_payload },
            process_id: target_process_id,
            actor: actor_data,
          }
          await CustomEventNode.producer.send({
            topic: 'orchestrator-continue-process-topic',
            messages: [{ value: JSON.stringify(payload) }],
          })
          await this._redis.del(
            `process_targets:${event.definition}:${target_process_id}`
          )
        } else {
          target = (await this._redis.get(
            `workflow_targets:${event.definition}`
          )) as LooseObject
          const payload = {
            workflow_name: target.workflow_name,
            input: {
              ...execution_data.trigger_payload,
              target_process_id: process_id,
            },
            actor: actor_data,
          }
          await CustomEventNode.producer.send({
            topic: 'orchestrator-start-process-topic',
            messages: [{ value: JSON.stringify(payload) }],
          })
        }
      }
    } catch (err) {
      console.log('ERR: ', err)
      return this._processError(err, { bag, external_input })
    }

    return {
      node_id: this.id,
      bag: bag,
      external_input: external_input,
      result: execution_data,
      error: null,
      status: 'running',
      next_node_id: this.next(execution_data),
    }
  }
}

export { CustomEventNode }
