'use client'

import {
  type JSX,
  type ReactNode,
  type SyntheticEvent,
  createElement,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react'
import { buildHandlers, runGate, runMount } from './plugin/runtime'
import { useActionRuntime } from './provider'
import type { ActionPluginRegistry, DOMEventName, Plugin } from './types'

type RegistryToProps = {
  [K in keyof ActionPluginRegistry as ActionPluginRegistry[K] extends Plugin<
    any,
    any,
    infer P
  >
    ? P
    : never]?: ActionPluginRegistry[K] extends Plugin<infer C, any, any> ? C : never
}

export type ActionProps = RegistryToProps & {
  mode?: 'inline' | 'region'
  as?: keyof JSX.IntrinsicElements
  children: ReactNode
}

const RESERVED_PROPS = new Set(['mode', 'as', 'children'])

function extractConfigs(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(props)) {
    if (RESERVED_PROPS.has(key)) continue
    out[key] = props[key]
  }
  return out
}

const EVENT_NAME_TO_DOM_PROP: Record<DOMEventName, string> = {
  click: 'onClick',
  focus: 'onFocus',
  blur: 'onBlur',
  change: 'onChange',
  submit: 'onSubmit',
  mouseenter: 'onMouseEnter',
  mouseleave: 'onMouseLeave',
}

function handlersToDomProps(
  handlers: Partial<Record<DOMEventName, (e: SyntheticEvent) => void>>,
): Record<string, (e: SyntheticEvent) => void> {
  const out: Record<string, (e: SyntheticEvent) => void> = {}
  for (const eventName of Object.keys(handlers) as DOMEventName[]) {
    const fn = handlers[eventName]
    if (!fn) continue
    out[EVENT_NAME_TO_DOM_PROP[eventName]] = fn
  }
  return out
}

export function Action(props: ActionProps): ReactNode {
  const { as = 'div', children } = props
  const runtime = useActionRuntime()
  const instanceId = useId()
  const elementRef = useRef<HTMLElement | null>(null)

  const configs = useMemo(
    () => extractConfigs(props as unknown as Record<string, unknown>),
    [props],
  )

  const ctx = useMemo(
    () => ({ instanceId, services: runtime.services }),
    [instanceId, runtime.services],
  )

  const gateResult = runGate(runtime.plugins, configs, ctx, runtime.onError)

  const renderTarget: ReactNode =
    gateResult.kind === 'block'
      ? null
      : gateResult.kind === 'replace'
        ? gateResult.node
        : children

  const handlers = useMemo(
    () =>
      gateResult.kind === 'block'
        ? {}
        : buildHandlers(runtime.plugins, configs, ctx, runtime.onError),
    [runtime.plugins, configs, ctx, gateResult.kind, runtime.onError],
  )

  useEffect(() => {
    if (gateResult.kind === 'block') return
    return runMount(runtime.plugins, configs, ctx, runtime.onError)
  }, [runtime.plugins, configs, ctx, gateResult.kind, runtime.onError])

  if (gateResult.kind === 'block') return null

  const domHandlers = handlersToDomProps(handlers)

  return createElement(
    as,
    {
      ref: elementRef,
      'data-drwyn-action': instanceId,
      ...domHandlers,
    },
    renderTarget,
  )
}
