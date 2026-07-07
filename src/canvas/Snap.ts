import paper from 'paper'

const SNAP_RADIUS_PX = 12

export interface SnapResult {
  point: paper.Point
  snapped: boolean
  snapType: 'grid' | 'endpoint' | 'midpoint' | 'none'
}

function findObjectSnap(projPt: paper.Point): paper.Point | null {
  const snapRadiusMm = SNAP_RADIUS_PX / paper.view.zoom
  let best: paper.Point | null = null
  let bestDist = snapRadiusMm

  const check = (p: paper.Point) => {
    const d = projPt.getDistance(p)
    if (d < bestDist) { bestDist = d; best = p }
  }

  paper.project.activeLayer.children.forEach((item) => {
    if (item instanceof paper.Path) {
      item.segments.forEach((seg) => check(seg.point))
      for (let i = 0; i < item.segments.length - 1; i++) {
        const mid = item.segments[i].point.add(item.segments[i + 1].point).divide(2)
        check(mid)
      }
    } else if (item instanceof paper.Group) {
      item.children.forEach((child) => {
        if (child instanceof paper.Path) {
          child.segments.forEach((seg) => check(seg.point))
        }
      })
    }
  })

  return best
}

// projX/projY are in project (mm) coordinates — same as e.point from Paper.js tool events
export function snapPoint(
  projX: number,
  projY: number,
  snapEnabled: boolean,
  gridSize = 100,
): SnapResult {
  const projPt = new paper.Point(projX, projY)

  if (!snapEnabled) {
    return { point: projPt, snapped: false, snapType: 'none' }
  }

  // Object snap has priority
  const objSnap = findObjectSnap(projPt)
  if (objSnap) {
    return { point: objSnap, snapped: true, snapType: 'endpoint' }
  }

  // Grid snap — only if cursor is within SNAP_RADIUS_PX of a grid intersection
  const gwx = Math.round(projX / gridSize) * gridSize
  const gwy = Math.round(projY / gridSize) * gridSize
  const gridPt = new paper.Point(gwx, gwy)
  const distPx = projPt.getDistance(gridPt) * paper.view.zoom

  if (distPx <= SNAP_RADIUS_PX) {
    return { point: gridPt, snapped: true, snapType: 'grid' }
  }

  return { point: projPt, snapped: false, snapType: 'none' }
}
