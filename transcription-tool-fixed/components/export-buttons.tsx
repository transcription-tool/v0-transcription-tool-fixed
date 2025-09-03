"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, File, Presentation, Loader2, ImageIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ExportData {
  transcription: string
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

interface ExportButtonsProps {
  data: ExportData
}

export function ExportButtons({ data }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<"summary-docx" | "analysis-docx" | "pptx" | "pure-transcript" | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (format: "summary-docx" | "analysis-docx" | "pptx" | "pure-transcript") => {
    setIsExporting(format)
    setError(null)

    try {
      console.log("[v0] Starting export in format:", format)

      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format,
          data,
        }),
      })

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`)
      }

      // Get the blob and create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url

      const filenames = {
        "summary-docx": "lecture-summary.docx",
        "analysis-docx": "transcription-analysis.docx",
        pptx: "lecture-presentation.pptx",
        "pure-transcript": "pure-transcript.docx",
      }
      link.download = filenames[format]

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log("[v0] Export completed successfully")
    } catch (err) {
      console.error("[v0] Export error:", err)
      setError(err instanceof Error ? err.message : "Export failed")
    } finally {
      setIsExporting(null)
    }
  }

  const handleMindMapPNG = () => {
    const mindMapElement = document.querySelector("[data-mindmap-container]") as HTMLElement
    if (!mindMapElement) {
      setError("Mind map not found. Please ensure the mind map is visible.")
      return
    }

    // Use html2canvas to capture the mind map
    import("html2canvas")
      .then((html2canvas) => {
        html2canvas
          .default(mindMapElement, {
            backgroundColor: "#ffffff",
            scale: 2,
            useCORS: true,
            allowTaint: true,
          })
          .then((canvas) => {
            const link = document.createElement("a")
            link.download = "mind-map.png"
            link.href = canvas.toDataURL()
            link.click()
          })
          .catch((err) => {
            console.error("[v0] Mind map PNG export error:", err)
            setError("Failed to export mind map as PNG")
          })
      })
      .catch((err) => {
        console.error("[v0] html2canvas import error:", err)
        setError("Failed to load PNG export library")
      })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Summary DOCX Export */}
            <Button
              onClick={() => handleExport("summary-docx")}
              disabled={isExporting !== null}
              className="flex items-center gap-2 h-12"
              variant="outline"
            >
              {isExporting === "summary-docx" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {isExporting === "summary-docx" ? "Generating..." : "Summary DOCX"}
            </Button>

            {/* Analysis DOCX Export */}
            <Button
              onClick={() => handleExport("analysis-docx")}
              disabled={isExporting !== null}
              className="flex items-center gap-2 h-12"
              variant="outline"
            >
              {isExporting === "analysis-docx" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <File className="h-4 w-4" />
              )}
              {isExporting === "analysis-docx" ? "Generating..." : "Analysis DOCX"}
            </Button>

            <Button
              onClick={() => handleExport("pure-transcript")}
              disabled={isExporting !== null}
              className="flex items-center gap-2 h-12"
              variant="outline"
            >
              {isExporting === "pure-transcript" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {isExporting === "pure-transcript" ? "Generating..." : "Pure Transcript"}
            </Button>

            {/* PowerPoint Export */}
            <Button
              onClick={() => handleExport("pptx")}
              disabled={isExporting !== null}
              className="flex items-center gap-2 h-12"
              variant="outline"
            >
              {isExporting === "pptx" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Presentation className="h-4 w-4" />
              )}
              {isExporting === "pptx" ? "Generating..." : "PowerPoint"}
            </Button>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Visual Exports</h4>
            <Button
              onClick={handleMindMapPNG}
              disabled={isExporting !== null}
              className="flex items-center gap-2 h-12 bg-transparent"
              variant="outline"
            >
              <ImageIcon className="h-4 w-4" />
              Download Mind Map (PNG)
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p>
              • <strong>Summary DOCX:</strong> Organized lecture summary with centered headers, timestamps, and bullet
              points
            </p>
            <p>
              • <strong>Analysis DOCX:</strong> Detailed transcription analysis with Islamic content and references
            </p>
            <p>
              • <strong>Pure Transcript:</strong> Raw transcript with only transliterated Arabic (no Arabic text)
            </p>
            <p>
              • <strong>PowerPoint:</strong> Professional presentation with 12+ slides, proper formatting, and Q&A
              sections
            </p>
            <p>
              • <strong>Mind Map PNG:</strong> High-quality image of the flowchart-style mind map
            </p>
            <p>• All DOCX formats include proper Arabic text formatting and can be easily converted to PDF</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
