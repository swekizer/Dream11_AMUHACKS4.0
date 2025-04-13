"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
// Remove useRouter if you're not using it
// import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// Remove this duplicate import
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Mail } from "lucide-react"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showVerificationAlert, setShowVerificationAlert] = useState(false)
  const { signUp } = useAuth()
  // Remove this line since router isn't being used
  // const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await signUp(name, email, password)
      setShowVerificationAlert(true)
      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
      })
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: "An error occurred during sign up. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/">TheGoodSociety</Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">"Join our community of changemakers and start making a difference today."</p>
            <footer className="text-sm">TheGoodSociety Team</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
            <p className="text-sm text-muted-foreground">Enter your information to create an account</p>
          </div>
          <div className="grid gap-6">
            {showVerificationAlert && (
              <Alert className="bg-primary/10 border-primary">
                <Mail className="h-4 w-4" />
                <AlertTitle>Check your email</AlertTitle>
                <AlertDescription>
                  We've sent a verification link to {email}. Please check your inbox and click the link to verify your account.
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </div>
            </form>
          </div>
          <div className="flex items-center justify-between">
            <Link href="/">TheGoodSociety</Link>
            <Link href="/login" className="text-sm text-muted-foreground">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
