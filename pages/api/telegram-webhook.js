import { supabase } from '../../lib/supabase'

export const config = { api: { bodyParser: true } }

const MARATHON_INFO = {
  date: '15 июня 2026',
  location: 'Marathon Skills, Казахстан',
  distances: ['5 км', '10 км', '21,1 км (полумарафон)', '42,2 км (марафон)'],
  startTime: '07:00',
  registration: 'Регистрация на сайте marathon-skills.vercel.app',
  contact: 'Вопросы: через форму на сайте',
}

async function sendMessage(chatId, text, extra = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
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
  ['❓ Помощь'],
])

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const body = req.body
    const message = body?.message
    if (!message) return res.status(200).json({ ok: true })

    const chatId = message.chat.id
    const text = (message.text || '').trim()
    const lower = text.toLowerCase()

    // /start
    if (text === '/start') {
      await sendMessage(chatId,
        `🏃‍♂️ <b>Привет! Я бот марафона Marathon Skills 2026!</b>\n\n` +
        `Я могу:\n` +
        `• 🔍 Найти участника по имени или фамилии\n` +
        `• 📊 Показать статистику участников\n` +
        `• 📅 Рассказать о дате и месте марафона\n` +
        `• 📍 Показать дистанции\n` +
        `• ⏰ Сообщить время старта\n\n` +
        `Используй кнопки меню или просто напиши имя/фамилию участника!`,
        MAIN_KEYBOARD
      )
      return res.status(200).json({ ok: true })
    }

    // /help или "помощь"
    if (text === '/help' || lower.includes('помощ') || lower === '❓ помощь') {
      await sendMessage(chatId,
        `📖 <b>Как пользоваться ботом:</b>\n\n` +
        `<b>Поиск участника:</b>\n` +
        `• Напиши имя или фамилию участника\n` +
        `• При совпадении нескольких — покажу всех\n\n` +
        `<b>Команды:</b>\n` +
        `/start — главное меню\n` +
        `/stats — статистика участников\n` +
        `/info — информация о марафоне\n` +
        `/help — эта справка`,
        MAIN_KEYBOARD
      )
      return res.status(200).json({ ok: true })
    }

    // /stats или "статистика"
    if (text === '/stats' || lower.includes('статистик') || lower === '📊 статистика') {
      const { data, error } = await supabase
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

    // Информация о марафоне
    if (text === '/info' || lower === '📅 о марафоне' || lower.includes('информаци') || lower.includes('о марафоне') || lower.includes('дата марафона')) {
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
    if (lower === '📍 дистанции' || lower.includes('дистанци') || lower.includes('дистанцию')) {
      await sendMessage(chatId,
        `📍 <b>Дистанции марафона</b>\n\n` +
        MARATHON_INFO.distances.map(d => `• ${d}`).join('\n') +
        `\n\n_Выбери свою дистанцию при регистрации на сайте!_`,
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
        `Зарегистрироваться можно на официальном сайте:\n` +
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
        `🔍 Введи имя или фамилию участника, которого хочешь найти.\n\nНапример: <b>Иванов</b> или <b>Анна</b>`,
        MAIN_KEYBOARD
      )
      return res.status(200).json({ ok: true })
    }

    // Поиск участника — по имени И по фамилии
    if (text.length >= 2) {
      const searchTerm = text.replace(/[^а-яёА-ЯЁa-zA-Z\s-]/g, '').trim()
      if (!searchTerm) {
        await sendMessage(chatId, '❓ Я не понял запрос. Попробуй ввести имя или фамилию участника.', MAIN_KEYBOARD)
        return res.status(200).json({ ok: true })
      }

      // Ищем по first_name ИЛИ last_name
      const { data: byLast } = await supabase
        .from('participants')
        .select('id, first_name, last_name, bmi, bmi_category, role, country, gender')
        .ilike('last_name', `%${searchTerm}%`)
        .limit(10)

      const { data: byFirst } = await supabase
        .from('participants')
        .select('id, first_name, last_name, bmi, bmi_category, role, country, gender')
        .ilike('first_name', `%${searchTerm}%`)
        .limit(10)

      // Объединяем, убираем дубли по id
      const seen = new Set()
      const combined = [...(byLast || []), ...(byFirst || [])].filter(p => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })

      if (combined.length === 0) {
        await sendMessage(chatId,
          `😔 Участник с именем/фамилией «<b>${searchTerm}</b>» не найден.\n\nПроверь написание или попробуй другой вариант.`,
          MAIN_KEYBOARD
        )
        return res.status(200).json({ ok: true })
      }

      if (combined.length === 1) {
        await sendMessage(chatId, `✅ Найден участник:\n\n${formatParticipant(combined[0])}`, MAIN_KEYBOARD)
        return res.status(200).json({ ok: true })
      }

      // Несколько результатов
      const list = combined.slice(0, 8).map((p, i) => `${i+1}. ${formatParticipant(p)}`).join('\n\n')
      await sendMessage(chatId,
        `🔍 По запросу «<b>${searchTerm}</b>» найдено <b>${combined.length}</b> участник(ов):\n\n${list}${combined.length > 8 ? '\n\n<i>...и ещё ' + (combined.length - 8) + '. Уточни запрос для точного поиска.</i>' : ''}`,
        MAIN_KEYBOARD
      )
      return res.status(200).json({ ok: true })
    }

    // Неизвестная команда
    await sendMessage(chatId,
      `❓ Не понял запрос. Используй кнопки меню или введи имя/фамилию участника.`,
      MAIN_KEYBOARD
    )
    return res.status(200).json({ ok: true })

  } catch (err) {
    console.error('Telegram webhook error:', err)
    return res.status(200).json({ ok: true })
  }
}
