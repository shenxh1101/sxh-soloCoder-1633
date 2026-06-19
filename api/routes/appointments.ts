import { Router, type Request, type Response } from 'express'
import db, { mapRow, mapRows } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { date } = req.query
    let rows: Record<string, unknown>[]
    if (date) {
      rows = db.prepare(
        `SELECT a.*, m.name as member_name, t.name as technician_name, s.name as service_name
         FROM appointments a
         LEFT JOIN members m ON a.member_id = m.id
         LEFT JOIN technicians t ON a.technician_id = t.id
         LEFT JOIN services s ON a.service_id = s.id
         WHERE a.date = ?
         ORDER BY a.time`
      ).all(date as string) as Record<string, unknown>[]
    } else {
      rows = db.prepare(
        `SELECT a.*, m.name as member_name, t.name as technician_name, s.name as service_name
         FROM appointments a
         LEFT JOIN members m ON a.member_id = m.id
         LEFT JOIN technicians t ON a.technician_id = t.id
         LEFT JOIN services s ON a.service_id = s.id
         ORDER BY a.date DESC, a.time`
      ).all() as Record<string, unknown>[]
    }
    res.json({ success: true, data: mapRows(rows) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { memberId, technicianId, serviceId, date, time } = req.body
    if (technicianId == null || serviceId == null || !date || !time) {
      res.status(400).json({ success: false, error: '技师、服务、日期、时间必填' })
      return
    }
    const info = db.prepare(
      `INSERT INTO appointments (member_id, technician_id, service_id, date, time)
       VALUES (?, ?, ?, ?, ?)`
    ).run(memberId || null, technicianId, serviceId, date, time)

    const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(info.lastInsertRowid) as Record<string, unknown>
    res.status(201).json({ success: true, data: mapRow(row) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.put('/:id/status', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10)
    const { status } = req.body
    if (!status) {
      res.status(400).json({ success: false, error: 'status 必填' })
      return
    }

    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id)
    if (!appt) {
      res.status(404).json({ success: false, error: '预约不存在' })
      return
    }

    const tx = db.transaction(() => {
      db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id)
      if (status === 'no_show') {
        const apptRow = db.prepare('SELECT member_id FROM appointments WHERE id = ?').get(id) as { member_id: number | null }
        if (apptRow && apptRow.member_id) {
          db.prepare('UPDATE members SET no_show_count = no_show_count + 1 WHERE id = ?').run(apptRow.member_id)
        }
      }
    })
    tx()

    const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as Record<string, unknown>
    res.json({ success: true, data: mapRow(row) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
