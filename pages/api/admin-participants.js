import { supabase } from '../../lib/supabase'

// Простая проверка секретного ключа для админа
const ADMIN_SECRET = 'marathon_admin_2026'

export default async function handler(req, res) {
  const secret = req.headers['x-admin-secret']
  if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { search, role, sort } = req.query
    let q = supabase.from('participants').select('*')
    if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,country.ilike.%${search}%`)
    if (role && role !== 'All') q = q.eq('role', role)
    const sortMap = {
      Id:['id',true], FirstName:['first_name',true], LastName:['last_name',true],
      BmiAsc:['bmi',true], BmiDesc:['bmi',false],
      AgeAsc:['birth_date',false], AgeDesc:['birth_date',true],
    }
    const [col, asc] = sortMap[sort] || ['id', true]
    q = q.order(col, { ascending: asc })
    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const { error } = await supabase.from('participants').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'PUT') {
    const { id } = req.query
    const { error } = await supabase.from('participants').update(req.body).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
