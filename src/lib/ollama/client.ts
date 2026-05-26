import { env } from "@/env"

export interface OllamaModel {
  name: string
  model: string
  modified_at: string
  size: number
  digest: string
  details: {
    parent_model: string
    format: string
    family: string
    families: string[] | null
    parameter_size: string
    quantization_level: string
  }
}

export interface OllamaRunningModel {
  name: string
  model: string
  size: number
  digest: string
  details: {
    parent_model: string
    format: string
    family: string
    families: string[] | null
    parameter_size: string
    quantization_level: string
  }
  expires_at: string
  size_vram: number
}

export interface OllamaMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface OllamaChatChunk {
  model: string
  created_at: string
  message: {
    role: "assistant"
    content: string
  }
  done: boolean
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

export interface OllamaPullChunk {
  status: string
  digest?: string
  total?: number
  completed?: number
}

export interface OllamaModelInfo {
  modelfile: string
  parameters: string
  template: string
  details: {
    parent_model: string
    format: string
    family: string
    families: string[] | null
    parameter_size: string
    quantization_level: string
  }
  model_info: Record<string, unknown>
}

export const ollamaClient = {
  baseUrl: env.OLLAMA_URL,

  async deleteModel(model: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/delete`, {
      body: JSON.stringify({ model }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    })
    if (!res.ok) throw new Error(`Failed to delete model: ${res.statusText}`)
  },

  async getVersion(): Promise<{ version: string }> {
    const res = await fetch(`${this.baseUrl}/api/version`)
    if (!res.ok) throw new Error(`Failed to get version: ${res.statusText}`)
    return res.json()
  },

  async listModels(): Promise<{ models: OllamaModel[] }> {
    const res = await fetch(`${this.baseUrl}/api/tags`)
    if (!res.ok) throw new Error(`Failed to fetch models: ${res.statusText}`)
    return res.json()
  },

  async listRunning(): Promise<{ models: OllamaRunningModel[] }> {
    const res = await fetch(`${this.baseUrl}/api/ps`)
    if (!res.ok)
      throw new Error(`Failed to list running models: ${res.statusText}`)
    return res.json()
  },

  async showModel(model: string): Promise<OllamaModelInfo> {
    const res = await fetch(`${this.baseUrl}/api/show`, {
      body: JSON.stringify({ model }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    if (!res.ok) throw new Error(`Failed to show model: ${res.statusText}`)
    return res.json()
  },

  async *streamChat(
    model: string,
    messages: OllamaMessage[],
  ): AsyncGenerator<OllamaChatChunk> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      body: JSON.stringify({ messages, model, stream: true }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    if (!res.ok) throw new Error(`Failed to chat: ${res.statusText}`)
    if (!res.body) throw new Error("No response body")

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.trim()) {
          const chunk = JSON.parse(line) as OllamaChatChunk
          yield chunk
        }
      }
    }

    if (buffer.trim()) {
      const chunk = JSON.parse(buffer) as OllamaChatChunk
      yield chunk
    }
  },

  async *streamPull(model: string): AsyncGenerator<OllamaPullChunk> {
    const res = await fetch(`${this.baseUrl}/api/pull`, {
      body: JSON.stringify({ model, stream: true }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    if (!res.ok) throw new Error(`Failed to pull model: ${res.statusText}`)
    if (!res.body) throw new Error("No response body")

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.trim()) {
          const chunk = JSON.parse(line) as OllamaPullChunk
          yield chunk
        }
      }
    }

    if (buffer.trim()) {
      const chunk = JSON.parse(buffer) as OllamaPullChunk
      yield chunk
    }
  },
}
