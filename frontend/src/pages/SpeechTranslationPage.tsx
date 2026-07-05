import { FormEvent, useEffect, useRef, useState } from 'react'
import { Loader2, Mic, Play, Square, Trash2, Upload } from 'lucide-react'
import Layout from '../components/Layout'
import LanguageSelect from '../components/LanguageSelect'
import TranslationResult from '../components/TranslationResult'
import Alert from '../components/Alert'
import {
  fetchLanguages,
  getErrorMessage,
  translateSpeech,
  type Language,
} from '../api/client'

// WAV encoding helper functions
function mergeBuffers(channelBuffer: Float32Array[], recordingLength: number): Float32Array {
  const result = new Float32Array(recordingLength)
  let offset = 0
  for (let i = 0; i < channelBuffer.length; i++) {
    const buffer = channelBuffer[i]
    result.set(buffer, offset)
    offset += buffer.length
  }
  return result
}

function writeUTFBytes(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  writeUTFBytes(view, 0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeUTFBytes(view, 8, 'WAVE')
  writeUTFBytes(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeUTFBytes(view, 36, 'data')
  view.setUint32(40, samples.length * 2, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }

  return new Blob([view], { type: 'audio/wav' })
}

export default function SpeechTranslationPage() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [target, setTarget] = useState('French')
  const [recognized, setRecognized] = useState('')
  const [translated, setTranslated] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Recording State
  const [inputMode, setInputMode] = useState<'upload' | 'record'>('upload')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const timerRef = useRef<any>(null)
  const recordingBuffersRef = useRef<Float32Array[]>([])
  const recordingLengthRef = useRef<number>(0)

  useEffect(() => {
    fetchLanguages().then(setLanguages).catch(() => setError('Failed to load languages'))
    return () => {
      stopRecordingContext()
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    }
  }, [recordedUrl])

  const startRecording = async () => {
    setError('')
    setRecordedUrl(null)
    setFile(null)
    recordingBuffersRef.current = []
    recordingLengthRef.current = 0

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const audioContext = new AudioCtx()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      // 4096 buffer size, 1 input channel, 1 output channel
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        const left = e.inputBuffer.getChannelData(0)
        recordingBuffersRef.current.push(new Float32Array(left))
        recordingLengthRef.current += left.length
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      setIsRecording(true)
      setRecordingSeconds(0)
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      setError('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecordingContext = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }

  const stopRecording = () => {
    if (!isRecording) return
    setIsRecording(false)
    stopRecordingContext()

    const sampleRate = audioContextRef.current?.sampleRate || 44100
    const merged = mergeBuffers(recordingBuffersRef.current, recordingLengthRef.current)
    const wavBlob = encodeWAV(merged, sampleRate)
    const wavFile = new File([wavBlob], 'microphone_recording.wav', { type: 'audio/wav' })

    setFile(wavFile)
    const url = URL.createObjectURL(wavBlob)
    setRecordedUrl(url)
  }

  const clearRecording = () => {
    setFile(null)
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
      setRecordedUrl(null)
    }
    setRecordingSeconds(0)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) return
    setError('')
    setLoading(true)

    try {
      const data = await translateSpeech(file, target)
      setRecognized(data.recognized_text)
      setTranslated(data.translated_text)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <Layout
      title="Speech Translation"
      description="Translate audio files or record voice directly using your microphone"
    >
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setInputMode('upload')
            clearRecording()
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            inputMode === 'upload' ? 'bg-blue-600 text-white' : 'bg-surface-800 text-slate-400 hover:text-white'
          }`}
        >
          Upload Audio
        </button>
        <button
          type="button"
          onClick={() => {
            setInputMode('record')
            setFile(null)
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            inputMode === 'record' ? 'bg-blue-600 text-white' : 'bg-surface-800 text-slate-400 hover:text-white'
          }`}
        >
          Record Mic
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4">
        {inputMode === 'upload' ? (
          <div>
            <label htmlFor="audio-upload" className="label">
              Upload audio file (WAV recommended)
            </label>
            <label
              htmlFor="audio-upload"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-surface-900 px-6 py-10 transition hover:border-blue-500/50"
            >
              <Upload className="mb-3 h-8 w-8 text-slate-500" aria-hidden />
              <span className="text-sm text-slate-400">
                {file ? file.name : 'Click to select WAV, MP3, or M4A file'}
              </span>
              <input
                id="audio-upload"
                type="file"
                accept="audio/*,.wav,.mp3,.m4a"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <label className="label self-start">Voice Recording</label>
            <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-700 bg-surface-900 p-6 w-full max-w-md">
              {isRecording ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative flex h-16 w-16 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/20 opacity-75"></span>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="relative flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-500"
                    >
                      <Square className="h-5 w-5" />
                    </button>
                  </div>
                  <span className="text-xl font-mono text-red-400">{formatTime(recordingSeconds)}</span>
                  <span className="text-xs text-slate-400">Recording speech... Click to stop.</span>
                </div>
              ) : recordedUrl ? (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="flex items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400">
                      <Play className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Recording Captured</p>
                      <p className="text-xs text-slate-400">Ready to recognize & translate</p>
                    </div>
                  </div>
                  <audio src={recordedUrl} controls className="w-full h-8" />
                  <button
                    type="button"
                    onClick={clearRecording}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Discard Recording
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500 hover:scale-105"
                  >
                    <Mic className="h-7 w-7" />
                  </button>
                  <span className="text-sm text-slate-300">Click to record voice</span>
                </div>
              )}
            </div>
          </div>
        )}

        <LanguageSelect languages={languages} value={target} onChange={setTarget} />

        <button type="submit" className="btn-primary w-full" disabled={!file || loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Recognize & Translate
        </button>
      </form>

      {error && <div className="mt-4"><Alert type="error" message={error} /></div>}

      {translated && (
        <div className="mt-6 max-w-2xl">
          <TranslationResult
            original={recognized}
            translated={translated}
            targetLanguage={target}
          />
        </div>
      )}
    </Layout>
  )
}

