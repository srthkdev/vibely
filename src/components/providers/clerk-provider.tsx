'use client'

import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs"
import { ReactNode } from "react"

interface ClerkProviderProps {
  children: ReactNode
}

export default function ClerkProvider({ children }: ClerkProviderProps) {
  return (
    <BaseClerkProvider 
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined,
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90',
          footerActionLink: 'text-primary hover:text-primary/90'
        }
      }}
    >
      {children}
    </BaseClerkProvider>
  )
}
