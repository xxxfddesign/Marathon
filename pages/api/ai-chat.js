// pages/api/ai-chat.js
// ИИ-ассистент на Groq (бесплатно!)
// Получить ключ: https://console.groq.com → API Keys
// Добавить в Vercel: GROQ_API_KEY

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const SYSTEM_INSTRUCTION = `Ты — умный и дружелюбный ИИ-ассистент марафона Marathon Skills 2026. Помогаешь участникам и гостям.

ИНФОРМАЦИЯ О МАРАФОНЕ:
- Название: Marathon Skills 2026
- Дата: 25 июня 2026 года
- Место: Казахстан
- Время старта: 07:00 (регистрация стартов с 06:00)
- Дистанции: 5 км, 10 км, 21,1 км (полумарафон), 42,2 км (марафон)
- Сайт: https://marathon-sepia-five.vercel.app
- Регистрация: через форму на сайте

ПРАВИЛА:
1. Отвечай только на русском языке
2. Будь дружелюбным, коротким и полезным (до 200 слов)
3. Используй эмодзи для удобства
4. Если тебе передали данные из базы — используй их
5. На вопросы не о марафоне: "Я специализируюсь на Marathon Skills 2026! Задай вопрос о марафоне 🏃"
6. Не выдумывай данные об участниках которых нет в базе`

async function getContextData(userMessage) {
  const lower = userMessage.toLowerCase()

  if (lower.includes('статист') || lower.includes('сколько') || lower.includes('участник')) {
    const { data } = await supabaseAdmin
      .from('participants')
      .select('role, country, bmi_category, gender')
    if (data) {
      const total = data.length
      const countries = new Set(data.map(p => p.country).filter(Boolean)).size
      const runners = data.filter(p => p.role === 'Runner').length
      const males = data.filter(p => p.gender === 'm').length
      const females = data.filter(p => p.gender === 'f').length
      return `[ДАННЫЕ ИЗ БАЗЫ: всего участников ${total}, стран ${countries}, бегунов ${runners}, мужчин ${males}, женщин ${females}]`
    }
  }

  const nameMatches = userMessage.match(/[А-ЯЁа-яёA-Za-z]{3,}/g) || []
  if (nameMatches.length > 0 && (lower.includes('найди') || lower.includes('есть ли') || lower.includes('ищу') || lower.includes('бежит') || lower.includes('зарегистрир'))) {
    for (const term of nameMatches) {
      if (term.length < 3) continue
      const { data: r1 } = await supabaseAdmin.from('participants').select('first_name, last_name, role, country').ilike('last_name', `%${term}%`).limit(3)
      const { data: r2 } = await supabaseAdmin.from('participants').select('first_name, last_name, role, country').ilike('first_name', `%${term}%`).limit(3)
      const found = [...(r1 || []), ...(r2 || [])]
      if (found.length > 0) {
        return `[НАЙДЕНЫ УЧАСТНИКИ по "${term}": ${found.map(p => `${p.first_name} ${p.last_name} (${p.role}, ${p.country})`).join('; ')}]`
      }
      if ((r1 && r1.length === 0) && (r2 && r2.length === 0)) {
        return `[ПОИСК по "${term}": участник не найден в базе]`
      }
    }
  }

  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages, userMessage } = req.body
  if (!userMessage || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(200).json({ reply: '⚠️ ИИ-ассистент не настроен. Добавьте GROQ_API_KEY в Vercel.' })
  }

  try {
    const contextData = await getContextData(userMessage)
    const systemText = contextData
      ? SYSTEM_INSTRUCTION + '\n\n' + contextData
      : SYSTEM_INSTRUCTION

    const historySlice = messages.slice(-10)
    const chatMessages = [
      { role: 'system', content: systemText },
      ...historySlice.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: chatMessages,
        max_tokens: 512,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || 'Groq API error')
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content
      || 'Извини, не смог ответить. Попробуй снова!'

    return res.status(200).json({ reply })
  } catch (err) {
    console.error('AI chat error:', err)
    return res.status(200).json({
      reply: '⚠️ ИИ-ассистент временно недоступен. Попробуй позже или напиши боту в Telegram!',
      error: true,
    })
  }
}
