import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { login, password } = req.body
  if (!login || !password) return res.status(400).json({ error: 'Введите логин и пароль' })

  const { data, error } = await supabase
    .from('participants')
    .select('id, first_name, last_name, login, password')
    .ilike('login', login.trim())
    .single()

  if (error || !data) {
    return res.status(401).json({ error: 'Неверный логин или пароль' })
  }

  if (data.password !== password) {
    return res.status(401).json({ error: 'Неверный логин или пароль' })
  }

  return res.status(200).json({ id: data.id, first_name: data.first_name, last_name: data.last_name })
}
