import { useState, useEffect, useCallback, type KeyboardEvent } from 'react'
import { useDrawingStore, type ToolName } from '../store/useDrawingStore'
import {
  drawLine, drawRectangle, drawCircle, drawArc,
  drawWall, drawPolyline, drawText, drawDimension,
} from '../drawing/drawByCoords'

interface Field {
  key: string
  label: string
  type: 'number' | 'text'
  defaultVal: number | string
}

const CONFIGS: Partial<Record<ToolName, Field[]>> = {
  line: [
    { key: 'x1', label: 'X1', type: 'number', defaultVal: 0 },
    { key: 'y1', label: 'Y1', type: 'number', defaultVal: 0 },
    { key: 'x2', label: 'X2', type: 'number', defaultVal: 200 },
    { key: 'y2', label: 'Y2', type: 'number', defaultVal: 0 },
  ],
  rectangle: [
    { key: 'x', label: 'X',      type: 'number', defaultVal: 0 },
    { key: 'y', label: 'Y',      type: 'number', defaultVal: 0 },
    { key: 'w', label: 'Width',  type: 'number', defaultVal: 200 },
    { key: 'h', label: 'Height', type: 'number', defaultVal: 150 },
  ],
  circle: [
    { key: 'cx', label: 'Center X', type: 'number', defaultVal: 0 },
    { key: 'cy', label: 'Center Y', type: 'number', defaultVal: 0 },
    { key: 'r',  label: 'Radius',   type: 'number', defaultVal: 100 },
  ],
  arc: [
    { key: 'x1', label: 'From X', type: 'number', defaultVal: 0 },
    { key: 'y1', label: 'From Y', type: 'number', defaultVal: 0 },
    { key: 'xt', label: 'Thru X', type: 'number', defaultVal: 100 },
    { key: 'yt', label: 'Thru Y', type: 'number', defaultVal: -50 },
    { key: 'x2', label: 'To X',   type: 'number', defaultVal: 200 },
    { key: 'y2', label: 'To Y',   type: 'number', defaultVal: 0 },
  ],
  wall: [
    { key: 'x1', label: 'X1', type: 'number', defaultVal: 0 },
    { key: 'y1', label: 'Y1', type: 'number', defaultVal: 0 },
    { key: 'x2', label: 'X2', type: 'number', defaultVal: 300 },
    { key: 'y2', label: 'Y2', type: 'number', defaultVal: 0 },
  ],
  dimension: [
    { key: 'x1', label: 'X1', type: 'number', defaultVal: 0 },
    { key: 'y1', label: 'Y1', type: 'number', defaultVal: 0 },
    { key: 'x2', label: 'X2', type: 'number', defaultVal: 200 },
    { key: 'y2', label: 'Y2', type: 'number', defaultVal: 0 },
  ],
  text: [
    { key: 'x',       label: 'X',    type: 'number', defaultVal: 0 },
    { key: 'y',       label: 'Y',    type: 'number', defaultVal: 0 },
    { key: 'content', label: 'Text', type: 'text',   defaultVal: '' },
  ],
}

// Polyline uses a separate dynamic-row UI — 2–8 points
const POLYLINE_MAX = 8

function defaultValues(fields: Field[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, String(f.defaultVal)]))
}

function defaultPolyPts(): [string, string][] {
  return [['0', '0'], ['200', '0'], ['200', '200']]
}

