import { useEffect, useRef, useState, useCallback } from 'react'

export interface TranscriptEntry {
  _id?: string
  speakerId: string
  speakerName: string
  role: 'tutor' | 'student' | 'system'
  text: string
  timeFormatted: string
  timestamp: string | Date
}

interface UseSpeechTranscriptionProps {
  roomId: string
  isMicOn: boolean
  currentUser: {
    id: string
    name: string
    role: 'tutor' | 'student'
  }
  socket: any
  onNewLocalTranscript?: (entry: TranscriptEntry) => void
  localStream?: MediaStream | null
}

export function useSpeechTranscription({
  roomId,
  isMicOn,
  currentUser,
  socket,
  onNewLocalTranscript,
  localStream,
}: UseSpeechTranscriptionProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [isSoundDetected, setIsSoundDetected] = useState(false)
  const [micVolume, setMicVolume] = useState(0)

  const recognitionRef = useRef<any>(null)
  const isMicOnRef = useRef(isMicOn)
  isMicOnRef.current = isMicOn
  const restartTimerRef = useRef<any>(null)
  const silenceTimerRef = useRef<any>(null)
  const currentInterimRef = useRef('')

  // Check browser support for Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
  }, [])

  // Web Audio API: Measure actual microphone volume from localStream
  useEffect(() => {
    if (!localStream || !isMicOn) {
      setMicVolume(0)
      setIsSoundDetected(false)
      return
    }

    const audioTracks = localStream.getAudioTracks()
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      setMicVolume(0)
      setIsSoundDetected(false)
      return
    }

    let audioContext: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let source: MediaStreamAudioSourceNode | null = null
    let animId: number | null = null

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        audioContext = new AudioCtx()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 128
        analyser.smoothingTimeConstant = 0.4
        source = audioContext.createMediaStreamSource(localStream)
        source.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const checkVolume = () => {
          if (!analyser) return
          analyser.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const avg = sum / dataArray.length
          const scaled = Math.min(100, Math.round((avg / 128) * 100))
          setMicVolume(scaled)
          if (scaled > 3) {
            setIsSoundDetected(true)
          }
          animId = requestAnimationFrame(checkVolume)
        }
        checkVolume()
      }
    } catch (e) {
      console.warn('[useSpeechTranscription] AudioContext volume measurement:', e)
    }

    return () => {
      if (animId) cancelAnimationFrame(animId)
      try {
        source?.disconnect()
        audioContext?.close()
      } catch {}
    }
  }, [localStream, isMicOn])

  // Finalize and broadcast a recognized transcript segment
  const emitFinalTranscript = useCallback(
    (rawText: string) => {
      const trimmed = rawText.trim()
      if (!trimmed) return

      const timeFormatted = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })

      const entry: TranscriptEntry = {
        speakerId: currentUser.id,
        speakerName: currentUser.name,
        role: currentUser.role,
        text: trimmed,
        timeFormatted,
        timestamp: new Date().toISOString(),
      }

      // Emit to backend socket for room broadcast and MongoDB persistence
      if (socket) {
        socket.emit('speech-transcript-segment', {
          roomId,
          speakerId: currentUser.id,
          speakerName: currentUser.name,
          role: currentUser.role,
          text: trimmed,
        })
      }

      onNewLocalTranscript?.(entry)
      setInterimText('')
      currentInterimRef.current = ''
    },
    [currentUser.id, currentUser.name, currentUser.role, onNewLocalTranscript, roomId, socket]
  )

  const startRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition not supported in this browser. Use Chrome or Edge.')
      return
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {}
      recognitionRef.current = null
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true

      // Format language cleanly
      const browserLang = navigator.language || 'en-US'
      recognition.lang = browserLang.length === 2 ? `${browserLang}-${browserLang.toUpperCase()}` : browserLang
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        setSpeechError(null)
      }

      recognition.onaudiostart = () => {
        setIsSoundDetected(true)
      }

      recognition.onsoundstart = () => {
        setIsSoundDetected(true)
      }

      recognition.onspeechstart = () => {
        setIsSoundDetected(true)
      }

      recognition.onresult = (event: any) => {
        let currentInterim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptSegment = event.results[i][0]?.transcript || ''
          if (event.results[i].isFinal) {
            emitFinalTranscript(transcriptSegment)
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
            return
          } else {
            currentInterim += transcriptSegment
          }
        }

        if (currentInterim.trim()) {
          const trimmed = currentInterim.trim()
          setInterimText(trimmed)
          currentInterimRef.current = trimmed
          setIsSoundDetected(true)

          // Auto-finalize after 1.4s of silence in case the browser engine pauses without firing isFinal
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = setTimeout(() => {
            if (currentInterimRef.current) {
              emitFinalTranscript(currentInterimRef.current)
            }
          }, 1400)
        }
      }

      recognition.onspeechend = () => {
        // When speech ends momentarily, flush any pending interim text
        if (currentInterimRef.current) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = setTimeout(() => {
            if (currentInterimRef.current) {
              emitFinalTranscript(currentInterimRef.current)
            }
          }, 600)
        }
      }

      recognition.onerror = (event: any) => {
        const err = event.error
        if (err === 'no-speech') {
          // Normal pause in talking, do not treat as error
          return
        }
        if (err === 'aborted') {
          return
        }

        console.warn('[SpeechRecognition] warning/error:', err)
        if (err === 'audio-capture') {
          setSpeechError(
            'Microphone not detected. Please verify your headphone or microphone is set as the Default Recording Device in Windows Sound Settings.'
          )
        } else if (err === 'not-allowed') {
          setSpeechError(
            'Microphone access blocked. Click the lock/tune icon next to http://localhost in your browser address bar and set Microphone to "Allow".'
          )
        } else if (err === 'network') {
          setSpeechError(
            'Network error: Speech service could not connect to Google speech servers. Check your internet connection.'
          )
        } else {
          setSpeechError(`Speech recognition: ${err}`)
        }
      }

      recognition.onend = () => {
        // Flush any un-finalized text
        if (currentInterimRef.current) {
          emitFinalTranscript(currentInterimRef.current)
        }
        setIsListening(false)
        recognitionRef.current = null

        // Auto-restart if microphone is still unmuted
        if (isMicOnRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
          restartTimerRef.current = setTimeout(() => {
            if (isMicOnRef.current && !recognitionRef.current) {
              startRecognition()
            }
          }, 200)
        }
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err)
      recognitionRef.current = null
      setIsListening(false)
      if (err?.name !== 'InvalidStateError') {
        setSpeechError(err?.message || 'Failed to start speech recognition')
      }
    }
  }, [emitFinalTranscript])

  const stopRecognition = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (currentInterimRef.current) {
      emitFinalTranscript(currentInterimRef.current)
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimText('')
    currentInterimRef.current = ''
  }, [emitFinalTranscript])

  const restartRecognition = useCallback(() => {
    stopRecognition()
    setTimeout(() => {
      if (isMicOnRef.current) {
        startRecognition()
      }
    }, 150)
  }, [startRecognition, stopRecognition])

  useEffect(() => {
    if (isMicOn) {
      startRecognition()
    } else {
      stopRecognition()
    }

    return () => {
      stopRecognition()
    }
  }, [isMicOn, startRecognition, stopRecognition])

  return {
    isSupported,
    isListening,
    interimText,
    speechError,
    isSoundDetected,
    micVolume,
    restartRecognition,
  }
}
