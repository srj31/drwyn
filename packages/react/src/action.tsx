'use client'

import {
  Children,
  type JSX,
  type ReactElement,
  type ReactNode,
  type Ref,
  type SyntheticEvent,
  cloneElement,
  createElement,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react'
import { composeRefs } from './plugin/compose-ref'
import { devWarn } from './plugin/dev-warn'
import { type VisibilityThreshold, observe, unobserve } from './plugin/intersection'
import { buildHandlers, runGate, runMount } from './plugin/runtime'
import { useActionRuntime } from './provider'
import type { ActionPluginRegistry, DOMEventName, Plugin } from './types'

type RegistryToProps = {
  [K in keyof ActionPluginRegistry as ActionPluginRegistry[K] extends Plugin<any, any, infer P>
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

function warnOnUnknownProps(
  configs: Record<string, unknown>,
  knownPropKeys: ReadonlySet<string>,
): void {
  if (process.env.NODE_ENV === 'production') return
  for (const key of Object.keys(configs)) {
    if (!knownPropKeys.has(key)) {
      devWarn(
        `unknown <Action> prop "${key}" — no registered plugin claims this propKey. Did you forget to add the plugin to <ActionProvider plugins={[...]}>?`,
      )
    }
  }
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

function mergeHandlerOnto(
  childProp: ((e: SyntheticEvent) => void) | undefined,
  pluginProp: ((e: SyntheticEvent) => void) | undefined,
): ((e: SyntheticEvent) => void) | undefined {
  if (!childProp) return pluginProp
  if (!pluginProp) return childProp
  return (e: SyntheticEvent) => {
    childProp(e)
    pluginProp(e)
  }
}

function getOnlyValidElementChild(children: ReactNode): ReactElement<any> | null {
  const arr = Children.toArray(children)
  if (arr.length !== 1) return null
  const first = arr[0]
  if (!isValidElement(first)) return null
  return first as ReactElement<any>
}

export function Action(props: ActionProps): ReactNode {
  const { mode = 'region', as = 'div', children } = props
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

  const knownPropKeys = useMemo(
    () => new Set(runtime.plugins.map((p) => p.propKey)),
    [runtime.plugins],
  )

  warnOnUnknownProps(configs, knownPropKeys)

  const gateResult = runGate(runtime.plugins, configs, ctx, runtime.onError)

  const renderTarget: ReactNode =
    gateResult.kind === 'block' ? null : gateResult.kind === 'replace' ? gateResult.node : children

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

  useEffect(() => {
    if (gateResult.kind === 'block') return
    const el = elementRef.current
    if (!el) return

    type Registration = {
      threshold: VisibilityThreshold
      onVisible: ((cfg: unknown, ctx: unknown) => void) | undefined
      onHidden: ((cfg: unknown, ctx: unknown) => void) | undefined
      cfg: unknown
      name: string
    }

    const regs: Registration[] = []
    for (const plugin of runtime.plugins) {
      if (!plugin.visibility) continue
      if (!Object.prototype.hasOwnProperty.call(configs, plugin.propKey)) continue
      regs.push({
        threshold: (plugin.visibility.threshold ?? 0.5) as VisibilityThreshold,
        onVisible: plugin.visibility.onVisible as Registration['onVisible'],
        onHidden: plugin.visibility.onHidden as Registration['onHidden'],
        cfg: configs[plugin.propKey],
        name: plugin.name,
      })
    }

    if (regs.length === 0) return

    const byThreshold = new Map<VisibilityThreshold, Registration[]>()
    for (const reg of regs) {
      const list = byThreshold.get(reg.threshold) ?? []
      list.push(reg)
      byThreshold.set(reg.threshold, list)
    }

    for (const threshold of byThreshold.keys()) {
      observe(el, threshold, (visible: boolean) => {
        for (const reg of byThreshold.get(threshold)!) {
          try {
            if (visible) reg.onVisible?.(reg.cfg, ctx)
            else reg.onHidden?.(reg.cfg, ctx)
          } catch (err) {
            runtime.onError(err, reg.name, 'visibility')
          }
        }
      })
    }

    return () => {
      for (const threshold of byThreshold.keys()) {
        unobserve(el, threshold)
      }
    }
  }, [runtime.plugins, configs, ctx, gateResult.kind, runtime.onError])

  if (gateResult.kind === 'block') return null

  const domHandlers = handlersToDomProps(handlers)

  if (mode === 'inline') {
    const onlyChild = getOnlyValidElementChild(renderTarget)

    if (!onlyChild) {
      devWarn(
        'mode="inline" requires exactly one valid React element as a child; falling back to region mode.',
      )
    } else {
      const childProps: Record<string, unknown> = { ...onlyChild.props }
      for (const propKey of Object.keys(domHandlers)) {
        childProps[propKey] = mergeHandlerOnto(
          (onlyChild.props as Record<string, unknown>)?.[propKey] as
            | ((e: SyntheticEvent) => void)
            | undefined,
          domHandlers[propKey],
        )
      }
      // React 19: ref is a regular prop in element.props.
      // React 18 with forwardRef: ref was on element.ref (now deprecated in 19).
      // Reading props.ref works in 19 without warnings; React 18 users using
      // forwardRef will lose ref composition, which is acceptable for v1.
      const childRef = (onlyChild.props as Record<string, unknown>)?.ref as
        | Ref<HTMLElement>
        | undefined
      ;(childProps as { ref: Ref<HTMLElement> }).ref = composeRefs(childRef, elementRef)
      return cloneElement(onlyChild, childProps)
    }
  }

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
