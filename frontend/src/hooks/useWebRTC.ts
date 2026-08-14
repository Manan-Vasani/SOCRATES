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
  role: 'tutor' | 'student' | 'system'
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
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:5000')

export function useWebRTC({ roomId, currentUser }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: currentUser.id,
      socketId: 'local-self',
      name: `${currentUser.name} (You)`,
      role: currentUser.role,
      avatar: currentUser.avatar,
      stream: undefined,
      isMuted: false,
      isCameraOff: false,
      isSpeaking: false,
      isPinned: false,
      isHandRaised: false,
      isScreenSharing: false,
    },
  ])

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
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'disconnected'>('connecting')

  const socketRef = useRef<Socket | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenTrackRef = useRef<MediaStreamTrack | null>(null)

  // 1. Initialize Local Media Stream
  useEffect(() => {
    let isMounted = true

    async function initLocalStream() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('[WebRTC] mediaDevices API is not available on this browser/insecure context.')
        return
      }

      try {
        console.log('[WebRTC] Requesting local camera & microphone access...')
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        localStreamRef.current = stream
        setLocalStream(stream)
        setIsCameraOn(true)
        setIsMicOn(true)
        console.log('[WebRTC] Camera & microphone streams acquired successfully.')

        // Instantly attach localStream to self participant entry
        setParticipants((prev) => {
          const exists = prev.some((p) => p.id === currentUser.id || p.name.includes('(You)'))
          if (!exists) {
            return [
              {
                id: currentUser.id,
                socketId: socketRef.current?.id || 'local-self',
                name: `${currentUser.name} (You)`,
                role: currentUser.role,
                avatar: currentUser.avatar,
                stream: stream,
                isMuted: false,
                isCameraOff: false,
                isSpeaking: false,
                isPinned: false,
                isHandRaised: false,
                isScreenSharing: false,
              },
            ]
          }
          return prev.map((p) =>
            p.id === currentUser.id || p.name.includes('(You)')
              ? { ...p, stream: stream, isCameraOff: false, isMuted: false }
              : p
          )
        })
      } catch (err: any) {
        console.warn('[WebRTC] Full media acquisition (video+audio) failed. Attempting fallback...', err)
        try {
          // Fallback 1: Audio-only if camera is occupied or denied
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
          })
          if (!isMounted) {
            audioOnlyStream.getTracks().forEach((t) => t.stop())
            return
          }
          localStreamRef.current = audioOnlyStream
          setLocalStream(audioOnlyStream)
          setIsCameraOn(false)
          setIsMicOn(true)

          setParticipants((prev) =>
            prev.map((p) =>
              p.id === currentUser.id || p.name.includes('(You)')
                ? { ...p, stream: audioOnlyStream, isCameraOff: true, isMuted: false }
                : p
            )
          )
        } catch (audioErr) {
          // Fallback 2: Video-only if microphone was denied
          try {
            const videoOnlyStream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            })
            if (!isMounted) {
              videoOnlyStream.getTracks().forEach((t) => t.stop())
              return
            }
            localStreamRef.current = videoOnlyStream
            setLocalStream(videoOnlyStream)
            setIsCameraOn(true)
            setIsMicOn(false)

            setParticipants((prev) =>
              prev.map((p) =>
                p.id === currentUser.id || p.name.includes('(You)')
                  ? { ...p, stream: videoOnlyStream, isCameraOff: false, isMuted: true }
                  : p
              )
            )
          } catch (videoErr) {
            console.warn('[WebRTC] Both camera and microphone initial access denied or unavailable.', videoErr)
            if (isMounted) {
              setIsCameraOn(false)
              setIsMicOn(false)
              setParticipants((prev) =>
                prev.map((p) =>
                  p.id === currentUser.id || p.name.includes('(You)')
                    ? { ...p, isCameraOff: true, isMuted: true }
                    : p
                )
              )
            }
          }
        }
      }
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

      // Add local media tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!)
        })
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

      // Handle incoming remote media stream track
      pc.ontrack = (event) => {
        console.log(`[WebRTC] Received remote stream track from ${targetSocketId}:`, event.streams[0])
        const remoteStream = event.streams[0]
        if (remoteStream) {
          setParticipants((prev) =>
            prev.map((p) => (p.socketId === targetSocketId ? { ...p, stream: remoteStream } : p))
          )
        }
      }

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC Peer ${targetSocketId}] State changed: ${pc.connectionState}`)
      }

      peerConnectionsRef.current.set(targetSocketId, pc)
      return pc
    },
    []
  )

  // 2. Connect Socket.IO & Listen for Signaling Events
  useEffect(() => {
    console.log(`[Meeting Socket] Connecting to ${SOCKET_URL}...`)
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log(`[Meeting Socket] Connected with Socket ID: ${socket.id}`)
      setConnectionStatus('connected')

      // Add/update self entry in participants list
      setParticipants((prev) => {
        const selfStream = localStreamRef.current || localStream || undefined
        const existingSelf = prev.find((p) => p.id === currentUser.id || p.name.includes('(You)'))
        const selfItem: Participant = {
          id: currentUser.id,
          socketId: socket.id!,
          name: `${currentUser.name} (You)`,
          role: currentUser.role,
          avatar: currentUser.avatar,
          stream: selfStream,
          isMuted: !isMicOn,
          isCameraOff: !isCameraOn,
          isSpeaking: false,
          isPinned: existingSelf?.isPinned || false,
          isHandRaised: isHandRaised,
          isScreenSharing: isScreenSharing,
        }
        const others = prev.filter((p) => p.id !== currentUser.id && !p.name.includes('(You)'))
        return [selfItem, ...others]
      })

      // Join room signaling channel
      socket.emit('join-room', {
        roomId,
        user: currentUser,
      })
    })

    socket.on('disconnect', () => {
      console.warn('[Meeting Socket] Disconnected from server.')
      setConnectionStatus('disconnected')
    })

    socket.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting')
    })

    // Received existing participants from server upon joining
    socket.on('existing-participants', async (existingList: any[]) => {
      console.log(`[Meeting Socket] Received ${existingList.length} existing participants:`, existingList)

      setParticipants((prev) => {
        const self = prev.find((p) => p.socketId === socket.id || p.name.includes('(You)'))
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

      // Initiate WebRTC connection (Offer) to each existing participant
      for (const peerData of existingList) {
        try {
          const pc = createPeerConnection(peerData.socketId, socket)
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)

          console.log(`[WebRTC] Sending SDP Offer to ${peerData.socketId}`)
          socket.emit('offer', {
            targetSocketId: peerData.socketId,
            offer,
          })
        } catch (err) {
          console.error(`[WebRTC] Error initiating offer to ${peerData.socketId}:`, err)
        }
      }
    })

    // New user joined room
    socket.on('user-joined', (newParticipant: any) => {
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
            isMuted: false,
            isCameraOff: false,
            isSpeaking: false,
            isPinned: false,
            isHandRaised: false,
            isScreenSharing: false,
          },
        ]
      })

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'System',
          role: 'system',
          text: `${newParticipant.name} joined the room.`,
          time: 'Now',
        },
      ])
    })

    // Received SDP Offer from a remote peer
    socket.on('offer', async ({ senderSocketId, offer }: { senderSocketId: string; offer: RTCSessionDescriptionInit }) => {
      console.log(`[WebRTC] Received SDP Offer from ${senderSocketId}`)
      try {
        const pc = createPeerConnection(senderSocketId, socket)
        await pc.setRemoteDescription(new RTCSessionDescription(offer))

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        console.log(`[WebRTC] Sending SDP Answer to ${senderSocketId}`)
        socket.emit('answer', {
          targetSocketId: senderSocketId,
          answer,
        })
      } catch (err) {
        console.error(`[WebRTC] Error handling offer from ${senderSocketId}:`, err)
      }
    })

    // Received SDP Answer from a remote peer
    socket.on('answer', async ({ senderSocketId, answer }: { senderSocketId: string; answer: RTCSessionDescriptionInit }) => {
      console.log(`[WebRTC] Received SDP Answer from ${senderSocketId}`)
      try {
        const pc = peerConnectionsRef.current.get(senderSocketId)
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer))
        }
      } catch (err) {
        console.error(`[WebRTC] Error setting remote description for answer from ${senderSocketId}:`, err)
      }
    })

    // Received ICE Candidate from remote peer
    socket.on('ice-candidate', async ({ senderSocketId, candidate }: { senderSocketId: string; candidate: RTCIceCandidateInit }) => {
      try {
        const pc = peerConnectionsRef.current.get(senderSocketId)
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        }
      } catch (err) {
        console.error(`[WebRTC] Error adding ICE candidate from ${senderSocketId}:`, err)
      }
    })

    // Participant State Update (Mic, Camera, Screen Share, Hand Raise)
    socket.on('participant-state-updated', ({ socketId, state }: { socketId: string; state: any }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, ...state } : p))
      )
    })

    // Real-Time Room Message Received
    socket.on('room-message-received', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg])
    })

    // User left room
    socket.on('user-left', ({ socketId, userId }: { socketId: string; userId: string }) => {
      console.log(`[Meeting Socket] User left room: ${socketId}`)

      // Close and cleanup RTCPeerConnection for leaving user
      const pc = peerConnectionsRef.current.get(socketId)
      if (pc) {
        pc.close()
        peerConnectionsRef.current.delete(socketId)
      }

      setParticipants((prev) => {
        const leaving = prev.find((p) => p.socketId === socketId)
        if (leaving) {
          setMessages((m) => [
            ...m,
            {
              id: String(Date.now()),
              sender: 'System',
              role: 'system',
              text: `${leaving.name.replace(' (You)', '')} left the room.`,
              time: 'Now',
            },
          ])
        }
        return prev.filter((p) => p.socketId !== socketId)
      })
    })

    return () => {
      console.log('[Meeting Socket] Cleaning up socket and peer connections...')
      socket.emit('leave-room', { roomId })

      peerConnectionsRef.current.forEach((pc) => pc.close())
      peerConnectionsRef.current.clear()

      socket.disconnect()
    }
  }, [roomId, currentUser.id, currentUser.name, currentUser.role, currentUser.avatar, createPeerConnection])

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
          toast.success(newMicState ? 'Microphone unmuted' : 'Microphone muted')
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
        toast.success('Microphone enabled')
      }
    } catch (err: any) {
      console.error('[WebRTC] Microphone access error:', err)
      toast.error(err.message?.includes('Permission') ? 'Microphone permission denied' : 'Could not access microphone')
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
          toast.success(newCamState ? 'Camera turned on' : 'Camera turned off')
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
        toast.success('Camera enabled')
      }
    } catch (err: any) {
      console.error('[WebRTC] Camera access error:', err)
      toast.error(err.message?.includes('Permission') ? 'Camera permission denied' : 'Could not access camera')
      setIsCameraOn(false)
    }
  }, [roomId, currentUser.id])

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
        role: currentUser.role,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      socketRef.current.emit('send-room-message', { roomId, message: newMsg })
    },
    [roomId, currentUser.name, currentUser.role]
  )

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
    localStream,
    participants,
    messages,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    isHandRaised,
    connectionStatus,
    toggleMic,
    toggleCamera,
    toggleHandRaise,
    toggleScreenShare,
    sendMessage,
    leaveRoom,
    setParticipants,
  }
}
