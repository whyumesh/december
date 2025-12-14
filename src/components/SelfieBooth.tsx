'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, X, Download, RefreshCw, Check, AlertCircle, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import Link from 'next/link'

interface SelfieBoothProps {
  onClose?: () => void
}

const TEMPLATES = [
  { id: 1, path: '/SELFIE BOOTH/ELECTKMS1.jpeg', name: 'Frame 1' },
  { id: 2, path: '/SELFIE BOOTH/ELECTKMS2.jpeg', name: 'Frame 2' },
  { id: 3, path: '/SELFIE BOOTH/ELECTKMS3.jpeg', name: 'Frame 3' },
  { id: 4, path: '/SELFIE BOOTH/ELECTKMS4.jpeg', name: 'Frame 4' },
]

export default function SelfieBooth({ onClose }: SelfieBoothProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const templateCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  // Start camera immediately
  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })
      
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Unable to access camera. Please allow camera permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      setIsCapturing(false)
      return
    }

    // Capture as 1:1 square (use the smaller dimension)
    const size = Math.min(video.videoWidth, video.videoHeight)
    canvas.width = size
    canvas.height = size

    // Calculate crop position to center the square
    const x = (video.videoWidth - size) / 2
    const y = (video.videoHeight - size) / 2

    // Draw square crop from video to canvas
    ctx.drawImage(video, x, y, size, size, 0, 0, size, size)
    
    // Get captured image data (1:1 square)
    const imageData = canvas.toDataURL('image/png')
    setCapturedImage(imageData)
    
    // Stop camera after capture
    stopCamera()
    setIsCapturing(false)
  }

  const downloadSelfie = async () => {
    if (!capturedImage || !selectedTemplate || !templateCanvasRef.current) return

    const templateCanvas = templateCanvasRef.current
    const ctx = templateCanvas.getContext('2d')
    
    if (!ctx) return

    // Load template image from file
    const templateImg = new Image()
    templateImg.crossOrigin = 'anonymous'
    
    templateImg.onload = () => {
      // Set canvas size to template size
      templateCanvas.width = templateImg.width
      templateCanvas.height = templateImg.height

      // Draw template as background
      ctx.drawImage(templateImg, 0, 0)

      // Load captured selfie (1:1 square)
      const selfieImg = new Image()
      selfieImg.onload = () => {
        // Calculate size and position for selfie overlay
        // Make selfie fit nicely in the center of the frame
        // Use 65% of the smaller dimension to ensure it fits well in the circular area (enlarged)
        const selfieSize = Math.min(templateImg.width * 0.65, templateImg.height * 0.65)
        const x = (templateImg.width - selfieSize) / 2
        const y = (templateImg.height - selfieSize) / 2

        // Create circular clipping path for the selfie
        const centerX = templateImg.width / 2
        const centerY = templateImg.height / 2
        
        ctx.save()
        ctx.beginPath()
        ctx.arc(
          centerX,
          centerY,
          selfieSize / 2,
          0,
          Math.PI * 2
        )
        ctx.clip()

        // Draw selfie on template (mirror it back to normal orientation)
        // Create a temporary canvas to handle the mirroring
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = selfieSize
        tempCanvas.height = selfieSize
        const tempCtx = tempCanvas.getContext('2d')
        
        if (tempCtx) {
          // Mirror the image horizontally on temp canvas
          tempCtx.translate(selfieSize, 0)
          tempCtx.scale(-1, 1)
          tempCtx.drawImage(selfieImg, 0, 0, selfieSize, selfieSize)
          
          // Draw the mirrored image onto the template at the correct position
          ctx.drawImage(tempCanvas, x, y, selfieSize, selfieSize)
        } else {
          // Fallback: use transform directly
          ctx.save()
          ctx.translate(centerX + selfieSize / 2, centerY - selfieSize / 2)
          ctx.scale(-1, 1)
          ctx.drawImage(selfieImg, 0, 0, selfieSize, selfieSize)
          ctx.restore()
        }
        
        ctx.restore()

        // Convert to blob and download
        templateCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `election-selfie-${Date.now()}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }
        }, 'image/png')
      }
      selfieImg.src = capturedImage
    }
    
    templateImg.src = TEMPLATES.find(t => t.id === selectedTemplate)!.path
  }

  const resetCapture = () => {
    setCapturedImage(null)
    // Keep the selected template and camera running
    if (!stream) {
      startCamera()
    }
  }

  const handleClose = () => {
    stopCamera()
    if (onClose) {
      onClose()
    }
  }

  // Main selfie booth screen - camera with frame selection
  if (!capturedImage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        {/* Header/Navbar */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-4 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                <Logo size="sm" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 truncate">SKMMMS Election 2026</h1>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 font-bold line-clamp-2">Election Commission : Shree Panvel Kutchi Maheshwari Mahajan</p>
                </div>
              </div>
              <Link href="/voter/dashboard" className="w-full sm:w-auto mt-2 sm:mt-0">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4">
                  <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
        <Card className="max-w-5xl w-full bg-white shadow-2xl">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Election Selfie Booth
                </h2>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Choose a frame and capture your moment!</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="hover:bg-gray-100 flex-shrink-0">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {error && (
              <div className="bg-red-500 text-white p-3 rounded-lg mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            {/* Camera Preview Section */}
            <div className="relative mb-4 sm:mb-6">
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
                {/* Video preview with template overlay if selected */}
                {selectedTemplate ? (
                  <div className="relative w-full max-w-md mx-auto" style={{ aspectRatio: '3/4' }}>
                    {/* Template image - behind the camera */}
                    <img
                      src={TEMPLATES.find(t => t.id === selectedTemplate)!.path}
                      alt="Template"
                      className="w-full h-full object-contain absolute inset-0 z-0"
                    />
                    {/* Resonating circles - animated pulsing rings */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                      {/* Outer resonating ring 1 */}
                      <div className="absolute w-[65%] aspect-square rounded-full border-2 border-blue-400/30 animate-pulse" 
                           style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                      {/* Outer resonating ring 2 */}
                      <div className="absolute w-[70%] aspect-square rounded-full border-2 border-purple-400/20 animate-pulse"
                           style={{ animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '0.5s' }}></div>
                      {/* Outer resonating ring 3 */}
                      <div className="absolute w-[75%] aspect-square rounded-full border-2 border-pink-400/15 animate-pulse"
                           style={{ animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '1s' }}></div>
                    </div>
                    {/* Live video preview in circular center area - enlarged - above template */}
                    <div className="absolute inset-0 z-30 flex items-center justify-center">
                      {/* Resonating border rings around camera */}
                      <div className="absolute w-[65%] aspect-square rounded-full border-4 border-white/60 animate-ping"
                           style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                      <div className="absolute w-[65%] aspect-square rounded-full border-2 border-blue-300/40 animate-ping"
                           style={{ animation: 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite', animationDelay: '0.3s' }}></div>
                      
                      {/* Main camera frame - enlarged to 65% */}
                      <div className="relative w-[65%] aspect-square rounded-full overflow-hidden border-4 border-white/80 shadow-2xl bg-black ring-4 ring-blue-500/30">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                          style={{ transform: 'scaleX(-1)' }} // Mirror effect
                        />
                        {!stream && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80">
                            <div className="text-center text-white">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                              <p className="text-xs">Starting camera...</p>
                            </div>
                          </div>
                        )}
                        {/* Inner glow effect */}
                        <div className="absolute inset-0 rounded-full ring-2 ring-white/20 pointer-events-none"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Full video preview when no frame selected */
                  <div className="w-full max-w-md mx-auto" style={{ aspectRatio: '1/1' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-2xl"
                      style={{ transform: 'scaleX(-1)' }} // Mirror effect
                    />
                    {!stream && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl">
                        <div className="text-center text-white">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                          <p>Starting camera...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Frame Selection Section */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 text-center">Choose Your Frame</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`relative group border-2 sm:border-4 rounded-lg sm:rounded-xl overflow-hidden transition-all transform hover:scale-105 ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 shadow-lg shadow-blue-500/50 ring-2 sm:ring-4 ring-blue-200'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="aspect-[3/4] relative bg-gray-100">
                      <img
                        src={template.path}
                        alt={template.name}
                        className="w-full h-full object-contain"
                      />
                      {selectedTemplate === template.id && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="bg-blue-500 rounded-full p-1.5 sm:p-2">
                            <Check className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] sm:text-xs py-0.5 sm:py-1 text-center">
                      {template.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Capture Button */}
            <div className="flex justify-center">
              <Button
                onClick={capturePhoto}
                disabled={!stream || isCapturing || !selectedTemplate}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-12 py-4 sm:py-6 rounded-full text-base sm:text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {isCapturing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                    <span className="text-sm sm:text-base">Capturing...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    <span className="text-sm sm:text-base">Capture Selfie</span>
                  </>
                )}
              </Button>
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
          </CardContent>
        </Card>
        </div>

        {/* Footer */}
        <Footer language={"english" as any} />
      </div>
    )
  }

  // Preview and download screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Logo size="sm" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">SKMMMS Election 2026</h1>
                <p className="text-xs text-gray-600 mt-0.5 font-bold">Election Commission : Shree Panvel Kutchi Maheshwari Mahajan</p>
              </div>
            </div>
            <Link href="/voter/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
      <Card className="max-w-3xl w-full bg-white shadow-2xl">
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Your Selfie is Ready! 🎉
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">Review and download your election selfie</p>
            </div>
            <Button variant="ghost" size="icon" onClick={resetCapture} className="hover:bg-gray-100 flex-shrink-0">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Preview with template */}
          <div className="relative mb-4 sm:mb-6 bg-gray-100 rounded-xl sm:rounded-2xl p-2 sm:p-4">
            <div className="relative mx-auto" style={{ width: '100%', maxWidth: '400px', aspectRatio: '3/4' }}>
              {/* Template image - behind everything */}
              <img
                src={TEMPLATES.find(t => t.id === selectedTemplate)!.path}
                alt="Template"
                className="w-full h-full object-contain absolute inset-0 z-0"
                onError={(e) => {
                  console.error('Template image failed to load:', TEMPLATES.find(t => t.id === selectedTemplate)!.path)
                }}
              />
              {/* Resonating elements for preview */}
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="absolute w-[70%] aspect-square rounded-full border-2 border-blue-400/20 animate-pulse"></div>
                <div className="absolute w-[75%] aspect-square rounded-full border-2 border-purple-400/15 animate-pulse"
                     style={{ animationDelay: '0.5s' }}></div>
              </div>
              {/* Selfie preview in circular center area - enlarged - above template */}
              {capturedImage && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="w-[65%] aspect-square rounded-full overflow-hidden border-4 border-white/70 shadow-2xl ring-4 ring-blue-500/30 bg-black">
                    <img
                      src={capturedImage}
                      alt="Captured selfie"
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }} // Mirror effect for preview
                      onError={(e) => {
                        console.error('Captured image failed to load')
                      }}
                    />
                    {/* Inner glow */}
                    <div className="absolute inset-0 rounded-full ring-2 ring-white/20 pointer-events-none"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
            <Button
              onClick={resetCapture}
              variant="outline"
              size="lg"
              className="px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto text-sm sm:text-base"
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Retake
            </Button>
            <Button
              onClick={downloadSelfie}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-4 sm:py-6 shadow-lg w-full sm:w-auto text-sm sm:text-base"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Download Selfie
            </Button>
            <Link href="/voter/dashboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto text-sm sm:text-base"
              >
                <Home className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Hidden canvas for final composition */}
          <canvas ref={templateCanvasRef} className="hidden" />
        </CardContent>
      </Card>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

