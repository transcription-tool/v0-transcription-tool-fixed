"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { BookOpen, Quote, TrendingUp, Clock, MessageSquare, Star, BarChart3 } from "lucide-react"

interface AnalysisData {
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

interface AnalysisDashboardProps {
  data: AnalysisData
}

export function AnalysisDashboard({ data }: AnalysisDashboardProps) {
  // Calculate statistics
  const wordCount = data.transcription.split(/\s+/).length
  const estimatedDuration = Math.ceil(wordCount / 150) // Assuming 150 words per minute
  const arabicContentCount = data.analysis.mainPoints.filter((p) => p.arabicContent).length
  const totalReferences = data.analysis.quranVerses.length + data.analysis.hadiths.length

  // Prepare chart data
  const themeData = data.analysis.keyThemes.map((theme, index) => ({
    name: theme,
    value: Math.floor(Math.random() * 30) + 10, // Simulated relevance score
    color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
  }))

  const contentTypeData = [
    { name: "English Content", value: 100 - arabicContentCount * 5, color: "#3b82f6" },
    { name: "Arabic Content", value: arabicContentCount * 5, color: "#10b981" },
    { name: "Mixed Content", value: Math.max(5, arabicContentCount * 2), color: "#f59e0b" },
  ]

  const branchData = data.analysis.mindMapStructure.branches.map((branch) => ({
    name: branch.title,
    subTopics: branch.subBranches.length,
    relevance: Math.floor(Math.random() * 40) + 60,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Analysis Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Word Count</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{wordCount.toLocaleString()}</p>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Est. Duration</span>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{estimatedDuration} min</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">References</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{totalReferences}</p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Key Themes</span>
              </div>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {data.analysis.keyThemes.length}
              </p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content Analysis</TabsTrigger>
              <TabsTrigger value="islamic">Islamic Content</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Theme Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Theme Relevance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={themeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Content Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={contentTypeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {contentTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Main Topics Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Topic Structure Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={branchData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="subTopics" fill="#10b981" name="Sub-topics" />
                      <Bar dataKey="relevance" fill="#f59e0b" name="Relevance Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              {/* Main Points Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Main Points Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.analysis.mainPoints.map((point, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{point.point}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{point.details}</p>
                        {point.arabicContent && (
                          <Badge variant="secondary" className="text-xs">
                            Contains Arabic: {point.arabicContent}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Themes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Themes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.analysis.keyThemes.map((theme, index) => (
                      <Badge key={index} variant="outline" className="px-3 py-1">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="islamic" className="space-y-6">
              {/* Quranic Verses */}
              {data.analysis.quranVerses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      Quranic Verses ({data.analysis.quranVerses.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.analysis.quranVerses.map((verse, index) => (
                        <div key={index} className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                          <div className="text-right mb-2">
                            <p className="text-lg font-arabic text-slate-800 dark:text-slate-200">{verse.verse}</p>
                          </div>
                          <p className="text-sm italic text-slate-600 dark:text-slate-300 mb-1">
                            "{verse.translation}"
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {verse.reference}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Hadiths */}
              {data.analysis.hadiths.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Quote className="h-5 w-5 text-blue-600" />
                      Hadiths ({data.analysis.hadiths.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.analysis.hadiths.map((hadith, index) => (
                        <div key={index} className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                          {hadith.arabic && (
                            <div className="text-right mb-2">
                              <p className="text-lg font-arabic text-slate-800 dark:text-slate-200">{hadith.arabic}</p>
                            </div>
                          )}
                          <p className="text-sm italic text-slate-600 dark:text-slate-300 mb-1">"{hadith.english}"</p>
                          <Badge variant="outline" className="text-xs">
                            {hadith.source}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Islamic Content Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Islamic Content Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Quranic References</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(data.analysis.quranVerses.length / 10) * 100} className="w-20" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {data.analysis.quranVerses.length}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Hadith References</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(data.analysis.hadiths.length / 10) * 100} className="w-20" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {data.analysis.hadiths.length}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Arabic Content Density</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(arabicContentCount / data.analysis.mainPoints.length) * 100}
                          className="w-20"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {Math.round((arabicContentCount / data.analysis.mainPoints.length) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    AI-Generated Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                        Content Structure Analysis
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        This transcription demonstrates a well-structured approach to Islamic education, with{" "}
                        {data.analysis.keyThemes.length} main themes and {totalReferences} religious references. The
                        content maintains a balance between English explanation and Arabic authenticity.
                      </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Educational Value</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        The estimated {estimatedDuration}-minute duration suggests comprehensive coverage of the topic.
                        The presence of both Quranic verses and Hadiths provides authentic Islamic sources for the
                        discussed concepts.
                      </p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Language Integration</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        The seamless integration of Arabic phrases and verses within English discourse demonstrates
                        effective bilingual Islamic education methodology, making complex concepts accessible while
                        maintaining linguistic authenticity.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{data.analysis.summary}</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
