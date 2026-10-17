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

function normalizeAddress(value: string, engine: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^[^\s]+\.[^\s]+$/.test(trimmed)) return `https://${trimmed}`
  const searchUrls: Record<string, string> = {
    google: 'https://www.google.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    brave: 'https://search.brave.com/search?q=',
    bing: 'https://www.bing.com/search?q=',
  }
  return `${searchUrls[engine] ?? searchUrls.google}${encodeURIComponent(trimmed)}`
}

export default function Page() {
  const [tabs, setTabs] = useState([{ id: 1, title: 'New tab', address: '', activeUrl: '' }])
  const [activeTabId, setActiveTabId] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [assistantMessages, setAssistantMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const address = activeTab?.address ?? ''
  const activeUrl = activeTab?.activeUrl ?? ''

  function updateActiveTab(updates: Partial<typeof tabs[number]>) {
    setTabs((currentTabs) => currentTabs.map((tab) => tab.id === activeTabId ? { ...tab, ...updates } : tab))
  }

  function addNewTab() {
    const id = Date.now()
    setTabs((currentTabs) => [...currentTabs, { id, title: 'New tab', address: '', activeUrl: '' }])
    setActiveTabId(id)
  }

  function closeTab(id: number) {
    if (tabs.length === 1) return
    const remainingTabs = tabs.filter((tab) => tab.id !== id)
    setTabs(remainingTabs)
    if (id === activeTabId) setActiveTabId(remainingTabs[remainingTabs.length - 1].id)
  }
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [selectedBrowser, setSelectedBrowser] = useState('google')
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
    const nextUrl = normalizeAddress(address, selectedBrowser)
    if (!nextUrl) return
    const proxiedUrl = `/api/proxy?url=${encodeURIComponent(nextUrl)}`
    updateActiveTab({ activeUrl: proxiedUrl, address: nextUrl, title: new URL(nextUrl).hostname || 'New tab' })
    setIsLoading(true)
    window.setTimeout(() => setIsLoading(false), 650)
  }

  function goBack() {
    updateActiveTab({ activeUrl: '', address: '', title: 'New tab' })
  }

  function goReload() {
    if (!activeUrl) return
    setIsLoading(true)
    window.setTimeout(() => setIsLoading(false), 400)
  }

  function browseCategory(category: string) {
    if (category === 'AI' || category === 'Chat') {
      setAssistantOpen(true)
      return
    }
    updateActiveTab({ address: category })
  }

  async function askAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = assistantInput.trim()
    if (!content || assistantLoading) return
    const nextMessages = [...assistantMessages, { role: 'user' as const, content }]
    setAssistantMessages(nextMessages)
    setAssistantInput('')
    setAssistantLoading(true)
    try {
      const response = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: nextMessages }) })
      const data = await response.json()
      setAssistantMessages([...nextMessages, { role: 'assistant', content: data.text ?? data.error }])
    } catch {
      setAssistantMessages([...nextMessages, { role: 'assistant', content: 'I could not connect right now. Please try again.' }])
    } finally {
      setAssistantLoading(false)
    }
  }

  return (
    <main className="browser-app">
      <header className="browser-chrome">
        <div className="tab-strip">
          {tabs.map((tab) => (
            <button
              className={`tab ${tab.id === activeTabId ? 'active-tab' : ''}`}
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              aria-label={`Switch to ${tab.title}`}
            >
              <Globe2 aria-hidden="true" />
              <span>{tab.title}</span>
              <X aria-hidden="true" onClick={(event) => { event.stopPropagation(); closeTab(tab.id) }} />
            </button>
          ))}
          <button className="new-tab" type="button" aria-label="Open new tab" onClick={addNewTab}><Plus aria-hidden="true" /></button>
        </div>
        <div className="toolbar">
          <div className="nav-actions" aria-label="Browser navigation">
            <button type="button" aria-label="Back" onClick={goBack} disabled={!activeUrl}><ArrowLeft aria-hidden="true" /></button>
            <button type="button" aria-label="Forward" disabled><ArrowRight aria-hidden="true" /></button>
            <button type="button" aria-label="Reload" onClick={goReload} disabled={!activeUrl}><RotateCw aria-hidden="true" className={isLoading ? 'spin' : undefined} /></button>
          </div>
          <form className="address-bar" onSubmit={navigate}>
            <LockKeyhole aria-hidden="true" />
            <input aria-label="Web address" value={address} onChange={(event) => updateActiveTab({ address: event.target.value })} placeholder="Search or enter a web address" />
            <button type="button" aria-label="Bookmark" onClick={() => setIsBookmarked(!isBookmarked)}><Star aria-hidden="true" fill={isBookmarked ? "currentColor" : "none"} /></button>
          </form>
          <div className="toolbar-actions">
            <button type="button" aria-label="Exit browser" onClick={closeBrowser}><X aria-hidden="true" /></button>
            <button type="button" aria-label="Menu"><Menu aria-hidden="true" /></button>
          </div>
        </div>
      </header>

      {assistantOpen && (
        <aside className="assistant-panel" aria-label="Nuclear Academy Assistant">
          <div className="assistant-header"><div><strong>Nuclear Academy Assistant</strong><span>Help with math, science, reading, and more</span></div><button type="button" aria-label="Close assistant" onClick={() => setAssistantOpen(false)}><X aria-hidden="true" /></button></div>
          <div className="assistant-messages" aria-live="polite">
            {assistantMessages.length === 0 && <p className="assistant-welcome">Hi! Ask me anything about school, studying, or an idea you are exploring.</p>}
            {assistantMessages.map((message, index) => <div className={`assistant-message ${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}
            {assistantLoading && <div className="assistant-message assistant">Thinking…</div>}
          </div>
          <form className="assistant-form" onSubmit={askAssistant}><input value={assistantInput} onChange={(event) => setAssistantInput(event.target.value)} placeholder="Ask for help…" aria-label="Ask the assistant" /><button type="submit" disabled={assistantLoading || !assistantInput.trim()}>Ask</button></form>
        </aside>
      )}

      <section className="browser-page" aria-label="New tab page">
        <div className="page-glow glow-one" />
        <div className="page-glow glow-two" />
        {activeUrl ? (
          <div className="browser-view" aria-label="Browsing content">
            <iframe
              key={activeUrl}
              title="Web page"
              src={activeUrl}
              className="web-frame"
              sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
            />
          </div>
        ) : (
        <div className="home-content">
          <div className="browser-select-container">
            <label htmlFor="browser-select">Search Engine:</label>
            <select 
              id="browser-select" 
              value={selectedBrowser} 
              onChange={(e) => setSelectedBrowser(e.target.value)}
              className="browser-select"
            >
              <option value="google">Google</option>
              <option value="duckduckgo">DuckDuckGo</option>
              <option value="brave">Brave Search</option>
              <option value="bing">Bing</option>
            </select>
          </div>
          <div className="hero-mark">
            <img src="/nuclear-academy-emblem.png" alt="Nuclear Academy emblem" />
          </div>
          <h1>Nuclear Academy</h1>
          <p className="hero-copy">A friendly school for every student :D</p>
          <form className="hero-search" onSubmit={navigate}>
            <Search />
            <input aria-label="Search the web freely" value={address} onChange={(event) => updateActiveTab({ address: event.target.value })} placeholder="Search the web freely" />
            <button type="submit">{'>'}</button>
          </form>
          <nav className="category-tabs" aria-label="Explore categories">
            {['Apps', 'Games', 'AI', 'Chat'].map((category) => (
              <button key={category} type="button" onClick={() => browseCategory(category)}>
                {category}
              </button>
            ))}
          </nav>
        </div>
        )}
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
