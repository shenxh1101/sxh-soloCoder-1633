import { Router, type Request, type Response } from 'express'
import db, { mapRow, mapRows } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare('SELECT * FROM services ORDER BY id').all() as Record<string, unknown>[]
    res.json({ success: true, data: mapRows(rows) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, price, duration } = req.body
    if (!name || price == null || duration == null) {
      res.status(400).json({ success: false, error: '名称、价格、时长必填' })
      return
    }
    const info = db.prepare(
      `INSERT INTO services (name, price, duration)
       VALUES (?, ?, ?)`
    ).run(name, price, duration)

    const row = db.prepare('SELECT * FROM services WHERE id = ?').get(info.lastInsertRowid) as Record<string, unknown>
    res.status(201).json({ success: true, data: mapRow(row) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
