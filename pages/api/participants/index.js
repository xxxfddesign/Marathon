import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // GET is public — list participants
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

    // Validate login uniqueness if provided
    if (b.login) {
      const { data: existing } = await supabase
        .from('participants')
        .select('id')
        .ilike('login', b.login.trim())
        .maybeSingle()
      if (existing) {
        return res.status(409).json({ error: 'Этот login уже занят. Выберите другой.' })
      }
    }

    const insertData = {
      first_name: b.first_name,
      last_name: b.last_name,
      email: b.email,
      phone: b.phone,
      country: b.country,
      birth_date: b.birth_date,
      gender: b.gender,
      role: b.role || 'Runner',
      bmi: b.bmi,
      bmi_category: b.bmi_category,
    }

    if (b.login) insertData.login = b.login.trim().toLowerCase()
    if (b.password) insertData.password = b.password

    // Optionally attach Google user_id if session exists
    try {
      const session = await getServerSession(req, res, authOptions)
      if (session?.user?.id) insertData.user_id = session.user.id
    } catch {}

    const { data, error } = await supabase
      .from('participants')
      .insert([insertData])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
