import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GolfGives — Play, Win, Give Back',
  description: 'The subscription golf platform combining performance tracking, monthly prize draws, and charitable giving.',
  keywords: 'golf, charity, subscription, stableford, prize draw, fundraising',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-[#0a0e14] text-white`}>
        {children}
      </body>
    </html>
  )
}
