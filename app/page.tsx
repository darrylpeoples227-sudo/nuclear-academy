'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Bell,
  Globe2,
  Hash,
  Headphones,
  HelpCircle,
  LockKeyhole,
  Menu,
  Mic,
  Pin,
  Plus,
  RotateCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  Star,
  Users,
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
  const [assistantMode, setAssistantMode] = useState<'chat' | 'ai'>('chat')
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [assistantMessages, setAssistantMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [assistantCategory, setAssistantCategory] = useState('help')
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { name: 'Nova', initials: 'N', color: '#5865f2', text: 'Welcome to the Nuclear Academy community!', time: 'Today at 9:41 AM' },
    { name: 'Maya', initials: 'M', color: '#eb459e', text: 'Hey everyone! Does anyone want to study together later?', time: 'Today at 9:43 AM' },
    { name: 'Alex', initials: 'A', color: '#57f287', text: 'I’m in. I need to review the science chapter.', time: 'Today at 9:44 AM' },
  ])

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
      setAssistantMode(category === 'AI' ? 'ai' : 'chat')
      setAssistantOpen(true)
      return
    }
    updateActiveTab({ address: category })
  }

  function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    setChatMessages((messages) => [...messages, { name: 'You', initials: 'Y', color: '#00aff4', text, time: 'Just now' }])
    setChatInput('')
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
      const response = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: nextMessages, category: assistantCategory }) })
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

      {assistantOpen && (assistantMode === 'chat' ? (
        <aside className="discord-shell" aria-label="Nuclear Academy online chat">
          <nav className="discord-servers" aria-label="Servers">
            <button className="server-orb server-home" type="button" aria-label="Nuclear Academy">N</button>
            <span className="server-divider" />
            <button className="server-orb active-server" type="button" aria-label="Study Lounge">SL</button>
            <button className="server-orb add-server" type="button" aria-label="Add a server"><Plus aria-hidden="true" /></button>
          </nav>
          <section className="discord-channels">
            <div className="discord-server-title"><strong>Study Lounge</strong><button type="button" aria-label="Close chat" onClick={() => setAssistantOpen(false)}><X aria-hidden="true" /></button></div>
            <div className="channel-search"><Search aria-hidden="true" /><span>Find a channel</span></div>
            <p className="channel-heading">TEXT CHANNELS <Plus aria-hidden="true" /></p>
            <button className="channel active-channel" type="button"><Hash aria-hidden="true" /><span>general</span></button>
            <button className="channel" type="button"><Hash aria-hidden="true" /><span>homework-help</span></button>
            <button className="channel" type="button"><Hash aria-hidden="true" /><span>study-tips</span></button>
            <p className="channel-heading voice-heading">VOICE CHANNELS <Plus aria-hidden="true" /></p>
            <button className="channel" type="button"><Headphones aria-hidden="true" /><span>Study Room</span></button>
            <div className="discord-user-card"><div className="user-avatar">Y<span /></div><div><strong>You</strong><small>Online</small></div><div className="user-actions"><Mic aria-hidden="true" /><Headphones aria-hidden="true" /><Settings aria-hidden="true" /></div></div>
          </section>
          <section className="discord-chat">
            <header className="discord-chat-header"><div className="chat-title"><Hash aria-hidden="true" /><strong>general</strong><span>Welcome to the Nuclear Academy community!</span></div><div className="chat-tools"><Bell aria-hidden="true" /><Pin aria-hidden="true" /><Users aria-hidden="true" /><HelpCircle aria-hidden="true" /></div></header>
            <div className="discord-messages" aria-live="polite">
              <div className="channel-welcome"><div className="welcome-hash"><Hash aria-hidden="true" /></div><h1>Welcome to #general!</h1><p>This is the beginning of this channel.</p></div>
              {chatMessages.map((message, index) => <article className="discord-message" key={`${message.name}-${index}`}><div className="message-avatar" style={{ background: message.color }}>{message.initials}</div><div><div className="message-meta"><strong>{message.name}</strong><time>{message.time}</time></div><p>{message.text}</p></div></article>)}
            </div>
            <form className="discord-composer" onSubmit={sendChatMessage}><button type="button" aria-label="Add attachment"><Plus aria-hidden="true" /></button><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Message #general" aria-label="Message general channel" /><button type="button" aria-label="Add emoji"><Smile aria-hidden="true" /></button><button className="send-chat" type="submit" aria-label="Send message" disabled={!chatInput.trim()}><Send aria-hidden="true" /></button></form>
          </section>
          <aside className="discord-members"><div className="members-heading">ONLINE — 3</div><div className="member-row"><div className="message-avatar small" style={{ background: '#5865f2' }}>N</div><strong>Nova</strong></div><div className="member-row"><div className="message-avatar small" style={{ background: '#eb459e' }}>M</div><strong>Maya</strong></div><div className="member-row"><div className="message-avatar small" style={{ background: '#57f287' }}>A</div><strong>Alex</strong></div></aside>
        </aside>
      ) : (
        <aside className="ai-fullscreen" aria-label="Nuclear Academy AI Assistant">
          <header className="ai-fullscreen-header">
            <div><span className="ai-orb">AI</span><div><h2>Nuclear Academy AI</h2><p>Your study partner for math, science, reading, and more</p></div></div>
            <button type="button" aria-label="Return to online chat" onClick={() => setAssistantMode('chat')}><Users aria-hidden="true" /> Chat</button>
            <button type="button" aria-label="Close AI assistant" onClick={() => setAssistantOpen(false)}><X aria-hidden="true" /></button>
          </header>
          <div className="assistant-categories" aria-label="Subject categories">
            {['Help', 'Math', 'Science', 'Social Studies', 'Reading', 'Suggestions'].map((category) => (
              <button key={category} type="button" className={`category-btn ${assistantCategory === category.toLowerCase() ? 'active' : ''}`} onClick={() => setAssistantCategory(category.toLowerCase())}>{category}</button>
            ))}
          </div>
          <div className="assistant-messages" aria-live="polite">
            {assistantMessages.length === 0 && <p className="assistant-welcome">Hi! Ask me anything about school, studying, or an idea you are exploring.</p>}
            {assistantMessages.map((message, index) => <div className={`assistant-message ${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}
            {assistantLoading && <div className="assistant-message assistant">Thinking…</div>}
          </div>
          <form className="assistant-form" onSubmit={askAssistant}><input value={assistantInput} onChange={(event) => setAssistantInput(event.target.value)} placeholder={`Ask a ${assistantCategory} question…`} aria-label="Ask the AI assistant" /><button type="submit" disabled={assistantLoading || !assistantInput.trim()}>Ask</button></form>
        </aside>
      ))}

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
