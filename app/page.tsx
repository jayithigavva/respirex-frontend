'use client'
// Updated: Images moved to public directory for proper Next.js static asset handling

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, FileAudio, AlertCircle, CheckCircle, Loader2, Play, Pause, 
  Heart, Shield, Zap, Users, ChevronDown, ChevronUp, Menu, X,
  Stethoscope, Brain, Target, Clock, Award, HelpCircle, AlertTriangle
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://respirex-api-ml.onrender.com'

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

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [selectedModel, setSelectedModel] = useState<'disease' | 'annotation'>('disease')
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // Annotation Model states
  const [isRecording, setIsRecording] = useState(false)
  const [recordStartTime, setRecordStartTime] = useState<number | null>(null)
  const [annotationEvents, setAnnotationEvents] = useState<Array<{type: string, timestamp: number, duration: number}>>([])
  const [recordingDuration, setRecordingDuration] = useState(0)

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
    if (selectedModel === 'disease') {
      if (!file) return

      setIsUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await axios.post(`${API_BASE_URL}/predict_disease`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        })

        setResult(response.data)
      } catch (err: any) {
        console.error('Disease prediction error:', err)
        if (err.response?.status === 500) {
          setError('Server error. Please try again later.')
        } else if (err.response?.data?.error) {
          setError(`Error: ${err.response.data.error}`)
        } else if (err.code === 'ECONNABORTED') {
          setError('Request timeout. The audio file might be too large.')
        } else if (err.response?.status === 400) {
          setError('Invalid audio file. Please upload a valid audio file.')
        } else {
          setError(`Failed to process audio file: ${err.message}`)
        }
      } finally {
        setIsUploading(false)
      }
    } else {
      // Annotation model - send button press data
      if (annotationEvents.length === 0) {
        setError('Please record some crackles or wheezes first.')
        return
      }

      setIsUploading(true)
      setError(null)

      try {
        const response = await axios.post(`${API_BASE_URL}/predict_annotation`, {
          events: annotationEvents,
          duration: recordingDuration
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        })

        setResult(response.data)
      } catch (err: any) {
        console.error('Annotation error:', err)
        if (err.response?.status === 500) {
          setError('Server error. Please try again later.')
        } else if (err.response?.data?.error) {
          setError(`Error: ${err.response.data.error}`)
        } else if (err.code === 'ECONNABORTED') {
          setError('Request timeout. Please try again.')
        } else {
          setError(`Failed to process annotation data: ${err.message}`)
        }
      } finally {
        setIsUploading(false)
      }
    }
  }

  // Annotation functions
  const startRecording = () => {
    setIsRecording(true)
    setRecordStartTime(Date.now())
    setAnnotationEvents([])
    setRecordingDuration(0)
    setError(null)
    setResult(null)
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (recordStartTime) {
      setRecordingDuration((Date.now() - recordStartTime) / 1000)
    }
    setRecordStartTime(null)
  }

  const addCrackle = () => {
    if (!isRecording) return
    const timestamp = recordStartTime ? (Date.now() - recordStartTime) / 1000 : 0
    setAnnotationEvents([...annotationEvents, { type: 'crackle', timestamp, duration: 0.5 }])
  }

  const addWheeze = () => {
    if (!isRecording) return
    const timestamp = recordStartTime ? (Date.now() - recordStartTime) / 1000 : 0
    setAnnotationEvents([...annotationEvents, { type: 'wheeze', timestamp, duration: 1.0 }])
  }

  const clearAnnotations = () => {
    setAnnotationEvents([])
    setRecordingDuration(0)
    setResult(null)
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

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setActiveSection(sectionId)
    }
    setMobileMenuOpen(false)
  }

  const faqs = [
    {
      question: "What is RespireX?",
      answer: "RespireX is an AI-powered respiratory disease detection system that analyzes audio recordings of breathing sounds to identify potential respiratory conditions with medical-grade precision."
    },
    {
      question: "How reliable is the diagnosis?",
      answer: "Our AI models provide medical-grade performance for disease classification and clinical-grade analysis for annotation-based predictions, making them suitable for medical screening applications."
    },
    {
      question: "What audio formats are supported?",
      answer: "We support WAV, MP3, M4A, and FLAC audio formats. For best results, use high-quality recordings with minimal background noise."
    },
    {
      question: "Is this a replacement for medical diagnosis?",
      answer: "No, RespireX is designed as a screening tool to assist healthcare professionals. Always consult with qualified medical professionals for final diagnosis and treatment."
    },
    {
      question: "How long does the analysis take?",
      answer: "Analysis typically takes 10-30 seconds depending on the audio file size and server load. Our system is optimized for quick results."
    },
    {
      question: "Is my audio data secure?",
      answer: "Yes, we prioritize data privacy and security. Audio files are processed securely and not stored permanently on our servers."
    }
  ]

  const teamMembers = [
    {
      name: "Aashi Goyal",
      role: "",
      image: "/Aashi_Goyal.jpeg",
      bio: ""
    },
    {
      name: "Jayithi Gavva",
      role: "",
      image: "/Jayithi_Gavva.png",
      bio: ""
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => scrollToSection('home')}
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <img src="/logo.png" alt="RespireX Logo" className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                RespireX
              </h1>
            </motion.div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {['home', 'why-choose', 'models', 'how-it-works', 'faq', 'team'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className={`capitalize font-medium transition-colors ${
                    activeSection === item ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {item === 'faq' ? 'FAQs' : item === 'how-it-works' ? 'How it works?' : item === 'why-choose' ? 'Why RespireX?' : item.replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-gray-200 py-4"
              >
                <div className="flex flex-col space-y-4">
                  {['home', 'why-choose', 'models', 'how-it-works', 'faq', 'team'].map((item) => (
                    <button
                      key={item}
                      onClick={() => scrollToSection(item)}
                      className="capitalize font-medium text-left py-2 text-gray-600 hover:text-blue-600"
                    >
                      {item === 'faq' ? 'FAQs' : item === 'how-it-works' ? 'How it works?' : item === 'why-choose' ? 'Why RespireX?' : item.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              RespireX
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
              AI-Powered Respiratory Disease Detection
            </p>
            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
              Advanced machine learning technology that analyzes breathing sounds to identify respiratory conditions with medical-grade accuracy
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button
                onClick={() => scrollToSection('models')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                Try RespireX Now
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300"
              >
                Learn More
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Respirex */}
      <section id="why-choose" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why RespireX?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cutting-edge AI technology meets medical expertise to deliver accurate, fast, and reliable respiratory disease detection
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Brain className="w-8 h-8" />,
                title: "AI-Powered Analysis",
                description: "Advanced machine learning algorithms trained on thousands of respiratory sound samples"
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "Data-Driven Insights",
                description: "Auscultation projective analysis with objective, data-driven insights replacing subjective assessment"
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: "Fast Results",
                description: "Get analysis results in seconds, not days. Quick screening for better patient care"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Secure & Private",
                description: "Your data is protected with enterprise-grade security and privacy measures"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section id="models" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our AI Models</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Two specialized models working together to provide comprehensive respiratory analysis
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Disease Classifier Model */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white mr-4">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Disease Classifier</h3>
                  <p className="text-gray-600">Primary Detection Model</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="font-medium text-gray-900">Performance</span>
                  <span className="text-2xl font-bold text-green-600">Medical-Grade</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="font-medium text-gray-900">Diseases Detected</span>
                  <span className="text-lg font-semibold text-blue-600">8 Types</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <span className="font-medium text-gray-900">Processing Time</span>
                  <span className="text-lg font-semibold text-purple-600">~15 seconds</span>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Our primary model analyzes audio recordings to classify respiratory diseases including COPD, 
                Asthma, Pneumonia, and more. Uses advanced ensemble learning with SVM, MLP, and RandomForest.
              </p>

              <div className="flex flex-wrap gap-2">
                {['COPD', 'Asthma', 'Pneumonia', 'Healthy', 'Bronchiectasis', 'Bronchiolitis', 'LRTI', 'URTI'].map((disease) => (
                  <span key={disease} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {disease}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Annotation Model */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white mr-4">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Annotation Model</h3>
                  <p className="text-gray-600">Event Detection Model</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="font-medium text-gray-900">Performance</span>
                  <span className="text-2xl font-bold text-green-600">Clinical-Grade</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <span className="font-medium text-gray-900">Events Detected</span>
                  <span className="text-lg font-semibold text-orange-600">Wheezes & Crackles</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <span className="font-medium text-gray-900">Processing Time</span>
                  <span className="text-lg font-semibold text-red-600">~20 seconds</span>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Specialized model for detecting specific respiratory events like wheezes and crackles with 
                precise timestamps. Provides detailed analysis for clinical assessment.
              </p>

              <div className="flex flex-wrap gap-2">
                {['Wheeze Detection', 'Crackle Detection', 'Timeline Analysis', 'Confidence Scores'].map((feature) => (
                  <span key={feature} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    {feature}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Try Our Models</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Interface */}
              <div className="space-y-6">
                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as 'disease' | 'annotation')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="disease">Disease Classifier (Medical-Grade)</option>
                    <option value="annotation">Annotation Model (Clinical-Grade)</option>
                  </select>
                </div>
                
                {/* Model-specific Interface */}
                {selectedModel === 'disease' ? (
                  /* Disease Model - Audio Upload */
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    {isDragActive ? (
                      <p className="text-blue-600 font-medium">Drop the audio file here...</p>
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
                ) : (
                  /* Annotation Model - Button Press Interface */
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-2 border-orange-200">
                      <Stethoscope className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Doctor-Assisted Annotation</h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Listen to audio and press buttons when you hear crackles or wheezes
                      </p>
                      
                      {/* Recording Controls */}
                      <div className="space-y-3">
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <Play className="w-4 h-4" />
                            <span>Start Recording</span>
                          </button>
                        ) : (
                          <button
                            onClick={stopRecording}
                            className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <Pause className="w-4 h-4" />
                            <span>Stop Recording</span>
                          </button>
                        )}
                        
                        {/* Event Buttons */}
                        {isRecording && (
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={addCrackle}
                              className="py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                              Crackle
                            </button>
                            <button
                              onClick={addWheeze}
                              className="py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                            >
                              Wheeze
                            </button>
                          </div>
                        )}
                        
                        {/* Clear Button */}
                        {annotationEvents.length > 0 && (
                          <button
                            onClick={clearAnnotations}
                            className="w-full py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Events List */}
                    {annotationEvents.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-2">Recorded Events:</h5>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {annotationEvents.map((event, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className={`px-2 py-1 rounded text-white ${
                                event.type === 'crackle' ? 'bg-blue-500' : 'bg-purple-500'
                              }`}>
                                {event.type}
                              </span>
                              <span className="text-gray-600">
                                {event.timestamp.toFixed(1)}s
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Total: {annotationEvents.length} events
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Selected File */}
                {file && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gray-50 rounded-lg"
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
                  disabled={(selectedModel === 'disease' && !file) || (selectedModel === 'annotation' && annotationEvents.length === 0) || isUploading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 hover:shadow-lg transition-all duration-300"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>{selectedModel === 'disease' ? 'Analyze Audio' : 'Analyze Annotations'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Results */}
              <div className="space-y-6">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 border-l-4 border-red-500 bg-red-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-red-700">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {/* Prediction Results */}
                      <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                        <div className="flex items-center space-x-3 mb-4">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                          <h4 className="text-lg font-semibold text-gray-900">Analysis Results</h4>
                        </div>

                        <div className="space-y-4">
                          {/* Disease Prediction */}
                          <div className="p-4 bg-white rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-2">Predicted Disease</h5>
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
                              <h5 className="font-medium text-gray-900 mb-3">All Disease Probabilities</h5>
                              <div className="space-y-2">
                                {Object.entries(result.class_probabilities)
                                  .sort(([,a], [,b]) => b - a)
                                  .slice(0, 5)
                                  .map(([disease, probability]) => (
                                    <div key={disease} className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600">{disease}</span>
                                      <div className="flex items-center space-x-2">
                                        <div className="w-20 bg-gray-200 rounded-full h-2">
                                          <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
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
                        <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-4">Detected Events</h5>
                          
                          {/* Audio Player */}
                          <div className="mb-4 p-4 bg-white rounded-lg">
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={togglePlayPause}
                                className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                              >
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                              </button>
                              <div className="flex-1">
                                <div className="text-sm text-gray-600 mb-1">
                                  {file?.name}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 relative">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-100"
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
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How it works?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered system uses advanced machine learning to analyze respiratory sounds and provide accurate diagnoses
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Upload Audio",
                description: "Record or upload breathing sounds using our secure platform",
                icon: <Upload className="w-8 h-8" />
              },
              {
                step: "02", 
                title: "AI Analysis",
                description: "Our models extract 243+ audio features and analyze patterns",
                icon: <Brain className="w-8 h-8" />
              },
              {
                step: "03",
                title: "Disease Detection",
                description: "Advanced algorithms classify respiratory conditions with medical-grade precision",
                icon: <Target className="w-8 h-8" />
              },
              {
                step: "04",
                title: "Results & Insights",
                description: "Get detailed analysis with confidence scores and recommendations",
                icon: <Award className="w-8 h-8" />
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 relative">
                  {step.icon}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">FAQs</h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about RespireX
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-gray-600">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* AlertTriangle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-12 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg"
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Important Medical Disclaimer</h3>
                <p className="text-yellow-700">
                  RespireX is designed as a screening tool to assist healthcare professionals and should not be used as a substitute for professional medical diagnosis, treatment, or advice. Always consult with qualified medical professionals for proper diagnosis and treatment of respiratory conditions.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet the experts behind RespireX - combining AI innovation with medical expertise
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
                viewport={{ once: true }}
                className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden shadow-lg">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-lg text-blue-600 font-semibold mb-4">{member.role}</p>
                <p className="text-gray-600 leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <img src="/logo.png" alt="RespireX Logo" className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">RespireX</h3>
              </div>
              <p className="text-gray-400">
                AI-powered respiratory disease detection for better healthcare outcomes.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                {['home', 'why-choose', 'models', 'how-it-works', 'faq', 'team'].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item)}
                    className="block text-gray-400 hover:text-white transition-colors capitalize"
                  >
                    {item === 'faq' ? 'FAQs' : item === 'how-it-works' ? 'How it works?' : item === 'why-choose' ? 'Why RespireX?' : item.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400">
                <p>Email: respirexai@gmail.com</p>
                <p>Phone: +91 8465968724, +91 99824 62685</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 RespireX. All rights reserved. | Medical AI Research Platform</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
