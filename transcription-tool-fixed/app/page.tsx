import { AudioUploader } from "@/components/audio-uploader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TranscriptionTool() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 text-balance">
            AI Transcription & Analysis Tool
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-pretty">
            Advanced speech-to-text for mixed English-Arabic audio with intelligent analysis and mind-mapping
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Section */}
          <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">Upload Audio File</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Upload MP3 or MP4 files up to 2GB. Optimized for mixed English-Arabic content including Quranic verses
                and hadiths.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AudioUploader />
            </CardContent>
          </Card>

          {/* Features Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">AI Transcription</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Advanced speech recognition optimized for mixed English-Arabic content with high accuracy.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Mind Mapping</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Automatic generation of visual mind maps showing topic relationships and key concepts.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Document Export</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Export summaries and analysis in DOCX and PDF formats with proper Arabic text support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
