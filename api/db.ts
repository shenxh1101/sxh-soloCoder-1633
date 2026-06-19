import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.resolve(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'app.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  if (obj === null || typeof obj !== 'object') return obj
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    result[camelKey] = obj[key]
  }
  return result
}

export function mapRow<T>(row: Record<string, unknown> | null | undefined): T | null {
  if (!row) return null
  return snakeToCamel(row) as T
}

export function mapRows<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((row) => snakeToCamel(row) as T)
}

const createTablesSql = `
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  birthday TEXT,
  balance REAL DEFAULT 0,
  points INTEGER DEFAULT 0,
  hair_preference TEXT,
  no_show_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS technicians (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  specialties TEXT,
  avatar TEXT
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  duration INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER,
  technician_id INTEGER,
  service_id INTEGER,
  date TEXT,
  time TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (technician_id) REFERENCES technicians(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER,
  technician_id INTEGER,
  service_id INTEGER,
  amount REAL NOT NULL,
  points_earned INTEGER DEFAULT 0,
  type TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (technician_id) REFERENCES technicians(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE IF NOT EXISTS recharge_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recharge_amount REAL NOT NULL,
  bonus_amount REAL NOT NULL
);
`

db.exec(createTablesSql)

const rulesCount = db.prepare('SELECT COUNT(*) as cnt FROM recharge_rules').get() as { cnt: number }
if (rulesCount.cnt === 0) {
  const insertRule = db.prepare(
    'INSERT INTO recharge_rules (recharge_amount, bonus_amount) VALUES (?, ?)'
  )
  insertRule.run(200, 30)
  insertRule.run(500, 100)
  insertRule.run(1000, 300)
}

const servicesCount = db.prepare('SELECT COUNT(*) as cnt FROM services').get() as { cnt: number }
if (servicesCount.cnt === 0) {
  const insertService = db.prepare(
    'INSERT INTO services (name, price, duration) VALUES (?, ?, ?)'
  )
  insertService.run('剪发', 58, 30)
  insertService.run('烫染', 298, 120)
  insertService.run('护理', 168, 60)
}

const techniciansCount = db.prepare('SELECT COUNT(*) as cnt FROM technicians').get() as { cnt: number }
if (techniciansCount.cnt === 0) {
  const insertTech = db.prepare(
    'INSERT INTO technicians (name, phone, specialties, avatar) VALUES (?, ?, ?, ?)'
  )
  insertTech.run('阿明', '13800000001', '剪发、造型', null)
  insertTech.run('小红', '13800000002', '烫染、护理', null)
  insertTech.run('阿杰', '13800000003', '精剪、男士油头', null)
}

const membersCount = db.prepare('SELECT COUNT(*) as cnt FROM members').get() as { cnt: number }
if (membersCount.cnt === 0) {
  const insertMember = db.prepare(
    `INSERT INTO members (name, phone, birthday, balance, points, hair_preference, no_show_count)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  insertMember.run('张三', '13900000001', '1990-05-15', 500, 120, '喜欢简约风格', 0)
  insertMember.run('李四', '13900000002', '1992-08-20', 300, 80, '长发卷发', 1)
  insertMember.run('王五', '13900000003', '1988-11-30', 1200, 250, '短发干练', 0)
  insertMember.run('赵六', '13900000004', '1995-03-10', 0, 0, null, 0)
}

const appointmentsCount = db.prepare('SELECT COUNT(*) as cnt FROM appointments').get() as { cnt: number }
if (appointmentsCount.cnt === 0) {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const tomorrow = new Date(today.getTime() + 86400000)
  const dayAfter = new Date(today.getTime() + 2 * 86400000)

  const insertAppt = db.prepare(
    `INSERT INTO appointments (member_id, technician_id, service_id, date, time, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
  insertAppt.run(1, 1, 1, fmt(today), '10:00', 'completed')
  insertAppt.run(2, 2, 2, fmt(tomorrow), '14:00', 'pending')
  insertAppt.run(3, 3, 3, fmt(dayAfter), '15:30', 'pending')
  insertAppt.run(1, 2, 3, fmt(dayAfter), '11:00', 'pending')
}

export default db
