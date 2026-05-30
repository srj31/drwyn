'use client'

import { type ReactNode, createContext, useContext, useMemo } from 'react'
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

export function ActionProvider({
  plugins,
  services,
  onError,
  children,
}: ActionProviderProps) {
  const runtime = useMemo<ActionRuntime>(() => {
    const resolvedOnError =
      onError ??
      (process.env.NODE_ENV === 'production' ? defaultOnErrorProd : defaultOnErrorDev)
    return {
      plugins,
      services: { ...({} as ActionServicesRegistry), ...(services ?? {}) } as ActionServicesRegistry,
      onError: resolvedOnError,
    }
  }, [plugins, services, onError])

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
