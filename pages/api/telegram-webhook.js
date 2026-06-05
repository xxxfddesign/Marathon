import { supabase } from '../../lib/supabase'

export const config = { api: { bodyParser: true } }

const BOT_NAME = 'Marathon Skills 2026'
const SITE = 'marathon-skills.vercel.app'

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

function makeKeyboard(buttons) {
  return {
    reply_markup: JSON.stringify({
      keyboard: buttons.map(row => row.map(text => ({ text }))),
      resize_keyboard: true,
    }),
  }
}

const MAIN_KB = makeKeyboard([
  ['🏃 Найти участника', '📊 Статистика'],
  ['📅 О марафоне',      '📍 Дистанции'],
  ['⏰ Старт и место',   '🏅 Подготовка'],
  ['💪 Советы бегуну',  '📝 Регистрация'],
  ['❓ Помощь'],
])

function fmt(p) {
  const gender = p.gender === 'f' ? '👩' : '👨'
  const bmiEmoji = { Normal:'💚', Underweight:'🟡', Overweight:'🟠', Obese:'🔴' }[p.bmi_category] || '⚪'
  return (
    `${gender} <b>${p.first_name} ${p.last_name}</b>\n` +
    `${bmiEmoji} BMI: <b>${p.bmi ?? '—'}</b> — ${p.bmi_category ?? '—'}\n` +
    `🏃 Роль: ${p.role ?? '—'} | 🌍 ${p.country ?? '—'}`
  )
}

async function searchParticipants(query) {
  const clean = query.replace(/[^а-яёА-ЯЁa-zA-Z0-9\s-]/g, '').trim()
  if (!clean) return []
  const [byLast, byFirst] = await Promise.all([
    supabase.from('participants').select('id,first_name,last_name,bmi,bmi_category,role,country,gender').ilike('last_name', `%${clean}%`).limit(8),
    supabase.from('participants').select('id,first_name,last_name,bmi,bmi_category,role,country,gender').ilike('first_name', `%${clean}%`).limit(8),
  ])
  const seen = new Set()
  return [...(byLast.data || []), ...(byFirst.data || [])].filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id); return true
  })
}

