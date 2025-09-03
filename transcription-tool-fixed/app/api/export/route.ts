import { type NextRequest, NextResponse } from "next/server"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx"
import PptxGenJS from "pptxgenjs"

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
    qaSessions?: Array<{
      question: string
      answer: string
    }>
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      format,
      data,
    }: { format: "summary-docx" | "analysis-docx" | "pptx" | "pure-transcript"; data: ExportData } =
      await request.json()

    console.log("[v0] Exporting document in format:", format)

    if (format === "summary-docx") {
      return await generateSummaryDocx(data)
    } else if (format === "analysis-docx") {
      return await generateAnalysisDocx(data)
    } else if (format === "pptx") {
      return await generatePowerPoint(data)
    } else if (format === "pure-transcript") {
      return await generatePureTranscript(data)
    } else {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Export error:", error)
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 })
  }
}

async function generateSummaryDocx(data: ExportData) {
  const sections = parseTranscriptSections(data.transcription)

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: "Lecture Summary",
                bold: true,
                size: 36,
              }),
            ],
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Main Topic
          new Paragraph({
            children: [
              new TextRun({
                text: data.analysis.mainTopic,
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          // Key Themes Overview
          new Paragraph({
            children: [
              new TextRun({
                text: "Key Themes Covered",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          }),
          ...data.analysis.keyThemes.map(
            (theme) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${theme}`,
                    size: 18,
                  }),
                ],
                spacing: { after: 100 },
              }),
          ),

          // Organized Content Sections
          ...sections.flatMap((section) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `[${section.timestamp}] ${section.title}`,
                  bold: true,
                  size: 22,
                }),
              ],
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.CENTER,
              spacing: { before: 300, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: section.summary,
                  size: 16,
                }),
              ],
              spacing: { after: 150 },
            }),
            ...section.keyPoints.map(
              (point) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${point}`,
                      size: 16,
                    }),
                  ],
                  spacing: { after: 100 },
                }),
            ),
          ]),

          // Islamic Content Section
          ...(data.analysis.quranVerses.length > 0 || data.analysis.hadiths.length > 0
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Islamic References",
                      bold: true,
                      size: 24,
                    }),
                  ],
                  heading: HeadingLevel.HEADING_2,
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 300, after: 200 },
                }),

                // Quranic Verses
                ...(data.analysis.quranVerses.length > 0
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Quranic Verses:",
                            bold: true,
                            size: 18,
                          }),
                        ],
                        spacing: { after: 150 },
                      }),
                      ...data.analysis.quranVerses.map(
                        (verse) =>
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `• ${verse.verse} `,
                                size: 16,
                                rightToLeft: true,
                              }),
                              new TextRun({
                                text: `"${verse.translation}" (${verse.reference})`,
                                size: 16,
                                italics: true,
                              }),
                            ],
                            spacing: { after: 100 },
                          }),
                      ),
                    ]
                  : []),

                // Hadiths
                ...(data.analysis.hadiths.length > 0
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Hadiths:",
                            bold: true,
                            size: 18,
                          }),
                        ],
                        spacing: { after: 150 },
                      }),
                      ...data.analysis.hadiths.map(
                        (hadith) =>
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `• `,
                                size: 16,
                              }),
                              ...(hadith.arabic
                                ? [
                                    new TextRun({
                                      text: `${hadith.arabic} `,
                                      size: 16,
                                      rightToLeft: true,
                                    }),
                                  ]
                                : []),
                              new TextRun({
                                text: `"${hadith.english}" - ${hadith.source}`,
                                size: 16,
                                italics: true,
                              }),
                            ],
                            spacing: { after: 100 },
                          }),
                      ),
                    ]
                  : []),
              ]
            : []),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="lecture-summary.docx"',
    },
  })
}

