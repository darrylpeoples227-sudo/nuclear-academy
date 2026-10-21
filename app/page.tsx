'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { SignInButton, SignUpButton, Show, UserButton, useUser } from '@clerk/nextjs'
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  ExternalLink,
  Download,
  FileJson,
  Bell,
  Gamepad2,
  Globe2,
  Hash,
  Headphones,
  HelpCircle,
  LayoutGrid,
  LockKeyhole,
  Menu,
  MessagesSquare,
  Monitor,
  MicOff,
  Mic,
  Palette,
  Pin,
  Plus,
  RotateCw,
  Search,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Upload,
  Users,
  X,
} from 'lucide-react'

const suggestions = [
  { title: 'Ultraviolet', url: 'https://github.com/titaniumnetwork-dev/Ultraviolet-App', description: 'A sophisticated web proxy' },
  { title: 'Scramjet', url: 'https://github.com/MercuryWorkshop/scramjet', description: 'Modern web proxy technology' },
  { title: 'TitaniumNetwork', url: 'https://github.com/titaniumnetwork-dev', description: 'Open web tooling and projects' },
]

const appLinks = [
  ['Crunchyroll', 'https://crunchyroll.com'], ['X/Twitter', 'https://x.com/'], ['Twitch', 'https://www.twitch.tv/'], ['Truth Social', 'https://truthsocial.com/'], ['Reddit', 'https://reddit.com'], ['Soundboard', 'https://soundbuttonsworld.com/'], ['FMHY', 'https://fmhy.net'], ['Spotify', 'https://open.spotify.com/'], ['Amazon', 'https://www.amazon.com/'], ['Apple Music', 'https://music.apple.com/us/new'], ['Disney +', 'https://www.disneyplus.com/'], ['GeforceNOW', 'https://play.geforcenow.com/mall/#/loginwall'], ['eBay', 'https://www.ebay.com/'], ['Hacker Typer', 'https://hackertyper.net/'], ['Monochrome Music', 'https://monochrome.tf/'], ['NBA', 'https://www.nba.com/'], ['Gauth', 'https://www.gauthmath.com/'], ['CapCut', 'https://www.capcut.com/'], ['Discord', 'https://discord.com/'], ['TikTok', 'https://www.tiktok.com/'], ['Instagram', 'https://www.instagram.com/'], ['YouTube Music', 'https://music.youtube.com/'], ['Fandom', 'https://www.fandom.com/'], ['W3Schools', 'https://www.w3schools.com/'], ['Code Visual Studio', 'https://code.visualstudio.com/'], ['Scratch', 'https://scratch.mit.edu/'], ['Sh1mmer', 'https://sh1mmer.me/'], ['Thirty Dollar Website', 'https://thirtydollar.website'], ['V86', 'https://copy.sh/v86/'], ['Tiermaker', 'https://tiermaker.com/'], ['Chrome Music Lab', 'https://musiclab.chromeexperiments.com/'], ['ExtPrint3r', 'https://extprint3r.github.io/'], ['Base44', 'https://base44.app/'], ['About:blank Launcher', 'https://straight-blank-launch-pad.base44.app/'], ['Browser.lol', 'https://browser.lol/'],
]

