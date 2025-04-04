import ClerkProvider from "@/components/providers/clerk-provider"
import { Heebo, Acme } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import QueryProvider from "@/components/providers/query-provider"
import NavBar from "@/components/navbar"
import "./globals.css"
import { Toaster } from "sonner"

const heebo = Heebo({ 
  subsets: ["latin"],
  variable: "--font-heebo"
})

const acme = Acme({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-acme"
})

export const metadata = {
  title: "Video Chat Room",
  description: "Join topic-based video chat rooms and connect with people who share your interests.",
  icons: {
    icon: [
      { url: '/favicon.svg' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${heebo.variable} ${acme.variable} ${heebo.className}`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider>
            <QueryProvider>
              <NavBar />
              {children}
            </QueryProvider>
            <Toaster position="bottom-right" />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
