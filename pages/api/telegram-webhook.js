// pages/api/telegram-webhook.js
// Marathon Skills Bot — с ИИ на Google Gemini (бесплатно)

import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: true } }

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const MARATHON_INFO = {
  date: '15 июня 2026',
  location: 'Marathon Skills, Казахстан',
  distances: ['5 км', '10 км', '21,1 км (полумарафон)', '42,2 км (марафон)'],
  startTime: '07:00',
  registration: 'Регистрация на сайте marathon-skills.vercel.app',
}

const SYSTEM_INSTRUCTION = `Ты — ИИ-ассистент марафона Marathon Skills 2026. Отвечай только на русском, кратко и с эмодзи.
Марафон: 15 июня 2026, Казахстан, старт 07:00. Дистанции: 5км, 10км, 21.1км, 42.2км. Сайт: marathon-skills.vercel.app.
На вопросы не про марафон: "Я помогаю только с информацией о Marathon Skills 2026 🏃"
Максимум 150 слов.`

// AI sessions per chat (in-memory)
const aiSessions = {}
const aiModeUsers = new Set()

async function sendMessage(chatId, text, extra = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
  })
}

async function sendTyping(chatId) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  })
}

function formatParticipant(p) {
  return (
    `👤 <b>${p.first_name} ${p.last_name}</b>\n` +
    `📊 BMI: ${p.bmi ?? '—'} (${p.bmi_category ?? '—'})\n` +
    `🏃 Роль: ${p.role ?? '—'}\n` +
    `🌍 Страна: ${p.country ?? '—'}`
  )
}

function makeKeyboard(buttons) {
  return {
    reply_markup: JSON.stringify({
      keyboard: buttons.map(row => row.map(text => ({ text }))),
      resize_keyboard: true,
      one_time_keyboard: false,
    }),
  }
}

const MAIN_KEYBOARD = makeKeyboard([
  ['🏃 Найти участника', '📊 Статистика'],
  ['📅 О марафоне', '📍 Дистанции'],
  ['⏰ Время старта', '📝 Регистрация'],
  ['🤖 ИИ-ассистент', '❓ Помощь'],
])

const AI_KEYBOARD = makeKeyboard([
  ['🔚 Выйти из ИИ-режима'],
])

