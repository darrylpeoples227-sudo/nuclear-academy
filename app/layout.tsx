import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const isProductionDeployment = process.env.VERCEL_ENV === 'production'

if (isProductionDeployment && clerkPublishableKey?.startsWith('pk_test_')) {
  throw new Error('Clerk production deployment requires a production publishable key. Configure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY with a pk_live_ key for the Production environment.')
}

export const metadata: Metadata = {
  title: 'Nuclear Academy',
  description: 'Nuclear Academy is a private, fast browser and learning space.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/nuclear-academy-emblem.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/nuclear-academy-emblem.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ClerkProvider>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ClerkProvider>
      </body>
    </html>
  )
}
