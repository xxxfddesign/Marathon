import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  const { id } = req.query

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('participants').select('*').eq('id', id).single()
    if (error) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json(data)
  }

  if (req.method === 'PUT') {
    const b = req.body
    const { data, error } = await supabase.from('participants').update({
      first_name: b.first_name, last_name: b.last_name, email: b.email,
      phone: b.phone, country: b.country, birth_date: b.birth_date,
      gender: b.gender, role: b.role, bmi: b.bmi, bmi_category: b.bmi_category,
    }).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('participants').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(204).end()
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
