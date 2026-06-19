import { Router, type Request, type Response } from 'express'
import db, { mapRow, mapRows } from '../db.js'

const router = Router()

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare('SELECT * FROM technicians ORDER BY id').all() as Record<string, unknown>[]
    res.json({ success: true, data: mapRows(rows) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/available', (req: Request, res: Response): void => {
  try {
    const { date, time, duration } = req.query
    if (!date || !time || !duration) {
      res.status(400).json({ success: false, error: '缺少 date、time、duration 参数' })
      return
    }

    const startMin = timeToMinutes(time as string)
    const dur = parseInt(duration as string, 10)
    const endMin = startMin + dur

    const allTechs = db.prepare('SELECT * FROM technicians').all() as Record<string, unknown>[]
    const busyAppts = db.prepare(
      `SELECT a.technician_id, a.time, s.duration
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.date = ? AND a.status IN ('pending', 'completed')`
    ).all(date as string) as { technician_id: number; time: string; duration: number }[]

    const busyTechIds = new Set<number>()
    for (const appt of busyAppts) {
      const aStart = timeToMinutes(appt.time)
      const aEnd = aStart + appt.duration
      if (startMin < aEnd && endMin > aStart) {
        busyTechIds.add(appt.technician_id)
      }
    }

    const available = allTechs.filter((t) => !busyTechIds.has((t as { id: number }).id))
    res.json({ success: true, data: mapRows(available) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, phone, specialties, avatar } = req.body
    if (!name) {
      res.status(400).json({ success: false, error: '姓名必填' })
      return
    }
    const info = db.prepare(
      `INSERT INTO technicians (name, phone, specialties, avatar)
       VALUES (?, ?, ?, ?)`
    ).run(name, phone || null, specialties || null, avatar || null)

    const row = db.prepare('SELECT * FROM technicians WHERE id = ?').get(info.lastInsertRowid) as Record<string, unknown>
    res.status(201).json({ success: true, data: mapRow(row) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
