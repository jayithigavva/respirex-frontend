import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('disease');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const modelOptions = [
    { value: 'disease', label: 'Disease Classifier', endpoint: '/predict_disease' },
    { value: 'event', label: 'Event Detector', endpoint: '/predict_event' }
  ];

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError(null);
    }
  };

  const handlePredict = async () => {
    if (!selectedFile) {
      setError('Please select an audio file first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const selectedModelConfig = modelOptions.find(option => option.value === selectedModel);
      const response = await axios.post(
        `${API_BASE_URL}${selectedModelConfig.endpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred while processing the audio file');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-primary-800 mb-4">
            🫁 Respirex
          </h1>
          <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
            Advanced Respiratory Disease Detection from Audio Analysis
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card mb-8"
        >
          <div className="space-y-6">
            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Upload Audio File
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="input-field"
                />
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-2 p-3 bg-primary-50 rounded-lg border border-primary-200"
                  >
                    <p className="text-sm text-primary-700">
                      📁 Selected: <span className="font-medium">{selectedFile.name}</span>
                    </p>
                    <p className="text-xs text-primary-600">
                      Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Select AI Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="select-field"
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePredict}
                disabled={isLoading || !selectedFile}
                className={`btn-primary flex-1 ${
                  isLoading || !selectedFile
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  '🔬 Upload & Predict'
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetForm}
                className="btn-secondary"
              >
                Reset
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="card mb-8"
            >
              <h2 className="text-2xl font-bold text-primary-800 mb-4">
                🎯 Prediction Results
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-600 mb-1">
                      Model Type
                    </label>
                    <p className="text-lg font-semibold text-primary-700">
                      {result.model_type}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-600 mb-1">
                      Prediction
                    </label>
                    <p className="text-xl font-bold text-secondary-800">
                      {result.prediction}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-600 mb-1">
                      Confidence Score
                    </label>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-secondary-200 rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence * 100}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full"
                        />
                      </div>
                      <span className="text-lg font-bold text-primary-700">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-600 mb-1">
                      Features Extracted
                    </label>
                    <p className="text-lg font-semibold text-secondary-700">
                      {result.features_extracted} MFCC coefficients
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Section */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="card border-l-4 border-red-500 bg-red-50"
            >
              <div className="flex items-center">
                <div className="text-red-500 text-xl mr-3">⚠️</div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="card bg-gradient-to-r from-primary-50 to-secondary-50"
        >
          <h3 className="text-lg font-semibold text-primary-800 mb-3">
            ℹ️ How it works
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-secondary-700">
            <div>
              <h4 className="font-semibold text-primary-700 mb-2">Disease Classifier</h4>
              <p>Analyzes respiratory audio to detect diseases like Asthma, COPD, Pneumonia, and Bronchitis.</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-700 mb-2">Event Detector</h4>
              <p>Identifies specific respiratory events including Crackles, Wheezes, Rhonchi, and Stridor.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default App;
