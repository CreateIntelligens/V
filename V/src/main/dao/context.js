import { connect } from '../db/index.js'

export function update(key, val) {
  const db = connect()
  const info = db.prepare('update context set val = ? where key = ?').run(val, key)
  return info
}

export function findByKey(key) {
  const db = connect()
  return db.prepare('select val from context where key = ?').get(key)
}

export function selectAll() {
  const db = connect()
  return db.prepare('select * from context').all()
}

export function insert(key, val) {
  const db = connect()
  const info = db.prepare('insert into context (key, val) values (?, ?)').run(key, val)
  return info
}
