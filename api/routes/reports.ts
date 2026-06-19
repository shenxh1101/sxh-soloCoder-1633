import { Router, type Request, type Response } from 'express'
import db, { mapRows } from '../db.js'

const router = Router()

router.get('/technicians', (req: Request, res: Response): void => {
  try {
    const { month } = req.query
    if (!month) {
      res.status(400).json({ success: false, error: '缺少 month 参数 (YYYY-MM)' })
      return
    }
    const prefix = `${month}-`
    const rows = db.prepare(
      `SELECT t.id, t.name,
              COUNT(a.id) as appointment_count,
              COALESCE(SUM(CASE WHEN tr.type = 'consume' THEN tr.amount ELSE 0 END), 0) as revenue
       FROM technicians t
       LEFT JOIN appointments a ON t.id = a.technician_id AND a.date LIKE ? AND a.status = 'completed'
       LEFT JOIN transactions tr ON t.id = tr.technician_id AND tr.created_at LIKE ? AND tr.type = 'consume'
       GROUP BY t.id, t.name
       ORDER BY revenue DESC`
    ).all(`${prefix}%`, `${prefix}%`) as Record<string, unknown>[]
    res.json({ success: true, data: mapRows(rows) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/services', (req: Request, res: Response): void => {
  try {
    const { month } = req.query
    if (!month) {
      res.status(400).json({ success: false, error: '缺少 month 参数 (YYYY-MM)' })
      return
    }
    const prefix = `${month}-`
    const rows = db.prepare(
      `SELECT s.id, s.name,
              COUNT(a.id) as appointment_count,
              COALESCE(SUM(CASE WHEN a.status = 'completed' THEN s.price ELSE 0 END), 0) as revenue
       FROM services s
       LEFT JOIN appointments a ON s.id = a.service_id AND a.date LIKE ?
       GROUP BY s.id, s.name
       ORDER BY revenue DESC`
    ).all(`${prefix}%`) as Record<string, unknown>[]
    res.json({ success: true, data: mapRows(rows) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/recharge', (req: Request, res: Response): void => {
  try {
    const { month } = req.query
    if (!month) {
      res.status(400).json({ success: false, error: '缺少 month 参数 (YYYY-MM)' })
      return
    }
    const prefix = `${month}-`
    const row = db.prepare(
      `SELECT COUNT(*) as recharge_count,
              COALESCE(SUM(amount), 0) as total_recharge
       FROM transactions
       WHERE type = 'recharge' AND created_at LIKE ?`
    ).get(`${prefix}%`) as Record<string, unknown>

    const rules = db.prepare('SELECT * FROM recharge_rules ORDER BY recharge_amount').all() as Record<string, unknown>[]

    res.json({
      success: true,
      data: {
        ...(mapRows([row])[0] as Record<string, unknown>),
        rules: mapRows(rules),
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
