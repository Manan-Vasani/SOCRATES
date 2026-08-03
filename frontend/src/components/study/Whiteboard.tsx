import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  Pencil,
  MousePointer2,
  Type,
  Eraser,
  Trash2,
  Download,
  Undo2,
  Redo2,
  ChevronDown,
  Minus,
  Square,
  Circle,
  Triangle,
  Diamond,
  ArrowRight,
  ArrowLeftRight,
  Star,
  Hexagon,
  RectangleHorizontal,
  Spline,
  Pen,
  Grid3x3,
  Grid,
  Layers,
  Moon,
  Layout,
  GripHorizontal,
  X,
} from 'lucide-react'

type BgType = 'dots' | 'grid' | 'blank' | 'dark' | 'chalkboard'

type Tool =
  | 'select' | 'pen' | 'text' | 'eraser'
  | 'line' | 'arrow' | 'doubleArrow'
  | 'rect' | 'roundedRect' | 'circle' | 'ellipse'
  | 'triangle' | 'diamond' | 'star' | 'hexagon'

const SHAPE_TOOLS: { key: Tool; icon: React.ReactNode; label: string }[] = [
  { key: 'line', icon: <Minus size={16} />, label: 'Line' },
  { key: 'arrow', icon: <ArrowRight size={16} />, label: 'Arrow' },
  { key: 'doubleArrow', icon: <ArrowLeftRight size={16} />, label: 'Double Arrow' },
  { key: 'rect', icon: <Square size={16} />, label: 'Rectangle' },
  { key: 'roundedRect', icon: <RectangleHorizontal size={16} />, label: 'Rounded Rect' },
  { key: 'circle', icon: <Circle size={16} />, label: 'Circle' },
  { key: 'ellipse', icon: <Spline size={16} />, label: 'Ellipse' },
  { key: 'triangle', icon: <Triangle size={16} />, label: 'Triangle' },
  { key: 'diamond', icon: <Diamond size={16} />, label: 'Diamond' },
  { key: 'star', icon: <Star size={16} />, label: 'Star' },
  { key: 'hexagon', icon: <Hexagon size={16} />, label: 'Hexagon' },
]

const COLORS = [
  { value: '#1d1d1f', name: 'Black' },
  { value: '#0066cc', name: 'Blue' },
  { value: '#10b981', name: 'Green' },
  { value: '#8b5cf6', name: 'Purple' },
  { value: '#f59e0b', name: 'Amber' },
  { value: '#ef4444', name: 'Red' },
  { value: '#ec4899', name: 'Pink' },
  { value: '#6b7280', name: 'Gray' },
]

const STROKE_WIDTHS = [
  { value: 2, dotSize: 4 },
  { value: 4, dotSize: 7 },
  { value: 8, dotSize: 11 },
]

interface Point { x: number; y: number }
interface Stroke { id?: string; tool: Tool; color: string; width: number; points: Point[] }
interface TextItem { id: string; x: number; y: number; text: string; color: string; fontSize: number }

