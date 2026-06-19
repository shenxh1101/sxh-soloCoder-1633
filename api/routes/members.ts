import { Router, type Request, type Response } from 'express'
import db, { mapRow, mapRows } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare('SELECT * FROM members ORDER BY created_at DESC').all() as Record<string, unknown>[]
    res.json({ success: true, data: mapRows(rows) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/birthdays', (req: Request, res: Response): void => {
  try {
    const today = new Date()
    const currentYear = today.getFullYear()
    const todayMd = today.toISOString().slice(5, 10)
    const sevenDays = new Date(today.getTime() + 7 * 86400000)
    const sevenMd = sevenDays.toISOString().slice(5, 10)

    let rows: Record<string, unknown>[]
    if (todayMd <= sevenMd) {
      rows = db.prepare(
        `SELECT m.* FROM members m
         LEFT JOIN birthday_records br ON m.id = br.member_id AND br.year = ?
         WHERE m.birthday IS NOT NULL
           AND strftime('%m-%d', m.birthday) BETWEEN ? AND ?
           AND br.id IS NULL
         ORDER BY strftime('%m-%d', m.birthday)`
      ).all(currentYear, todayMd, sevenMd) as Record<string, unknown>[]
    } else {
      rows = db.prepare(
        `SELECT m.* FROM members m
         LEFT JOIN birthday_records br ON m.id = br.member_id AND br.year = ?
         WHERE m.birthday IS NOT NULL
           AND (strftime('%m-%d', m.birthday) >= ? OR strftime('%m-%d', m.birthday) <= ?)
           AND br.id IS NULL
         ORDER BY strftime('%m-%d', m.birthday)`
      ).all(currentYear, todayMd, sevenMd) as Record<string, unknown>[]
    }

    res.json({ success: true, data: mapRows(rows) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.post('/:id/birthday-handle', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10)
    const { note } = req.body
    const currentYear = new Date().getFullYear()

    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id)
    if (!member) {
      res.status(404).json({ success: false, error: '会员不存在' })
      return
    }

    const existing = db.prepare(
      'SELECT * FROM birthday_records WHERE member_id = ? AND year = ?'
    ).get(id, currentYear)

    if (existing) {
      db.prepare(
        'UPDATE birthday_records SET note = ?, handled_at = CURRENT_TIMESTAMP WHERE member_id = ? AND year = ?'
      ).run(note || null, id, currentYear)
    } else {
      db.prepare(
        'INSERT INTO birthday_records (member_id, year, note) VALUES (?, ?, ?)'
      ).run(id, currentYear, note || null)
    }

    const record = db.prepare(
      'SELECT * FROM birthday_records WHERE member_id = ? AND year = ?'
    ).get(id, currentYear) as Record<string, unknown>

    res.json({ success: true, data: mapRow(record) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10)
    const row = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!row) {
      res.status(404).json({ success: false, error: '会员不存在' })
      return
    }
    res.json({ success: true, data: mapRow(row) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/:id/transactions', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10)
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id)
    if (!member) {
      res.status(404).json({ success: false, error: '会员不存在' })
      return
    }
    const rows = db.prepare(
      `SELECT t.id, t.amount, t.bonus_amount, t.points_earned, t.type, t.created_at,
              tech.name as technician_name, s.name as service_name
       FROM transactions t
       LEFT JOIN technicians tech ON t.technician_id = tech.id
       LEFT JOIN services s ON t.service_id = s.id
       WHERE t.member_id = ?
       ORDER BY t.created_at DESC`
    ).all(id) as Record<string, unknown>[]
    res.json({ success: true, data: mapRows(rows) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/:id/birthday-records', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10)
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id)
    if (!member) {
      res.status(404).json({ success: false, error: '会员不存在' })
      return
    }
    const rows = db.prepare(
      `SELECT id, member_id, year, handled_at, note
       FROM birthday_records
       WHERE member_id = ?
       ORDER BY year DESC`
    ).all(id) as Record<string, unknown>[]
    res.json({ success: true, data: mapRows(rows) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, phone, birthday, hairPreference } = req.body
    if (!name || !phone) {
      res.status(400).json({ success: false, error: '姓名和手机号必填' })
      return
    }
    const info = db.prepare(
      `INSERT INTO members (name, phone, birthday, hair_preference)
       VALUES (?, ?, ?, ?)`
    ).run(name, phone, birthday || null, hairPreference || null)

    const row = db.prepare('SELECT * FROM members WHERE id = ?').get(info.lastInsertRowid) as Record<string, unknown>
    res.status(201).json({ success: true, data: mapRow(row) })
  } catch (err) {
    const msg = (err as Error).message
    if (msg.includes('UNIQUE')) {
      res.status(400).json({ success: false, error: '手机号已存在' })
    } else {
      res.status(500).json({ success: false, error: msg })
    }
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: '会员不存在' })
      return
    }
    const { name, phone, birthday, balance, points, hairPreference, noShowCount } = req.body
    db.prepare(
      `UPDATE members
       SET name = COALESCE(?, name),
           phone = COALESCE(?, phone),
           birthday = COALESCE(?, birthday),
           balance = COALESCE(?, balance),
           points = COALESCE(?, points),
           hair_preference = COALESCE(?, hair_preference),
           no_show_count = COALESCE(?, no_show_count)
       WHERE id = ?`
    ).run(
      name ?? null,
      phone ?? null,
      birthday ?? null,
      balance ?? null,
      points ?? null,
      hairPreference ?? null,
      noShowCount ?? null,
      id
    )
    const row = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Record<string, unknown>
    res.json({ success: true, data: mapRow(row) })
  } catch (err) {
    const msg = (err as Error).message
    if (msg.includes('UNIQUE')) {
      res.status(400).json({ success: false, error: '手机号已存在' })
    } else {
      res.status(500).json({ success: false, error: msg })
    }
  }
})

router.post('/:id/recharge', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10)
    const { amount, bonusAmount } = req.body
    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: '充值金额必须大于0' })
      return
    }
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id)
    if (!member) {
      res.status(404).json({ success: false, error: '会员不存在' })
      return
    }

    let bonus: number
    if (bonusAmount !== undefined && bonusAmount !== null) {
      bonus = Number(bonusAmount)
    } else {
      const rule = db.prepare(
        `SELECT * FROM recharge_rules
         WHERE recharge_amount <= ?
         ORDER BY bonus_amount DESC
         LIMIT 1`
      ).get(amount) as { bonus_amount: number; recharge_amount: number } | undefined
      bonus = rule ? rule.bonus_amount : 0
    }
    const total = amount + bonus

    const tx = db.transaction(() => {
      db.prepare('UPDATE members SET balance = balance + ? WHERE id = ?').run(total, id)
      const info = db.prepare(
        `INSERT INTO transactions (member_id, amount, bonus_amount, type)
         VALUES (?, ?, ?, 'recharge')`
      ).run(id, amount, bonus)
      return info.lastInsertRowid
    })

    const txId = tx()
    const row = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Record<string, unknown>
    res.json({
      success: true,
      data: {
        member: mapRow(row),
        rechargeAmount: amount,
        bonusAmount: bonus,
        transactionId: txId,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.post('/:id/consume', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10)
    const { amount, technicianId, serviceId } = req.body
    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: '消费金额必须大于0' })
      return
    }
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as { balance: number } | undefined
    if (!member) {
      res.status(404).json({ success: false, error: '会员不存在' })
      return
    }
    if (member.balance < amount) {
      res.status(400).json({ success: false, error: '余额不足' })
      return
    }

    const pointsEarned = Math.floor(amount)

    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const tx = db.transaction(() => {
      db.prepare('UPDATE members SET balance = balance - ?, points = points + ? WHERE id = ?').run(
        amount,
        pointsEarned,
        id
      )
      const info = db.prepare(
        `INSERT INTO transactions (member_id, technician_id, service_id, amount, points_earned, type)
         VALUES (?, ?, ?, ?, ?, 'consume')`
      ).run(id, technicianId || null, serviceId || null, amount, pointsEarned)

      if (technicianId && serviceId) {
        db.prepare(
          `INSERT INTO appointments (member_id, technician_id, service_id, date, time, status)
           VALUES (?, ?, ?, ?, ?, 'completed')`
        ).run(id, technicianId, serviceId, today, currentTime)
      }

      return info.lastInsertRowid
    })

    const txId = tx()
    const row = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Record<string, unknown>
    res.json({
      success: true,
      data: {
        member: mapRow(row),
        pointsEarned,
        transactionId: txId,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.post('/:id/birthday-handle', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10)
    const { note } = req.body
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id)
    if (!member) {
      res.status(404).json({ success: false, error: '会员不存在' })
      return
    }

    const year = new Date().getFullYear()

    db.prepare(
      `INSERT OR REPLACE INTO birthday_records (member_id, year, note)
       VALUES (?, ?, ?)`
    ).run(id, year, note || null)

    res.json({ success: true, data: null })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
