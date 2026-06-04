import { supabase } from '../../lib/supabase'

// Отключаем стандартный body parser Next.js (Telegram шлёт JSON)
export const config = {
  api: {
    bodyParser: true,
  },
}

/**
 * Отправляет сообщение пользователю через Telegram Bot API
 */
async function sendMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const url = `https://api.telegram.org/bot${token}/sendMessage`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

export default async function handler(req, res) {
  // Telegram шлёт только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body

    // Получаем сообщение из update
    const message = body?.message
    if (!message) {
      // Telegram может слать другие типы апдейтов (callback_query и т.д.) — просто игнорируем
      return res.status(200).json({ ok: true })
    }

    const chatId = message.chat.id
    const text = (message.text || '').trim()

    // Команда /start — приветствие
    if (text === '/start') {
      await sendMessage(
        chatId,
        'Привет! 👋\nЯ бот марафона.\nОтправь мне фамилию участника, и я найду его BMI в базе.\n\nПример: Иванов'
      )
      return res.status(200).json({ ok: true })
    }

    if (!text) {
      await sendMessage(chatId, 'Пожалуйста, введи фамилию участника.')
      return res.status(200).json({ ok: true })
    }

    // Ищем участника по фамилии (last_name = surname, bmi = value)
    const { data, error } = await supabase
      .from('participants')
      .select('last_name, bmi, bmi_category, first_name, role')
      .ilike('last_name', text)   // регистронезависимый поиск
      .limit(1)
      .single()

    if (error || !data) {
      await sendMessage(chatId, `Фамилия «${text}» не найдена в базе.`)
      return res.status(200).json({ ok: true })
    }

    const reply =
      `Фамилия ${data.last_name} → значение: ${data.bmi ?? 'не указано'}\n` +
      `👤 ${data.first_name} ${data.last_name}\n` +
      `📊 BMI: ${data.bmi ?? '—'} (${data.bmi_category ?? '—'})\n` +
      `🏃 Роль: ${data.role ?? '—'}`

    await sendMessage(chatId, reply)
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Telegram webhook error:', err)
    // Всегда возвращаем 200, чтобы Telegram не ретраил
    return res.status(200).json({ ok: true })
  }
}