const vmLinks = [
  ['Opera VM', 'https://blobs.vusercontent.net/blob/docker-opera-master-UfAcsDNVZJkiZcDdoSuSxSaeokNw3M.zip'],
  ['Microsoft Edge VM', 'https://blobs.vusercontent.net/blob/docker-msedge-master-VvRDGazd0hB4ZHIOUrkKukEyTKTST8.zip'],
  ['Steam VM', 'https://blobs.vusercontent.net/blob/docker-steam-master-mjBm4JdAQsdr8DbK1RPS39wr5N0Mcj.zip'],
  ['Ungoogled Chromium VM', 'https://blobs.vusercontent.net/blob/docker-ungoogled-chromium-master-yvWRRaWBR2czopirIEaRoehZHeAE10.zip'],
  ['WebCord VM', 'https://blobs.vusercontent.net/blob/docker-webcord-master-B7Rz1zIrquag8mHAJydpIDP9b2N0xN.zip'],
  ['Brave VM', 'https://blobs.vusercontent.net/blob/docker-brave-master-VO3LwQtSs4jCDlVjJ2RxEBLqtIivsr.zip'],
  ['Chrome VM', 'https://blobs.vusercontent.net/blob/docker-chrome-master-IUVDd8piaDryEjzNBNcbQhh3ekqgOO.zip'],
  ['Chromium VM', 'https://blobs.vusercontent.net/blob/docker-chromium-master-Wtku4ljIKQaCLiln2D78ebPHjqKB2X.zip'],
  ['Blender VM', 'https://blobs.vusercontent.net/blob/docker-blender-master-Le4YfMUjNSQ5Rj803XNu2gBR9iIuG2.zip'],
  ['Firefox VM', 'https://blobs.vusercontent.net/blob/docker-firefox-master-HpBwelypDG3jthamEqWJvQsaJkpU8H.zip'],
]