function isShapeTool(t: Tool): boolean {
  return SHAPE_TOOLS.some((s) => s.key === t)
}

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const textInputRef = useRef<HTMLTextAreaElement>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#1d1d1f')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [undoStack, setUndoStack] = useState<Stroke[][]>([])
  const [redoStack, setRedoStack] = useState<Stroke[][]>([])
  const [showShapes, setShowShapes] = useState(false)
  const [selectedShape, setSelectedShape] = useState<Tool>('rect')
  const [bgType, setBgType] = useState<BgType>('dots')
  const [showBgMenu, setShowBgMenu] = useState(false)
  const [textItems, setTextItems] = useState<TextItem[]>([])
  const [textUndoStack, setTextUndoStack] = useState<TextItem[][]>([])
  const [textRedoStack, setTextRedoStack] = useState<TextItem[][]>([])
  const [editingText, setEditingText] = useState<{ x: number; y: number } | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [isDraggingText, setIsDraggingText] = useState(false)
  const dragStartOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Selection & Transform states
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedKind, setSelectedKind] = useState<'stroke' | 'text' | null>(null)
  const [transformHandle, setTransformHandle] = useState<string | null>(null)
  const [hoverCursor, setHoverCursor] = useState<string | null>(null)
  const transformStartPos = useRef<Point>({ x: 0, y: 0 })
  const transformInitialBBox = useRef<{ x: number; y: number; width: number; height: number } | null>(null)

  // Resize canvas to fill container with HiDPI
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (bgType === 'dark') {
      ctx.fillStyle = '#121215'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#2a2a32'
      const gap = 24
      for (let x = gap; x < w; x += gap) {
        for (let y = gap; y < h; y += gap) {
          ctx.beginPath()
          ctx.arc(x, y, 0.9, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      return
    }

    if (bgType === 'chalkboard') {
      ctx.fillStyle = '#1b3024'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#274434'
      ctx.lineWidth = 1
      const gap = 30
      ctx.beginPath()
      for (let x = gap; x < w; x += gap) {
        ctx.moveTo(x, 0); ctx.lineTo(x, h)
      }
      for (let y = gap; y < h; y += gap) {
        ctx.moveTo(0, y); ctx.lineTo(w, y)
      }
      ctx.stroke()
      return
    }

    if (bgType === 'blank') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      return
    }

    if (bgType === 'grid') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#e8eaee'
      ctx.lineWidth = 1
      const gap = 24
      ctx.beginPath()
      for (let x = gap; x < w; x += gap) {
        ctx.moveTo(x, 0); ctx.lineTo(x, h)
      }
      for (let y = gap; y < h; y += gap) {
        ctx.moveTo(0, y); ctx.lineTo(w, y)
      }
      ctx.stroke()
      return
    }

    // Default 'dots'
    ctx.fillStyle = '#fafbfc'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#e0e3e8'
    const gap = 24
    for (let x = gap; x < w; x += gap) {
      for (let y = gap; y < h; y += gap) {
        ctx.beginPath()
        ctx.arc(x, y, 0.8, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, [bgType])

  // Draw a single shape stroke on the canvas
  const drawShapeStroke = (ctx: CanvasRenderingContext2D, s: Stroke) => {
    const start = s.points[0]
    const end = s.points[s.points.length - 1]
    const x1 = start.x, y1 = start.y
    const x2 = end.x, y2 = end.y
    const w = x2 - x1, h = y2 - y1
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2
    const rx = Math.abs(w) / 2, ry = Math.abs(h) / 2

    ctx.beginPath()

    switch (s.tool) {
      case 'line':
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        break

      case 'arrow': {
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        // Arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1)
        const headLen = 12 + s.width
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
        break
      }

      case 'doubleArrow': {
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        const angle = Math.atan2(y2 - y1, x2 - x1)
        const headLen = 12 + s.width
        ctx.beginPath()
        // Head at end (x2, y2)
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
        // Head at start (x1, y1)
        ctx.moveTo(x1, y1)
        ctx.lineTo(x1 + headLen * Math.cos(angle - Math.PI / 6), y1 + headLen * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(x1, y1)
        ctx.lineTo(x1 + headLen * Math.cos(angle + Math.PI / 6), y1 + headLen * Math.sin(angle + Math.PI / 6))
        break
      }

      case 'rect':
        ctx.rect(x1, y1, w, h)
        break

      case 'roundedRect': {
        const r = Math.min(12, Math.abs(w) / 4, Math.abs(h) / 4)
        const left = Math.min(x1, x2), top = Math.min(y1, y2)
        const aw = Math.abs(w), ah = Math.abs(h)
        ctx.moveTo(left + r, top)
        ctx.lineTo(left + aw - r, top)
        ctx.arcTo(left + aw, top, left + aw, top + r, r)
        ctx.lineTo(left + aw, top + ah - r)
        ctx.arcTo(left + aw, top + ah, left + aw - r, top + ah, r)
        ctx.lineTo(left + r, top + ah)
        ctx.arcTo(left, top + ah, left, top + ah - r, r)
        ctx.lineTo(left, top + r)
        ctx.arcTo(left, top, left + r, top, r)
        ctx.closePath()
        break
      }

      case 'circle': {
        const radius = Math.min(Math.abs(w), Math.abs(h)) / 2
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        break
      }

      case 'ellipse':
        if (rx > 0 && ry > 0) ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        break

      case 'triangle':
        ctx.moveTo(cx, Math.min(y1, y2))
        ctx.lineTo(Math.max(x1, x2), Math.max(y1, y2))
        ctx.lineTo(Math.min(x1, x2), Math.max(y1, y2))
        ctx.closePath()
        break

      case 'diamond':
        ctx.moveTo(cx, Math.min(y1, y2))
        ctx.lineTo(Math.max(x1, x2), cy)
        ctx.lineTo(cx, Math.max(y1, y2))
        ctx.lineTo(Math.min(x1, x2), cy)
        ctx.closePath()
        break

      case 'star': {
        const outerR = Math.min(rx, ry)
        const innerR = outerR * 0.4
        const spikes = 5
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR
          const a = (Math.PI / spikes) * i - Math.PI / 2
          const px = cx + r * Math.cos(a)
          const py = cy + r * Math.sin(a)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        break
      }

      case 'hexagon': {
        const hr = Math.min(rx, ry)
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6
          const px = cx + hr * Math.cos(a)
          const py = cy + hr * Math.sin(a)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        break
      }
    }

    ctx.stroke()
  }

  // Bounding box calculation for selected shape/stroke or text
  const getElementBBox = useCallback((id: string, kind: 'stroke' | 'text') => {
    if (kind === 'stroke') {
      const s = strokes.find((st) => st.id === id)
      if (!s || s.points.length === 0) return null
      if (isShapeTool(s.tool) && s.points.length >= 2) {
        const x1 = s.points[0].x, y1 = s.points[0].y
        const x2 = s.points[1].x, y2 = s.points[1].y
        return {
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          width: Math.max(12, Math.abs(x2 - x1)),
          height: Math.max(12, Math.abs(y2 - y1)),
        }
      }
      let minX = s.points[0].x, maxX = s.points[0].x
      let minY = s.points[0].y, maxY = s.points[0].y
      for (const pt of s.points) {
        if (pt.x < minX) minX = pt.x
        if (pt.x > maxX) maxX = pt.x
        if (pt.y < minY) minY = pt.y
        if (pt.y > maxY) maxY = pt.y
      }
      return { x: minX, y: minY, width: Math.max(12, maxX - minX), height: Math.max(12, maxY - minY) }
    } else {
      const t = textItems.find((ti) => ti.id === id)
      if (!t) return null
      const textW = Math.max(60, t.text.length * t.fontSize * 0.6)
      const textH = t.fontSize * 1.4 * t.text.split('\n').length
      return { x: t.x, y: t.y, width: textW, height: textH }
    }
  }, [strokes, textItems])

  const getHandlesForBBox = (bbox: { x: number; y: number; width: number; height: number }) => {
    const pad = 8
    const bx = bbox.x - pad, by = bbox.y - pad, bw = bbox.width + pad * 2, bh = bbox.height + pad * 2
    return [
      { key: 'nw', x: bx, y: by },
      { key: 'ne', x: bx + bw, y: by },
      { key: 'se', x: bx + bw, y: by + bh },
      { key: 'sw', x: bx, y: by + bh },
      { key: 'n', x: bx + bw / 2, y: by },
      { key: 's', x: bx + bw / 2, y: by + bh },
      { key: 'w', x: bx, y: by + bh / 2 },
      { key: 'e', x: bx + bw, y: by + bh / 2 },
    ]
  }

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    drawBackground(ctx, w, h)

    const allStrokes = currentStroke && currentStroke.tool !== 'eraser'
      ? [...strokes, currentStroke]
      : strokes
    for (const s of allStrokes) {
      if (s.points.length < 2 || s.tool === 'eraser') continue
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (isShapeTool(s.tool)) {
        drawShapeStroke(ctx, s)
      } else {
        ctx.beginPath()
        ctx.moveTo(s.points[0].x, s.points[0].y)
        for (let i = 1; i < s.points.length - 1; i++) {
          const mx = (s.points[i].x + s.points[i + 1].x) / 2
          const my = (s.points[i].y + s.points[i + 1].y) / 2
          ctx.quadraticCurveTo(s.points[i].x, s.points[i].y, mx, my)
        }
        const last = s.points[s.points.length - 1]
        ctx.lineTo(last.x, last.y)
        ctx.stroke()
      }
    }

    // Draw text items
    for (const t of textItems) {
      ctx.fillStyle = t.color
      ctx.font = `${t.fontSize}px Inter, system-ui, sans-serif`
      ctx.textBaseline = 'top'
      const lines = t.text.split('\n')
      lines.forEach((line, i) => {
        ctx.fillText(line, t.x, t.y + i * (t.fontSize * 1.3))
      })
    }

    // Draw Selection Bounding Box & Transform Handles
    if (selectedId && selectedKind) {
      const bbox = getElementBBox(selectedId, selectedKind)
      if (bbox) {
        const pad = 8
        const bx = bbox.x - pad, by = bbox.y - pad, bw = bbox.width + pad * 2, bh = bbox.height + pad * 2

        ctx.save()
        // Blue dashed selection rectangle
        ctx.setLineDash([5, 4])
        ctx.strokeStyle = '#0066cc'
        ctx.lineWidth = 1.8
        ctx.strokeRect(bx, by, bw, bh)

        // Draw 8 handle circles
        const handles = getHandlesForBBox(bbox)
        ctx.setLineDash([])
        for (const hnd of handles) {
          ctx.beginPath()
          ctx.arc(hnd.x, hnd.y, 4.5, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.fill()
          ctx.lineWidth = 2
          ctx.strokeStyle = '#0066cc'
          ctx.stroke()
        }
        ctx.restore()
      }
    }
  }, [strokes, currentStroke, drawBackground, textItems, selectedId, selectedKind, getElementBBox])

  useEffect(() => { redraw() }, [redraw])

  // Auto-focus text input when editing position is set
  useEffect(() => {
    if (editingText) {
      const timer = setTimeout(() => {
        textInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [editingText])

  // Drag text box around
  useEffect(() => {
    if (!isDraggingText || !editingText) return
    const handleMouseMove = (e: MouseEvent) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      if (!canvasRect) return
      const newX = e.clientX - canvasRect.left - dragStartOffset.current.x
      const newY = e.clientY - canvasRect.top - dragStartOffset.current.y
      setEditingText({ x: Math.max(0, newX), y: Math.max(0, newY) })
    }
    const handleMouseUp = () => {
      setIsDraggingText(false)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingText, editingText])

  const getPos = (e: React.MouseEvent): Point => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  // Distance from point P to line segment AB
  const distToSegment = (p: Point, a: Point, b: Point): number => {
    const dx = b.x - a.x, dy = b.y - a.y
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y)
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
  }

  // Check if a point is near any segment of a stroke
  const isPointNearStroke = (p: Point, stroke: Stroke, threshold: number): boolean => {
    for (let i = 0; i < stroke.points.length - 1; i++) {
      if (distToSegment(p, stroke.points[i], stroke.points[i + 1]) < threshold) return true
    }
    return false
  }

  // Eraser: remove strokes and text items that the cursor passes near
  const eraseAt = (p: Point) => {
    const threshold = 12 + strokeWidth
    const remaining = strokes.filter((s) => s.tool !== 'eraser' && !isPointNearStroke(p, s, threshold))
    // Also check text items
    const remainingText = textItems.filter((t) => {
      const textW = t.text.length * t.fontSize * 0.6
      const textH = t.fontSize * 1.3 * t.text.split('\n').length
      return !(p.x >= t.x - 8 && p.x <= t.x + textW + 8 && p.y >= t.y - 8 && p.y <= t.y + textH + 8)
    })
    const strokesChanged = remaining.length < strokes.length
    const textChanged = remainingText.length < textItems.length
    if (strokesChanged || textChanged) {
      if (!eraserSavedRef.current) {
        setUndoStack((prev) => [...prev, strokes])
        setTextUndoStack((prev) => [...prev, textItems])
        setRedoStack([])
        setTextRedoStack([])
        eraserSavedRef.current = true
      }
      if (strokesChanged) setStrokes(remaining)
      if (textChanged) setTextItems(remainingText)
    }
  }

  const eraserSavedRef = useRef(false)
  const textCreatedAtRef = useRef(0)

  // Commit active text input to canvas
  const commitText = () => {
    if (!editingText || !editingValue.trim()) {
      setEditingText(null)
      setEditingValue('')
      return
    }
    const fontSize = 14 + strokeWidth * 2
    const newItem: TextItem = {
      id: String(Date.now()),
      x: editingText.x,
      y: editingText.y,
      text: editingValue.trim(),
      color,
      fontSize,
    }
    setTextUndoStack((prev) => [...prev, textItems])
    setTextRedoStack([])
    setTextItems((prev) => [...prev, newItem])
    setEditingText(null)
    setEditingValue('')
  }

  // Bounding box calculation
  // Sync color & stroke width to toolbar when an element is selected
  useEffect(() => {
    if (selectedId && selectedKind) {
      if (selectedKind === 'stroke') {
        const s = strokes.find((st) => st.id === selectedId)
        if (s) {
          setColor(s.color)
          setStrokeWidth(s.width)
        }
      } else if (selectedKind === 'text') {
        const t = textItems.find((ti) => ti.id === selectedId)
        if (t) setColor(t.color)
      }
    }
  }, [selectedId, selectedKind])

  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    if (selectedId && selectedKind) {
      if (selectedKind === 'stroke') {
        setStrokes((prev) => prev.map((s) => (s.id === selectedId ? { ...s, color: newColor } : s)))
      } else if (selectedKind === 'text') {
        setTextItems((prev) => prev.map((t) => (t.id === selectedId ? { ...t, color: newColor } : t)))
      }
    }
  }

  const handleWidthChange = (newWidth: number) => {
    setStrokeWidth(newWidth)
    if (selectedId && selectedKind) {
      if (selectedKind === 'stroke') {
        setStrokes((prev) => prev.map((s) => (s.id === selectedId ? { ...s, width: newWidth } : s)))
      } else if (selectedKind === 'text') {
        const newFontSize = 14 + newWidth * 2
        setTextItems((prev) => prev.map((t) => (t.id === selectedId ? { ...t, fontSize: newFontSize } : t)))
      }
    }
  }

  // Delete key shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !editingText) {
        if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return
        e.preventDefault()
        if (selectedKind === 'stroke') {
          setStrokes((prev) => prev.filter((s) => s.id !== selectedId))
        } else if (selectedKind === 'text') {
          setTextItems((prev) => prev.filter((t) => t.id !== selectedId))
        }
        setSelectedId(null)
        setSelectedKind(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, selectedKind, editingText])

  // Mouse down drag for active text box
  const handleTextMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!editingText) return
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    if (!canvasRect) return
    dragStartOffset.current = {
      x: e.clientX - canvasRect.left - editingText.x,
      y: e.clientY - canvasRect.top - editingText.y,
    }
    setIsDraggingText(true)
  }

  // Double click text to open edit mode
  const handleDoubleClick = (e: React.MouseEvent) => {
    const p = getPos(e)
    const existingText = findTextAt(p)
    if (existingText) {
      if (editingText) commitText()
      setEditingText({ x: existingText.x, y: existingText.y })
      setEditingValue(existingText.text)
      setColor(existingText.color)
      setTextItems((prev) => prev.filter((t) => t.id !== existingText.id))
      textCreatedAtRef.current = Date.now()
      setSelectedId(null)
      setSelectedKind(null)
      e.preventDefault()
    }
  }

  const initialPointsRef = useRef<Point[] | null>(null)
  const initialFontSizeRef = useRef<number>(18)

  // Find text item at canvas position
  const findTextAt = useCallback((p: Point): TextItem | undefined => {
    return textItems.find((t) => {
      const textW = Math.max(80, t.text.length * t.fontSize * 0.6)
      const textH = t.fontSize * 1.4 * t.text.split('\n').length
      return p.x >= t.x - 6 && p.x <= t.x + textW + 6 && p.y >= t.y - 6 && p.y <= t.y + textH + 6
    })
  }, [textItems])

  // Find shape or stroke at canvas position
  const findShapeAt = useCallback((p: Point): Stroke | undefined => {
    return strokes.find((s) => {
      if (s.points.length < 2) return false
      const bbox = getElementBBox(s.id || '', 'stroke')
      if (!bbox) return false
      return p.x >= bbox.x - 8 && p.x <= bbox.x + bbox.width + 8 && p.y >= bbox.y - 8 && p.y <= bbox.y + bbox.height + 8
    })
  }, [strokes, getElementBBox])

  const handleMouseDown = (e: React.MouseEvent) => {
    const p = getPos(e)

    // Check handle click on active selection
    if (selectedId && selectedKind) {
      const bbox = getElementBBox(selectedId, selectedKind)
      if (bbox) {
        const handles = getHandlesForBBox(bbox)
        const hitHandle = handles.find((hnd) => Math.hypot(p.x - hnd.x, p.y - hnd.y) <= 10)
        if (hitHandle) {
          if (selectedKind === 'stroke') {
            const st = strokes.find((s) => s.id === selectedId)
            if (st) initialPointsRef.current = st.points.map((pt) => ({ ...pt }))
          } else if (selectedKind === 'text') {
            const t = textItems.find((ti) => ti.id === selectedId)
            if (t) initialFontSizeRef.current = t.fontSize
          }
          setTransformHandle(hitHandle.key)
          transformStartPos.current = p
          transformInitialBBox.current = bbox
          e.preventDefault()
          return
        }

        // Inside selection bbox -> start move
        const pad = 8
        if (
          p.x >= bbox.x - pad &&
          p.x <= bbox.x + bbox.width + pad &&
          p.y >= bbox.y - pad &&
          p.y <= bbox.y + bbox.height + pad
        ) {
          if (selectedKind === 'stroke') {
            const st = strokes.find((s) => s.id === selectedId)
            if (st) initialPointsRef.current = st.points.map((pt) => ({ ...pt }))
          }
          setTransformHandle('move')
          transformStartPos.current = p
          transformInitialBBox.current = bbox
          e.preventDefault()
          return
        }
      }
    }

    // Hit test existing text item
    const existingText = findTextAt(p)
    if (existingText && (tool === 'select' || tool === 'text')) {
      setSelectedId(existingText.id)
      setSelectedKind('text')
      setTransformHandle('move')
      transformStartPos.current = p
      transformInitialBBox.current = getElementBBox(existingText.id, 'text')
      textCreatedAtRef.current = Date.now()
      e.preventDefault()
      return
    }

    // Hit test existing shape / stroke
    const existingShape = findShapeAt(p)
    if (existingShape && tool === 'select') {
      if (existingShape.id) {
        initialPointsRef.current = existingShape.points.map((pt) => ({ ...pt }))
      }
      setSelectedId(existingShape.id || null)
      setSelectedKind('stroke')
      setTransformHandle('move')
      transformStartPos.current = p
      transformInitialBBox.current = getElementBBox(existingShape.id || '', 'stroke')
      e.preventDefault()
      return
    }

    // Deselect if clicking empty space with select tool
    if (tool === 'select') {
      setSelectedId(null)
      setSelectedKind(null)
      return
    }

    // Text tool: place input if none active, or commit current input
    if (tool === 'text') {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).closest('.group')) return
      if (editingText) {
        commitText()
        return
      }
      setEditingText(p)
      setEditingValue('')
      textCreatedAtRef.current = Date.now()
      e.preventDefault()
      return
    }

    if (tool === 'eraser') {
      eraserSavedRef.current = false
      eraseAt(getPos(e))
      setIsDrawing(true)
      return
    }

    setSelectedId(null)
    setSelectedKind(null)
    setIsDrawing(true)
    const newId = String(Date.now() + Math.random())
    setCurrentStroke({ id: newId, tool, color, width: strokeWidth, points: [p] })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const p = getPos(e)

    // Dynamic hover cursor over selection handles
    if (selectedId && selectedKind && tool === 'select' && !isDrawing && !transformHandle) {
      const bbox = getElementBBox(selectedId, selectedKind)
      if (bbox) {
        const handles = getHandlesForBBox(bbox)
        const hitHandle = handles.find((hnd) => Math.hypot(p.x - hnd.x, p.y - hnd.y) <= 10)
        if (hitHandle) {
          if (hitHandle.key === 'nw' || hitHandle.key === 'se') setHoverCursor('nwse-resize')
          else if (hitHandle.key === 'ne' || hitHandle.key === 'sw') setHoverCursor('nesw-resize')
          else if (hitHandle.key === 'n' || hitHandle.key === 's') setHoverCursor('ns-resize')
          else if (hitHandle.key === 'e' || hitHandle.key === 'w') setHoverCursor('ew-resize')
        } else {
          const pad = 8
          if (p.x >= bbox.x - pad && p.x <= bbox.x + bbox.width + pad && p.y >= bbox.y - pad && p.y <= bbox.y + bbox.height + pad) {
            setHoverCursor('move')
          } else {
            if (hoverCursor !== null) setHoverCursor(null)
          }
        }
      }
    } else if (!transformHandle && hoverCursor !== null) {
      setHoverCursor(null)
    }

    // Active transform dragging (move / resize handle)
    if (transformHandle && selectedId && selectedKind && transformInitialBBox.current) {
      const dx = p.x - transformStartPos.current.x
      const dy = p.y - transformStartPos.current.y
      const initBox = transformInitialBBox.current

      if (selectedKind === 'stroke') {
        setStrokes((prev) =>
          prev.map((s) => {
            if (s.id !== selectedId) return s
            if (transformHandle === 'move' && initialPointsRef.current) {
              return {
                ...s,
                points: initialPointsRef.current.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
              }
            } else if (isShapeTool(s.tool) && s.points.length >= 2) {
              let p0 = initialPointsRef.current ? { ...initialPointsRef.current[0] } : { ...s.points[0] }
              let p1 = initialPointsRef.current ? { ...initialPointsRef.current[1] } : { ...s.points[1] }
              if (transformHandle.includes('e')) p1.x = initBox.x + initBox.width + dx
              if (transformHandle.includes('w')) p0.x = initBox.x + dx
              if (transformHandle.includes('s')) p1.y = initBox.y + initBox.height + dy
              if (transformHandle.includes('n')) p0.y = initBox.y + dy
              return { ...s, points: [p0, p1] }
            }
            return s
          })
        )
      } else if (selectedKind === 'text') {
        setTextItems((prev) =>
          prev.map((t) => {
            if (t.id !== selectedId) return t
            if (transformHandle === 'move') {
              return { ...t, x: initBox.x + dx, y: initBox.y + dy }
            } else {
              const initSize = initialFontSizeRef.current || 18
              let scaleDelta = 0
              if (transformHandle.includes('e') || transformHandle.includes('s')) {
                scaleDelta = (dx + dy) * 0.25
              } else if (transformHandle.includes('w') || transformHandle.includes('n')) {
                scaleDelta = (-dx - dy) * 0.25
              }
              const newFontSize = Math.max(10, Math.min(120, Math.round(initSize + scaleDelta)))
              let newX = t.x
              let newY = t.y
              if (transformHandle.includes('w')) newX = initBox.x + dx
              if (transformHandle.includes('n')) newY = initBox.y + dy
              return { ...t, x: newX, y: newY, fontSize: newFontSize }
            }
          })
        )
      }
      return
    }

    if (!isDrawing) return
    if (tool === 'eraser') {
      eraseAt(p)
      return
    }
    if (!currentStroke) return
    if (isShapeTool(currentStroke.tool)) {
      setCurrentStroke({ ...currentStroke, points: [currentStroke.points[0], p] })
    } else {
      setCurrentStroke({ ...currentStroke, points: [...currentStroke.points, p] })
    }
  }

  const handleMouseUp = () => {
    if (transformHandle) {
      setTransformHandle(null)
      transformInitialBBox.current = null
      return
    }
    if (tool === 'eraser') {
      setIsDrawing(false)
      eraserSavedRef.current = false
      return
    }
    if (!isDrawing || !currentStroke) return
    setIsDrawing(false)
    setUndoStack((prev) => [...prev, strokes])
    setRedoStack([])
    setStrokes((prev) => [...prev, currentStroke])
    setCurrentStroke(null)
  }

  const undo = () => {
    if (undoStack.length === 0 && textUndoStack.length === 0) return
    if (undoStack.length > 0) {
      setRedoStack((prev) => [...prev, strokes])
      setStrokes(undoStack[undoStack.length - 1])
      setUndoStack((prev) => prev.slice(0, -1))
    }
    if (textUndoStack.length > 0) {
      setTextRedoStack((prev) => [...prev, textItems])
      setTextItems(textUndoStack[textUndoStack.length - 1])
      setTextUndoStack((prev) => prev.slice(0, -1))
    }
  }

  const redo = () => {
    if (redoStack.length === 0 && textRedoStack.length === 0) return
    if (redoStack.length > 0) {
      setUndoStack((prev) => [...prev, strokes])
      setStrokes(redoStack[redoStack.length - 1])
      setRedoStack((prev) => prev.slice(0, -1))
    }
    if (textRedoStack.length > 0) {
      setTextUndoStack((prev) => [...prev, textItems])
      setTextItems(textRedoStack[textRedoStack.length - 1])
      setTextRedoStack((prev) => prev.slice(0, -1))
    }
  }

  const clearAll = () => {
    if (strokes.length === 0 && textItems.length === 0) return
    setUndoStack((prev) => [...prev, strokes])
    setTextUndoStack((prev) => [...prev, textItems])
    setRedoStack([])
    setTextRedoStack([])
    setStrokes([])
    setTextItems([])
  }

  const exportPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'whiteboard.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  // Close dropdowns on click outside
  useEffect(() => {
    if (!showShapes && !showBgMenu) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-shapes-dropdown]')) setShowShapes(false)
      if (!target.closest('[data-bg-dropdown]')) setShowBgMenu(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [showShapes, showBgMenu])

  // Currently selected shape config for the dropdown button icon
  const activeShapeConfig = SHAPE_TOOLS.find((s) => s.key === selectedShape) || SHAPE_TOOLS[2]

  const [isShrunk, setIsShrunk] = useState(false)

  // Track whiteboard container width to switch between 1-line and 2-line toolbar dynamically
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsShrunk(entry.contentRect.width < 740)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const ToolBtn = ({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-xl transition-all duration-150 cursor-pointer transform-gpu backface-hidden ${
        active
          ? 'bg-[#0066cc] text-white shadow-md shadow-[#0066cc]/25'
          : 'text-[#525252] hover:bg-[#f0f0f2] hover:text-[#1d1d1f]'
      }`}
      title={title}
    >
      {children}
    </button>
  )

  return (
    <div ref={containerRef} className="flex w-full h-full relative bg-[#fafbfc]">
      {/* Dynamic Floating Toolbar (1-line normal, 2-line when shrunk) */}
      <div
        className={`absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/8 border border-[#e5e5e7] select-none ${
          isShrunk
            ? 'flex flex-col items-center gap-1.5 p-1.5'
            : 'flex items-center gap-1 px-2.5 py-1.5'
        }`}
      >
        {/* Line 1 (or single row when wide): Primary Tools & Dropdowns */}
        <div className="flex items-center gap-0.5">
          <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} title="Select">
            <MousePointer2 size={16} />
          </ToolBtn>
          <ToolBtn active={tool === 'pen'} onClick={() => setTool('pen')} title="Pen">
            <Pencil size={16} />
          </ToolBtn>

          {/* Shapes Dropdown */}
          <div className="relative" data-shapes-dropdown>
            <button
              onClick={() => setShowShapes(!showShapes)}
              className={`flex items-center gap-0.5 p-2 pr-1 rounded-xl transition-all duration-150 cursor-pointer transform-gpu backface-hidden ${
                isShapeTool(tool)
                  ? 'bg-[#0066cc] text-white shadow-md shadow-[#0066cc]/25'
                  : 'text-[#525252] hover:bg-[#f0f0f2] hover:text-[#1d1d1f]'
              }`}
              title="Shapes"
            >
              {activeShapeConfig.icon}
              <ChevronDown size={10} className="opacity-60" />
            </button>

            {showShapes && (
              <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/12 border border-[#e5e5e7] p-2 w-[280px] z-50">
                <div className="text-[9px] font-bold text-[#a1a1a6] uppercase tracking-widest px-2.5 py-1.5">Shapes</div>
                <div className="grid grid-cols-2 gap-1">
                  {SHAPE_TOOLS.map((shape) => (
                    <button
                      key={shape.key}
                      onClick={() => {
                        setTool(shape.key)
                        setSelectedShape(shape.key)
                        setShowShapes(false)
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        tool === shape.key
                          ? 'bg-[#0066cc] text-white shadow-sm'
                          : 'text-[#525252] hover:bg-[#f0f0f2] hover:text-[#1d1d1f]'
                      }`}
                    >
                      {shape.icon}
                      <span>{shape.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <ToolBtn
            active={tool === 'text'}
            onClick={() => {
              setTool('text')
              if (!editingText) {
                const container = containerRef.current
                const rect = container?.getBoundingClientRect()
                const x = rect ? Math.max(40, rect.width / 2 - 100) : 200
                const y = 120
                setEditingText({ x, y })
                setEditingValue('')
                textCreatedAtRef.current = Date.now()
              }
            }}
            title="Text"
          >
            <Type size={16} />
          </ToolBtn>
          <ToolBtn active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Eraser">
            <Eraser size={16} />
          </ToolBtn>

          {!isShrunk && <div className="w-px h-7 bg-[#e5e5e7] mx-1 shrink-0" />}

          {/* Color Swatches (inlined on 1-line mode) */}
          {!isShrunk && (
            <div className="flex items-center gap-2 shrink-0">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleColorChange(c.value)}
                  className={`w-5 h-5 rounded-full transition-all cursor-pointer transform-gpu ${
                    color === c.value ? 'ring-2 ring-[#0066cc] ring-offset-2 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          )}

          {!isShrunk && <div className="w-px h-7 bg-[#e5e5e7] mx-1 shrink-0" />}

          {/* Stroke Widths (inlined on 1-line mode) */}
          {!isShrunk && (
            <div className="flex items-center gap-0.5 shrink-0">
              {STROKE_WIDTHS.map((sw) => (
                <button
                  key={sw.value}
                  onClick={() => handleWidthChange(sw.value)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    strokeWidth === sw.value
                      ? 'bg-[#0066cc]/10 border border-[#0066cc]/25'
                      : 'hover:bg-[#f0f0f2]'
                  }`}
                  title={`${sw.value}px`}
                >
                  <span
                    className="rounded-full bg-[#1d1d1f]"
                    style={{ width: sw.dotSize, height: sw.dotSize }}
                  />
                </button>
              ))}
            </div>
          )}

          <div className="w-px h-6 bg-[#e5e5e7] mx-1 shrink-0" />

          {/* Canvas Background Menu */}
          <div className="relative" data-bg-dropdown>
            <button
              onClick={() => setShowBgMenu(!showBgMenu)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                showBgMenu
                  ? 'bg-[#0066cc] text-white shadow-md shadow-[#0066cc]/25'
                  : 'text-[#525252] hover:bg-[#f0f0f2] hover:text-[#1d1d1f]'
              }`}
              title="Canvas Background"
            >
              <Grid3x3 size={15} />
              <ChevronDown size={10} className="opacity-60" />
            </button>

            {showBgMenu && (
              <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/12 border border-[#e5e5e7] p-1.5 w-[165px] z-50">
                <div className="text-[9px] font-bold text-[#a1a1a6] uppercase tracking-widest px-2.5 py-1.5">Background Style</div>
                <div className="flex flex-col gap-0.5">
                  {[
                    { key: 'dots', label: 'Dot Grid', icon: <Grid3x3 size={14} /> },
                    { key: 'grid', label: 'Line Grid', icon: <Grid size={14} /> },
                    { key: 'blank', label: 'Blank White', icon: <Square size={14} /> },
                    { key: 'dark', label: 'Dark Grid', icon: <Moon size={14} /> },
                    { key: 'chalkboard', label: 'Chalkboard', icon: <Layers size={14} /> },
                  ].map((bg) => (
                    <button
                      key={bg.key}
                      onClick={() => {
                        setBgType(bg.key as BgType)
                        setShowBgMenu(false)
                      }}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        bgType === bg.key
                          ? 'bg-[#0066cc] text-white'
                          : 'text-[#525252] hover:bg-[#f0f0f2] hover:text-[#1d1d1f]'
                      }`}
                    >
                      {bg.icon}
                      <span>{bg.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-[#e5e5e7] mx-1 shrink-0" />

          {/* Action Buttons */}
          <button onClick={undo} disabled={undoStack.length === 0} className="p-2 rounded-xl text-[#525252] hover:bg-[#f0f0f2] hover:text-[#1d1d1f] transition-all cursor-pointer disabled:opacity-25" title="Undo (Ctrl+Z)"><Undo2 size={16} /></button>
          <button onClick={redo} disabled={redoStack.length === 0} className="p-2 rounded-xl text-[#525252] hover:bg-[#f0f0f2] hover:text-[#1d1d1f] transition-all cursor-pointer disabled:opacity-25" title="Redo (Ctrl+Y)"><Redo2 size={16} /></button>
          <button onClick={clearAll} disabled={strokes.length === 0} className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer disabled:opacity-25" title="Clear All"><Trash2 size={16} /></button>
          <button onClick={exportPng} className="p-2 rounded-xl text-[#525252] hover:bg-[#f0f0f2] hover:text-[#1d1d1f] transition-all cursor-pointer" title="Export PNG"><Download size={16} /></button>
        </div>

        {/* Line 2 (only rendered when canvas is shrunk/narrow): Colors & Stroke Width */}
        {isShrunk && (
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#e5e5e7]/60 w-full px-1">
            {/* Color Swatches */}
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleColorChange(c.value)}
                  className={`w-4.5 h-4.5 rounded-full transition-all cursor-pointer transform-gpu ${
                    color === c.value ? 'ring-2 ring-[#0066cc] ring-offset-2 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>

            <div className="w-px h-4 bg-[#e5e5e7] shrink-0" />

            {/* Stroke Width */}
            <div className="flex items-center gap-1">
              {STROKE_WIDTHS.map((sw) => (
                <button
                  key={sw.value}
                  onClick={() => handleWidthChange(sw.value)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    strokeWidth === sw.value
                      ? 'bg-[#0066cc]/10 border border-[#0066cc]/25'
                      : 'hover:bg-[#f0f0f2]'
                  }`}
                  title={`${sw.value}px`}
                >
                  <span
                    className="rounded-full bg-[#1d1d1f]"
                    style={{ width: sw.dotSize, height: sw.dotSize }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 min-w-0 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{
            cursor: hoverCursor || (tool === 'eraser' ? 'cell' : tool === 'text' ? 'text' : tool === 'select' ? 'default' : 'crosshair'),
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Seamless Transparent Text Input */}
        {editingText && (
          <textarea
            ref={textInputRef}
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                commitText()
              }
              if (e.key === 'Escape') {
                setEditingText(null)
                setEditingValue('')
              }
            }}
            onBlur={() => {
              if (Date.now() - textCreatedAtRef.current < 200) return
              commitText()
            }}
            onMouseDown={handleTextMouseDown}
            className="absolute outline-none bg-transparent border-2 border-dashed border-[#0066cc]/70 rounded-lg p-1.5 resize-none leading-normal z-40 font-sans cursor-move active:cursor-grabbing"
            style={{
              left: editingText.x,
              top: editingText.y,
              fontSize: `${Math.max(14, 12 + strokeWidth * 1.5)}px`,
              fontFamily: 'Inter, system-ui, sans-serif',
              color,
              minWidth: 100,
              minHeight: 36,
            }}
            placeholder="Type here..."
          />
        )}
      </div>
    </div>
  )
}
