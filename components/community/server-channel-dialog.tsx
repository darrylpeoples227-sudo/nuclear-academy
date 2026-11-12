import type { FormEvent } from 'react'
import { Hash, Headphones, X } from 'lucide-react'

type ServerChannelDialogProps = {
  type: 'text' | 'voice'
  name: string
  error: string
  saving: boolean
  onNameChange: (name: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClose: () => void
}

export function ServerChannelDialog({ type, name, error, saving, onNameChange, onSubmit, onClose }: ServerChannelDialogProps) {
  const isText = type === 'text'
  return (
    <section className="community-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="channel-create-title">
      <div className="community-modal channel-create-modal">
        <header className="community-modal-header">
          <div><span className="settings-kicker">SERVER CHANNELS</span><h2 id="channel-create-title">Add a {isText ? 'text' : 'voice'} channel</h2><p>Give this channel a clear name for your community.</p></div>
          <button type="button" className="settings-close" onClick={onClose} aria-label="Close channel dialog"><X /></button>
        </header>
        <div className="channel-type-chip">{isText ? <Hash aria-hidden="true" /> : <Headphones aria-hidden="true" />}{isText ? 'Text channel' : 'Voice channel'}</div>
        <form className="community-server-form" onSubmit={onSubmit}>
          <label htmlFor="community-channel-name">Channel name</label>
          <input id="community-channel-name" value={name} onChange={(event) => onNameChange(event.target.value)} maxLength={40} required placeholder={isText ? 'e.g. homework-help' : 'e.g. Study Room'} />
          {error && <p className="community-form-error" role="alert">{error}</p>}
          <button className="community-primary-action" type="submit" disabled={saving || name.trim().length < 2}>{saving ? 'Adding…' : `Add ${isText ? 'text' : 'voice'} channel`}</button>
        </form>
      </div>
    </section>
  )
}
