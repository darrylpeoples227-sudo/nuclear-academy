import type { ChangeEvent, FormEvent } from 'react'
import { Hash, Headphones, Plus, Upload, X } from 'lucide-react'
import type { CommunityServer } from '@/lib/community/types'

type ServerCreateDialogProps = {
  open: boolean
  name: string
  picturePreview: string
  error: string
  saving: boolean
  servers: CommunityServer[]
  onNameChange: (name: string) => void
  onPictureChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onJoin: (serverId: string) => void
  onClose: () => void
}

export function ServerCreateDialog({
  open,
  name,
  picturePreview,
  error,
  saving,
  servers,
  onNameChange,
  onPictureChange,
  onSubmit,
  onJoin,
  onClose,
}: ServerCreateDialogProps) {
  if (!open) return null

  return (
    <section className="community-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="server-create-title">
      <div className="community-modal server-create-modal">
        <header className="community-modal-header">
          <div><span className="settings-kicker">YOUR COMMUNITY</span><h2 id="server-create-title">Create or join a server</h2><p>Start a space with your own channels and server picture.</p></div>
          <button type="button" className="settings-close" onClick={onClose} aria-label="Close server dialog"><X /></button>
        </header>
        <form className="community-server-form" onSubmit={onSubmit}>
          <label htmlFor="community-server-name">Server name</label>
          <input id="community-server-name" value={name} onChange={(event) => onNameChange(event.target.value)} maxLength={40} required placeholder="e.g. Study Circle" />
          <label className="community-image-upload" htmlFor="community-server-picture">
            {picturePreview ? <img src={picturePreview} alt="Selected server picture preview" /> : <span className="community-image-placeholder"><Upload aria-hidden="true" /></span>}
            <span>{picturePreview ? 'Change server picture' : 'Add server picture'}</span>
            <input id="community-server-picture" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onPictureChange} />
          </label>
          <p className="community-form-hint">PNG, JPEG, WebP, or GIF · max 5 MB. New servers start with #general and a Study Room voice channel.</p>
          {error && <p className="community-form-error" role="alert">{error}</p>}
          <button className="community-primary-action" type="submit" disabled={saving || name.trim().length < 2}>{saving ? 'Creating…' : <><Plus aria-hidden="true" /> Create server</>}</button>
        </form>
        <div className="community-directory">
          <div className="community-directory-heading"><div><strong>Discover servers</strong><span>Join a community to see its channels.</span></div><span>{servers.length}</span></div>
          {servers.length === 0 ? <p className="community-empty">No active servers yet. Create the first one.</p> : (
            <div className="community-server-list">
              {servers.map((server) => (
                <article className="community-server-row" key={server.id}>
                  <span className="community-server-avatar">{server.imageUrl ? <img src={server.imageUrl} alt="" loading="lazy" /> : server.name.slice(0, 1).toUpperCase()}</span>
                  <div className="community-server-row-name"><strong>{server.name}</strong><small>{server.joined ? 'Already a member' : 'Community server'}</small></div>
                  <button type="button" className="community-join-action" onClick={() => onJoin(server.id)}>{server.joined ? 'Open' : 'Join'}</button>
                </article>
              ))}
            </div>
          )}
          <div className="community-channel-preview"><span><Hash aria-hidden="true" /> Text channels</span><span><Headphones aria-hidden="true" /> Voice channels</span></div>
        </div>
      </div>
    </section>
  )
}
