import { Router, type Request, type Response } from 'express'
import db, { mapRow, mapRows } from '../db.js'

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
              COUNT(DISTINCT a.id) as appointment_count,
              COALESCE(SUM(tr.amount), 0) as revenue
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
              COUNT(DISTINCT a.id) as appointment_count,
              COALESCE(SUM(tr.amount), 0) as revenue
       FROM services s
       LEFT JOIN appointments a ON s.id = a.service_id AND a.date LIKE ? AND a.status = 'completed'
       LEFT JOIN transactions tr ON s.id = tr.service_id AND tr.created_at LIKE ? AND tr.type = 'consume'
       GROUP BY s.id, s.name
       ORDER BY revenue DESC`
    ).all(`${prefix}%`, `${prefix}%`) as Record<string, unknown>[]
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
              COALESCE(SUM(amount), 0) as total_recharge,
              COALESCE(SUM(bonus_amount), 0) as total_bonus
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

router.get('/technician-detail', (req: Request, res: Response): void => {
  try {
    const { month, technicianId } = req.query
    if (!month || !technicianId) {
      res.status(400).json({ success: false, error: '缺少 month 和 technicianId 参数' })
      return
    }
    const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get(Number(technicianId)) as Record<string, unknown> | undefined
    if (!tech) {
      res.status(404).json({ success: false, error: '技师不存在' })
      return
    }
    const prefix = `${month}-`
    const transactions = db.prepare(
      `SELECT tr.id, tr.amount, tr.created_at,
              m.name as member_name, s.name as service_name
       FROM transactions tr
       LEFT JOIN members m ON tr.member_id = m.id
       LEFT JOIN services s ON tr.service_id = s.id
       WHERE tr.technician_id = ? AND tr.type = 'consume' AND tr.created_at LIKE ?
       ORDER BY tr.created_at DESC`
    ).all(Number(technicianId), `${prefix}%`) as Record<string, unknown>[]
    const techData = mapRow(tech) as Record<string, unknown>
    res.json({
      success: true,
      data: {
        id: techData.id,
        name: techData.name,
        transactions: mapRows(transactions),
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/service-detail', (req: Request, res: Response): void => {
  try {
    const { month, serviceId } = req.query
    if (!month || !serviceId) {
      res.status(400).json({ success: false, error: '缺少 month 和 serviceId 参数' })
      return
    }
    const svc = db.prepare('SELECT * FROM services WHERE id = ?').get(Number(serviceId)) as Record<string, unknown> | undefined
    if (!svc) {
      res.status(404).json({ success: false, error: '服务项目不存在' })
      return
    }
    const prefix = `${month}-`
    const transactions = db.prepare(
      `SELECT tr.id, tr.amount, tr.created_at,
              m.name as member_name, tech.name as technician_name
       FROM transactions tr
       LEFT JOIN members m ON tr.member_id = m.id
       LEFT JOIN technicians tech ON tr.technician_id = tech.id
       WHERE tr.service_id = ? AND tr.type = 'consume' AND tr.created_at LIKE ?
       ORDER BY tr.created_at DESC`
    ).all(Number(serviceId), `${prefix}%`) as Record<string, unknown>[]
    const svcData = mapRow(svc) as Record<string, unknown>
    res.json({
      success: true,
      data: {
        id: svcData.id,
        name: svcData.name,
        transactions: mapRows(transactions),
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