export function CoordInputPanel() {
  const activeTool = useDrawingStore((s) => s.activeTool)
  const fields = CONFIGS[activeTool]
  const isPolyline = activeTool === 'polyline'
  const hasInput = !!fields || isPolyline

  const [values, setValues] = useState<Record<string, string>>({})
  const [polyPts, setPolyPts] = useState<[string, string][]>(defaultPolyPts)
  const [flash, setFlash] = useState(false)

  // Reset fields when tool changes
  useEffect(() => {
    if (fields) setValues(defaultValues(fields))
    if (isPolyline) setPolyPts(defaultPolyPts())
  }, [activeTool]) // eslint-disable-line react-hooks/exhaustive-deps

  const n = (key: string) => parseFloat(values[key] ?? '0') || 0

  const handleDraw = useCallback(() => {
    try {
      if (activeTool === 'line')      drawLine(n('x1'), n('y1'), n('x2'), n('y2'))
      else if (activeTool === 'rectangle') drawRectangle(n('x'), n('y'), n('w'), n('h'))
      else if (activeTool === 'circle')    drawCircle(n('cx'), n('cy'), n('r'))
      else if (activeTool === 'arc')       drawArc(n('x1'), n('y1'), n('xt'), n('yt'), n('x2'), n('y2'))
      else if (activeTool === 'wall')      drawWall(n('x1'), n('y1'), n('x2'), n('y2'))
      else if (activeTool === 'dimension') drawDimension(n('x1'), n('y1'), n('x2'), n('y2'))
      else if (activeTool === 'text')      drawText(n('x'), n('y'), values['content'] ?? '')
      else if (activeTool === 'polyline') {
        const pts = polyPts
          .filter(([x, y]) => x !== '' && y !== '')
          .map(([x, y]) => [parseFloat(x) || 0, parseFloat(y) || 0] as [number, number])
        drawPolyline(pts)
      }
      setFlash(true)
      setTimeout(() => setFlash(false), 400)
    } catch { /* ignore draw errors */ }
  }, [activeTool, values, polyPts]) // eslint-disable-line react-hooks/exhaustive-deps

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleDraw()
  }

  const inputCls = 'bg-slate-700 text-slate-100 text-xs rounded border border-slate-600 px-1.5 py-0.5 focus:outline-none focus:border-blue-500 w-16'
  const labelCls = 'text-[10px] text-slate-500 mr-0.5'

  if (!hasInput) return null

  return (
    <div className={`flex items-center gap-2 px-3 py-1 border-t border-slate-700 text-xs shrink-0 transition-colors ${flash ? 'bg-slate-700' : 'bg-slate-800'}`}>
      {/* Tool label */}
      <span className="text-blue-400 font-semibold uppercase text-[10px] w-16 shrink-0 tracking-wide">
        {activeTool}
      </span>
      <span className="text-slate-600 text-base shrink-0">|</span>

      {/* Standard field tools */}
      {fields && (
        <div className="flex items-center gap-2 flex-wrap">
          {fields.map((f) => (
            <label key={f.key} className="flex items-center gap-0.5">
              <span className={labelCls}>{f.label}</span>
              <input
                type={f.type === 'text' ? 'text' : 'number'}
                value={values[f.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                onKeyDown={onKey}
                className={f.type === 'text' ? inputCls.replace('w-16', 'w-32') : inputCls}
                step={f.type === 'number' ? 1 : undefined}
              />
            </label>
          ))}
          {activeTool === 'wall' && (
            <span className="text-[10px] text-slate-500">
              thickness: <span className="text-slate-300">{useDrawingStore.getState().wallThickness}mm</span>
            </span>
          )}
        </div>
      )}

      {/* Polyline: dynamic point rows */}
      {isPolyline && (
        <div className="flex items-center gap-2 flex-wrap">
          {polyPts.map(([x, y], i) => (
            <label key={i} className="flex items-center gap-0.5">
              <span className={labelCls}>P{i + 1}</span>
              <input
                type="number"
                value={x}
                onChange={(e) => setPolyPts((pts) => { const n = [...pts]; n[i] = [e.target.value, n[i][1]]; return n })}
                onKeyDown={onKey}
                className={inputCls}
                placeholder="X"
              />
              <input
                type="number"
                value={y}
                onChange={(e) => setPolyPts((pts) => { const n = [...pts]; n[i] = [n[i][0], e.target.value]; return n })}
                onKeyDown={onKey}
                className={inputCls}
                placeholder="Y"
              />
            </label>
          ))}
          <button
            onClick={() => setPolyPts((p) => p.length < POLYLINE_MAX ? [...p, ['0', '0']] : p)}
            className="text-slate-400 hover:text-white text-base leading-none px-1"
            title="Add point"
          >+</button>
          <button
            onClick={() => setPolyPts((p) => p.length > 2 ? p.slice(0, -1) : p)}
            className="text-slate-400 hover:text-white text-base leading-none px-1"
            title="Remove last point"
          >−</button>
        </div>
      )}

      <span className="text-slate-600 text-base shrink-0">|</span>

      {/* Actions */}
      <button
        onClick={handleDraw}
        className="px-3 py-0.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded border border-blue-500 font-medium shrink-0"
      >
        Draw
      </button>
      <button
        onClick={() => {
          if (fields) setValues(defaultValues(fields))
          if (isPolyline) setPolyPts(defaultPolyPts())
        }}
        className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-400 text-xs rounded border border-slate-600 shrink-0"
        title="Reset to defaults"
      >
        ↺
      </button>

      <span className="ml-auto text-[10px] text-slate-600">all values in mm · Enter to draw</span>
    </div>
  )
}
