'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'

type VoiceParticipant = {
  userId: string
  name: string
  avatarUrl: string | null
  muted: boolean
}

type VoiceSignal = {
  id: string
  fromUserId: string
  signalType: 'offer' | 'answer' | 'candidate'
  payload: Record<string, unknown>
}

type VoiceResponse = {
  participants: VoiceParticipant[]
  signals: VoiceSignal[]
}

export type VoiceRoomScope = {
  channel: string
  channelId?: string | null
  serverId?: string | null
  serverChannelId?: string | null
}

type LiveVoiceRoomProps = {
  active: boolean
  userId: string
  profileName: string
  profileImage: string
  muted: boolean
  speaking: boolean
  stream: MediaStream | null
  scope: VoiceRoomScope
}

async function fetchVoiceRoom(url: string): Promise<VoiceResponse> {
  const response = await fetch(url, { cache: 'no-store' })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Voice room could not be loaded.')
  return result as VoiceResponse
}

async function readResponse(response: Response) {
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Voice connection could not be updated.')
  return result
}

export function LiveVoiceRoom({ active, userId, profileName, profileImage, muted, speaking, stream, scope }: LiveVoiceRoomProps) {
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(() => new Map())
  const [connectionError, setConnectionError] = useState('')
  const peerConnections = useRef(new Map<string, RTCPeerConnection>())
  const seenSignals = useRef(new Set<string>())
  const offeredPeers = useRef(new Set<string>())
  const pendingCandidates = useRef(new Map<string, RTCIceCandidateInit[]>())
  const audioElements = useRef(new Map<string, HTMLAudioElement>())

  const query = useMemo(() => {
    const params = new URLSearchParams({ channel: scope.channel })
    if (scope.channelId) params.set('channelId', scope.channelId)
    if (scope.serverId) params.set('serverId', scope.serverId)
    if (scope.serverChannelId) params.set('serverChannelId', scope.serverChannelId)
    return params.toString()
  }, [scope.channel, scope.channelId, scope.serverId, scope.serverChannelId])
  const endpoint = active ? `/api/voice?${query}` : null
  const requestScope = useMemo(() => ({
    channel: scope.channel,
    channelId: scope.channelId ?? null,
    serverId: scope.serverId ?? null,
    serverChannelId: scope.serverChannelId ?? null,
  }), [scope.channel, scope.channelId, scope.serverId, scope.serverChannelId])

  const { data, error } = useSWR<VoiceResponse>(endpoint, fetchVoiceRoom, {
    refreshInterval: 1200,
    revalidateOnFocus: true,
    dedupingInterval: 500,
  })
  const { trigger: heartbeat } = useSWRMutation(
    endpoint,
    async (url: string, { arg }: { arg: { muted: boolean } }) => {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...requestScope, muted: arg.muted }),
      })
      return readResponse(response)
    },
  )

  const sendSignal = useCallback(async (toUserId: string, signalType: VoiceSignal['signalType'], payload: object) => {
    if (!endpoint) return
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...requestScope, toUserId, signalType, payload }),
    })
    await readResponse(response)
  }, [endpoint, requestScope])

  const createPeerConnection = useCallback((peerUserId: string) => {
    const current = peerConnections.current.get(peerUserId)
    if (current) return current
    if (!stream) return null
    if (typeof RTCPeerConnection === 'undefined') {
      setConnectionError('This browser does not support WebRTC voice connections.')
      return null
    }

    const connection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
      ],
    })
    stream.getAudioTracks().forEach((track) => connection.addTrack(track, stream))
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        void sendSignal(peerUserId, 'candidate', event.candidate.toJSON()).catch(() => {
          setConnectionError('Voice signaling was interrupted. Reconnecting…')
        })
      }
    }
    connection.ontrack = (event) => {
      const remoteStream = event.streams[0]
      if (remoteStream) setRemoteStreams((currentStreams) => new Map(currentStreams).set(peerUserId, remoteStream))
    }
    connection.onconnectionstatechange = () => {
      if (connection.connectionState === 'failed') setConnectionError('A peer connection could not be established on this network.')
      if (connection.connectionState === 'connected') setConnectionError('')
    }
    peerConnections.current.set(peerUserId, connection)
    return connection
  }, [sendSignal, stream])

  const handleSignal = useCallback(async (signal: VoiceSignal) => {
    const connection = createPeerConnection(signal.fromUserId)
    if (!connection) return

    if (signal.signalType === 'candidate') {
      const candidate = signal.payload as RTCIceCandidateInit
      if (!connection.remoteDescription) {
        const queued = pendingCandidates.current.get(signal.fromUserId) ?? []
        queued.push(candidate)
        pendingCandidates.current.set(signal.fromUserId, queued)
      } else {
        await connection.addIceCandidate(new RTCIceCandidate(candidate))
      }
      return
    }

    const description = signal.payload as unknown as RTCSessionDescriptionInit
    await connection.setRemoteDescription(new RTCSessionDescription(description))
    const queuedCandidates = pendingCandidates.current.get(signal.fromUserId) ?? []
    pendingCandidates.current.delete(signal.fromUserId)
    for (const candidate of queuedCandidates) await connection.addIceCandidate(new RTCIceCandidate(candidate))

    if (signal.signalType === 'offer') {
      const answer = await connection.createAnswer()
      await connection.setLocalDescription(answer)
      await sendSignal(signal.fromUserId, 'answer', connection.localDescription?.toJSON() ?? answer)
    }
  }, [createPeerConnection, sendSignal])

  useEffect(() => {
    if (!active) return
    let cancelled = false
    const updatePresence = () => {
      void heartbeat({ muted }).catch(() => {
        if (!cancelled) setConnectionError('Voice presence is reconnecting…')
      })
    }
    updatePresence()
    const interval = window.setInterval(updatePresence, 5_000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [active, heartbeat, muted])

  useEffect(() => {
    if (!active || !stream) return
    const participants: VoiceParticipant[] = data?.participants ?? []
    const onlinePeerIds = new Set(participants.map((participant) => participant.userId).filter((participantId) => participantId !== userId))

    for (const [peerUserId, connection] of peerConnections.current) {
      if (!onlinePeerIds.has(peerUserId)) {
        connection.close()
        peerConnections.current.delete(peerUserId)
        offeredPeers.current.delete(peerUserId)
        pendingCandidates.current.delete(peerUserId)
        setRemoteStreams((currentStreams) => {
          const nextStreams = new Map(currentStreams)
          nextStreams.delete(peerUserId)
          return nextStreams
        })
      }
    }

    for (const peerUserId of onlinePeerIds) {
      if (userId.localeCompare(peerUserId) > 0 || offeredPeers.current.has(peerUserId)) continue
      const connection = createPeerConnection(peerUserId)
      if (!connection || connection.signalingState !== 'stable') continue
      offeredPeers.current.add(peerUserId)
      void connection.createOffer()
        .then((offer) => connection.setLocalDescription(offer).then(() => offer))
        .then((offer) => sendSignal(peerUserId, 'offer', connection.localDescription?.toJSON() ?? offer))
        .catch(() => {
          offeredPeers.current.delete(peerUserId)
          setConnectionError('Could not start a voice connection. Retrying…')
        })
    }
  }, [active, createPeerConnection, data?.participants, sendSignal, stream, userId])

  useEffect(() => {
    if (!active || !stream) return
    const signals: VoiceSignal[] = data?.signals ?? []
    for (const signal of signals) {
      if (seenSignals.current.has(signal.id)) continue
      seenSignals.current.add(signal.id)
      void handleSignal(signal).catch(() => setConnectionError('A voice signal could not be processed. Reconnecting…'))
    }
  }, [active, data?.signals, handleSignal, stream])

  useEffect(() => {
    for (const [participantId, audio] of audioElements.current) {
      audio.srcObject = remoteStreams.get(participantId) ?? null
      if (remoteStreams.has(participantId)) void audio.play().catch(() => undefined)
    }
  }, [remoteStreams])

  useEffect(() => () => {
    for (const connection of peerConnections.current.values()) connection.close()
    peerConnections.current.clear()
    audioElements.current.clear()
    if (endpoint) {
      void fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestScope),
        keepalive: true,
      }).catch(() => undefined)
    }
  }, [endpoint, requestScope])

  const participants: VoiceParticipant[] = data?.participants ?? []
  const isInRoom = participants.some((participant) => participant.userId === userId)

  return (
    <section className="live-voice-room" aria-label={`${scope.channel} voice room`}>
      <div className="voice-room-status" role="status">
        <span className={`voice-status-light ${error || connectionError ? 'voice-status-warning' : ''}`} aria-hidden="true" />
        <strong>{participants.length} {participants.length === 1 ? 'participant' : 'participants'}</strong>
        <span>{error ? 'Reconnecting to voice room…' : connectionError || (isInRoom ? 'Connected' : 'Joining voice room…')}</span>
      </div>
      <div className="voice-participant-grid">
        {participants.map((participant) => {
          const isLocal = participant.userId === userId
          const name = isLocal ? profileName : participant.name
          const avatarUrl = isLocal ? profileImage : participant.avatarUrl
          const participantMuted = isLocal ? muted : participant.muted
          return (
            <article className={`voice-participant-card ${isLocal && !muted ? 'voice-local-participant' : ''}`} key={participant.userId}>
              <div className="voice-participant-avatar">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{name.slice(0, 1).toUpperCase()}</span>}
              </div>
              <div className="voice-participant-name">
                <strong>{name}{isLocal ? ' (you)' : ''}</strong>
                <span>{participantMuted ? 'Muted' : isLocal ? speaking ? 'Speaking' : 'Your microphone is on' : 'Microphone on'}</span>
              </div>
              {participantMuted && <span className="voice-muted-indicator" aria-label={`${name} is muted`}>Muted</span>}
              {!isLocal && <audio
                autoPlay
                playsInline
                aria-label={`Audio from ${name}`}
                ref={(element) => {
                  if (element) {
                    audioElements.current.set(participant.userId, element)
                    element.srcObject = remoteStreams.get(participant.userId) ?? null
                  } else {
                    audioElements.current.delete(participant.userId)
                  }
                }}
              />}
            </article>
          )
        })}
        {participants.length === 0 && <p className="voice-room-empty" role="status">Joining {scope.channel}…</p>}
      </div>
    </section>
  )
}
