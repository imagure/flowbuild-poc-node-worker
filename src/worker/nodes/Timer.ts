/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Nodes } from '@flowbuild/engine'
import { promisify } from 'util'
import { LooseObject } from '@common-types'
import { Actor } from '@kafka'

const sleep = promisify(setTimeout)

class CustomTimerSystemTaskNode extends Nodes.SystemTaskNode {
  private _spec: any

  next(result: any) {
    if (result['$runtimer']) {
      return this._spec['id']
    }
    return this._spec['next']
  }

  async _run(execution_data: any, _lisp: any) {
    if (execution_data['$runtimer']) {
      await sleep(execution_data.parameters?.timeout || 0)
      return [{ ...execution_data, $runtimer: false }, 'running']
    }
    return [{ ...execution_data, $runtimer: true }, 'pending']
  }

  _preProcessing({
    bag,
    input,
    actor_data,
    environment,
    parameters,
  }: {
    bag: LooseObject
    input: LooseObject
    actor_data: Actor
    environment: LooseObject
    parameters: LooseObject
  }) {
    return { ...bag, ...input, actor_data, environment, parameters }
  }
}

export { CustomTimerSystemTaskNode }
