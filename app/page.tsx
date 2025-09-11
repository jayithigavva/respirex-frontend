'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileAudio, AlertCircle, CheckCircle, Loader2, Play, Pause } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://my-backend.onrender.com'

interface DiseasePredictionResult {
  success: boolean
  filename: string
  prediction: string
  confidence: number
  class_probabilities: Record<string, number>
  audio_info: {
    duration: number
    sample_rate: number
  }
}

interface AnnotationPredictionResult {
  success: boolean
  filename: string
  disease: string
  confidence: number
  events: Array<{
    start: number
    end: number
    label: string
    confidence: number
  }>
  audio_info: {
    duration: number
    sample_rate: number
  }
}

type PredictionResult = DiseasePredictionResult | AnnotationPredictionResult

interface AnomalySegment {
  type: 'wheeze' | 'crackle'
  start_time: number
  end_time: number
  confidence: number
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [selectedModel, setSelectedModel] = useState<'disease' | 'annotation'>('disease')
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const waveformRef = useRef<HTMLDivElement>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.wav', '.mp3', '.m4a', '.flac']
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0])
        setError(null)
        setResult(null)
      }
    }
  })

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const endpoint = selectedModel === 'disease' ? '/predict_disease' : '/predict_annotation'
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      })

      setResult(response.data)
    } catch (err: any) {
      if (err.response?.status === 500) {
        setError('Server error. Please try again later.')
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timeout. The audio file might be too large.')
      } else if (err.response?.status === 400) {
        setError('Invalid audio file. Please upload a valid audio file.')
      } else {
        setError('Failed to process audio file. Please check your connection and try again.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const getDiseaseColor = (disease: string) => {
    const colors: Record<string, string> = {
      'Healthy': 'text-green-600 bg-green-100',
      'COPD': 'text-red-600 bg-red-100',
      'Pneumonia': 'text-orange-600 bg-orange-100',
      'Asthma': 'text-blue-600 bg-blue-100',
      'Bronchiectasis': 'text-purple-600 bg-purple-100',
      'Bronchiolitis': 'text-yellow-600 bg-yellow-100',
      'LRTI': 'text-indigo-600 bg-indigo-100',
      'URTI': 'text-pink-600 bg-pink-100',
    }
    return colors[disease] || 'text-gray-600 bg-gray-100'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <FileAudio className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Respiratory Disease AI</h1>
            </div>
            <div className="text-sm text-gray-500">
              AI-Powered Audio Analysis
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Audio File</h2>
              
              {/* Model Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as 'disease' | 'annotation')}
                  className="input-field"
                >
                  <option value="disease">Disease Classifier</option>
                  <option value="annotation">Annotation Model</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedModel === 'disease' 
                    ? 'Classifies respiratory diseases from audio'
                    : 'Detects abnormal sounds and classifies diseases'
                  }
                </p>
              </div>
              
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-primary-600 font-medium">Drop the audio file here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag & drop an audio file here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports WAV, MP3, M4A, FLAC formats
                    </p>
                  </div>
                )}
              </div>

              {/* Selected File */}
              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileAudio className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="w-full mt-4 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Analyze Audio</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="card border-l-4 border-red-500 bg-red-50"
                >
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Prediction Results */}
                  <div className="card">
                    <div className="flex items-center space-x-3 mb-4">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
                    </div>

                    <div className="space-y-4">
                      {/* Disease Prediction */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2">Predicted Disease</h3>
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDiseaseColor(
                            'prediction' in result ? result.prediction : result.disease
                          )}`}>
                            {'prediction' in result ? result.prediction : result.disease}
                          </span>
                          <span className={`text-lg font-bold ${getConfidenceColor(result.confidence)}`}>
                            {(result.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Class Probabilities (only for disease model) */}
                      {'class_probabilities' in result && (
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3">All Disease Probabilities</h3>
                          <div className="space-y-2">
                            {Object.entries(result.class_probabilities)
                              .sort(([,a], [,b]) => b - a)
                              .map(([disease, probability]) => (
                                <div key={disease} className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">{disease}</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${probability * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-sm text-gray-500 w-12 text-right">
                                      {(probability * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Audio Player and Events */}
                  {('events' in result && result.events.length > 0) && (
                    <div className="card">
                      <h3 className="font-medium text-gray-900 mb-4">Detected Events</h3>
                      
                      {/* Audio Player */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={togglePlayPause}
                            className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors"
                          >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                          </button>
                          <div className="flex-1">
                            <div className="text-sm text-gray-600 mb-1">
                              {file?.name}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 relative">
                              <div
                                className="bg-primary-500 h-2 rounded-full transition-all duration-100"
                                style={{ width: `${(currentTime / result.audio_info.duration) * 100}%` }}
                              />
                              {/* Event markers */}
                              {result.events.map((event, index) => (
                                <div
                                  key={index}
                                  className={`absolute top-0 h-2 rounded-full ${
                                    event.label === 'wheeze' ? 'bg-red-500' : 'bg-orange-500'
                                  }`}
                                  style={{
                                    left: `${(event.start / result.audio_info.duration) * 100}%`,
                                    width: `${((event.end - event.start) / result.audio_info.duration) * 100}%`,
                                  }}
                                />
                              ))}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')} / {Math.floor(result.audio_info.duration / 60)}:{(result.audio_info.duration % 60).toFixed(0).padStart(2, '0')}
                            </div>
                          </div>
                        </div>
                        <audio
                          ref={audioRef}
                          src={file ? URL.createObjectURL(file) : undefined}
                          onTimeUpdate={handleTimeUpdate}
                          onEnded={() => setIsPlaying(false)}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                      </div>

                      {/* Event List */}
                      <div className="space-y-2">
                        {result.events.map((event, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border-l-4 ${
                              event.label === 'wheeze'
                                ? 'bg-red-50 border-red-500'
                                : 'bg-orange-50 border-orange-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    event.label === 'wheeze' ? 'bg-red-500' : 'bg-orange-500'
                                  }`}
                                />
                                <span className="font-medium capitalize">{event.label}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {event.start}s - {event.end}s
                                <span className="ml-2 text-xs">
                                  ({(event.confidence * 100).toFixed(0)}% confidence)
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}
