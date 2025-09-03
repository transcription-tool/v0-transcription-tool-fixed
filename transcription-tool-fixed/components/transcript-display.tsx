"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Search, Copy, Check } from "lucide-react"
import { Input } from "@/components/ui/input"

interface TranscriptDisplayProps {
  transcription: string
  className?: string
}

interface TranscriptSection {
  timestamp: string
  title: string
  content: string
}

export function TranscriptDisplay({ transcription, className }: TranscriptDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  // Parse the transcript into sections
  const parseTranscript = (text: string): TranscriptSection[] => {
    const sections = text
      .split("---")
      .map((section) => section.trim())
      .filter(Boolean)

    return sections.map((section) => {
      const lines = section.split("\n").filter((line) => line.trim())
      const firstLine = lines[0] || ""

      // Extract timestamp and title from first line like "[00:00] Introduction"
      const timestampMatch = firstLine.match(/\[(\d{2}:\d{2})\]\s*(.+)/)

      if (timestampMatch) {
        return {
          timestamp: timestampMatch[1],
          title: timestampMatch[2],
          content: lines.slice(1).join("\n").trim(),
        }
      }

      return {
        timestamp: "00:00",
        title: "Content",
        content: section,
      }
    })
  }

  const sections = parseTranscript(transcription)

  // Filter sections based on search term
  const filteredSections = sections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.content.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const copyToClipboard = async (text: string, sectionId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSection(sectionId)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  // Format Arabic text with proper styling
  const formatContent = (content: string) => {
    // Split content by lines and format each line
    return content.split("\n").map((line, index) => {
      // Check if line contains Arabic text (basic Arabic Unicode range)
      const hasArabic = /[\u0600-\u06FF]/.test(line)

      if (hasArabic) {
        // Split line into Arabic and non-Arabic parts
        const parts = line.split(/(\s+[\u0600-\u06FF\s]+\s+)/)

        return (
          <p key={index} className="mb-2 leading-relaxed">
            {parts.map((part, partIndex) => {
              const isArabicPart = /[\u0600-\u06FF]/.test(part)

              if (isArabicPart) {
                return (
                  <span
                    key={partIndex}
                    className="font-arabic text-lg font-medium text-emerald-700 dark:text-emerald-300 mx-1"
                    dir="rtl"
                    style={{ fontFamily: 'Amiri, "Times New Roman", serif' }}
                  >
                    {part.trim()}
                  </span>
                )
              }

              // Check if it's a transliteration (usually in italics or parentheses)
              if (part.includes("(") && part.includes(")")) {
                return (
                  <span key={partIndex} className="italic text-slate-600 dark:text-slate-400 text-sm">
                    {part}
                  </span>
                )
              }

              return <span key={partIndex}>{part}</span>
            })}
          </p>
        )
      }

      // Regular English content
      return (
        <p key={index} className="mb-2 leading-relaxed text-slate-700 dark:text-slate-300">
          {line}
        </p>
      )
    })
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timestamped Transcript
            </CardTitle>
            <Badge variant="secondary">{sections.length} sections</Badge>
          </div>

          {/* Search functionality */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search transcript..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6 max-h-96 overflow-y-auto">
          {filteredSections.map((section, index) => (
            <div key={index} className="border-l-4 border-blue-200 dark:border-blue-800 pl-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {section.timestamp}
                  </Badge>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">{section.title}</h4>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(`[${section.timestamp}] ${section.title}\n\n${section.content}`, `section-${index}`)
                  }
                  className="h-8 w-8 p-0"
                >
                  {copiedSection === `section-${index}` ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="text-sm">{formatContent(section.content)}</div>
            </div>
          ))}

          {filteredSections.length === 0 && searchTerm && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No sections found matching "{searchTerm}"
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
