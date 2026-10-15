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
        <div className="window-bar">
          <div className="brand-lockup">
            <img src="/uv.png" alt="Ultraviolet logo" className="brand-mark" />
            <span>Ultraviolet Browser</span>
          </div>
          <div className="window-actions" aria-label="Window controls">
            <button aria-label="Minimize window"><span className="minimize" /></button>
            <button aria-label="Maximize window"><Maximize2 /></button>
            <button aria-label="Close window"><X /></button>
          </div>
        </div>
        <div className="tab-bar">
          <div className="tab active-tab">
            <Globe2 />
            <span>{activeUrl ? new URL(activeUrl).hostname : 'New tab'}</span>
            <button aria-label="Close tab"><X /></button>
          </div>
          <button className="new-tab" aria-label="Open new tab" onClick={() => { setAddress(''); setActiveUrl('') }}><Plus /></button>
        </div>
        <div className="toolbar">
          <div className="nav-actions">
            <button aria-label="Go back"><ArrowLeft /></button>
            <button aria-label="Go forward"><ArrowRight /></button>
            <button aria-label="Reload" onClick={() => setIsLoading(true)}><RotateCw className={isLoading ? 'spin' : ''} /></button>
          </div>
          <form className="address-bar" onSubmit={navigate}>
            <LockKeyhole className="address-lock" />
            <input aria-label="Address and search bar" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Search or enter a web address" />
            <button type="button" aria-label="Bookmark this page" className={isBookmarked ? 'bookmarked' : ''} onClick={() => setIsBookmarked(!isBookmarked)}><Star /></button>
          </form>
          <div className="toolbar-actions">
            <button aria-label="Downloads"><Download /></button>
            <button aria-label="Open menu"><Menu /></button>
          </div>
        </div>
        {isLoading && <div className="loading-line" />}
      </header>

      <section className="browser-page" aria-label="New tab page">
        <div className="page-glow glow-one" />
        <div className="page-glow glow-two" />
        <div className="home-content">
          <div className="hero-mark"><ShieldCheck /></div>
          <p className="eyebrow">PRIVATE · FAST · OPEN</p>
          <h1>Browse without limits.</h1>
          <p className="hero-copy">Ultraviolet is a sophisticated web proxy for accessing the open web in a controlled, private sandbox.</p>
          <form className="hero-search" onSubmit={navigate}>
            <Search />
            <input aria-label="Search the web freely" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Search the web freely" />
            <button type="submit">Go</button>
          </form>
          <div className="quick-links" aria-label="Quick links">
            {suggestions.map((suggestion) => (
              <button key={suggestion.title} className="quick-link" onClick={() => useSuggestion(suggestion.url)}>
                <span className="quick-icon"><ExternalLink /></span>
                <span><strong>{suggestion.title}</strong><small>{suggestion.description}</small></span>
              </button>
            ))}
          </div>
        </div>
        <footer className="browser-footer"><span>Ultraviolet · TitaniumNetwork</span><span>Protected by service workers</span></footer>
      </section>
    </main>
  )
}
