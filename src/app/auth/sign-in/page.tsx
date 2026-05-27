"use client"

import {
  IconBrandDiscord,
  IconLogout,
  IconShieldLock,
} from "@tabler/icons-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { signIn, signOut, useSession } from "@/lib/auth/client"

export default function SignInPage() {
  const { data: session } = useSession()

  const [isSigningIn, startSigningIn] = React.useTransition()
  const [isSigningOut, startSigningOut] = React.useTransition()

  const handleDiscordSignIn = () => {
    startSigningIn(async () => {
      const { data, error } = await signIn.social({
        callbackURL: "/",
        disableRedirect: true,
        provider: "discord",
      })

      if (error) {
        throw error
      }

      if (data?.url) {
        window.location.assign(data.url)
      }
    })
  }

  const handleSignOut = () => {
    startSigningOut(async () => {
      await signOut()
      window.location.assign("/auth/sign-in")
    })
  }

  const isAuthenticated = !!session?.user

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-border/60 bg-background/90 p-1 shadow-2xl shadow-primary/5">
        <div className="rounded-[1.4rem] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.96))] p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3 text-muted-foreground text-sm">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <IconShieldLock className="size-5" />
            </span>
            <div>
              <p className="font-medium text-foreground">Sign in</p>
              <p>Discord only. No sign-up path.</p>
            </div>
          </div>

          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">Access the app</CardTitle>
              <CardDescription>
                Use your existing Discord account to continue. New-account
                creation is disabled.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isAuthenticated ? (
                <Button
                  className="w-full"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  variant="secondary"
                >
                  <IconLogout className="size-4" />
                  Sign out
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={isSigningIn}
                  onClick={handleDiscordSignIn}
                >
                  <IconBrandDiscord className="size-4" />
                  Continue with Discord
                </Button>
              )}

              <p className="text-center text-muted-foreground text-sm">
                {isAuthenticated
                  ? `Signed in as ${session.user.name ?? session.user.email ?? "Unknown"}`
                  : "You’ll be redirected to Discord, then returned here."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
