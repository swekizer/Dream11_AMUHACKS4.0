import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import Footer from "@/components/footer"
// Remove this unused import
// import { headers } from 'next/headers'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TheGoodSociety - Crowdfunding Platform",
  description: "A platform for social good and community support",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          suppressHydrationWarning
        >
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


// Remove this duplicate import
// import './globals.css'

// Remove incorrect generateStaticParams implementation
// export async function generateStaticParams() {
//   return {
//     notFound: {
//       about: true,
//       'about/careers': true,
//       'about/team': true,
//       cookies: true,
//       privacy: true,
//     },
//   }
// }