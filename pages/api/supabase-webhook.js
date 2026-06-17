// pages/api/supabase-webhook.js
// Supabase Database Webhook → Telegram admin notifications
// Setup: Supabase Dashboard → Database → Webhooks → Add Webhook
//   URL: https://your-site.vercel.app/api/supabase-webhook
//   Table: participants, Events: INSERT, UPDATE, DELETE
//   Add Header: x-webhook-secret = SUPABASE_WEBHOOK_SECRET

export const config = { api: { bodyParser: true } }

async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!token || !adminChatId) return

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: adminChatId,
      text,
      parse_mode: 'HTML',
    }),
  })
}

function formatRecord(record) {
  if (!record) return '—'
  return (
    `👤 <b>${record.first_name || ''} ${record.last_name || ''}</b>\n` +
    `📧 ${record.email || '—'}\n` +
    `🏃 Роль: ${record.role || '—'}\n` +
    `🌍 Страна: ${record.country || '—'}\n` +
    `📊 BMI: ${record.bmi || '—'} (${record.bmi_category || '—'})`
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Verify webhook secret (optional but recommended)
  const secret = req.headers['x-webhook-secret']
  if (process.env.SUPABASE_WEBHOOK_SECRET && secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { type, record, old_record, table } = req.body

    if (table !== 'participants') return res.status(200).json({ ok: true })

    const now = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })

    if (type === 'INSERT') {
      await sendTelegramMessage(
        `🎉 <b>Новая регистрация!</b>\n` +
        `🕐 ${now}\n\n` +
        formatRecord(record) +
        `\n\n🌐 <a href="https://marathon-skills.vercel.app/admin">Открыть панель</a>`
      )
    }

    if (type === 'UPDATE') {
      const changes = []
      const keys = ['first_name', 'last_name', 'email', 'role', 'country', 'bmi', 'bmi_category']
      for (const k of keys) {
        if (old_record && record && old_record[k] !== record[k]) {
          changes.push(`• ${k}: <s>${old_record[k] || '—'}</s> → <b>${record[k] || '—'}</b>`)
        }
      }
      if (changes.length > 0) {
        await sendTelegramMessage(
          `✏️ <b>Данные участника обновлены</b>\n` +
          `🕐 ${now}\n\n` +
          `👤 <b>${record.first_name} ${record.last_name}</b>\n\n` +
          `<b>Изменения:</b>\n${changes.join('\n')}`
        )
      }
    }

    if (type === 'DELETE') {
      await sendTelegramMessage(
        `🗑 <b>Участник удалён</b>\n` +
        `🕐 ${now}\n\n` +
        formatRecord(old_record)
      )
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Supabase webhook error:', err)
    return res.status(200).json({ ok: true })
  }
}