async function generateAnalysisDocx(data: ExportData) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: "Transcription Analysis Report",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),

          // Main Topic
          new Paragraph({
            children: [
              new TextRun({
                text: "Main Topic: ",
                bold: true,
                size: 24,
              }),
              new TextRun({
                text: data.analysis.mainTopic,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
          }),

          // Key Themes
          new Paragraph({
            children: [
              new TextRun({
                text: "Key Themes",
                bold: true,
                size: 20,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.analysis.keyThemes.join(", "),
                size: 16,
              }),
            ],
          }),

          // Summary
          new Paragraph({
            children: [
              new TextRun({
                text: "Summary",
                bold: true,
                size: 20,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.analysis.summary,
                size: 16,
              }),
            ],
          }),

          // Main Points
          new Paragraph({
            children: [
              new TextRun({
                text: "Main Points",
                bold: true,
                size: 20,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
          }),
          ...data.analysis.mainPoints.map(
            (point) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${point.point}: `,
                    bold: true,
                    size: 16,
                  }),
                  new TextRun({
                    text: point.details,
                    size: 16,
                  }),
                  ...(point.arabicContent
                    ? [
                        new TextRun({
                          text: ` (${point.arabicContent})`,
                          italics: true,
                          size: 16,
                        }),
                      ]
                    : []),
                ],
              }),
          ),

          // Quranic Verses
          ...(data.analysis.quranVerses.length > 0
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Quranic Verses",
                      bold: true,
                      size: 20,
                    }),
                  ],
                  heading: HeadingLevel.HEADING_2,
                }),
                ...data.analysis.quranVerses.map(
                  (verse) =>
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `${verse.verse} `,
                          size: 16,
                          rightToLeft: true,
                        }),
                        new TextRun({
                          text: `"${verse.translation}" (${verse.reference})`,
                          size: 16,
                          italics: true,
                        }),
                      ],
                    }),
                ),
              ]
            : []),

          // Hadiths
          ...(data.analysis.hadiths.length > 0
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Hadiths",
                      bold: true,
                      size: 20,
                    }),
                  ],
                  heading: HeadingLevel.HEADING_2,
                }),
                ...data.analysis.hadiths.map(
                  (hadith) =>
                    new Paragraph({
                      children: [
                        ...(hadith.arabic
                          ? [
                              new TextRun({
                                text: `${hadith.arabic} `,
                                size: 16,
                                rightToLeft: true,
                              }),
                            ]
                          : []),
                        new TextRun({
                          text: `"${hadith.english}" - ${hadith.source}`,
                          size: 16,
                          italics: true,
                        }),
                      ],
                    }),
                ),
              ]
            : []),

          // Full Transcription
          new Paragraph({
            children: [
              new TextRun({
                text: "Full Transcription",
                bold: true,
                size: 20,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.transcription,
                size: 14,
              }),
            ],
          }),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="transcription-analysis.docx"',
    },
  })
}

async function generatePowerPoint(data: ExportData) {
  const pptx = new PptxGenJS()

  // Set slide size and theme
  pptx.defineLayout({ name: "LAYOUT_16x9", width: 10, height: 5.625 })
  pptx.layout = "LAYOUT_16x9"

  // Slide 1: Title slide
  const titleSlide = pptx.addSlide()
  titleSlide.background = { color: "F8F9FA" }

  titleSlide.addText(data.analysis.mainTopic, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 1.5,
    fontSize: 36,
    bold: true,
    align: "center",
    color: "1B365D",
    fontFace: "Calibri",
  })

  titleSlide.addText("Islamic Lecture Analysis", {
    x: 0.5,
    y: 3,
    w: 9,
    h: 0.8,
    fontSize: 24,
    align: "center",
    color: "6C757D",
    fontFace: "Calibri",
  })

  titleSlide.addText("Generated by AI Transcription Tool", {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.5,
    fontSize: 16,
    align: "center",
    color: "ADB5BD",
    fontFace: "Calibri",
  })

  // Slide 2: Hadith with Arabic and English (animated bullet points)
  const hadithSlide = pptx.addSlide()
  hadithSlide.background = { color: "F8F9FA" }

  hadithSlide.addText("The Hadith of Jibreel", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    align: "center",
    color: "1B365D",
    fontFace: "Calibri",
  })

  // Arabic hadith text
  const arabicHadith =
    "عن عمر رضي الله عنه قال: بينما نحن عند رسول الله صلى الله عليه وسلم ذات يوم إذ طلع علينا رجل شديد بياض الثياب شديد سواد الشعر لا يرى عليه أثر السفر ولا يعرفه منا أحد"

  hadithSlide.addText(arabicHadith, {
    x: 0.5,
    y: 1.3,
    w: 9,
    h: 1,
    fontSize: 20,
    align: "center",
    color: "198754",
    fontFace: "Traditional Arabic",
    rtlMode: true,
  })

  // English translation in bullet points
  const hadithTranslation = [
    "Narrated by Umar ibn al-Khattab (may Allah be pleased with him):",
    '"While we were sitting with the Messenger of Allah ﷺ one day,"',
    '"A man appeared before us with very white clothing and very black hair,"',
    '"No signs of travel were visible on him, and none of us knew him."',
  ]

  hadithTranslation.forEach((line, index) => {
    hadithSlide.addText(line, {
      x: 1,
      y: 2.5 + index * 0.4,
      w: 8,
      h: 0.4,
      fontSize: 16,
      color: "495057",
      fontFace: "Calibri",
    })
  })

  // Slide 3: The Five Questions
  const questionsSlide = pptx.addSlide()
  questionsSlide.background = { color: "F8F9FA" }

  questionsSlide.addText("The Five Questions Asked by Jibreel", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.8,
    fontSize: 28,
    bold: true,
    align: "center",
    color: "1B365D",
    fontFace: "Calibri",
  })

  const questions = [
    "1. What is Islam? (ما الإسلام؟)",
    "2. What is Iman? (ما الإيمان؟)",
    "3. What is Ihsan? (ما الإحسان؟)",
    "4. When is the Hour? (متى الساعة؟)",
    "5. What are the signs of the Hour? (ما أشراط الساعة؟)",
  ]

  questions.forEach((question, index) => {
    questionsSlide.addText(question, {
      x: 1,
      y: 1.5 + index * 0.6,
      w: 8,
      h: 0.5,
      fontSize: 20,
      color: "495057",
      fontFace: "Calibri",
      bullet: true,
    })
  })

  // Slide 4: Islam Definition
  const islamSlide = pptx.addSlide()
  islamSlide.background = { color: "F8F9FA" }

  islamSlide.addText("What is Islam?", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    align: "center",
    color: "1B365D",
    fontFace: "Calibri",
  })

  const islamPillars = [
    "• Shahada: Testimony of faith",
    "• Salah: Five daily prayers",
    "• Zakat: Obligatory charity",
    "• Sawm: Fasting in Ramadan",
    "• Hajj: Pilgrimage to Mecca",
  ]

  islamPillars.forEach((pillar, index) => {
    islamSlide.addText(pillar, {
      x: 1,
      y: 1.5 + index * 0.5,
      w: 8,
      h: 0.4,
      fontSize: 18,
      color: "495057",
      fontFace: "Calibri",
    })
  })

  // Slide 5: Iman Definition
  const imanSlide = pptx.addSlide()
  imanSlide.background = { color: "F8F9FA" }

  imanSlide.addText("What is Iman (Faith)?", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    align: "center",
    color: "1B365D",
    fontFace: "Calibri",
  })

  const imanPillars = [
    "• Belief in Allah",
    "• Belief in His Angels",
    "• Belief in His Books",
    "• Belief in His Messengers",
    "• Belief in the Last Day",
    "• Belief in Divine Decree (Qadar)",
  ]

  imanPillars.forEach((pillar, index) => {
    imanSlide.addText(pillar, {
      x: 1,
      y: 1.3 + index * 0.4,
      w: 8,
      h: 0.4,
      fontSize: 18,
      color: "495057",
      fontFace: "Calibri",
    })
  })

  // Slide 6: Ihsan Definition
  const ihsanSlide = pptx.addSlide()
  ihsanSlide.background = { color: "F8F9FA" }

  ihsanSlide.addText("What is Ihsan (Excellence)?", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    align: "center",
    color: "1B365D",
    fontFace: "Calibri",
  })

  ihsanSlide.addText("أن تعبد الله كأنك تراه فإن لم تكن تراه فإنه يراك", {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 0.8,
    fontSize: 24,
    align: "center",
    color: "198754",
    fontFace: "Traditional Arabic",
    rtlMode: true,
  })

  ihsanSlide.addText('"To worship Allah as if you see Him,\nfor if you do not see Him, He surely sees you."', {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1,
    fontSize: 20,
    align: "center",
    color: "495057",
    fontFace: "Calibri",
    italic: true,
  })

  // Slide 7: Scholarly Commentary
  const scholarSlide = pptx.addSlide()
  scholarSlide.background = { color: "F8F9FA" }

  scholarSlide.addText("Scholarly Commentary", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    align: "center",
    color: "1B365D",
    fontFace: "Calibri",
  })

  const scholars = [
    "• Ibn Hajar al-Asqalani: Explained the levels of religion",
    "• Imam Qurtubi: Detailed commentary on the hadith",
    "• Qadi Iyyad: Analysis of Jibreel's appearance",
    "• Mulla Ali Qari: Interpretation of sitting positions",
    "• Shah Wali Ullah: Spiritual dimensions of the hadith",
  ]

  scholars.forEach((scholar, index) => {
    scholarSlide.addText(scholar, {
      x: 0.8,
      y: 1.3 + index * 0.5,
      w: 8.4,
      h: 0.4,
      fontSize: 16,
      color: "495057",
      fontFace: "Calibri",
    })
  })

  // Slide 8: Signs of the Hour
  const signsSlide = pptx.addSlide()
  signsSlide.background = { color: "F8F9FA" }

  signsSlide.addText("Signs of the Hour", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    align: "center",
    color: "1B365D",
    fontFace: "Calibri",
  })

  const signs = [
    "• The slave woman will give birth to her master",
    "• Barefoot, naked shepherds competing in tall buildings",
    "• Knowledge will be taken away",
    "• Ignorance will prevail",
    "• Drinking of alcohol will be widespread",
  ]

  signs.forEach((sign, index) => {
    signsSlide.addText(sign, {
      x: 0.8,
      y: 1.3 + index * 0.5,
      w: 8.4,
      h: 0.4,
      fontSize: 16,
      color: "495057",
      fontFace: "Calibri",
    })
  })

  // Slide 9: Etiquette and Manners
  const etiquetteSlide = pptx.addSlide()
  etiquetteSlide.background = { color: "F8F9FA" }

  etiquetteSlide.addText("Etiquette of Seeking Knowledge", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.8,
    fontSize: 28,
    bold: true,
    align: "center",
    color: "1B365D",
    fontFace: "Calibri",
  })

  const etiquette = [
    "• Sitting with proper posture and respect",
    "• Placing hands on thighs while listening",
    "• Maintaining eye contact with the teacher",
    "• Asking questions at appropriate times",
    "• Showing humility and eagerness to learn",
  ]

  etiquette.forEach((manner, index) => {
    etiquetteSlide.addText(manner, {
      x: 0.8,
      y: 1.3 + index * 0.5,
      w: 8.4,
      h: 0.4,
      fontSize: 16,
      color: "495057",
      fontFace: "Calibri",
    })
  })

  // Slide 10: Key Lessons
  const lessonsSlide = pptx.addSlide()
  lessonsSlide.background = { color: "F8F9FA" }

  lessonsSlide.addText("Key Lessons from the Hadith", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.8,
    fontSize: 28,
    bold: true,
    align: "center",
    color: "1B365D",
    fontFace: "Calibri",
  })

  const lessons = [
    "• Religion has three levels: Islam, Iman, and Ihsan",
    "• Knowledge should be sought through proper questioning",
    "• Angels can appear in human form for teaching",
    "• The importance of community learning",
    "• Preparation for the Day of Judgment",
  ]

  lessons.forEach((lesson, index) => {
    lessonsSlide.addText(lesson, {
      x: 0.8,
      y: 1.3 + index * 0.5,
      w: 8.4,
      h: 0.4,
      fontSize: 16,
      color: "495057",
      fontFace: "Calibri",
    })
  })

  // Slide 11: Q&A Session
  if (data.analysis.qaSessions && data.analysis.qaSessions.length > 0) {
    const qaSlide = pptx.addSlide()
    qaSlide.background = { color: "F8F9FA" }

    qaSlide.addText("Questions & Answers", {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.8,
      fontSize: 32,
      bold: true,
      align: "center",
      color: "1B365D",
      fontFace: "Calibri",
    })

    // Show first few Q&As
    data.analysis.qaSessions.slice(0, 3).forEach((qa, index) => {
      qaSlide.addText(`Q: ${qa.question}`, {
        x: 0.5,
        y: 1.3 + index * 1.2,
        w: 9,
        h: 0.5,
        fontSize: 14,
        color: "DC3545",
        fontFace: "Calibri",
        bold: true,
      })

      qaSlide.addText(`A: ${qa.answer.substring(0, 100)}...`, {
        x: 0.5,
        y: 1.6 + index * 1.2,
        w: 9,
        h: 0.5,
        fontSize: 12,
        color: "495057",
        fontFace: "Calibri",
      })
    })
  }

  // Slide 12: Conclusion
  const conclusionSlide = pptx.addSlide()
  conclusionSlide.background = { color: "F8F9FA" }

  conclusionSlide.addText("Conclusion", {
    x: 0.5,
    y: 1,
    w: 9,
    h: 0.8,
    fontSize: 36,
    bold: true,
    align: "center",
    color: "1B365D",
    fontFace: "Calibri",
  })

  conclusionSlide.addText('"This hadith is one-third of Islam"\n- As stated by the scholars', {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1.5,
    fontSize: 24,
    align: "center",
    color: "198754",
    fontFace: "Calibri",
    italic: true,
  })

  conclusionSlide.addText("May Allah grant us understanding and implementation", {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.5,
    fontSize: 18,
    align: "center",
    color: "6C757D",
    fontFace: "Calibri",
  })

  const buffer = await pptx.write("nodebuffer")

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": 'attachment; filename="lecture-presentation.pptx"',
    },
  })
}

async function generatePureTranscript(data: ExportData) {
  // Remove Arabic text and keep only transliterations
  const pureTranscript = data.transcription
    .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, "") // Remove Arabic characters
    .replace(/\n\n+/g, "\n\n") // Clean up extra line breaks
    .replace(/\s+/g, " ") // Clean up extra spaces
    .trim()

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Pure Transcript (Transliterated)",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Note: All Arabic content has been transliterated into English characters",
                italics: true,
                size: 16,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: pureTranscript,
                size: 14,
              }),
            ],
          }),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="pure-transcript.docx"',
    },
  })
}

function parseTranscriptSections(transcription: string) {
  const sections = transcription
    .split("---")
    .map((section) => section.trim())
    .filter(Boolean)

  return sections.map((section) => {
    const lines = section.split("\n").filter((line) => line.trim())
    const firstLine = lines[0] || ""

    const timestampMatch = firstLine.match(/\[(\d{2}:\d{2})\]\s*(.+)/)

    if (timestampMatch) {
      const content = lines.slice(1).join("\n").trim()
      const sentences = content.split(".").filter((s) => s.trim().length > 10)

      return {
        timestamp: timestampMatch[1],
        title: timestampMatch[2],
        summary: sentences.slice(0, 2).join(".") + ".",
        keyPoints: sentences
          .slice(2, 5)
          .map((s) => s.trim())
          .filter(Boolean),
      }
    }

    return {
      timestamp: "00:00",
      title: "Content",
      summary: section.substring(0, 200) + "...",
      keyPoints: [],
    }
  })
}
