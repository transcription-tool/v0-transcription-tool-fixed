"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, BookOpen, ArrowDown, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface MindMapData {
  centralTopic: string
  branches: Array<{
    title: string
    subBranches: string[]
  }>
}

interface MindMapProps {
  data: MindMapData
  className?: string
}

interface FlowchartNodeProps {
  title: string
  subBranches: string[]
  level: number
  isExpanded: boolean
  onToggle: () => void
  color: string
  isLast?: boolean
}

function FlowchartNode({ title, subBranches, level, isExpanded, onToggle, color, isLast }: FlowchartNodeProps) {
  const hasSubBranches = subBranches.length > 0

  return (
    <div className="relative flex flex-col items-center">
      {/* Main Node */}
      <div className="relative">
        <div
          className={cn(
            "px-6 py-4 rounded-lg border-2 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer min-w-48 text-center",
            level === 0
              ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white border-blue-600"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300",
          )}
          onClick={hasSubBranches ? onToggle : undefined}
        >
          <div className="flex items-center justify-center gap-2">
            {hasSubBranches && (
              <div className="flex-shrink-0">
                {isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </div>
            )}
            <span
              className={cn("font-medium text-sm", level === 0 ? "text-white" : "text-slate-900 dark:text-slate-100")}
            >
              {title}
            </span>
            {hasSubBranches && (
              <Badge variant={level === 0 ? "secondary" : "outline"} className="text-xs ml-2">
                {subBranches.length}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Connection Line Down */}
      {hasSubBranches && isExpanded && <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600 mt-2" />}

      {/* Sub-branches Container */}
      {hasSubBranches && isExpanded && (
        <div className="relative">
          {/* Horizontal Line */}
          <div className="w-full h-0.5 bg-slate-300 dark:bg-slate-600 mb-4" />

          {/* Sub-branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
            {subBranches.map((subBranch, index) => (
              <div key={index} className="relative flex flex-col items-center">
                {/* Vertical connector to horizontal line */}
                <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-600 -mt-4 mb-2" />

                {/* Sub-branch Node */}
                <div
                  className={cn(
                    "px-4 py-3 rounded-md border shadow-sm text-center min-w-32 transition-all duration-200 hover:shadow-md",
                    "bg-gradient-to-br",
                    color,
                    "text-white border-transparent",
                  )}
                >
                  <span className="text-xs font-medium">{subBranch}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function MindMap({ data, className }: MindMapProps) {
  const [expandedBranches, setExpandedBranches] = useState<Set<number>>(new Set([0]))

  const toggleBranch = (index: number) => {
    const newExpanded = new Set(expandedBranches)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedBranches(newExpanded)
  }

  const expandAll = () => {
    setExpandedBranches(new Set(data.branches.map((_, index) => index)))
  }

  const collapseAll = () => {
    setExpandedBranches(new Set())
  }

  const branchColors = [
    "from-emerald-400 to-emerald-600",
    "from-purple-400 to-purple-600",
    "from-orange-400 to-orange-600",
    "from-teal-400 to-teal-600",
    "from-pink-400 to-pink-600",
    "from-indigo-400 to-indigo-600",
  ]

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <CardTitle>Mind Map - Flowchart View</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8 py-4" data-mindmap-container>
          {/* Central Topic */}
          <div className="flex justify-center">
            <FlowchartNode
              title={data.centralTopic}
              subBranches={[]}
              level={0}
              isExpanded={false}
              onToggle={() => {}}
              color=""
            />
          </div>

          {/* Main connector line down from central topic */}
          <div className="flex justify-center">
            <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600" />
          </div>

          {/* Horizontal line for main branches */}
          <div className="flex justify-center">
            <div className="w-full max-w-6xl h-0.5 bg-slate-300 dark:bg-slate-600" />
          </div>

          {/* Main Branches */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {data.branches.map((branch, index) => (
              <div key={index} className="relative flex flex-col items-center">
                {/* Vertical connector to horizontal line */}
                <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600 -mt-8 mb-4" />

                <FlowchartNode
                  title={branch.title}
                  subBranches={branch.subBranches}
                  level={1}
                  isExpanded={expandedBranches.has(index)}
                  onToggle={() => toggleBranch(index)}
                  color={branchColors[index % branchColors.length]}
                  isLast={index === data.branches.length - 1}
                />
              </div>
            ))}
          </div>

          {/* Enhanced Legend */}
          <div className="mt-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">Flowchart Guide</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded" />
                  <span>Central topic (main theme)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded" />
                  <span>Primary branches (key concepts)</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-slate-500" />
                  <span>Click to expand sub-topics</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowDown className="h-4 w-4 text-slate-500" />
                  <span>Hierarchical flow structure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