const gameLinks = [
  ['Yohoho io', 'https://yohoho.io/'], ['Slither io', 'http://slither.com/io'], ['Agar io', 'https://agar.io/'], ['Paper io', 'https://paperio.site/'], ['OVO', 'https://www.dedragames.com/games/ovo/1.1/'], ['OVO 2', 'https://dedragames.com/games/ovo2/0.2alpha/'], ['OVO 3', 'https://dedragames.com/games/ovo3/'], ['DOOM', 'https://swordslasher.com/games/doom/'], ['DOOM 2', 'https://swordslasher.com/games/doom2/'], ['Run', 'https://swordslasher.com/games/run1/'], ['Run 2', 'https://swordslasher.com/games/run2/'], ['Run 3', 'https://swordslasher.com/games/run3/'], ['Cookie Clicker', 'https://swordslasher.com/games/cookieclicker/'], ['Angry Birds', 'https://swordslasher.com/games/angrybirds/index.html'],
  ['2048', 'https://swordslasher.com/games/zeldalampshade/'], ['Duck Life', 'https://swordslasher.com/games/ducklife/'], ['Duck Life 2', 'https://swordslasher.com/games/ducklife2/'], ['Duck Life 3', 'https://swordslasher.com/games/ducklife3/'], ['Duck Life 4', 'https://swordslasher.com/games/ducklife4/'], ['Undertale', 'https://swordslasher.com/games/undertale/src/'], ['Deltarune', 'https://swordslasher.com/games/undertale/deltarune/'], ['N-gon', 'https://swordslasher.com/games/ngon/'], ['Super Mario 64', 'https://swordslasher.com/games/sm64/src/'], ['DNS Emulator', 'https://swordslasher.com/games/nds/'], ['Sonic 2', 'https://swordslasher.com/games/sonic2/'], ['GameBoy', 'https://swordslasher.com/games/gameboy/'], ['Ultimate Flash Sonic', 'https://swordslasher.com/games/ultimateflashsonic/'], ['Melon Sandbox', 'https://74.ip.nowgg.fun/apps/playducky/7199/melon-sandbox.html'], ['Roblox', 'https://74.ip.nowgg.fun/apps/a/19900/b.html'], ['Stumble Guys', 'https://74.ip.nowgg.fun/apps/a/10011/b.html'], ['Call Of Duty', 'https://74.ip.nowgg.fun/apps/a/10008/b.html'], ['Rocket League', 'https://74.ip.nowgg.fun/apps/a/10008/b.html'], ['Fortnite', 'https://nowgg.fun/apps/aptoide/5874/aptoide.html?deep_link=aptoidesearch://com.epicgames.fortnite'], ['Buckshot Roulette', 'https://swordslasher.com/games/buckshot/buckshot/'], ['Half Life', 'https://swordslasher.com/games/src/xash.html'], ['Super Meat Boy', 'https://swordslasher.com/games/bloonTDs/bloonTD2/'], ['FB@WG', 'https://amhooman.github.io/fireboywatergirl/game.html'], ['FB@WG 2', 'https://swordslasher.com/games/fbwg2/'], ['FB@WG 3', 'https://swordslasher.com/games/fbwg3/'], ['FB@WG 4', 'https://swordslasher.com/games/fbwg4/'], ['FB@WG 5', 'https://swordslasher.com/games/fbwg5/'], ['Slope', 'https://swordslasher.com/games/slope/'], ['Drive Mad', 'https://swordslasher.com/games/drive-mad/index.html'], ['Bit Life', 'https://swordslasher.com/games/bitlife/'], ['Wordle', 'https://swordslasher.com/games/wordle/#daily'], ['Retro Bowl', 'https://swordslasher.com/games/retrobowl/'], ['There Is Game', 'https://swordslasher.com/games/thereisnogame/alternate/871000/test.html'], ['FNF GO', 'https://www.fnfgo.com/'], ['Pac-Man', 'https://swordslasher.com/games/pacman2/'], ['Slope 2', 'https://playfreegamesonlinewithoutdownloading.github.io/slope-2-game.html'], ['Baldis Basics', 'https://playfreegamesonlinewithoutdownloading.github.io/baldis-basics.html'], ['Bad Time Simulator', 'https://playfreegamesonlinewithoutdownloading.github.io/bad-time-simulator.html'], ['Slope 3', 'https://playfreegamesonlinewithoutdownloading.github.io/slope-3.html'], ['Tiny Fishing', 'https://playfreegamesonlinewithoutdownloading.github.io/tiny-fishing.html'], ['Escape Road', 'https://playfreegamesonlinewithoutdownloading.github.io/escape-road.html'], ['Escape Road 2', 'https://playfreegamesonlinewithoutdownloading.github.io/escape-road-2.html'], ['Yandex games', 'https://yandex.com/games/'], ['Nowgg fun', 'https://nowgg.fun/'], ['Crazy games', 'https://www.crazygames.com/'], ['CoolMath Games', 'https://www.coolmathgames.com/'], ['Neal Fun', 'https://neal.fun/'], ['Mist', 'https://s3.amazonaws.com/misting2/index.html#/'], ['Space Waves', 'https://spacewaves.io/'], ['Ragdoll Hit', 'https://ragdollhit2.org/'], ['Ragdoll Archers', 'https://ragdollarchers2.io/'], ['Geometry Dash', 'https://geometrylitepc.net/'], ['Addicting Games', 'https://addictinggames.com/'], ['Y8 Games', 'https://y8.com/'], ['Poki', 'https://poki.com/'], ['Google Feud', 'https://googlefeud.com/'], 
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
  const [isClient, setIsClient] = useState(false)
  const { user } = useUser()
  const isOwner = user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'darrylpeoples227@gmail.com'
  const [ownerOpen, setOwnerOpen] = useState(false)
  const [ownerUsers, setOwnerUsers] = useState<Array<{ id: string; email: string; name: string; role: string; status: string; timeoutUntil: string | null }>>([])
  const [ownerError, setOwnerError] = useState('')
  const [profileName, setProfileName] = useState('You')
  const [profileImage, setProfileImage] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [privateRoomCode, setPrivateRoomCode] = useState<string | null>(null)
  const [voiceJoined, setVoiceJoined] = useState(false)
  const [voiceMuted, setVoiceMuted] = useState(false)
  const profileInput = useRef<HTMLInputElement>(null)
  const micStream = useRef<MediaStream | null>(null)
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
  const [catalogCategory, setCatalogCategory] = useState<'Apps' | 'Games' | 'VMs' | null>(null)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [panicUrl, setPanicUrl] = useState('https://www.google.com')
  const [panicCombo, setPanicCombo] = useState('Control+Shift+X')
  const [antiClose, setAntiClose] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState('#7eff84')
  const [backgroundImage, setBackgroundImage] = useState('')
  const [cloakName, setCloakName] = useState('Nuclear Academy')
  const [cloakLogo, setCloakLogo] = useState('/nuclear-academy-emblem.png')
  const importInput = useRef<HTMLInputElement>(null)
  const startupSound = useRef<HTMLAudioElement>(null)
  const exitSound = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    document.title = cloakName
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.appendChild(icon) }
    icon.href = cloakLogo
  }, [cloakName, cloakLogo])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const pressed = `${event.ctrlKey ? 'Control+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.altKey ? 'Alt+' : ''}${event.key.toUpperCase()}`
      if (pressed === panicCombo.toUpperCase()) window.location.assign(panicUrl)
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => { if (antiClose) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('beforeunload', onBeforeUnload) }
  }, [panicCombo, panicUrl, antiClose])

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
    if (category === 'Apps' || category === 'Games' || category === 'VMs') {
      setCatalogCategory(category)
      return
    }
    if (category === 'AI' || category === 'Chat') {
      setAssistantMode(category === 'AI' ? 'ai' : 'chat')
      setAssistantOpen(true)
      return
    }
    updateActiveTab({ address: category })
  }

  function openCatalogLink(url: string, isVmArchive = false) {
    if (isVmArchive) {
      const download = document.createElement('a')
      download.href = url
      download.download = ''
      download.target = '_blank'
      download.rel = 'noopener noreferrer'
      document.body.appendChild(download)
      download.click()
      download.remove()
      return
    }
    const proxiedUrl = `/api/proxy?url=${encodeURIComponent(url)}`
    updateActiveTab({ activeUrl: proxiedUrl, address: url, title: new URL(url).hostname || 'New tab' })
    setCatalogCategory(null)
    setIsLoading(true)
    window.setTimeout(() => setIsLoading(false), 650)
  }

  function updateProfileImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader(); reader.onload = () => setProfileImage(String(reader.result)); reader.readAsDataURL(file)
  }

  function createPrivateRoom() {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    setPrivateRoomCode(code)
  }

  async function toggleVoice() {
    if (voiceJoined) {
      micStream.current?.getTracks().forEach((track) => track.stop())
      micStream.current = null; setVoiceJoined(false); setVoiceMuted(false); return
    }
    try {
      micStream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      setVoiceJoined(true)
    } catch { setOwnerError('Microphone access was blocked. Allow microphone permission to join voice chat.') }
  }

  function toggleMute() {
    const nextMuted = !voiceMuted
    micStream.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted })
    setVoiceMuted(nextMuted)
  }

  async function openOwnerPanel() {
    setOwnerOpen(true); setOwnerError('')
    const response = await fetch('/api/owner/users')
    if (!response.ok) { setOwnerError('Owner access could not be verified.'); return }
    setOwnerUsers(await response.json())
  }

  async function moderateUser(userId: string, action: string, extra: Record<string, unknown> = {}) {
    const response = await fetch('/api/owner/users', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId, action, ...extra }) })
    if (!response.ok) { setOwnerError((await response.json()).error ?? 'Moderation failed.'); return }
    await openOwnerPanel()
  }

  function exportData() {
    const payload = { panicUrl, panicCombo, antiClose, backgroundColor, backgroundImage, cloakName, cloakLogo, selectedBrowser }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'nuclear-academy-settings.json'; link.click(); URL.revokeObjectURL(link.href)
  }

  function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { try { const data = JSON.parse(String(reader.result)); setPanicUrl(data.panicUrl ?? panicUrl); setPanicCombo(data.panicCombo ?? panicCombo); setAntiClose(Boolean(data.antiClose)); setBackgroundColor(data.backgroundColor ?? backgroundColor); setBackgroundImage(data.backgroundImage ?? ''); setCloakName(data.cloakName ?? cloakName); setCloakLogo(data.cloakLogo ?? cloakLogo); setSelectedBrowser(data.selectedBrowser ?? selectedBrowser) } catch { window.alert('That settings file is not valid JSON.') } }
    reader.readAsText(file)
    event.target.value = ''
  }

  function resetSettings() {
    setPanicUrl('https://www.google.com'); setPanicCombo('Control+Shift+X'); setAntiClose(false); setBackgroundColor('#7eff84'); setBackgroundImage(''); setCloakName('Nuclear Academy'); setCloakLogo('/nuclear-academy-emblem.png'); setSelectedBrowser('google')
  }

  function handleBackgroundImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader(); reader.onload = () => setBackgroundImage(String(reader.result)); reader.readAsDataURL(file)
  }

  function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    if (/\bmessage\b/i.test(text)) { setOwnerError('That word is blocked by message moderation.'); return }
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
  if (!response.ok) throw new Error(data.error || 'Assistant request failed')
  setAssistantMessages([...nextMessages, { role: 'assistant', content: data.text ?? 'I did not receive a response. Please try again.' }])
    } catch {
      setAssistantMessages([...nextMessages, { role: 'assistant', content: 'I could not connect right now. Please try again.' }])
    } finally {
      setAssistantLoading(false)
    }
  }

  if (!isClient) {
    return <main className="browser-app hydration-shell" aria-busy="true" />
  }

  return (
    <main className="browser-app" style={{ backgroundColor, backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
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
            <button type="button" aria-label="Open settings" onClick={() => setSettingsOpen(true)}><Menu aria-hidden="true" /></button>{isOwner && <button type="button" aria-label="Open owner panel" onClick={openOwnerPanel}><ShieldAlert aria-hidden="true" /></button>}
          </div>
        </div>
      </header>

      {profileOpen && <section className="profile-modal" aria-label="Edit profile"><div className="profile-card"><button className="profile-close" type="button" onClick={() => setProfileOpen(false)} aria-label="Close profile editor"><X /></button><div className="profile-preview">{profileImage ? <img src={profileImage} alt="Profile preview" /> : profileName.slice(0, 1).toUpperCase()}</div><h2>Edit your profile</h2><label>Display name<input value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={24} /></label><label className="profile-upload">Upload profile picture<input ref={profileInput} type="file" accept="image/*" onChange={updateProfileImage} /></label><button className="profile-save" type="button" onClick={() => setProfileOpen(false)}>Save profile</button></div></section>}

      {ownerOpen && isOwner && (
        <section className="settings-overlay owner-overlay" aria-label="Owner panel"><div className="settings-panel owner-panel"><header className="settings-header"><div><span className="settings-kicker">OWNER CONTROL</span><h2>Community moderation</h2><p>Signed in as {user?.primaryEmailAddress?.emailAddress}</p></div><button type="button" className="settings-close" onClick={() => setOwnerOpen(false)} aria-label="Close owner panel"><X /></button></header><div className="owner-tools"><div><strong>Message moderation</strong><p>Messages containing <code>message</code> are blocked by default.</p></div><span className="owner-status">Active</span></div>{ownerError && <p className="owner-error">{ownerError}</p>}<div className="owner-user-list">{ownerUsers.map((member) => <article className="owner-user" key={member.id}><div><strong>{member.name}</strong><small>{member.email}</small></div><span className={`owner-badge ${member.status}`}>{member.role} · {member.status}</span><div className="owner-actions"><button type="button" onClick={() => moderateUser(member.id, member.status === 'banned' ? 'unban' : 'ban')}>{member.status === 'banned' ? 'Unban' : 'Ban'}</button><button type="button" onClick={() => moderateUser(member.id, member.timeoutUntil ? 'untimeout' : 'timeout', { timeoutMinutes: 10 })}>{member.timeoutUntil ? 'Remove timeout' : 'Timeout 10m'}</button><button type="button" onClick={() => moderateUser(member.id, member.role === 'member' ? 'rank' : 'unrank', { role: 'moderator' })}>{member.role === 'member' ? 'Rank moderator' : 'Unrank'}</button></div></article>)}</div></div></section>
      )}

      {settingsOpen && (
        <section className="settings-overlay" aria-label="Settings">
          <div className="settings-panel">
            <header className="settings-header"><div><span className="settings-kicker">NUCLEAR ACADEMY</span><h2>Settings</h2><p>Customize your browser workspace.</p></div><button type="button" className="settings-close" onClick={() => setSettingsOpen(false)} aria-label="Close settings"><X /></button></header>
            <div className="settings-grid">
              <section className="settings-section"><div className="settings-section-title"><ShieldAlert /><div><h3>Panic Button</h3><p>Use your key combo to leave instantly.</p></div></div><label>Redirect URL<input value={panicUrl} onChange={(e) => setPanicUrl(e.target.value)} placeholder="https://www.google.com" /></label><label>Key Combo<input value={panicCombo} onChange={(e) => setPanicCombo(e.target.value)} placeholder="Control+Shift+X" /></label><button className="panic-button" type="button" onClick={() => window.location.assign(panicUrl)}>Test Panic Button</button></section>
              <section className="settings-section"><div className="settings-section-title"><ShieldCheck /><div><h3>Safety</h3><p>Control how the browser can be closed.</p></div></div><label className="toggle-row"><span>Anti Close</span><input type="checkbox" checked={antiClose} onChange={(e) => setAntiClose(e.target.checked)} /><span className="toggle-ui" /></label></section>
              <section className="settings-section"><div className="settings-section-title"><Search /><div><h3>Search Engine</h3><p>Choose the engine used for searches.</p></div></div><select className="settings-select" value={selectedBrowser} onChange={(e) => setSelectedBrowser(e.target.value)}><option value="google">Google</option><option value="duckduckgo">DuckDuckGo</option><option value="brave">Brave Search</option><option value="bing">Bing</option></select></section>
              <section className="settings-section"><div className="settings-section-title"><Palette /><div><h3>Appearance</h3><p>Set a custom color or background image.</p></div></div><label>Background color<input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} /></label><label className="file-button"><Upload /> Add background image<input type="file" accept="image/*" onChange={handleBackgroundImage} /></label></section>
              <section className="settings-section"><div className="settings-section-title"><Globe2 /><div><h3>Tab Cloak</h3><p>Change the browser title and favicon.</p></div></div><label>Website name<input value={cloakName} onChange={(e) => setCloakName(e.target.value)} /></label><label className="file-button"><Upload /> Add logo<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = () => setCloakLogo(String(reader.result)); reader.readAsDataURL(file) } }} /></label><div className="cloak-presets">{['Google','Google Docs','Google Drive','Google Classroom','Google Slides','Google Sheets','IXL','Canvas','Gmail','Khan Academy','Clever','Schoology','Quizlet','Edpuzzle','Desmos','PowerSchool'].map((name) => <button type="button" key={name} onClick={() => setCloakName(name)}>{name}</button>)}</div></section>
              <section className="settings-section data-section"><div className="settings-section-title"><FileJson /><div><h3>Data</h3><p>Export or import your settings.</p></div></div><div className="data-actions"><button type="button" onClick={exportData}><Download /> Export</button><button type="button" onClick={() => importInput.current?.click()}><Upload /> Import</button><input ref={importInput} type="file" accept="application/json" onChange={importData} /></div></section>
            </div>
            <button className="reset-settings" type="button" onClick={resetSettings}>Reset to Default</button>
          </div>
        </section>
      )}

      {assistantOpen && (assistantMode === 'chat' ? (
        <>
          <Show when="signed-out">
            <aside className="chat-auth-gate" aria-label="Sign in to chat">
              <div className="chat-auth-card">
                <div className="ai-orb">N</div>
                <h2>Join the Study Lounge</h2>
                <p>Sign in or create an account before chatting online, joining servers, or sharing invite codes.</p>
                <div className="chat-auth-actions"><SignInButton mode="modal"><button type="button" className="auth-primary">Sign in</button></SignInButton><SignUpButton mode="modal"><button type="button" className="auth-secondary">Create account</button></SignUpButton></div>
                <button type="button" className="auth-dismiss" onClick={() => setAssistantOpen(false)}>Maybe later</button>
              </div>
            </aside>
          </Show>
          <Show when="signed-in">
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
            <button className={`channel ${voiceJoined ? 'active-channel' : ''}`} type="button" onClick={toggleVoice}><Headphones aria-hidden="true" /><span>Study Room</span>{voiceJoined && <small className="voice-live">LIVE</small>}</button><button className="channel private-room-button" type="button" onClick={createPrivateRoom}><LockKeyhole aria-hidden="true" /><span>Private room</span></button>{privateRoomCode && <div className="private-code" role="status">Invite code <strong>{privateRoomCode}</strong><button type="button" onClick={() => navigator.clipboard?.writeText(privateRoomCode)} aria-label="Copy invite code"><Copy aria-hidden="true" /></button></div>}
            <div className="discord-user-card"><button className="user-avatar profile-avatar-button" type="button" onClick={() => setProfileOpen(true)} aria-label="Edit profile">{profileImage ? <img src={profileImage} alt="Your profile" /> : profileName.slice(0, 1).toUpperCase()}<span /></button><div><strong>{profileName}</strong><small>{voiceJoined ? 'In Study Room' : 'Online'}</small></div><div className="user-actions"><button type="button" onClick={toggleMute} disabled={!voiceJoined} aria-label={voiceMuted ? 'Unmute microphone' : 'Mute microphone'}>{voiceMuted ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}</button><button type="button" onClick={toggleVoice} aria-label={voiceJoined ? 'Leave Study Room' : 'Join Study Room'}><Headphones aria-hidden="true" /></button><UserButton /></div></div>
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
          </Show>
        </>
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

      {catalogCategory && (
        <section className="catalog-overlay" aria-label={`${catalogCategory} directory`}>
          <div className="catalog-card">
            <div className="catalog-topbar"><button type="button" className="catalog-close" onClick={() => setCatalogCategory(null)} aria-label="Close directory"><X aria-hidden="true" /></button><label className="catalog-search"><Search aria-hidden="true" /><input aria-label={`Search ${catalogCategory}`} placeholder="Search by name" value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} /><kbd>/</kbd></label><span className="catalog-spacer" /></div>
            <div className="catalog-title"><span className="catalog-kicker">NUCLEAR ACADEMY</span><h2>{catalogCategory}</h2><p>{catalogCategory === 'Games' ? 'Pick a game and start playing.' : catalogCategory === 'VMs' ? 'Download Docker VM project archives to run with Docker.' : 'Open a favorite app in your browser.'}</p></div>
            <div className="catalog-grid">{(catalogCategory === 'Apps' ? appLinks : catalogCategory === 'VMs' ? vmLinks : gameLinks).filter(([name, url]) => `${name} ${url}`.toLowerCase().includes(catalogSearch.trim().toLowerCase())).map(([name, url], index) => <button className={`catalog-item tile-${(index % 7) + 1}`} key={`${name}-${url}`} type="button" onClick={() => openCatalogLink(url, catalogCategory === 'VMs')}><span className="catalog-icon"><img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=128`} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; const fallback = event.currentTarget.nextElementSibling as HTMLElement | null; if (fallback) fallback.style.display = 'grid' }} /><span>{name.slice(0, 1)}</span></span><span className="catalog-name">{name}</span><ExternalLink aria-hidden="true" /></button>)}</div>
          </div>
        </section>
      )}

      <section className="browser-page" aria-label="New tab page" style={{ backgroundColor, backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
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
          <div className="hero-mark">
            <img src="/nuclear-academy-emblem.png" alt="Nuclear Academy logo" />
          </div>
          <h1>Nuclear Academy</h1>
          <p className="hero-copy">A friendly school for every student :D</p>
          <form className="hero-search" onSubmit={navigate}>
            <Search />
            <input aria-label="Search the web freely" value={address} onChange={(event) => updateActiveTab({ address: event.target.value })} placeholder="Search the web freely" />
            <button type="submit">{'>'}</button>
          </form>
          <nav className="category-tabs" aria-label="Explore categories">
{[
              ['Apps', LayoutGrid],
              ['Games', Gamepad2],
              ['VMs', Monitor],
              ['AI', Sparkles],
              ['Chat', MessagesSquare],
            ].map(([category, Icon]) => (
              <button key={category as string} type="button" onClick={() => browseCategory(category as string)}>
                <Icon aria-hidden="true" />
                {category as string}
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
          <span>cya! next time keep playing more GAMES</span>
        </div>
      )}
    </main>
  )
}
