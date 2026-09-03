import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'TrappolaGIoDev – AI Minecraft Plugin & Config Generator',
    template: '%s | TrappolaGIoDev',
  },
  description:
    'Crea Plugin e Configurazioni per Minecraft in pochi secondi con l\'Intelligenza Artificiale. Supporta Spigot, PaperMC e BungeeCord.',
  keywords: [
    'Minecraft plugin generator',
    'AI Minecraft plugins',
    'Spigot plugin creator',
    'PaperMC config generator',
    'AI coding tool',
    'TrappolaGIoDev',
  ],
  authors: [{ name: 'TrappolaGIoDev' }],
  creator: 'TrappolaGIoDev',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: '/',
    siteName: 'TrappolaGIoDev',
    title: 'TrappolaGIoDev – AI Minecraft Plugin & Config Generator',
    description:
      'Crea Plugin e Configurazioni per Minecraft in pochi secondi con l\'Intelligenza Artificiale.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrappolaGIoDev – AI Minecraft Plugin & Config Generator',
    description:
      'Crea Plugin e Configurazioni per Minecraft in pochi secondi con l\'Intelligenza Artificiale.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it" className={`${inter.variable} ${jetbrainsMono.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
