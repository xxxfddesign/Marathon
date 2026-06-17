// pages/api/daily-stats.js
// Vercel Cron Job: runs daily at 09:00 Kazakhstan time (04:00 UTC)
// Setup in vercel.json: { "crons": [{ "path": "/api/daily-stats", "schedule": "0 4 * * *" }] }

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!token || !adminChatId) return false

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: adminChatId, text, parse_mode: 'HTML' }),
  })
  return res.ok
}

export default async function handler(req, res) {
  // Allow cron calls (no Authorization header from Vercel internally)
  // But protect manual calls with a secret
  if (req.method === 'POST') {
    const secret = req.headers['x-cron-secret']
    if (secret && secret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  try {
    const { data: all, error } = await supabaseAdmin
      .from('participants')
      .select('role, country, bmi_category, gender, created_at')

    if (error) throw error

    const total = all.length
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const newToday = all.filter(p => new Date(p.created_at) >= today).length

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const newYesterday = all.filter(p => {
      const d = new Date(p.created_at)
      return d >= yesterday && d < today
    }).length

    const countries = new Set(all.map(p => p.country).filter(Boolean))
    const runners = all.filter(p => p.role === 'Runner').length
    const coordinators = all.filter(p => p.role === 'Coordinator').length
    const admins = all.filter(p => p.role === 'Administrator').length
    const males = all.filter(p => p.gender === 'm').length
    const females = all.filter(p => p.gender === 'f').length
    const normalBmi = all.filter(p => p.bmi_category === 'Normal').length

    const date = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Almaty' })

    const trendIcon = newToday > newYesterday ? '📈' : newToday < newYesterday ? '📉' : '➡️'

    const message =
      `📊 <b>Ежедневная статистика марафона</b>\n` +
      `📅 ${date}\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `👥 <b>Всего участников:</b> ${total}\n` +
      `${trendIcon} Новых сегодня: <b>${newToday}</b>\n` +
      `📆 Вчера зарегистрировалось: ${newYesterday}\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `🏃 Бегунов: <b>${runners}</b>\n` +
      `📋 Координаторов: ${coordinators}\n` +
      `⭐ Администраторов: ${admins}\n\n` +
      `👨 Мужчин: ${males} | 👩 Женщин: ${females}\n` +
      `🌍 Стран: <b>${countries.size}</b>\n` +
      `💚 Норма BMI: ${normalBmi} из ${total}\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `🌐 <a href="https://marathon-skills.vercel.app/admin">Открыть панель управления</a>`

    const sent = await sendTelegramMessage(message)

    return res.status(200).json({
      ok: true,
      sent,
      stats: { total, newToday, countries: countries.size }
    })
  } catch (err) {
    console.error('Daily stats error:', err)
    return res.status(500).json({ error: err.message })
  }
}