async function askGemini(chatId, userText) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    await sendMessage(chatId, '⚠️ ИИ-ассистент не настроен. Добавьте GEMINI_API_KEY в Vercel.', MAIN_KEYBOARD)
    return
  }

  if (!aiSessions[chatId]) aiSessions[chatId] = []
  const history = aiSessions[chatId]

  // Get context
  let contextData = ''
  const lower = userText.toLowerCase()
  if (lower.includes('статист') || lower.includes('сколько') || lower.includes('участник')) {
    const { data } = await supabaseAdmin.from('participants').select('role, country, bmi_category, gender')
    if (data) {
      const total = data.length
      const countries = new Set(data.map(p => p.country).filter(Boolean)).size
      const runners = data.filter(p => p.role === 'Runner').length
      contextData = ` [ДАННЫЕ: участников ${total}, стран ${countries}, бегунов ${runners}]`
    }
  }

  const nameMatches = userText.match(/[А-ЯЁа-яёA-Za-z]{3,}/g) || []
  if (nameMatches.length > 0 && (lower.includes('найди') || lower.includes('есть') || lower.includes('ищу') || lower.includes('бежит'))) {
    for (const term of nameMatches) {
      if (term.length < 3) continue
      const { data: r1 } = await supabaseAdmin.from('participants').select('first_name, last_name, role, country').ilike('last_name', `%${term}%`).limit(3)
      const { data: r2 } = await supabaseAdmin.from('participants').select('first_name, last_name, role, country').ilike('first_name', `%${term}%`).limit(3)
      const found = [...(r1 || []), ...(r2 || [])]
      if (found.length > 0) {
        contextData += ` [НАЙДЕНЫ: ${found.map(p => `${p.first_name} ${p.last_name} (${p.role})`).join('; ')}]`
        break
      }
    }
  }

  const systemText = SYSTEM_INSTRUCTION + contextData

  // Build history for Gemini
  history.push({ role: 'user', parts: [{ text: userText }] })
  if (history.length > 10) history.splice(0, history.length - 10)

  await sendTyping(chatId)

  try {
    const geminiHistory = history.slice(0, -1)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemText }] },
          contents: [
            ...geminiHistory,
            { role: 'user', parts: [{ text: userText }] },
          ],
          generationConfig: { maxOutputTokens: 350, temperature: 0.7 },
        }),
      }
    )

    if (!response.ok) throw new Error('Gemini error')
    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Не смог ответить.'

    history.push({ role: 'model', parts: [{ text: reply }] })

    await sendMessage(chatId, `🤖 <b>ИИ-ассистент:</b>\n\n${reply}`, AI_KEYBOARD)
  } catch {
    await sendMessage(chatId, '⚠️ ИИ временно недоступен. Попробуй позже!', MAIN_KEYBOARD)
    aiModeUsers.delete(chatId)
    delete aiSessions[chatId]
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { message } = req.body
    if (!message) return res.status(200).json({ ok: true })

    const chatId = message.chat.id
    const text = (message.text || '').trim()
    const lower = text.toLowerCase()

    // Exit AI mode
    if (lower === '🔚 выйти из ии-режима' || lower === '/exit' || lower === '/menu') {
      aiModeUsers.delete(chatId)
      delete aiSessions[chatId]
      await sendMessage(chatId, '👋 Вышел из режима ИИ. Используй кнопки меню!', MAIN_KEYBOARD)
      return res.status(200).json({ ok: true })
    }

    // AI mode — handle any message
    if (aiModeUsers.has(chatId)) {
      await askGemini(chatId, text)
      return res.status(200).json({ ok: true })
    }

    // Enter AI mode
    if (lower === '🤖 ии-ассистент' || lower === '/ai') {
      aiModeUsers.add(chatId)
      await sendMessage(chatId,
        `🤖 <b>Режим ИИ-ассистента активирован!</b>\n\n` +
        `Работает на базе <b>Google Gemini</b> ✨\n\n` +
        `Я могу:\n` +
        `• Ответить на любой вопрос о марафоне\n` +
        `• Найти участника по имени/фамилии\n` +
        `• Показать статистику\n` +
        `• Объяснить дистанции и правила\n\n` +
        `Просто напиши вопрос! ✍️\n` +
        `Для выхода нажми <b>🔚 Выйти из ИИ-режима</b>`,
        AI_KEYBOARD
      )
      return res.status(200).json({ ok: true })
    }

    // /start
    if (text === '/start') {
      await sendMessage(chatId,
        `🏃‍♂️ <b>Привет! Я бот марафона Marathon Skills 2026!</b>\n\n` +
        `Я могу:\n` +
        `• 🔍 Найти участника по имени или фамилии\n` +
        `• 📊 Показать статистику участников\n` +
        `• 📅 Рассказать о дате и месте марафона\n` +
        `• 📍 Показать дистанции\n` +
        `• 🤖 Ответить на любой вопрос через ИИ\n\n` +
        `Используй кнопки меню!`,
        MAIN_KEYBOARD
      )
      return res.status(200).json({ ok: true })
    }

    // /help
    if (text === '/help' || lower.includes('помощ') || lower === '❓ помощь') {
      await sendMessage(chatId,
        `📖 <b>Как пользоваться ботом:</b>\n\n` +
        `<b>Поиск участника:</b>\n` +
        `• Напиши имя или фамилию участника\n\n` +
        `<b>🤖 ИИ-ассистент (Gemini):</b>\n` +
        `• Нажми кнопку "🤖 ИИ-ассистент"\n` +
        `• Задавай любые вопросы о марафоне\n\n` +
        `<b>Команды:</b>\n` +
        `/start — главное меню\n` +
        `/stats — статистика\n` +
        `/info — о марафоне\n` +
        `/ai — режим ИИ\n` +
        `/help — справка`,
        MAIN_KEYBOARD
      )
      return res.status(200).json({ ok: true })
    }

    // /stats
    if (text === '/stats' || lower.includes('статистик') || lower === '📊 статистика') {
      const { data, error } = await supabaseAdmin
        .from('participants')
        .select('role, country, bmi_category, gender')

      if (error || !data) {
        await sendMessage(chatId, '⚠️ Не удалось получить статистику.', MAIN_KEYBOARD)
        return res.status(200).json({ ok: true })
      }

      const total = data.length
      const countries = new Set(data.map(p => p.country).filter(Boolean)).size
      const runners = data.filter(p => p.role === 'Runner').length
      const males = data.filter(p => p.gender === 'm').length
      const females = data.filter(p => p.gender === 'f').length
      const normal = data.filter(p => p.bmi_category === 'Normal').length

      await sendMessage(chatId,
        `📊 <b>Статистика участников</b>\n\n` +
        `👥 Всего зарегистрировано: <b>${total}</b>\n` +
        `🌍 Стран представлено: <b>${countries}</b>\n` +
        `🏃 Бегунов: <b>${runners}</b>\n` +
        `👨 Мужчин: <b>${males}</b> | 👩 Женщин: <b>${females}</b>\n` +
        `💚 Нормальный BMI: <b>${normal}</b> из ${total}`,
        MAIN_KEYBOARD
      )
      return res.status(200).json({ ok: true })
    }

    // /info
    if (text === '/info' || lower === '📅 о марафоне' || lower.includes('информаци') || lower.includes('о марафоне')) {
      await sendMessage(chatId,
        `📅 <b>Marathon Skills 2026</b>\n\n` +
        `🗓 Дата: <b>${MARATHON_INFO.date}</b>\n` +
        `📍 Место: <b>${MARATHON_INFO.location}</b>\n` +
        `⏰ Старт: <b>${MARATHON_INFO.startTime}</b>\n` +
        `📝 ${MARATHON_INFO.registration}`,
        MAIN_KEYBOARD
      )
      return res.status(200).json({ ok: true })
    }

    // Дистанции
    if (lower === '📍 дистанции' || lower.includes('дистанци')) {
      await sendMessage(chatId,
        `📍 <b>Дистанции марафона</b>\n\n` +
        MARATHON_INFO.distances.map(d => `• ${d}`).join('\n') +
        `\n\n<i>Выбери свою дистанцию при регистрации!</i>`,
        MAIN_KEYBOARD
      )
      return res.status(200).json({ ok: true })
    }

    // Время старта
    if (lower === '⏰ время старта' || lower.includes('время') || lower.includes('старт') || lower.includes('начало')) {
      await sendMessage(chatId,
        `⏰ <b>Время старта</b>\n\n` +
        `Марафон стартует в <b>${MARATHON_INFO.startTime}</b>\n` +
        `📅 Дата: <b>${MARATHON_INFO.date}</b>\n\n` +
        `Приходи заранее — регистрация стартов открывается в 06:00!`,
        MAIN_KEYBOARD
      )
      return res.status(200).json({ ok: true })
    }

    // Регистрация
    if (lower === '📝 регистрация' || lower.includes('зарегистрир') || lower.includes('как записаться')) {
      await sendMessage(chatId,
        `📝 <b>Регистрация на марафон</b>\n\n` +
        `🌐 <b>marathon-skills.vercel.app</b>\n\n` +
        `• Рассчитай BMI\n• Заполни форму\n• Получи подтверждение\n\n` +
        `Регистрация открыта до <b>${MARATHON_INFO.date}</b>!`,
        MAIN_KEYBOARD
      )
      return res.status(200).json({ ok: true })
    }

    // Кнопка "Найти участника"
    if (lower === '🏃 найти участника') {
      await sendMessage(chatId,
        `🔍 Введи имя или фамилию участника.\n\nНапример: <b>Иванов</b> или <b>Анна</b>`,
        MAIN_KEYBOARD
      )
      return res.status(200).json({ ok: true })
    }

    // Поиск участника
    if (text.length >= 2 && !lower.startsWith('/')) {
      const searchTerm = text.replace(/[^а-яёА-ЯЁa-zA-Z\s-]/g, '').trim()
      if (!searchTerm) {
        await sendMessage(chatId, '❓ Введи имя или фамилию участника.', MAIN_KEYBOARD)
        return res.status(200).json({ ok: true })
      }

      const { data: byLast } = await supabaseAdmin
        .from('participants')
        .select('id, first_name, last_name, bmi, bmi_category, role, country')
        .ilike('last_name', `%${searchTerm}%`)
        .limit(10)

      const { data: byFirst } = await supabaseAdmin
        .from('participants')
        .select('id, first_name, last_name, bmi, bmi_category, role, country')
        .ilike('first_name', `%${searchTerm}%`)
        .limit(10)

      const seen = new Set()
      const combined = [...(byLast || []), ...(byFirst || [])].filter(p => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })

      if (combined.length === 0) {
        await sendMessage(chatId,
          `😔 Участник «<b>${searchTerm}</b>» не найден.\n\nПроверь написание или попробуй другой вариант.\n\n💡 Используй <b>🤖 ИИ-ассистента</b> для умного поиска!`,
          MAIN_KEYBOARD
        )
        return res.status(200).json({ ok: true })
      }

      if (combined.length === 1) {
        await sendMessage(chatId, `✅ Найден участник:\n\n${formatParticipant(combined[0])}`, MAIN_KEYBOARD)
        return res.status(200).json({ ok: true })
      }

      const list = combined.slice(0, 8).map((p, i) => `${i + 1}. ${formatParticipant(p)}`).join('\n\n')
      await sendMessage(chatId,
        `🔍 По запросу «<b>${searchTerm}</b>» найдено <b>${combined.length}</b> участник(ов):\n\n${list}${combined.length > 8 ? '\n\n<i>...ещё ' + (combined.length - 8) + '. Уточни запрос.</i>' : ''}`,
        MAIN_KEYBOARD
      )
      return res.status(200).json({ ok: true })
    }

    await sendMessage(chatId,
      `❓ Не понял запрос. Используй кнопки меню!\n\n💡 Попробуй <b>🤖 ИИ-ассистента</b> — он ответит на любой вопрос!`,
      MAIN_KEYBOARD
    )
    return res.status(200).json({ ok: true })

  } catch (err) {
    console.error('Telegram webhook error:', err)
    return res.status(200).json({ ok: true })
  }
}
