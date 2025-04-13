import Link from "next/link"
import { Facebook, Twitter, Instagram, Mail } from "lucide-react"

export default function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container grid gap-8 px-4 py-10 md:grid-cols-2 md:px-6 lg:grid-cols-4">
        <div className="space-y-4">
          <h3 className="text-lg font-bold">TheGoodSociety</h3>
          <p className="text-sm text-muted-foreground">
            A platform to create and support fundraising campaigns for causes that matter.
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-bold">About</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="text-muted-foreground hover:text-foreground">
                Our Mission
              </Link>
            </li>
            <li>
              <Link href="/about/team" className="text-muted-foreground hover:text-foreground">
                Our Team
              </Link>
            </li>
            <li>
              <Link href="/about/careers" className="text-muted-foreground hover:text-foreground">
                Careers
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="text-muted-foreground hover:text-foreground">
                Cookie Policy
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Connect</h3>
          <div className="flex space-x-4">
            <Link href="https://twitter.com" className="text-muted-foreground hover:text-foreground">
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link href="https://facebook.com" className="text-muted-foreground hover:text-foreground">
              <Facebook className="h-5 w-5" />
              <span className="sr-only">Facebook</span>
            </Link>
            <Link href="https://instagram.com" className="text-muted-foreground hover:text-foreground">
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </Link>
            <Link href="mailto:contact@fundraiser.com" className="text-muted-foreground hover:text-foreground">
              <Mail className="h-5 w-5" />
              <span className="sr-only">Email</span>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">Contact us: contact@fundraiser.com</p>
        </div>
      </div>
      <div className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} TheGoodSociety. All rights reserved.</p>
      </div>
    </footer>
  )
}
