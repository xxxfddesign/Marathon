// pages/api/export-import.js
// Export: GET /api/export-import?format=csv|json  (admin only)
// Import: POST /api/export-import  (admin only)

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ADMIN_SECRET = 'marathon_admin_2026'

function toCSV(data) {
  if (!data.length) return ''
  const headers = ['id', 'first_name', 'last_name', 'email', 'phone', 'country', 'role', 'gender', 'birth_date', 'bmi', 'bmi_category', 'created_at']
  const rows = data.map(p =>
    headers.map(h => {
      const v = p[h] ?? ''
      // Escape commas/quotes
      return typeof v === 'string' && (v.includes(',') || v.includes('"') || v.includes('\n'))
        ? `"${v.replace(/"/g, '""')}"`
        : v
    }).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const values = []
    let current = '', inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        values.push(current); current = ''
      } else {
        current += ch
      }
    }
    values.push(current)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = values[i]?.trim() || null })
    return obj
  })
}

export default async function handler(req, res) {
  const secret = req.headers['x-admin-secret']
  if (secret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // EXPORT
  if (req.method === 'GET') {
    const format = req.query.format || 'csv'

    const { data, error } = await supabaseAdmin
      .from('participants')
      .select('id, first_name, last_name, email, phone, country, role, gender, birth_date, bmi, bmi_category, created_at')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="marathon_participants_${Date.now()}.json"`)
      return res.status(200).send(JSON.stringify(data, null, 2))
    }

    // CSV
    const csv = toCSV(data)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="marathon_participants_${Date.now()}.csv"`)
    // BOM for Excel UTF-8
    return res.status(200).send('\uFEFF' + csv)
  }

  // IMPORT
  if (req.method === 'POST') {
    const { rows, mode = 'upsert' } = req.body
    // rows: array of participant objects
    // mode: 'upsert' (update if email exists) | 'insert' (skip existing)

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided' })
    }

    const ALLOWED_FIELDS = ['first_name', 'last_name', 'email', 'phone', 'country', 'role', 'gender', 'birth_date', 'bmi', 'bmi_category']
    const VALID_ROLES = ['Runner', 'Coordinator', 'Administrator']
    const VALID_GENDERS = ['m', 'f', null, '']

    const cleaned = rows.map(r => {
      const obj = {}
      for (const f of ALLOWED_FIELDS) {
        if (r[f] !== undefined) obj[f] = r[f] || null
      }
      // Validate role
      if (obj.role && !VALID_ROLES.includes(obj.role)) obj.role = 'Runner'
      // Validate gender
      if (obj.gender && !VALID_GENDERS.includes(obj.gender)) obj.gender = null
      // Parse BMI
      if (obj.bmi) obj.bmi = parseFloat(obj.bmi) || null
      return obj
    }).filter(r => r.first_name && r.last_name && r.email)

    if (cleaned.length === 0) {
      return res.status(400).json({ error: 'No valid rows (need first_name, last_name, email)' })
    }

    let inserted = 0, updated = 0, skipped = 0, errors = []

    for (const row of cleaned) {
      // Check if email exists
      const { data: existing } = await supabaseAdmin
        .from('participants')
        .select('id')
        .eq('email', row.email)
        .single()

      if (existing) {
        if (mode === 'upsert') {
          const { error: upErr } = await supabaseAdmin
            .from('participants')
            .update(row)
            .eq('email', row.email)
          if (upErr) errors.push({ email: row.email, error: upErr.message })
          else updated++
        } else {
          skipped++
        }
      } else {
        const { error: insErr } = await supabaseAdmin
          .from('participants')
          .insert(row)
        if (insErr) errors.push({ email: row.email, error: insErr.message })
        else inserted++
      }
    }

    return res.status(200).json({
      ok: true,
      inserted,
      updated,
      skipped,
      errors: errors.slice(0, 5),
      total: cleaned.length,
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
