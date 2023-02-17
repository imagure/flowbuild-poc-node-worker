/* eslint-disable @typescript-eslint/no-explicit-any */
import { Actor } from '@kafka/types'
import { Workflow } from './workflow.type'

export type Action = {
  node_spec: any
  execution_data: any
  workflow: Workflow
  process_id: string
  actor: Actor
}
