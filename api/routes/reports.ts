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
              COALESCE(tr.consume_count, 0) as appointment_count,
              COALESCE(tr.revenue, 0) as revenue
       FROM technicians t
       LEFT JOIN (
         SELECT technician_id, 
                COUNT(*) as consume_count, 
                SUM(amount) as revenue
         FROM transactions
         WHERE type = 'consume' AND created_at LIKE ?
         GROUP BY technician_id
       ) tr ON t.id = tr.technician_id
       ORDER BY revenue DESC`
    ).all(`${prefix}%`) as Record<string, unknown>[]
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
              COALESCE(tr.consume_count, 0) as appointment_count,
              COALESCE(tr.revenue, 0) as revenue
       FROM services s
       LEFT JOIN (
         SELECT service_id, 
                COUNT(*) as consume_count, 
                SUM(amount) as revenue
         FROM transactions
         WHERE type = 'consume' AND created_at LIKE ?
         GROUP BY service_id
       ) tr ON s.id = tr.service_id
       ORDER BY tr.consume_count DESC, revenue DESC`
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
              m.name as member_name, s.name as service_name, tech.name as technician_name
       FROM transactions tr
       LEFT JOIN members m ON tr.member_id = m.id
       LEFT JOIN services s ON tr.service_id = s.id
       LEFT JOIN technicians tech ON tr.technician_id = tech.id
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
              m.name as member_name, tech.name as technician_name, s.name as service_name
       FROM transactions tr
       LEFT JOIN members m ON tr.member_id = m.id
       LEFT JOIN technicians tech ON tr.technician_id = tech.id
       LEFT JOIN services s ON tr.service_id = s.id
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

router.get('/dashboard-summary', (req: Request, res: Response): void => {
  try {
    const { month } = req.query
    let targetMonth: string
    if (month) {
      targetMonth = `${month}-`
    } else {
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      targetMonth = `${y}-${m}-`
    }

    const revenueRow = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as monthly_revenue
       FROM transactions
       WHERE type = 'consume' AND created_at LIKE ?`
    ).get(`${targetMonth}%`) as Record<string, unknown>

    const rechargeRow = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as monthly_recharge
       FROM transactions
       WHERE type = 'recharge' AND created_at LIKE ?`
    ).get(`${targetMonth}%`) as Record<string, unknown>

    const apptsRow = db.prepare(
      `SELECT COUNT(*) as today_appointments
       FROM appointments
       WHERE date = ?`
    ).get(new Date().toISOString().slice(0, 10)) as Record<string, unknown>

    const membersRow = db.prepare(
      `SELECT COUNT(*) as total_members FROM members`
    ).get() as Record<string, unknown>

    const revenueData = mapRow(revenueRow) as Record<string, unknown>
    const rechargeData = mapRow(rechargeRow) as Record<string, unknown>
    const apptsData = mapRow(apptsRow) as Record<string, unknown>
    const membersData = mapRow(membersRow) as Record<string, unknown>

    res.json({
      success: true,
      data: {
        monthlyRevenue: revenueData.monthlyRevenue ?? 0,
        monthlyRecharge: rechargeData.monthlyRecharge ?? 0,
        todayAppointments: apptsData.todayAppointments ?? 0,
        totalMembers: membersData.totalMembers ?? 0,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
