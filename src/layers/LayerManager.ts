import paper from 'paper'
import type { Layer } from '../store/useDrawingStore'
import { useDrawingStore } from '../store/useDrawingStore'

// Apply layer visibility/lock state to all paper items
export function applyLayerStates(layers: Layer[]) {
  if (!paper.project) return
  const layerMap = Object.fromEntries(layers.map((l) => [l.id, l]))

  paper.project.activeLayer.children.forEach((item) => {
    const layerId = item.data?.layerId as string | undefined
    if (!layerId) return
    const layer = layerMap[layerId]
    if (layer) {
      item.visible = layer.visible
      item.locked = layer.locked
    }
  })
}

// Call after any draw or undo/redo to keep items in sync with current layer states
export function applyCurrentLayerStates() {
  applyLayerStates(useDrawingStore.getState().layers)
}
