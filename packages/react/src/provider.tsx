'use client'

import { type ReactNode, createContext, useContext, useMemo } from 'react'
import { devWarn } from './plugin/dev-warn'
import type { ActionServicesRegistry, Plugin, PluginPhase } from './types'

export type OnError = (err: unknown, pluginName: string, phase: PluginPhase) => void

export interface ActionRuntime {
  plugins: ReadonlyArray<Plugin<any, string, string>>
  services: ActionServicesRegistry
  onError: OnError
}

const ActionContext = createContext<ActionRuntime | null>(null)

export interface ActionProviderProps {
  plugins: ReadonlyArray<Plugin<any, string, string>>
  services?: Partial<ActionServicesRegistry>
  onError?: OnError
  children: ReactNode
}

const defaultOnErrorDev: OnError = (err, name, phase) => {
  console.error(`[drwyn:${name}:${phase}]`, err)
}

const defaultOnErrorProd: OnError = () => {}

export function ActionProvider({ plugins, services, onError, children }: ActionProviderProps) {
  const runtime = useMemo<ActionRuntime>(() => {
    const resolvedOnError =
      onError ?? (process.env.NODE_ENV === 'production' ? defaultOnErrorProd : defaultOnErrorDev)
    return {
      plugins,
      services: {
        ...({} as ActionServicesRegistry),
        ...(services ?? {}),
      } as ActionServicesRegistry,
      onError: resolvedOnError,
    }
  }, [plugins, services, onError])

  useMemo(() => {
    if (process.env.NODE_ENV === 'production') return
    const byKey = new Map<string, string[]>()
    for (const p of plugins) {
      const list = byKey.get(p.propKey) ?? []
      list.push(p.name)
      byKey.set(p.propKey, list)
    }
    for (const [propKey, names] of byKey) {
      if (names.length > 1) {
        devWarn(
          `propKey "${propKey}" claimed by multiple plugins: ${names.join(', ')}. Only the first will receive that prop's config.`,
        )
      }
    }
  }, [plugins])

  return <ActionContext.Provider value={runtime}>{children}</ActionContext.Provider>
}

export function useActionRuntime(): ActionRuntime {
  const value = useContext(ActionContext)
  if (!value) {
    throw new Error(
      '[drwyn] useActionRuntime/<Action> used outside an <ActionProvider>. Wrap your app in <ActionProvider plugins={[...]}>.',
    )
  }
  return value
}
