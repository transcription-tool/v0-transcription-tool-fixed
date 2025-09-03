"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Clock, Search, Filter, Copy, Check } from "lucide-react"

interface QASession {
  question: string
  answer: string
  timestamp: string
  category: string
}

interface QADisplayProps {
  qaSessions: QASession[]
  className?: string
}

export function QADisplay({ qaSessions, className }: QADisplayProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(qaSessions.map((qa) => qa.category)))]

  // Filter Q&A sessions
  const filteredSessions = qaSessions.filter((qa) => {
    const matchesSearch =
      qa.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qa.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || qa.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  const formatArabicText = (text: string) => {
    // Split text and format Arabic parts
    const parts = text.split(/(\s+[\u0600-\u06FF\s]+\s+)/)

    return parts.map((part, index) => {
      const hasArabic = /[\u0600-\u06FF]/.test(part)

      if (hasArabic) {
        return (
          <span
            key={index}
            className="font-arabic text-emerald-700 dark:text-emerald-300 mx-1 font-medium"
            dir="rtl"
            style={{ fontFamily: 'Amiri, "Times New Roman", serif' }}
          >
            {part.trim()}
          </span>
        )
      }

      return <span key={index}>{part}</span>
    })
  }

  if (qaSessions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Q&A Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No Q&A sessions found in this transcription.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Q&A Sessions
            <Badge variant="secondary">{qaSessions.length} questions</Badge>
          </CardTitle>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search questions and answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 max-h-96 overflow-y-auto">
        {filteredSessions.map((qa, index) => (
          <div key={index} className="border-l-4 border-blue-200 dark:border-blue-800 pl-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {qa.timestamp}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {qa.category}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(`Q: ${qa.question}\n\nA: ${qa.answer}`, index)}
                className="h-8 w-8 p-0"
              >
                {copiedIndex === index ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* Question */}
            <div className="mb-3">
              <div className="flex items-start gap-2 mb-2">
                <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                  Q
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                    {formatArabicText(qa.question)}
                  </p>
                </div>
              </div>
            </div>

            {/* Answer */}
            <div>
              <div className="flex items-start gap-2">
                <div className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-1 rounded text-xs font-medium">
                  A
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {qa.answer.split("\n").map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-2 last:mb-0">
                        {formatArabicText(paragraph)}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredSessions.length === 0 && (searchTerm || selectedCategory !== "all") && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No Q&A sessions match your search criteria.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
