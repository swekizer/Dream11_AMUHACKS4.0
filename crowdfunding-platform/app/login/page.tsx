"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      router.push("/")
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Image */}
      <div className="hidden w-1/2 bg-gray-900 lg:block">
        <div className="relative h-full">
          <img
            src="/login-image.jpg"
            alt="People helping each other"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-gray-900/20" />
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-3xl font-bold">TheGoodSociety</h1>
              <p className="text-sm text-muted-foreground">
                Enter your email to sign in to your account
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex w-full items-center justify-center lg:w-1/2">
        <div className="mx-auto w-full max-w-sm px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">
              Enter your credentials to sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
