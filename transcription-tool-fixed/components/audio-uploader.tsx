"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { MindMap } from "./mind-map"
import { ExportButtons } from "./export-buttons"
import { AnalysisDashboard } from "./analysis-dashboard"
import { TranscriptDisplay } from "./transcript-display"
import { QADisplay } from "./qa-display"

interface UploadedFile {
  file: File
  progress: number
  status: "uploading" | "completed" | "error"
  id: string
}

interface TranscriptionResult {
  transcription: string
  duration: number
  wordCount: number
  analysis: {
    mainTopic: string
    keyThemes: string[]
    mainPoints: Array<{
      point: string
      details: string
      arabicContent: string | null
    }>
    quranVerses: Array<{
      verse: string
      translation: string
      reference: string
    }>
    hadiths: Array<{
      arabic?: string
      english: string
      source: string
    }>
    qaSessions?: Array<{
      question: string
      answer: string
      timestamp: string
      category: string
    }>
    summary: string
    mindMapStructure: {
      centralTopic: string
      branches: Array<{
        title: string
        subBranches: string[]
      }>
    }
  }
}

export function AudioUploader() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
      id: Math.random().toString(36).substr(2, 9),
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])
    setError(null)

    // Simulate upload progress
    newFiles.forEach((uploadedFile) => {
      simulateUpload(uploadedFile.id)
    })
  }, [])

  const simulateUpload = (fileId: string) => {
    const interval = setInterval(() => {
      setUploadedFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId) {
            const newProgress = Math.min(file.progress + Math.random() * 20, 100)
            const newStatus = newProgress === 100 ? "completed" : "uploading"
            return { ...file, progress: newProgress, status: newStatus }
          }
          return file
        }),
      )
    }, 500)

    setTimeout(() => {
      clearInterval(interval)
      setUploadedFiles((prev) =>
        prev.map((file) => (file.id === fileId ? { ...file, progress: 100, status: "completed" } : file)),
      )
    }, 3000)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const startTranscription = async () => {
    const completedFiles = uploadedFiles.filter((file) => file.status === "completed")
    if (completedFiles.length === 0) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("audio", completedFiles[0].file)

      console.log("[v0] Starting transcription for file:", completedFiles[0].file.name)

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("[v0] Transcription completed:", result)

      if (result.success) {
        setTranscriptionResult(result)
      } else {
        throw new Error(result.error || "Transcription failed")
      }
    } catch (err) {
      console.error("[v0] Transcription error:", err)
      setError(err instanceof Error ? err.message : "Failed to transcribe audio")
    } finally {
      setIsProcessing(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
      "video/*": [".mp4", ".mov"],
    },
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    multiple: true,
  })

  const completedFiles = uploadedFiles.filter((file) => file.status === "completed")
  const hasCompletedFiles = completedFiles.length > 0

  if (transcriptionResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Transcription Complete</h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
              <span>Duration: {transcriptionResult.duration} minutes</span>
              <span>•</span>
              <span>Words: {transcriptionResult.wordCount.toLocaleString()}</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setTranscriptionResult(null)
              setUploadedFiles([])
            }}
          >
            New Transcription
          </Button>
        </div>

        <AnalysisDashboard data={transcriptionResult} />

        <TranscriptDisplay transcription={transcriptionResult.transcription} className="mb-6" />

        {transcriptionResult.analysis.qaSessions && transcriptionResult.analysis.qaSessions.length > 0 && (
          <QADisplay qaSessions={transcriptionResult.analysis.qaSessions} className="mb-6" />
        )}

        <MindMap data={transcriptionResult.analysis.mindMapStructure} className="mb-6" />

        <ExportButtons data={transcriptionResult} />

        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Summary</h4>
          <p className="text-sm text-slate-600 dark:text-slate-300">{transcriptionResult.analysis.summary}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
          {isDragActive ? "Drop files here..." : "Drag & drop audio files here"}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Supports MP3, MP4, WAV, M4A files up to 2GB each
        </p>
        <Button variant="outline" className="mt-2 bg-transparent">
          Browse Files
        </Button>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-slate-900 dark:text-slate-100">Uploaded Files</h3>
          {uploadedFiles.map((uploadedFile) => (
            <div key={uploadedFile.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <File className="h-5 w-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(uploadedFile.file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
                {uploadedFile.status === "uploading" && <Progress value={uploadedFile.progress} className="mt-2 h-1" />}
              </div>
              <div className="flex items-center gap-2">
                {uploadedFile.status === "completed" && <CheckCircle className="h-5 w-5 text-green-500" />}
                {uploadedFile.status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                <Button variant="ghost" size="sm" onClick={() => removeFile(uploadedFile.id)} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {hasCompletedFiles && (
        <div className="flex gap-3">
          <Button onClick={startTranscription} disabled={isProcessing} className="flex-1">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Start Transcription (${completedFiles.length} file${completedFiles.length > 1 ? "s" : ""})`
            )}
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          For best results with mixed English-Arabic content, ensure clear audio quality. The AI is optimized to
          recognize Quranic verses, hadiths, and Arabic phrases within English speech.
        </AlertDescription>
      </Alert>
    </div>
  )
}