function match(lower, ...keywords) {
  return keywords.some(k => lower.includes(k))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const message = req.body?.message
    if (!message) return res.status(200).json({ ok: true })

    const chatId = message.chat.id
    const firstName = message.chat.first_name || 'друг'
    const text = (message.text || '').trim()
    const L = text.toLowerCase()

    await sendTyping(chatId)

    // ═══ /start ═══
    if (text === '/start') {
      await sendMessage(chatId,
        `👋 Привет, <b>${firstName}</b>! Я бот марафона <b>${BOT_NAME}</b>!\n\n` +
        `🤖 Я умею:\n` +
        `• Искать участников по имени или фамилии\n` +
        `• Отвечать на вопросы о марафоне\n` +
        `• Давать советы по подготовке к забегу\n` +
        `• Показывать статистику участников\n\n` +
        `Просто нажми кнопку или напиши мне что угодно! 👇`,
        MAIN_KB)
      return res.status(200).json({ ok: true })
    }

    // ═══ ПОМОЩЬ ═══
    if (match(L, 'помощ', '/help', '❓') || L === 'помощь') {
      await sendMessage(chatId,
        `📖 <b>Что я умею:</b>\n\n` +
        `🔍 <b>Поиск участника</b> — напиши имя или фамилию\n` +
        `   Пример: <i>Иванов</i> или <i>Анна Петрова</i>\n\n` +
        `📅 <b>Информация</b> — о дате, месте, дистанциях\n\n` +
        `💪 <b>Советы</b> — как подготовиться к марафону\n\n` +
        `📊 <b>Статистика</b> — сколько участников, стран\n\n` +
        `❓ Просто пиши вопрос — я постараюсь ответить!`,
        MAIN_KB)
      return res.status(200).json({ ok: true })
    }

    // ═══ О МАРАФОНЕ ═══
    if (match(L, 'о марафоне', 'информаци', '/info', '📅', 'дата', 'когда марафон', 'marathon skills')) {
      await sendMessage(chatId,
        `📅 <b>Marathon Skills 2026</b>\n\n` +
        `🗓 Дата: <b>15 июня 2026</b>\n` +
        `📍 Место: <b>Казахстан</b>\n` +
        `⏰ Старт: <b>07:00</b> (явка с 06:00)\n` +
        `🌡 Погода: <b>+18°C</b>, ветер 12 км/ч\n` +
        `🏅 Медали: <b>Gold</b> для всех финишёров\n` +
        `🌐 Сайт: <b>${SITE}</b>\n\n` +
        `💡 Марафон проходит раз в год — не пропусти!`,
        MAIN_KB)
      return res.status(200).json({ ok: true })
    }

    // ═══ ДИСТАНЦИИ ═══
    if (match(L, 'дистанци', '📍', 'километр', 'км', 'полумарафон', 'сколько км', 'какая длина')) {
      await sendMessage(chatId,
        `📍 <b>Дистанции марафона</b>\n\n` +
        `🟢 <b>5 км</b> — для начинающих\n` +
        `🔵 <b>10 км</b> — для любителей\n` +
        `🟠 <b>21,1 км</b> — полумарафон\n` +
        `🔴 <b>42,2 км</b> — классический марафон\n\n` +
        `🏆 Рекорд трассы: <b>2:01</b>\n` +
        `👟 Средний темп участников: <b>4:32 мин/км</b>\n\n` +
        `Выбери дистанцию при регистрации на сайте!`,
        MAIN_KB)
      return res.status(200).json({ ok: true })
    }

    // ═══ СТАРТ И МЕСТО ═══
    if (match(L, 'старт', 'время', 'место', 'где', 'адрес', '⏰', 'начало', 'во сколько')) {
      await sendMessage(chatId,
        `⏰ <b>Старт и место</b>\n\n` +
        `📍 Место: <b>Казахстан</b>\n` +
        `🗓 Дата: <b>15 июня 2026</b>\n` +
        `⏰ Старт забега: <b>07:00</b>\n` +
        `🕕 Явка участников: <b>06:00</b>\n\n` +
        `⚠️ Приходи заранее — нужно пройти регистрацию на месте и получить номер!\n\n` +
        `Подробности на сайте: <b>${SITE}</b>`,
        MAIN_KB)
      return res.status(200).json({ ok: true })
    }

    // ═══ РЕГИСТРАЦИЯ ═══
    if (match(L, 'регистрац', 'записаться', 'участвовать', 'как попасть', '📝', 'зарегистрир')) {
      await sendMessage(chatId,
        `📝 <b>Как зарегистрироваться</b>\n\n` +
        `1️⃣ Зайди на сайт: <b>${SITE}</b>\n` +
        `2️⃣ Нажми кнопку «Регистрация»\n` +
        `3️⃣ Заполни анкету\n` +
        `4️⃣ Рассчитай свой BMI\n` +
        `5️⃣ Получи подтверждение!\n\n` +
        `✅ Регистрация открыта до <b>15 июня 2026</b>\n` +
        `💡 Уже зарегистрированным — войди через сайт чтобы отслеживать свой профиль`,
        MAIN_KB)
      return res.status(200).json({ ok: true })
    }

    // ═══ СТАТИСТИКА ═══
    if (match(L, 'статистик', '📊', '/stats', 'сколько участник', 'сколько человек')) {
      const { data } = await supabase.from('participants').select('role,country,bmi_category,gender')
      if (!data) {
        await sendMessage(chatId, '⚠️ Не удалось получить данные. Попробуй позже.', MAIN_KB)
        return res.status(200).json({ ok: true })
      }
      const total = data.length
      const countries = new Set(data.map(p => p.country).filter(Boolean)).size
      const runners = data.filter(p => p.role === 'Runner').length
      const coordinators = data.filter(p => p.role === 'Coordinator').length
      const males = data.filter(p => p.gender === 'm').length
      const females = data.filter(p => p.gender === 'f').length
      const normal = data.filter(p => p.bmi_category === 'Normal').length
      await sendMessage(chatId,
        `📊 <b>Статистика участников</b>\n\n` +
        `👥 Всего зарегистрировано: <b>${total}</b>\n` +
        `🌍 Представлено стран: <b>${countries}</b>\n\n` +
        `🏃 Бегунов: <b>${runners}</b>\n` +
        `📋 Координаторов: <b>${coordinators}</b>\n\n` +
        `👨 Мужчин: <b>${males}</b>\n` +
        `👩 Женщин: <b>${females}</b>\n\n` +
        `💚 С нормальным BMI: <b>${normal}</b> из ${total}`,
        MAIN_KB)
      return res.status(200).json({ ok: true })
    }

    // ═══ СОВЕТЫ БЕГУНУ ═══
    if (match(L, 'совет', 'подготовк', '💪', 'как бежать', 'как готовиться', 'тренировк', 'питани', 'что взять', 'что надеть')) {
      const tips = [
        [`💪 <b>Физическая подготовка</b>\n\n` +
        `• За 3 месяца до старта — регулярные пробежки 3-4 раза в неделю\n` +
        `• Увеличивай дистанцию постепенно — не более 10% в неделю\n` +
        `• За 2 недели до марафона — снизь нагрузку (тейпер)\n` +
        `• Обязательно делай длинные пробежки по выходным\n\n` +
        `🏁 <b>За день до старта:</b>\n` +
        `• Не бегай совсем\n` +
        `• Хорошо выспись\n` +
        `• Ешь углеводы — паста, рис, хлеб`],

        [`🍌 <b>Питание на марафоне</b>\n\n` +
        `• За 3-4 часа до старта: лёгкий завтрак с углеводами\n` +
        `• Каждые 45 минут во время бега: гель или банан\n` +
        `• Пей воду на каждом пункте питания\n` +
        `• Не пробуй ничего нового в день забега!\n\n` +
        `⚡ На пунктах питания обычно есть:\n` +
        `вода, изотоник, бананы, апельсины, гели`],

        [`👟 <b>Что взять на марафон</b>\n\n` +
        `• Беговые кроссовки (обкатанные, не новые!)\n` +
        `• Беговая форма по погоде\n` +
        `• Пластырь (предотвратить натирания)\n` +
        `• Гели / питание на дистанцию\n` +
        `• Солнцезащитный крем\n` +
        `• Наушники (по желанию)\n` +
        `• Паспорт или номер участника\n\n` +
        `☀️ Погода в день марафона: <b>+18°C</b>`],
      ]
      const tip = tips[Math.floor(Math.random() * tips.length)]
      await sendMessage(chatId, tip[0] + `\n\n💡 Спроси ещё — у меня есть советы по питанию, экипировке и тактике!`, MAIN_KB)
      return res.status(200).json({ ok: true })
    }

    // ═══ BMI ═══
    if (match(L, 'bmi', 'бми', 'индекс массы', 'вес', 'калькулятор')) {
      await sendMessage(chatId,
        `⚖️ <b>Калькулятор BMI</b>\n\n` +
        `BMI (индекс массы тела) = вес(кг) / рост²(м)\n\n` +
        `📊 Нормы:\n` +
        `🟡 До 18.5 — недостаток веса\n` +
        `💚 18.5–24.9 — норма (идеально для марафона)\n` +
        `🟠 25–29.9 — избыточный вес\n` +
        `🔴 От 30 — ожирение\n\n` +
        `💡 Рассчитай свой BMI на сайте: <b>${SITE}</b>\n` +
        `Результат автоматически сохранится в профиле!`,
        MAIN_KB)
      return res.status(200).json({ ok: true })
    }

    // ═══ НАЙТИ УЧАСТНИКА (кнопка) ═══
    if (L === '🏃 найти участника') {
      await sendMessage(chatId,
        `🔍 Введи имя или фамилию участника.\n\nНапример: <b>Иванов</b> или <b>Анна</b>`,
        MAIN_KB)
      return res.status(200).json({ ok: true })
    }

    // ═══ ПОИСК УЧАСТНИКА ═══
    // Ищем если написано что-то похожее на имя/фамилию
    const searchTrigger = match(L, 'найди', 'найти', 'ищу', 'поищи', 'покажи', 'есть ли', 'участник')
    const cleanText = text.replace(/найди|найти|ищу|поищи|покажи|участника|участник/gi, '').trim()
    const queryText = searchTrigger ? cleanText : text

    if (queryText.length >= 2 && /^[а-яёА-ЯЁa-zA-Z\s-]+$/.test(queryText)) {
      const found = await searchParticipants(queryText)
      if (found.length > 0) {
        if (found.length === 1) {
          await sendMessage(chatId, `✅ <b>Найден участник:</b>\n\n${fmt(found[0])}`, MAIN_KB)
        } else {
          const list = found.slice(0, 6).map((p, i) => `${i+1}. ${fmt(p)}`).join('\n\n')
          await sendMessage(chatId,
            `🔍 По запросу «<b>${queryText}</b>» найдено <b>${found.length}</b> участников:\n\n${list}` +
            (found.length > 6 ? `\n\n<i>...и ещё ${found.length - 6}. Уточни запрос.</i>` : ''),
            MAIN_KB)
        }
        return res.status(200).json({ ok: true })
      } else if (searchTrigger || text.length <= 25) {
        await sendMessage(chatId,
          `😔 Участник «<b>${queryText}</b>» не найден.\n\nПроверь написание или попробуй другой вариант.`,
          MAIN_KB)
        return res.status(200).json({ ok: true })
      }
    }

    // ═══ ПРИВЕТСТВИЕ ═══
    if (match(L, 'привет', 'здравствуй', 'хай', 'hello', 'hi ', 'добрый')) {
      await sendMessage(chatId,
        `👋 Привет, <b>${firstName}</b>!\n\nЧем могу помочь? Используй кнопки меню или просто напиши вопрос! 😊`,
        MAIN_KB)
      return res.status(200).json({ ok: true })
    }

    // ═══ СПАСИБО ═══
    if (match(L, 'спасибо', 'благодар', 'thanks', 'thank you', 'супер', 'отлично', 'класс')) {
      await sendMessage(chatId,
        `😊 Пожалуйста! Удачи на марафоне, <b>${firstName}</b>! 🏃‍♂️🏅\n\nЕсли будут вопросы — всегда рад помочь!`,
        MAIN_KB)
      return res.status(200).json({ ok: true })
    }

    // ═══ НЕИЗВЕСТНАЯ КОМАНДА ═══
    await sendMessage(chatId,
      `🤔 Не совсем понял твой вопрос.\n\n` +
      `Попробуй:\n` +
      `• Нажать кнопку из меню\n` +
      `• Написать имя или фамилию участника\n` +
      `• Спросить: <i>«Когда марафон?»</i> или <i>«Как готовиться?»</i>`,
      MAIN_KB)
    return res.status(200).json({ ok: true })

  } catch (err) {
    console.error('Telegram webhook error:', err)
    return res.status(200).json({ ok: true })
  }
}
