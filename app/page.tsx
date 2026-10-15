'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
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
  const [isExiting, setIsExiting] = useState(false)
  const startupSound = useRef<HTMLAudioElement>(null)
  const exitSound = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    void startupSound.current?.play().catch(() => {
      // Browsers may block autoplay until the first interaction.
    })
  }, [])

  function closeBrowser() {
    setIsExiting(true)
    const audio = exitSound.current
    if (!audio) return
    audio.currentTime = 0
    void audio.play().catch(() => finishExit())
    audio.onended = finishExit
  }

  function finishExit() {
    window.close()
    window.setTimeout(() => {
      window.location.replace('about:blank')
    }, 100)
  }

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
        <div className="tab-strip">
          <div className="tab active-tab">
            <Globe2 aria-hidden="true" />
            <span>New tab</span>
            <X aria-hidden="true" />
          </div>
          <button className="new-tab" type="button" aria-label="Open new tab"><Plus aria-hidden="true" /></button>
        </div>
        <div className="toolbar">
          <div className="nav-actions" aria-label="Browser navigation">
            <button type="button" aria-label="Back"><ArrowLeft aria-hidden="true" /></button>
            <button type="button" aria-label="Forward"><ArrowRight aria-hidden="true" /></button>
            <button type="button" aria-label="Reload"><RotateCw aria-hidden="true" /></button>
          </div>
          <form className="address-bar" onSubmit={navigate}>
            <LockKeyhole aria-hidden="true" />
            <input aria-label="Web address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Search or enter a web address" />
            <button type="button" aria-label="Bookmark" onClick={() => setIsBookmarked(!isBookmarked)}><Star aria-hidden="true" fill={isBookmarked ? "currentColor" : "none"} /></button>
          </form>
          <div className="toolbar-actions">
            <button type="button" aria-label="Exit browser" onClick={closeBrowser}><X aria-hidden="true" /></button>
            <button type="button" aria-label="Menu"><Menu aria-hidden="true" /></button>
          </div>
        </div>
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

      <audio ref={startupSound} src="/wing5.wav" preload="auto" />
      <audio ref={exitSound} src="/wing4.wav" preload="auto" />

      {isExiting && (
        <div className="exit-screen" role="status" aria-live="polite">
          <span>Closing browser</span>
        </div>
      )}
    </main>
  )
}
