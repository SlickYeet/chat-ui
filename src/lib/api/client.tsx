"use client"

import type { QueryClient } from "@tanstack/react-query"
import { QueryClientProvider } from "@tanstack/react-query"
import {
  httpBatchStreamLink,
  httpSubscriptionLink,
  loggerLink,
  splitLink,
} from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server"
import type React from "react"
import superjson from "superjson"

import { getBaseUrl } from "@/lib/utils"
import type { AppRouter } from "@/server/api/root"

import { createQueryClient } from "./query-client"

let clientQueryClientSingleton: QueryClient | undefined
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient()
  }

  // Browser: use singleton pattern to keep the same query client
  clientQueryClientSingleton ??= createQueryClient()
  return clientQueryClientSingleton
}

export const api = createTRPCReact<AppRouter>()

const trpcLinks = [
  loggerLink({
    enabled: (opts) =>
      process.env.NODE_ENV === "development" ||
      (opts.direction === "down" && opts.result instanceof Error),
  }),
  splitLink({
    condition: (op) => op.type === "subscription",
    false: httpBatchStreamLink({
      headers() {
        const headers = new Headers()
        headers.set("x-trpc-source", "nextjs-react")
        return headers
      },
      transformer: superjson,
      url: `${getBaseUrl()}/api/trpc`,
    }),
    true: httpSubscriptionLink({
      transformer: superjson,
      url: `${getBaseUrl()}/api/trpc`,
    }),
  }),
]

export const trpcClient = api.createClient({
  links: trpcLinks,
})

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs["helloWorld"]["hello"]
 */
export type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs["helloWorld"]["hello"]
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>

export function TRPCReactProvider({ children }: React.PropsWithChildren) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </api.Provider>
    </QueryClientProvider>
  )
}
