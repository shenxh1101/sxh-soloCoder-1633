import { Router, type Request, type Response } from 'express'
import db, { mapRow, mapRows } from '../db.js'

const router = Router()

router.get('/recharge', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare('SELECT * FROM recharge_rules ORDER BY recharge_amount').all() as Record<string, unknown>[]
    res.json({ success: true, data: mapRows(rows) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.post('/recharge', (req: Request, res: Response): void => {
  try {
    const { rechargeAmount, bonusAmount } = req.body
    if (rechargeAmount == null || bonusAmount == null) {
      res.status(400).json({ success: false, error: '充值金额和赠送金额必填' })
      return
    }
    const info = db.prepare(
      `INSERT INTO recharge_rules (recharge_amount, bonus_amount)
       VALUES (?, ?)`
    ).run(rechargeAmount, bonusAmount)

    const row = db.prepare('SELECT * FROM recharge_rules WHERE id = ?').get(info.lastInsertRowid) as Record<string, unknown>
    res.status(201).json({ success: true, data: mapRow(row) })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.delete('/recharge/:id', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = db.prepare('SELECT * FROM recharge_rules WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: '规则不存在' })
      return
    }
    db.prepare('DELETE FROM recharge_rules WHERE id = ?').run(id)
    res.json({ success: true, data: { id } })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
