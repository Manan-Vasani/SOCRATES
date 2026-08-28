import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

export interface Participant {
  id: string
  socketId: string
  name: string
  role: 'tutor' | 'student'
  avatar?: string
  stream?: MediaStream
  isMuted: boolean
  isCameraOff: boolean
  isSpeaking: boolean
  isPinned: boolean
  isHandRaised: boolean
  isScreenSharing: boolean
}

export interface ChatMessage {
  id: string
  sender: string
  senderId?: string
  role: 'tutor' | 'student' | 'system' | 'ai'
  text: string
  time: string
}

interface UseWebRTCOptions {
  roomId: string
  currentUser: {
    id: string
    name: string
    role: 'tutor' | 'student'
    avatar?: string
  }
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string) ||
  (import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
    : typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:5000')

export function useWebRTC({ roomId, currentUser }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const [isMediaReady, setIsMediaReady] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const currentUserRef = useRef(currentUser)
  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  const [participants, setParticipants] = useState<Participant[]>(() => {
    try {
      const cached = sessionStorage.getItem(`socrates_room_participants_${roomId}`)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => ({ ...p, stream: undefined }))
        }
      }
    } catch {}
    return [
      {
        id: currentUser.id,
        socketId: 'local-self',
        name: `${currentUser.name} (You)`,
        role: currentUser.role,
        avatar: currentUser.avatar,
        isMuted: false,
        isCameraOff: true,
        isSpeaking: false,
        isPinned: false,
        isHandRaised: false,
        isScreenSharing: false,
      },
    ]
  })
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'sys-init',
      sender: 'System',
      role: 'system',
      text: `Connected to Study Room (${roomId}).`,
      time: 'Now',
    },
  ])
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  >('connecting')
  const [permissionDeniedType, setPermissionDeniedType] = useState<
    'microphone' | 'camera' | 'media' | null
  >(null)

  // Whiteboard Permission States
  const [hasWhiteboardPermission, setHasWhiteboardPermission] = useState<boolean>(
    currentUser.role === 'tutor'
  )
  const [whiteboardRequests, setWhiteboardRequests] = useState<
    { socketId: string; name: string; time: string }[]
  >([])
  const [whiteboardPermissionsMap, setWhiteboardPermissionsMap] = useState<
    Record<string, boolean>
  >({})

  const socketRef = useRef<Socket | null>(null)
  const hasJoinedRoomRef = useRef<boolean>(false)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const iceCandidateQueuesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())
  const screenTrackRef = useRef<MediaStreamTrack | null>(null)
  const iceRecoveryRetriesRef = useRef<Map<string, number>>(new Map())

  // Cache participants list in sessionStorage so refresh maintains all participants without pop-in
  useEffect(() => {
    if (participants && participants.length > 0) {
      try {
        const toSave = participants.map((p) => ({
          id: p.id,
          socketId: p.socketId,
          name: p.name,
          role: p.role,
          avatar: p.avatar,
          isMuted: p.isMuted,
          isCameraOff: p.isCameraOff,
          isSpeaking: p.isSpeaking,
          isPinned: p.isPinned,
          isHandRaised: p.isHandRaised,
          isScreenSharing: p.isScreenSharing,
        }))
        sessionStorage.setItem(`socrates_room_participants_${roomId}`, JSON.stringify(toSave))
      } catch {}
    }
  }, [participants, roomId])

  const processIceCandidateQueue = useCallback(async (socketId: string, pc: RTCPeerConnection) => {
    const queue = iceCandidateQueuesRef.current.get(socketId)
    if (queue && queue.length > 0) {
      console.log(`[WebRTC] Flushing ${queue.length} queued ICE candidates for ${socketId}`)
      for (const cand of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand))
        } catch (e) {
          console.warn(`[WebRTC] Error adding queued ICE candidate for ${socketId}:`, e)
        }
      }
      iceCandidateQueuesRef.current.delete(socketId)
    }
  }, [])

  // 1. Acquire Local Media Stream (Camera & Microphone)
  useEffect(() => {
    let isMounted = true

    async function initLocalStream() {
      let stream: MediaStream | null = null

      try {
        console.log('[WebRTC] Requesting local camera & microphone access...')
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true },
        })
        console.log('[WebRTC] Camera & microphone acquired successfully.')
      } catch (videoErr) {
        console.warn('[WebRTC] Camera unavailable or denied, attempting audio only...', videoErr)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
          })
          console.log('[WebRTC] Microphone acquired successfully (camera off).')
        } catch (audioErr) {
          console.warn('[WebRTC] Audio access denied or unavailable:', audioErr)
        }
      }

      if (!isMounted) {
        if (stream) stream.getTracks().forEach((track) => track.stop())
        return
      }

      if (stream) {
        // Keep mic enabled by default while keeping camera disabled
        stream.getAudioTracks().forEach((track) => {
          track.enabled = true
        })
        stream.getVideoTracks().forEach((track) => {
          track.enabled = false
        })
      }

      localStreamRef.current = stream
      setLocalStream(stream)
      setIsCameraOn(false)
      setIsMicOn(true)
      setIsMediaReady(true)

      setParticipants((prev) => {
        const exists = prev.some((p) => p.id === currentUserRef.current.id || p.name.includes('(You)'))
        const selfParticipant: Participant = {
          id: currentUserRef.current.id,
          socketId: socketRef.current?.id || 'local-self',
          name: `${currentUserRef.current.name} (You)`,
          role: currentUserRef.current.role,
          avatar: currentUserRef.current.avatar,
          stream: stream || undefined,
          isMuted: false,
          isCameraOff: true,
          isSpeaking: false,
          isPinned: false,
          isHandRaised: false,
          isScreenSharing: false,
        }

        if (!exists) {
          const others = prev.filter((p) => p.id !== currentUserRef.current.id && !p.name.includes('(You)'))
          return [selfParticipant, ...others]
        }
        return prev.map((p) =>
          p.id === currentUserRef.current.id || p.name.includes('(You)')
            ? { ...p, stream: stream || undefined, isCameraOff: true, isMuted: true }
            : p
        )
      })
    }

    initLocalStream()

    return () => {
      isMounted = false
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }
    }
  }, [currentUser.id])

  // Helper to create RTCPeerConnection for a remote peer
  const createPeerConnection = useCallback(
    (targetSocketId: string, socket: Socket) => {
      if (peerConnectionsRef.current.has(targetSocketId)) {
        return peerConnectionsRef.current.get(targetSocketId)!
      }

      console.log(`[WebRTC] Creating RTCPeerConnection for target peer: ${targetSocketId}`)
      const pc = new RTCPeerConnection(ICE_SERVERS)

      // Add local media tracks to peer connection if available
      if (localStreamRef.current && localStreamRef.current.getTracks().length > 0) {
        localStreamRef.current.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, localStreamRef.current!)
          } catch (e) {
            console.warn(`[WebRTC] addTrack error:`, e)
          }
        })
      } else {
        try {
          pc.addTransceiver('audio', { direction: 'sendrecv' })
          pc.addTransceiver('video', { direction: 'sendrecv' })
        } catch (e) {}
      }

      // Relay ICE candidates to remote peer via Socket.IO
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            targetSocketId,
            candidate: event.candidate,
          })
        }
      }

      // Handle incoming remote media stream track (robustly merge audio and video tracks into remote stream)
      pc.ontrack = (event) => {
        console.log(`[WebRTC] Received remote stream track (${event.track.kind}) from ${targetSocketId}`)

        const updateRemoteStream = () => {
          setParticipants((prev) =>
            prev.map((p) => {
              if (p.socketId === targetSocketId || p.id === targetSocketId) {
                const currentTracks = p.stream ? p.stream.getTracks() : []
                const mergedTracks = [...currentTracks]
                if (!mergedTracks.some((t) => t.id === event.track.id)) {
                  mergedTracks.push(event.track)
                }
                const newStream = new MediaStream(mergedTracks)
                const hasLiveVideo = newStream.getVideoTracks().some((t) => t.readyState === 'live' && !t.muted)
                return {
                  ...p,
                  stream: newStream,
                  isCameraOff: p.isCameraOff !== undefined ? p.isCameraOff : !hasLiveVideo,
                }
              }
              return p
            })
          )
        }

        updateRemoteStream()

        event.track.onunmute = () => {
          console.log(`[WebRTC] Remote track unmuted (${event.track.kind}) from ${targetSocketId}`)
          updateRemoteStream()
        }
        event.track.onmute = () => {
          console.log(`[WebRTC] Remote track muted (${event.track.kind}) from ${targetSocketId}`)
          updateRemoteStream()
        }
      }

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC Peer ${targetSocketId}] State changed: ${pc.connectionState}`)

        if (pc.connectionState === 'connected') {
          iceRecoveryRetriesRef.current.delete(targetSocketId)
        }

        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          const retries = (iceRecoveryRetriesRef.current.get(targetSocketId) || 0) + 1
          iceRecoveryRetriesRef.current.set(targetSocketId, retries)

          if (retries <= 3) {
            console.log(`[WebRTC] Connection ${pc.connectionState} for ${targetSocketId}, retry ${retries}/3`)
            pc.close()
            peerConnectionsRef.current.delete(targetSocketId)
            iceCandidateQueuesRef.current.delete(targetSocketId)

            setTimeout(async () => {
              try {
                const newPc = createPeerConnection(targetSocketId, socket)
                const offer = await newPc.createOffer()
                await newPc.setLocalDescription(offer)
                socket.emit('offer', { targetSocketId, offer })
              } catch (err) {
                console.warn('[WebRTC] ICE recovery offer failed:', err)
              }
            }, 2000)
          } else {
            console.warn(`[WebRTC] Max ICE retries reached for ${targetSocketId}`)
          }
        }
      }

      peerConnectionsRef.current.set(targetSocketId, pc)
      return pc
    },
    []
  )

  // Synchronize localStream tracks into all existing peer connections when localStream initializes or updates
  useEffect(() => {
    if (!localStream || !socketRef.current) return
    peerConnectionsRef.current.forEach(async (pc, targetSocketId) => {
      let needsRenegotiation = false
      localStream.getTracks().forEach((track) => {
        const senders = pc.getSenders()
        const existingSender = senders.find((s) => s.track?.kind === track.kind)
        if (existingSender) {
          existingSender.replaceTrack(track).catch(() => {})
        } else {
          try {
            pc.addTrack(track, localStream)
            needsRenegotiation = true
          } catch (e) {}
        }
      })

      if (needsRenegotiation && pc.signalingState === 'stable') {
        try {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          socketRef.current?.emit('offer', {
            targetSocketId,
            offer,
          })
        } catch (err) {
          console.warn('[WebRTC] Renegotiation offer failed:', err)
        }
      }
    })
  }, [localStream])

  // Helper to emit join-room once socket is connected and local media is initialized
  const emitJoinRoom = useCallback(() => {
    const activeSocket = socketRef.current
    if (!activeSocket || !activeSocket.connected || hasJoinedRoomRef.current) return
    hasJoinedRoomRef.current = true
    console.log(`[Meeting Socket] Emitting join-room for room ${roomId}...`)

    setParticipants((prev) => {
      const selfStream = localStreamRef.current || localStream || undefined
      const existingSelf = prev.find((p) => p.id === currentUserRef.current.id || p.name.includes('(You)'))
      const selfItem: Participant = {
        id: currentUserRef.current.id,
        socketId: activeSocket.id!,
        name: `${currentUserRef.current.name} (You)`,
        role: currentUserRef.current.role,
        avatar: currentUserRef.current.avatar,
        stream: selfStream,
        isMuted: !isMicOn,
        isCameraOff: !isCameraOn,
        isSpeaking: false,
        isPinned: existingSelf?.isPinned || false,
        isHandRaised: isHandRaised,
        isScreenSharing: isScreenSharing,
      }
      const others = prev.filter((p) => p.id !== currentUserRef.current.id && !p.name.includes('(You)'))
      return [selfItem, ...others]
    })

    activeSocket.emit('join-room', {
      roomId,
      user: {
        ...currentUserRef.current,
        isCameraOff: !isCameraOn,
        isMuted: !isMicOn,
      },
    })
  }, [roomId, isCameraOn, isMicOn, isHandRaised, isScreenSharing, localStream])

  // Trigger join-room whenever media becomes ready (or on reconnect)
  useEffect(() => {
    if (isMediaReady && socketRef.current?.connected && !hasJoinedRoomRef.current) {
      emitJoinRoom()
    }
  }, [isMediaReady, emitJoinRoom])

  // 2. Connect Socket.IO & Listen for Signaling Events
  useEffect(() => {
    console.log(`[Meeting Socket] Connecting to ${SOCKET_URL}...`)
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    })

    socketRef.current = socketInstance

    socketInstance.on('connect', () => {
      console.log(`[Meeting Socket] Connected with Socket ID: ${socketInstance.id}`)
      setConnectionStatus('connected')
      setSocket(socketInstance)
      hasJoinedRoomRef.current = false

      if (isMediaReady) {
        emitJoinRoom()
      }
    })

    socketInstance.on('disconnect', () => {
      console.warn('[Meeting Socket] Disconnected from server.')
      setConnectionStatus('disconnected')
      hasJoinedRoomRef.current = false
      setSocket(null)
    })

    socketInstance.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting')
    })

    // Received existing participants from server upon joining
    socketInstance.on('existing-participants', async (existingList: any[]) => {
      console.log(`[Meeting Socket] Received ${existingList.length} existing participants:`, existingList)

      setParticipants((prev) => {
        const self = prev.find((p) => p.socketId === socketInstance.id || p.name.includes('(You)'))
        const updated = existingList.map((p) => ({
          id: p.id,
          socketId: p.socketId,
          name: p.name,
          role: p.role,
          avatar: p.avatar,
          isMuted: p.isMuted ?? false,
          isCameraOff: p.isCameraOff ?? false,
          isSpeaking: false,
          isPinned: false,
          isHandRaised: p.isHandRaised ?? false,
          isScreenSharing: p.isScreenSharing ?? false,
        }))
        return self ? [self, ...updated] : updated
      })

      // Wait for localStream to be ready before creating peer connections
      const waitForStream = () =>
        new Promise<boolean>((resolve) => {
          if (localStreamRef.current && localStreamRef.current.getTracks().length > 0) {
            resolve(true)
            return
          }
          let attempts = 0
          const check = setInterval(() => {
            attempts++
            if (localStreamRef.current && localStreamRef.current.getTracks().length > 0) {
              clearInterval(check)
              resolve(true)
            } else if (attempts >= 30) {
              clearInterval(check)
              resolve(false)
            }
          }, 100)
        })

      await waitForStream()

      // Initiate WebRTC connection (Offer) to each existing participant
      for (const peerData of existingList) {
        try {
          const pc = createPeerConnection(peerData.socketId, socketInstance)
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)

          console.log(`[WebRTC] Sending SDP Offer to ${peerData.socketId}`)
          socketInstance.emit('offer', {
            targetSocketId: peerData.socketId,
            offer,
          })
        } catch (err) {
          console.error(`[WebRTC] Error initiating offer to ${peerData.socketId}:`, err)
        }
      }
    })

    // New user joined room
    socketInstance.on('user-joined', (newParticipant: any) => {
      console.log(`[Meeting Socket] New participant joined: ${newParticipant.name} (${newParticipant.socketId})`)

      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === newParticipant.socketId)) return prev
        return [
          ...prev,
          {
            id: newParticipant.id,
            socketId: newParticipant.socketId,
            name: newParticipant.name,
            role: newParticipant.role,
            avatar: newParticipant.avatar,
            isMuted: newParticipant.isMuted ?? true,
            isCameraOff: newParticipant.isCameraOff ?? true,
            isSpeaking: false,
            isPinned: false,
            isHandRaised: false,
            isScreenSharing: false,
          },
        ]
      })

      setMessages((prev) => {
        const text = `${newParticipant.name} joined the room.`
        const last = prev[prev.length - 1]
        if (last && last.role === 'system' && last.text === text) return prev
        return [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'System',
            role: 'system',
            text,
            time: 'Now',
          },
        ]
      })
    })

    // Remote peer reconnected seamlessly (e.g. page refresh)
    socketInstance.on('user-reconnected', (reconnectedUser: any) => {
      console.log(`[Meeting Socket] Remote peer reconnected seamlessly: ${reconnectedUser.name} (${reconnectedUser.socketId})`)
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === reconnectedUser.id
            ? { ...p, socketId: reconnectedUser.socketId }
            : p
        )
      )

      // Close and remove any stale peer connection for this user's previous socketId
      peerConnectionsRef.current.forEach((oldPc, oldSocketId) => {
        if (oldSocketId !== reconnectedUser.socketId) {
          const matchedParticipant = participants.find(
            (pp) => pp.id === reconnectedUser.id && pp.socketId === oldSocketId
          )
          if (matchedParticipant) {
            console.log(`[WebRTC] Closing stale PC for reconnected user: ${oldSocketId}`)
            oldPc.close()
            peerConnectionsRef.current.delete(oldSocketId)
            iceCandidateQueuesRef.current.delete(oldSocketId)
          }
        }
      })

      // Re-negotiate WebRTC with the new socket ID
      if (currentUser.role === 'tutor' || currentUser.id < reconnectedUser.id) {
        const pc = createPeerConnection(reconnectedUser.socketId, socketInstance)
        pc.createOffer().then(async (offer) => {
          await pc.setLocalDescription(offer)
          socketInstance.emit('offer', {
            targetSocketId: reconnectedUser.socketId,
            offer,
          })
        }).catch((err) => console.warn('[WebRTC] Reconnect offer error:', err))
      }
    })

    // Received SDP Offer from a remote peer
    socketInstance.on('offer', async ({ senderSocketId, offer }: { senderSocketId: string; offer: RTCSessionDescriptionInit }) => {
      console.log(`[WebRTC] Received SDP Offer from ${senderSocketId}`)
      try {
        const pc = createPeerConnection(senderSocketId, socketInstance)
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        await processIceCandidateQueue(senderSocketId, pc)

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        console.log(`[WebRTC] Sending SDP Answer to ${senderSocketId}`)
        socketInstance.emit('answer', {
          targetSocketId: senderSocketId,
          answer,
        })
      } catch (err) {
        console.error(`[WebRTC] Error handling offer from ${senderSocketId}:`, err)
      }
    })

    // Received SDP Answer from a remote peer
    socketInstance.on('answer', async ({ senderSocketId, answer }: { senderSocketId: string; answer: RTCSessionDescriptionInit }) => {
      console.log(`[WebRTC] Received SDP Answer from ${senderSocketId}`)
      try {
        const pc = peerConnectionsRef.current.get(senderSocketId)
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer))
          await processIceCandidateQueue(senderSocketId, pc)
        }
      } catch (err) {
        console.error(`[WebRTC] Error setting remote description for answer from ${senderSocketId}:`, err)
      }
    })

    // Received ICE Candidate from remote peer
    socketInstance.on('ice-candidate', async ({ senderSocketId, candidate }: { senderSocketId: string; candidate: RTCIceCandidateInit }) => {
      try {
        const pc = peerConnectionsRef.current.get(senderSocketId)
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } else {
          const q = iceCandidateQueuesRef.current.get(senderSocketId) || []
          q.push(candidate)
          iceCandidateQueuesRef.current.set(senderSocketId, q)
        }
      } catch (err) {
        console.error(`[WebRTC] Error adding ICE candidate from ${senderSocketId}:`, err)
      }
    })

    // Participant State Update (Mic, Camera, Screen Share, Hand Raise)
    socketInstance.on('participant-state-updated', ({ socketId, state }: { socketId: string; state: any }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, ...state } : p))
      )
    })

    // Remote Muted By Tutor Event
    socketInstance.on('remote-muted-by-tutor', () => {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0]
        if (audioTrack) {
          audioTrack.enabled = false
        }
      }
      setIsMicOn(false)
      if (socketRef.current) {
        socketRef.current.emit('participant-state-change', {
          roomId,
          state: { isMuted: true },
        })
      }
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === currentUserRef.current.id || p.name.includes('(You)') || p.socketId === socketInstance.id
            ? { ...p, isMuted: true }
            : p
        )
      )
    })

    // Remote Unmuted By Tutor Event
    socketInstance.on('remote-unmuted-by-tutor', () => {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0]
        if (audioTrack) {
          audioTrack.enabled = true
        }
      }
      setIsMicOn(true)
      if (socketRef.current) {
        socketRef.current.emit('participant-state-change', {
          roomId,
          state: { isMuted: false },
        })
      }
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === currentUserRef.current.id || p.name.includes('(You)') || p.socketId === socketInstance.id
            ? { ...p, isMuted: false }
            : p
        )
      )
    })

    // Whiteboard Permission Events
    socketInstance.on('tutor-whiteboard-request-received', (req: { socketId: string; name: string; time: string }) => {
      setWhiteboardRequests((prev) => {
        const idx = prev.findIndex((r) => r.socketId === req.socketId || r.name === req.name)
        if (idx !== -1) {
          const updated = [...prev]
          updated[idx] = req
          return updated
        }
        return [...prev, req]
      })
    })

    socketInstance.on('whiteboard-permission-updated', ({ hasAccess }: { hasAccess: boolean }) => {
      setHasWhiteboardPermission(hasAccess)
    })

    socketInstance.on('room-whiteboard-permissions-updated', (permissions: Record<string, boolean>) => {
      setWhiteboardPermissionsMap(permissions)
    })

    // Real-Time Room Message Received
    socketInstance.on('room-message-received', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg])
    })

    // User left room
    socketInstance.on('user-left', ({ socketId, userId }: { socketId: string; userId: string }) => {
      console.log(`[Meeting Socket] User left room: ${socketId}`)

      // Close and cleanup RTCPeerConnection for leaving user
      const pc = peerConnectionsRef.current.get(socketId)
      if (pc) {
        pc.close()
        peerConnectionsRef.current.delete(socketId)
        iceCandidateQueuesRef.current.delete(socketId)
      }

      // Also clean up any stale PC entries with mismatched socketId for the same user
      peerConnectionsRef.current.forEach((stalePc, staleSocketId) => {
        if (staleSocketId !== socketId) {
          const staleParticipant = participants.find(
            (pp) => pp.id === userId && pp.socketId === staleSocketId
          )
          if (staleParticipant) {
            console.log(`[WebRTC] Cleaning stale PC for leaving user: ${staleSocketId}`)
            stalePc.close()
            peerConnectionsRef.current.delete(staleSocketId)
            iceCandidateQueuesRef.current.delete(staleSocketId)
          }
        }
      })

      setParticipants((prev) => {
        const leaving = prev.find((p) => p.socketId === socketId)
        if (leaving) {
          setMessages((m) => {
            const text = `${leaving.name.replace(' (You)', '')} left the room.`
            const last = m[m.length - 1]
            if (last && last.role === 'system' && last.text === text) return m
            return [
              ...m,
              {
                id: String(Date.now()),
                sender: 'System',
                role: 'system',
                text,
                time: 'Now',
              },
            ]
          })
        }
        return prev.filter((p) => p.socketId !== socketId)
      })
    })

    return () => {
      console.log('[Meeting Socket] Cleaning up socket and peer connections...')
      hasJoinedRoomRef.current = false
      socketInstance.emit('leave-room', { roomId })

      peerConnectionsRef.current.forEach((pc) => pc.close())
      peerConnectionsRef.current.clear()

      socketInstance.disconnect()
      setSocket(null)
    }
  }, [roomId, currentUser.id, createPeerConnection])

  // Continually sync localStream to self entry in participants
  useEffect(() => {
    if (localStream) {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === currentUser.id || p.name.includes('(You)')
            ? { ...p, stream: localStream }
            : p
        )
      )
    }
  }, [localStream, currentUser.id])

  // Media Controls Actions (with on-demand dynamic device acquisition)
  const toggleMic = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0]
        if (audioTrack && audioTrack.readyState === 'live') {
          audioTrack.enabled = !audioTrack.enabled
          const newMicState = audioTrack.enabled
          setIsMicOn(newMicState)

          // Sync audio track across all active peer connections
          peerConnectionsRef.current.forEach((pc) => {
            const senders = pc.getSenders()
            const audioSender = senders.find((s) => s.track && s.track.kind === 'audio')
            if (audioSender) {
              audioSender.replaceTrack(audioTrack).catch(() => {})
            }
          })

          if (socketRef.current) {
            socketRef.current.emit('participant-state-change', {
              roomId,
              state: { isMuted: !newMicState },
            })
          }
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === currentUser.id || p.name.includes('(You)') || p.socketId === socketRef.current?.id
                ? { ...p, isMuted: !newMicState }
                : p
            )
          )
          return
        }
      }

      // If no active audio track exists, dynamically acquire microphone access
      console.log('[WebRTC] Requesting microphone access on toggle...')
      const newAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      const newAudioTrack = newAudioStream.getAudioTracks()[0]

      if (newAudioTrack) {
        let combinedStream: MediaStream
        if (localStreamRef.current) {
          localStreamRef.current.addTrack(newAudioTrack)
          combinedStream = new MediaStream(localStreamRef.current.getTracks())
        } else {
          combinedStream = new MediaStream([newAudioTrack])
        }

        localStreamRef.current = combinedStream
        setLocalStream(combinedStream)
        setIsMicOn(true)
        setPermissionDeniedType(null)

        // Replace or add audio track to all active peer connections
        peerConnectionsRef.current.forEach((pc) => {
          const senders = pc.getSenders()
          const audioSender = senders.find((s) => s.track && s.track.kind === 'audio')
          if (audioSender) {
            audioSender.replaceTrack(newAudioTrack).catch(() => {})
          } else {
            pc.addTrack(newAudioTrack, combinedStream)
          }
        })

        if (socketRef.current) {
          socketRef.current.emit('participant-state-change', {
            roomId,
            state: { isMuted: false },
          })
        }

        setParticipants((prev) =>
          prev.map((p) =>
            p.id === currentUser.id || p.name.includes('(You)') || p.socketId === socketRef.current?.id
              ? { ...p, stream: combinedStream, isMuted: false }
              : p
          )
        )
      }
    } catch (err: any) {
      console.error('[WebRTC] Microphone access error:', err)
      const isPerm = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.toLowerCase().includes('permission') || err.message?.toLowerCase().includes('denied')
      if (isPerm) {
        setPermissionDeniedType('microphone')
      } else {
        toast.error('Could not access microphone')
      }
      setIsMicOn(false)
    }
  }, [roomId, currentUser.id])

  const toggleCamera = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0]
        if (videoTrack && videoTrack.readyState === 'live') {
          videoTrack.enabled = !videoTrack.enabled
          const newCamState = videoTrack.enabled
          setIsCameraOn(newCamState)

          // Sync video track across all active peer connections
          peerConnectionsRef.current.forEach((pc) => {
            const senders = pc.getSenders()
            const videoSender = senders.find((s) => s.track && s.track.kind === 'video')
            if (videoSender) {
              videoSender.replaceTrack(videoTrack).catch(() => {})
            } else {
              try {
                pc.addTrack(videoTrack, localStreamRef.current!)
              } catch {}
            }
          })

          if (socketRef.current) {
            socketRef.current.emit('participant-state-change', {
              roomId,
              state: { isCameraOff: !newCamState },
            })
          }
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === currentUser.id || p.name.includes('(You)') || p.socketId === socketRef.current?.id
                ? { ...p, isCameraOff: !newCamState }
                : p
            )
          )
          return
        }
      }

      // If no active video track exists, dynamically acquire camera stream
      console.log('[WebRTC] Requesting camera access on toggle...')
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      })
      const newVideoTrack = newVideoStream.getVideoTracks()[0]

      if (newVideoTrack) {
        let combinedStream: MediaStream
        if (localStreamRef.current) {
          localStreamRef.current.addTrack(newVideoTrack)
          combinedStream = new MediaStream(localStreamRef.current.getTracks())
        } else {
          combinedStream = new MediaStream([newVideoTrack])
        }

        localStreamRef.current = combinedStream
        setLocalStream(combinedStream)
        setIsCameraOn(true)
        setPermissionDeniedType(null)

        // Replace or add video track to all active peer connections
        peerConnectionsRef.current.forEach((pc) => {
          const senders = pc.getSenders()
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video')
          if (videoSender) {
            videoSender.replaceTrack(newVideoTrack).catch(() => {})
          } else {
            pc.addTrack(newVideoTrack, combinedStream)
          }
        })

        if (socketRef.current) {
          socketRef.current.emit('participant-state-change', {
            roomId,
            state: { isCameraOff: false },
          })
        }

        setParticipants((prev) =>
          prev.map((p) =>
            p.id === currentUser.id || p.name.includes('(You)') || p.socketId === socketRef.current?.id
              ? { ...p, stream: combinedStream, isCameraOff: false }
              : p
          )
        )
      }
    } catch (err: any) {
      console.error('[WebRTC] Camera access error:', err)
      const isPerm = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.toLowerCase().includes('permission') || err.message?.toLowerCase().includes('denied')
      if (isPerm) {
        setPermissionDeniedType('camera')
      } else {
        toast.error('Could not access camera')
      }
      setIsCameraOn(false)
    }
  }, [roomId, currentUser.id])

  // Tutor Remote Mute / Unmute Participant Handler
  const muteParticipant = useCallback(
    (targetSocketId: string, shouldMute = true) => {
      if (socketRef.current) {
        const eventName = shouldMute ? 'tutor-mute-participant' : 'tutor-unmute-participant'
        socketRef.current.emit(eventName, { roomId, targetSocketId })
      }
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === targetSocketId || p.id === targetSocketId ? { ...p, isMuted: shouldMute } : p))
      )
    },
    [roomId]
  )

  const toggleHandRaise = useCallback(() => {
    setIsHandRaised((prev) => {
      const next = !prev
      if (socketRef.current) {
        socketRef.current.emit('participant-state-change', {
          roomId,
          state: { isHandRaised: next },
        })
      }
      setParticipants((pList) =>
        pList.map((p) =>
          p.id === currentUser.id || p.name.includes('(You)') || p.socketId === socketRef.current?.id
            ? { ...p, isHandRaised: next }
            : p
        )
      )
      return next
    })
  }, [roomId, currentUser.id])

  // Screen Sharing Implementation
  const startScreenShare = useCallback(async () => {
    try {
      console.log('[Screen Share] Requesting screen share media stream...')
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const screenTrack = screenStream.getVideoTracks()[0]
      screenTrackRef.current = screenTrack

      // Replace video track on all active peer connections
      peerConnectionsRef.current.forEach((pc) => {
        const senders = pc.getSenders()
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video')
        if (videoSender) {
          videoSender.replaceTrack(screenTrack)
        }
      })

      // Update local state
      setIsScreenSharing(true)

      // Notify socket server
      if (socketRef.current) {
        socketRef.current.emit('participant-state-change', {
          roomId,
          state: { isScreenSharing: true },
        })
      }
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === currentUser.id || p.name.includes('(You)') || p.socketId === socketRef.current?.id
            ? { ...p, isScreenSharing: true }
            : p
        )
      )

      // Handle browser native "Stop sharing" button click
      screenTrack.onended = () => {
        console.log('[Screen Share] Screen share track ended by browser.')
        stopScreenShare()
      }
    } catch (err) {
      console.error('[Screen Share] Permission denied or failed to share screen:', err)
    }
  }, [roomId, currentUser.id])

  const stopScreenShare = useCallback(() => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop()
      screenTrackRef.current = null
    }

    // Revert to camera track on peer connections
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0] || null
    peerConnectionsRef.current.forEach((pc) => {
      const senders = pc.getSenders()
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video')
      if (videoSender && cameraTrack) {
        videoSender.replaceTrack(cameraTrack)
      }
    })

    setIsScreenSharing(false)

    if (socketRef.current) {
      socketRef.current.emit('participant-state-change', {
        roomId,
        state: { isScreenSharing: false },
      })
    }
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === currentUser.id || p.name.includes('(You)') || p.socketId === socketRef.current?.id
          ? { ...p, isScreenSharing: false }
          : p
      )
    )
  }, [roomId, currentUser.id])

  const toggleScreenShare = useCallback(() => {
    if (isScreenSharing) {
      stopScreenShare()
    } else {
      startScreenShare()
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare])

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !socketRef.current) return
      const newMsg: ChatMessage = {
        id: String(Date.now()),
        sender: currentUser.name,
        senderId: currentUser.id,
        role: currentUser.role,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      socketRef.current.emit('send-room-message', { roomId, message: newMsg })
    },
    [roomId, currentUser.id, currentUser.name, currentUser.role]
  )

  // Whiteboard Permission Methods
  const requestWhiteboardPermission = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('request-whiteboard-permission', {
        roomId,
        socketId: socketRef.current.id,
        name: currentUser.name,
      })
    }
  }, [roomId, currentUser.name])

  const grantWhiteboardPermission = useCallback(
    (targetSocketId: string) => {
      if (socketRef.current) {
        socketRef.current.emit('grant-whiteboard-permission', { roomId, targetSocketId })
      }
      setWhiteboardRequests((prev) => prev.filter((r) => r.socketId !== targetSocketId))
      setWhiteboardPermissionsMap((prev) => ({ ...prev, [targetSocketId]: true }))
    },
    [roomId]
  )

  const revokeWhiteboardPermission = useCallback(
    (targetSocketId: string) => {
      if (socketRef.current) {
        socketRef.current.emit('revoke-whiteboard-permission', { roomId, targetSocketId })
      }
      setWhiteboardPermissionsMap((prev) => ({ ...prev, [targetSocketId]: false }))
    },
    [roomId]
  )

  const denyWhiteboardRequest = useCallback((targetSocketId: string) => {
    setWhiteboardRequests((prev) => prev.filter((r) => r.socketId !== targetSocketId))
  }, [])

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId })
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    peerConnectionsRef.current.forEach((pc) => pc.close())
    peerConnectionsRef.current.clear()
  }, [roomId])

  return {
    socket,
    localStream,
    participants,
    messages,
    socketRef,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    isHandRaised,
    connectionStatus,
    hasWhiteboardPermission,
    whiteboardRequests,
    whiteboardPermissionsMap,
    toggleMic,
    toggleCamera,
    toggleHandRaise,
    toggleScreenShare,
    muteParticipant,
    requestWhiteboardPermission,
    grantWhiteboardPermission,
    revokeWhiteboardPermission,
    denyWhiteboardRequest,
    sendMessage,
    leaveRoom,
    setParticipants,
    setMessages,
    permissionDeniedType,
    setPermissionDeniedType,
  }
}
