import { Headphones, Hash, ShieldAlert, X } from 'lucide-react'
import { serverRemovalReasons } from '@/lib/community/constants'
import type { ManagedCommunityServer } from '@/lib/community/types'

type ServerControlPanelProps = {
  servers: ManagedCommunityServer[]
  reasons: Record<string, string>
  loading: boolean
  error: string
  onReasonChange: (serverId: string, reason: string) => void
  onOpenServer: (serverId: string) => void
  onDeleteServer: (serverId: string) => void
  onClose: () => void
}

export function ServerControlPanel({ servers, reasons, loading, error, onReasonChange, onOpenServer, onDeleteServer, onClose }: ServerControlPanelProps) {
  return (
    <section className="community-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="server-control-title">
      <div className="community-modal server-control-modal">
        <header className="community-modal-header">
          <div><span className="settings-kicker">STAFF ACCESS</span><h2 id="server-control-title">Server Control Panel</h2><p>Review active servers, join their channels, or remove a server with a required reason.</p></div>
          <button type="button" className="settings-close" onClick={onClose} aria-label="Close server control panel"><X /></button>
        </header>
        {error && <p className="community-form-error" role="alert">{error}</p>}
        {loading ? <p className="community-empty" role="status">Loading active servers…</p> : servers.length === 0 ? <p className="community-empty">There are no active community servers.</p> : (
          <div className="server-control-list">
            {servers.map((server) => (
              <article className="server-control-row" key={server.id}>
                <span className="community-server-avatar">{server.imageUrl ? <img src={server.imageUrl} alt="" loading="lazy" /> : server.name.slice(0, 1).toUpperCase()}</span>
                <div className="server-control-info">
                  <strong>{server.name}</strong>
                  <small>Created by {server.createdBy.slice(0, 12)} · {server.channelCount} channels</small>
                  <div className="server-control-channel-types"><span><Hash aria-hidden="true" /> Text</span><span><Headphones aria-hidden="true" /> Voice</span></div>
                </div>
                <button type="button" className="community-join-action" onClick={() => onOpenServer(server.id)}>{server.joined ? 'Open server' : 'Join server'}</button>
                <div className="server-delete-controls">
                  <label htmlFor={`server-delete-reason-${server.id}`}>Removal reason</label>
                  <select id={`server-delete-reason-${server.id}`} value={reasons[server.id] ?? ''} onChange={(event) => onReasonChange(server.id, event.target.value)}>
                    <option value="">Select a required reason</option>
                    {serverRemovalReasons.map((reason) => <option value={reason} key={reason}>{reason}</option>)}
                  </select>
                  <button type="button" className="server-delete-action" disabled={!reasons[server.id]} onClick={() => onDeleteServer(server.id)}><ShieldAlert aria-hidden="true" /> Delete server</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
