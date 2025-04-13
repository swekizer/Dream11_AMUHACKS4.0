"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Plus, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
// Remove the Badge import if you're not using it
// import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  // Don't show navbar on auth pages
  if (pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password") {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold gradient-text">FundRaiser</span>
          </Link>
          <div className="hidden md:flex md:w-80">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search fundraisers..."
                className="w-full rounded-md bg-background pl-8 md:w-[300px] lg:w-[400px]"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex md:items-center md:gap-4">
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link href="/explore">Explore</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/community">Community</Link>
            </Button>
            {user ? (
              <>
                <Button
                  asChild
                  variant="default"
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  <Link href="/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Start a Fundraiser
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        {user.profilePicture ? (
                          <AvatarImage src={user.profilePicture} alt={user.name || 'User'} />
                        ) : null}
                        <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/community">Community</Link>
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="grid gap-4 py-4">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search fundraisers..."
                    className="w-full rounded-md bg-background pl-8"
                  />
                </div>
                <ThemeToggle />
                <Button asChild variant="outline">
                  <Link href="/explore">Explore</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/community">Community</Link>
                </Button>
                {user ? (
                  <>
                    <Button
                      asChild
                      variant="default"
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      <Link href="/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Start a Fundraiser
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/profile">Profile</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/settings">Settings</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/community">Community</Link>
                    </Button>
                    {user.isAdmin && (
                      <Button asChild variant="outline">
                        <Link href="/admin">Admin Dashboard</Link>
                      </Button>
                    )}
                    <Button variant="outline" onClick={logout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
