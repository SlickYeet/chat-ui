"use client"

import {
  IconBox,
  IconMessage,
  IconServer2,
  IconWifi,
  IconWifiOff,
} from "@tabler/icons-react"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"

import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { api } from "@/lib/api/client"

const navItems = [
  {
    description: "Chat with your models",
    href: "/",
    icon: IconMessage,
    title: "Chat",
  },
  {
    description: "Manage local models",
    href: "/models",
    icon: IconBox,
    title: "Models",
  },
]

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const { data: systemHealth } = api.system.health.useQuery(undefined, {
    enabled: isMounted,
  })
  const { data: systemVersion } = api.system.version.useQuery(undefined, {
    enabled: isMounted,
  })

  const isConnected = systemHealth?.status === "connected"

  return (
    <Sidebar>
      <SidebarHeader className="border-sidebar-border border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary">
            <IconServer2 className="size-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Ollama UI</span>
            <span className="text-muted-foreground text-xs">
              {systemVersion?.version ? `v${systemVersion.version}` : "Local"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    onClick={() => router.push(item.href)}
                    tooltip={item.description}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {pathname === "/" && (
          <SidebarGroup className="flex-1">
            <SidebarGroupLabel>Conversations</SidebarGroupLabel>
            <SidebarGroupContent className="flex-1">
              <ChatSidebar />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t">
        <div className="flex items-center justify-between px-2 py-2">
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <IconWifi className="size-4 text-success" />
                ) : (
                  <IconWifiOff className="size-4 text-destructive" />
                )}
                <span className="text-muted-foreground text-xs">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{systemHealth?.url ?? "Unavailable"}</p>
            </TooltipContent>
          </Tooltip>

          <Badge className="text-xs" variant="outline">
            {isConnected ? "Online" : "Offline"}
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
