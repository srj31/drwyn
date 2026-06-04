import type { DrwynClientOptions, EventInput, MemoryValue } from './types'

const DEFAULT_CLOUD_URL = 'https://api.drwyn.dev'

export class DrwynClient {
  private readonly projectKey: string
  private readonly cloudUrl: string

  constructor(options: DrwynClientOptions) {
    this.projectKey = options.projectKey
    this.cloudUrl = (options.cloudUrl ?? DEFAULT_CLOUD_URL).replace(/\/$/, '')
  }

  async sendEvent(input: EventInput): Promise<void> {
    await this.request('POST', '/events', {
      user_id: input.userId,
      name: input.name,
      props: input.props,
      timestamp_ms: input.timestamp,
    })
  }

  async getMemory(
    userId: string,
    key: string,
    options?: { namespace?: string },
  ): Promise<MemoryValue | null> {
    const params = new URLSearchParams({ user_id: userId })
    if (options?.namespace !== undefined) params.set('namespace', options.namespace)
    const result = (await this.request(
      'GET',
      `/memory/${encodeURIComponent(key)}?${params.toString()}`,
    )) as { value: MemoryValue | null }
    return result.value
  }

  async setMemory(
    userId: string,
    key: string,
    value: MemoryValue,
    options?: { namespace?: string },
  ): Promise<void> {
    const body: Record<string, unknown> = {
      user_id: userId,
      key,
      value,
    }
    if (options?.namespace !== undefined) {
      body.namespace = options.namespace
    }
    await this.request('POST', '/memory', body)
  }

  private async request(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const init: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.projectKey}`,
        'Content-Type': 'application/json',
      },
    }
    if (body !== undefined) {
      init.body = JSON.stringify(body)
    }
    const res = await fetch(`${this.cloudUrl}${path}`, init)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`[drwyn] ${res.status} ${res.statusText}: ${text}`)
    }
    return res.headers.get('Content-Type')?.includes('application/json')
      ? await res.json()
      : null
  }
}
