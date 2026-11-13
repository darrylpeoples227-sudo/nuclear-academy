'use client'

import { FormEvent, useState } from 'react'
import useSWR from 'swr'
import { Hash, Pencil, Plus, Send, Smile, Trash2 } from 'lucide-react'

type ChatMessage = {
  id: string
  userId: string
  name: string
  initials: string
  color: string
  text: string
  time: string
  avatarUrl?: string | null
}

type ChatResponse = { messages: ChatMessage[] }

type LiveChatProps = {
  channel: string
  serverId: string | null
  serverChannelId: string | null
  serverName: string
  userId: string
  isOwner: boolean
}

async function fetchMessages(url: string): Promise<ChatResponse> {
  const response = await fetch(url, { cache: 'no-store' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Chat history could not be loaded.')
  return data as ChatResponse
}

export function LiveChat({ channel, serverId, serverChannelId, serverName, userId, isOwner }: LiveChatProps) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [actionError, setActionError] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingMessageText, setEditingMessageText] = useState('')
  const params = new URLSearchParams({ channel })
  if (serverId && serverChannelId) {
    params.set('serverId', serverId)
    params.set('serverChannelId', serverChannelId)
  }
  const key = `/api/chat?${params.toString()}`
  const { data, error, isLoading, mutate } = useSWR<ChatResponse>(key, fetchMessages, {
    refreshInterval: 2000,
    revalidateOnFocus: true,
    dedupingInterval: 1000,
  })
  const messages = data?.messages ?? []

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    if (/\bmessage\b/i.test(text)) {
      setActionError('That word is blocked by message moderation.')
      return
    }
    setActionError('')
    setSending(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, channel, serverId, serverChannelId }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Your message could not be saved.')
      await mutate((current) => ({ messages: [...(current?.messages ?? []), result.message as ChatMessage] }), { revalidate: false })
      setInput('')
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Your message could not be saved.')
    } finally {
      setSending(false)
    }
  }

  async function saveEditedMessage(id: string) {
    const text = editingMessageText.trim()
    if (!text || !userId) return
    setActionError('')
    try {
      const response = await fetch(`/api/chat/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Message could not be updated.')
      await mutate((current) => ({
        messages: (current?.messages ?? []).map((message) => message.id === id
          ? { ...message, text: result.message.text, time: result.message.time }
          : message),
      }), { revalidate: false })
      setEditingMessageId(null)
      setEditingMessageText('')
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Message could not be updated.')
    }
  }

  async function deleteMessage(id: string) {
    if (!window.confirm('Delete this message?')) return
    setActionError('')
    try {
      const response = await fetch(`/api/chat/${encodeURIComponent(id)}`, { method: 'DELETE' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Message could not be deleted.')
      await mutate((current) => ({ messages: (current?.messages ?? []).filter((message) => message.id !== id) }), { revalidate: false })
      if (editingMessageId === id) setEditingMessageId(null)
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Message could not be deleted.')
    }
  }

  return (
    <>
      <header className="discord-chat-header">
        <div className="chat-title"><Hash aria-hidden="true" /><strong>{channel}</strong><span>Welcome to {serverName}!</span></div>
        <span className={`chat-live-status ${error ? 'chat-live-status-error' : ''}`} role="status">
          <span aria-hidden="true" />{error ? 'Reconnecting' : 'Live'}
        </span>
      </header>
      <div className="discord-messages" aria-live="polite" aria-relevant="additions text">
        <div className="channel-welcome"><div className="welcome-hash"><Hash aria-hidden="true" /></div><h1>Welcome to #{channel}!</h1><p>This is the beginning of this channel.</p></div>
        {actionError && <p className="chat-action-error" role="alert">{actionError}</p>}
        {error && <p className="chat-action-error" role="status">Live updates disconnected. Reconnecting…</p>}
        {!error && isLoading && <p className="chat-loading-status" role="status">Connecting to live chat…</p>}
        {messages.map((message) => {
          const isOwnMessage = message.userId === userId
          const canDeleteMessage = isOwnMessage || isOwner
          const isEditing = editingMessageId === message.id
          return (
            <article className="chat-message" key={message.id} aria-label={`Message from ${message.name}`}>
              <div className={`message-avatar small ${message.avatarUrl ? 'image-avatar' : ''}`} style={{ background: message.color }}>
                {message.avatarUrl ? <img src={message.avatarUrl} alt={`${message.name}'s avatar`} /> : message.initials}
              </div>
              <div className="message-content">
                <div className="message-meta">
                  <strong>{message.name}</strong><time>{message.time}</time>
                  <div className="message-actions">
                    {isOwnMessage && <button type="button" aria-label={`Edit message from ${message.name}`} onClick={() => { setEditingMessageId(message.id); setEditingMessageText(message.text); setActionError('') }}><Pencil aria-hidden="true" /></button>}
                    {canDeleteMessage && <button type="button" aria-label={`Delete message from ${message.name}`} onClick={() => void deleteMessage(message.id)}><Trash2 aria-hidden="true" /></button>}
                  </div>
                </div>
                {isEditing ? (
                  <form className="message-edit-form" onSubmit={(event) => { event.preventDefault(); void saveEditedMessage(message.id) }}>
                    <input
                      aria-label="Edit your message"
                      value={editingMessageText}
                      onChange={(event) => setEditingMessageText(event.target.value)}
                      onKeyDown={(event) => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault() }}
                      maxLength={2000}
                      autoFocus
                    />
                    <button type="submit" disabled={!editingMessageText.trim()}>Save</button>
                    <button type="button" onClick={() => setEditingMessageId(null)}>Cancel</button>
                  </form>
                ) : <p>{message.text}</p>}
              </div>
            </article>
          )
        })}
      </div>
      <form className="discord-composer" onSubmit={sendMessage}>
        <button type="button" aria-label="Add attachment" disabled><Plus aria-hidden="true" /></button>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault() }}
          placeholder={`Message #${channel}`}
          aria-label={`Message ${channel} channel`}
          maxLength={2000}
        />
        <button type="button" aria-label="Add emoji" disabled><Smile aria-hidden="true" /></button>
        <button className="send-chat" type="submit" aria-label="Send message" disabled={!input.trim() || sending}><Send aria-hidden="true" /></button>
      </form>
    </>
  )
}
