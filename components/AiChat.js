// components/AiChat.js
// Floating AI Chat widget — works with all 4 themes via CSS variables
import { useState, useRef, useEffect } from 'react'

const SUGGESTED = [
  'Сколько участников зарегистрировалось?',
  'Какие дистанции на марафоне?',
  'Когда и где старт?',
  'Как рассчитать BMI?',
]

export default function AiChat({ th }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Привет! Я ИИ-ассистент Marathon Skills 2026.\n\nЗадай любой вопрос о марафоне — расскажу о дистанциях, регистрации, участниках и многом другом!',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const [pulse, setPulse] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setUnread(0)
      setPulse(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Pulse attention after 3s
  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 3000)
    return () => clearTimeout(t)
  }, [])

  async function sendMessage(text) {
    const userText = text || input.trim()
    if (!userText || loading) return
    setInput('')

    const newMessages = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          userMessage: userText,
        }),
      })
      const data = await res.json()
      const reply = data.reply || 'Извини, произошла ошибка.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      if (!open) setUnread(u => u + 1)
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Сеть недоступна. Проверь соединение и попробуй снова.',
      }])
    }
    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const primary = th?.primary || '#00C6FF'
  const primaryDk = th?.primaryDk || '#0072FF'
  const card = th?.card || '#11243B'
  const nav = th?.nav || '#06121A'
  const border = th?.border || '#1E3C64'
  const text = th?.text || '#fff'
  const textSec = th?.textSec || '#C9D4E5'
  const inputBg = th?.inputBg || '#0C1E34'
  const shadow = th?.shadow || 'rgba(0,198,255,0.18)'

  return (
    <>
      {/* Floating button */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
        {/* Unread badge */}
        {unread > 0 && !open && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 20, height: 20, borderRadius: '50%',
            background: '#FF4860', color: '#fff',
            fontSize: 11, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1,
          }}>{unread}</div>
        )}

        {/* Pulse ring */}
        {pulse && !open && (
          <div style={{
            position: 'absolute', inset: -6, borderRadius: '50%',
            background: `${primary}22`,
            animation: 'aiPulse 2s ease-in-out infinite',
          }} />
        )}

        <button
          onClick={() => setOpen(o => !o)}
          title="ИИ-ассистент Marathon Skills"
          style={{
            width: 56, height: 56, borderRadius: '50%', border: 'none',
            background: `linear-gradient(135deg, ${primary}, ${primaryDk})`,
            color: '#fff', fontSize: 24, cursor: 'pointer',
            boxShadow: `0 4px 20px ${shadow}, 0 2px 8px rgba(0,0,0,0.4)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s',
            transform: open ? 'scale(0.92)' : 'scale(1)',
            position: 'relative',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = open ? 'scale(0.92)' : 'scale(1)'}
        >
          {open ? '✕' : '🤖'}
        </button>
      </div>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 9998,
          width: 360, maxWidth: 'calc(100vw - 32px)',
          maxHeight: 520,
          background: nav,
          border: `1px solid ${border}`,
          borderRadius: 20,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 4px 20px ${shadow}`,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}>

          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${primary}22, ${primaryDk}11)`,
            borderBottom: `1px solid ${border}`,
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
            flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `linear-gradient(135deg, ${primary}, ${primaryDk})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>🤖</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: text, fontFamily: 'Rajdhani,sans-serif', letterSpacing: 0.5 }}>
                ИИ-ассистент
              </div>
              <div style={{ fontSize: 11, color: primary, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5A8', display: 'inline-block' }} />
                Marathon Skills 2026
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([{ role: 'assistant', content: '🔄 Чат очищен. Задай новый вопрос!' }])
              }}
              title="Очистить чат"
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${border}`,
                color: textSec, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >↺</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 14px 8px',
            display: 'flex', flexDirection: 'column', gap: 10,
            scrollbarWidth: 'thin',
            scrollbarColor: `${border} transparent`,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                animation: 'msgFade 0.2s ease',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${primary}, ${primaryDk})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, marginRight: 8, alignSelf: 'flex-end',
                  }}>🤖</div>
                )}
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user'
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? `linear-gradient(135deg, ${primary}, ${primaryDk})`
                    : card,
                  border: msg.role === 'user' ? 'none' : `1px solid ${border}`,
                  color: text,
                  fontSize: 13,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${primary}, ${primaryDk})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                }}>🤖</div>
                <div style={{
                  background: card, border: `1px solid ${border}`,
                  borderRadius: '16px 16px 16px 4px',
                  padding: '12px 16px',
                  display: 'flex', gap: 4, alignItems: 'center',
                }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: primary,
                      animation: `dotBounce 1.2s ${j * 0.2}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div style={{
              padding: '0 14px 10px',
              display: 'flex', flexWrap: 'wrap', gap: 6,
            }}>
              {SUGGESTED.map(s => (
                <button key={s} onClick={() => sendMessage(s)} style={{
                  padding: '5px 11px',
                  background: `${primary}18`,
                  border: `1px solid ${primary}44`,
                  borderRadius: 20,
                  color: primary, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = `${primary}30`}
                  onMouseLeave={e => e.currentTarget.style.background = `${primary}18`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '10px 14px 14px',
            borderTop: `1px solid ${border}`,
            display: 'flex', gap: 8, alignItems: 'flex-end',
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Задай вопрос о марафоне..."
              rows={1}
              disabled={loading}
              style={{
                flex: 1, background: inputBg,
                border: `1px solid ${input ? primary + '66' : border}`,
                borderRadius: 12, padding: '10px 12px',
                color: text, fontSize: 13, fontFamily: 'inherit',
                resize: 'none', outline: 'none',
                maxHeight: 80, overflow: 'auto',
                scrollbarWidth: 'none',
                transition: 'border-color 0.2s',
                lineHeight: 1.4,
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: 10, border: 'none',
                background: input.trim() && !loading
                  ? `linear-gradient(135deg, ${primary}, ${primaryDk})`
                  : 'rgba(255,255,255,0.08)',
                color: input.trim() && !loading ? '#fff' : textSec,
                fontSize: 16, cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0,
              }}
            >↑</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes aiPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes msgFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  )
}
