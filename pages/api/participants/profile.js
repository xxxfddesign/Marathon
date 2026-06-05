import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  const id = req.query.id || req.body?.id
  if (!id) return res.status(400).json({ error: 'Нет id' })

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('participants')
      .select('id, first_name, last_name, email, phone, birth_date, country, gender, role, bmi, bmi_category, login')
      .eq('id', id)
      .single()
    if (error || !data) return res.status(404).json({ error: 'Участник не найден' })
    return res.status(200).json(data)
  }

  if (req.method === 'PUT') {
    const b = req.body
    const updates = {}
    if (b.first_name !== undefined) updates.first_name = b.first_name
    if (b.last_name  !== undefined) updates.last_name  = b.last_name
    if (b.email      !== undefined) updates.email      = b.email
    if (b.phone      !== undefined) updates.phone      = b.phone
    if (b.birth_date !== undefined) updates.birth_date = b.birth_date
    if (b.country    !== undefined) updates.country    = b.country
    if (b.gender     !== undefined) updates.gender     = b.gender
    if (b.password   !== undefined && b.password.length >= 6) updates.password = b.password

    const { data, error } = await supabase
      .from('participants')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
