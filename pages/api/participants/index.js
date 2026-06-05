import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  const userId = session.user.id

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

  if (req.method === 'POST') {
    const b = req.body
    const { data, error } = await supabase.from('participants').insert([{
      user_id: userId,
      first_name: b.first_name, last_name: b.last_name,
      email: b.email, phone: b.phone, country: b.country,
      birth_date: b.birth_date, gender: b.gender,
      role: b.role || 'Runner', bmi: b.bmi, bmi_category: b.bmi_category,
      login: b.login || null, password: b.password || null,
    }]).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
