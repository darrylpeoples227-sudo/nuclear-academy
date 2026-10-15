'use client'

import { FormEvent, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Download,
  ExternalLink,
  Globe2,
  LockKeyhole,
  Maximize2,
  Menu,
  Plus,
  RotateCw,
  Search,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react'

const suggestions = [
  { title: 'Ultraviolet', url: 'https://github.com/titaniumnetwork-dev/Ultraviolet-App', description: 'A sophisticated web proxy' },
  { title: 'Scramjet', url: 'https://github.com/MercuryWorkshop/scramjet', description: 'Modern web proxy technology' },
  { title: 'TitaniumNetwork', url: 'https://github.com/titaniumnetwork-dev', description: 'Open web tooling and projects' },
]

function normalizeAddress(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^[^\s]+\.[^\s]+$/.test(trimmed)) return `https://${trimmed}`
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`
}

export default function Page() {
  const [address, setAddress] = useState('')
  const [activeUrl, setActiveUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  function navigate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextUrl = normalizeAddress(address)
    if (!nextUrl) return
    setActiveUrl(nextUrl)
    setIsLoading(true)
    window.setTimeout(() => setIsLoading(false), 650)
  }

  function useSuggestion(url: string) {
    setAddress(url)
    setActiveUrl(url)
    setIsLoading(true)
    window.setTimeout(() => setIsLoading(false), 650)
  }

  return (
    <main className="browser-app">
      <header className="browser-chrome">


      </header>

      <section className="browser-page" aria-label="New tab page">
        <div className="page-glow glow-one" />
        <div className="page-glow glow-two" />
        <div className="home-content">
          <div className="hero-mark"></div>
          <h1>Nuclear Academy</h1>
          <p className="hero-copy">Ultraviolet is a sophisticated web proxy for accessing the open web in a controlled, private sandbox.</p>
          <form className="hero-search" onSubmit={navigate}>
            <Search />
            <input aria-label="Search the web freely" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Search the web freely" />
            <button type="submit">-></button>
          </form>
        </div>
      </section>
    </main>
  )
}
