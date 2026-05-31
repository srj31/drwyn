export { Action } from './action'
export type { ActionProps } from './action'

export { ActionProvider, useActionRuntime } from './provider'
export type { ActionProviderProps, ActionRuntime, OnError } from './provider'

export type {
  ActionPluginRegistry,
  ActionServicesRegistry,
  DOMEventName,
  GateResult,
  Plugin,
  PluginContext,
  PluginPhase,
} from './types'

import './plugins/analytics'
import './plugins/flag'
import './plugins/mount'
import './plugins/visibility'
