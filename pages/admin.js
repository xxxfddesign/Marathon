import Layout from '../components/Layout'
import { useState, useEffect, useRef } from 'react'
import { BMI_COLOR, BMI_NAME, calcAge } from '../lib/constants'

const ROLE_COLORS = { Runner:'#00C6FF', Coordinator:'#00E5A8', Administrator:'#FF6B35' }
const ROLE_RU = { Runner:'Бегун', Coordinator:'Координатор', Administrator:'Администратор' }

// ─── Export/Import Panel ───────────────────────────────────────────────
function ExportImportPanel({ th }) {
  const [tab, setTab] = useState('export')
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importMode, setImportMode] = useState('insert')
  const [dragOver, setDragOver] = useState(false)
  const [previewRows, setPreviewRows] = useState([])
  const [previewFile, setPreviewFile] = useState(null)
  const fileRef = useRef()

  const primary = th.primary
  const border = th.border
  const card = th.card
  const inputBg = th.inputBg
  const textSec = th.textSec
  const text = th.text

  function parseCSVClient(text) {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    return lines.slice(1).map(line => {
      const values = []
      let current = '', inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
          else inQuotes = !inQuotes
        } else if (ch === ',' && !inQuotes) {
          values.push(current); current = ''
        } else current += ch
      }
      values.push(current)
      const obj = {}
      headers.forEach((h, i) => { obj[h] = values[i]?.trim() || null })
      return obj
    })
  }

  async function handleFile(file) {
    if (!file) return
    setPreviewFile(file)
    const text = await file.text()
    let rows = []
    if (file.name.endsWith('.json')) {
      try { rows = JSON.parse(text) } catch { rows = [] }
    } else {
      rows = parseCSVClient(text.replace(/^\uFEFF/, ''))
    }
    setPreviewRows(rows.slice(0, 5))
  }

  async function doExport(format) {
    setExporting(true)
    try {
      const res = await fetch(`/api/export-import?format=${format}`, {
        headers: { 'x-admin-secret': 'marathon_admin_2026' }
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `marathon_${Date.now()}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Ошибка экспорта') }
    setExporting(false)
  }

  async function doImport() {
    if (!previewFile) return
    setImporting(true)
    setImportResult(null)
    try {
      const text = await previewFile.text()
      let rows = []
      if (previewFile.name.endsWith('.json')) {
        rows = JSON.parse(text)
      } else {
        rows = parseCSVClient(text.replace(/^\uFEFF/, ''))
      }
      const res = await fetch('/api/export-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': 'marathon_admin_2026' },
        body: JSON.stringify({ rows, mode: importMode }),
      })
      const data = await res.json()
      setImportResult(data)
      setPreviewRows([])
      setPreviewFile(null)
    } catch (e) { setImportResult({ error: e.message }) }
    setImporting(false)
  }

  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {['export', 'import'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: tab === t ? `linear-gradient(135deg, ${primary}, ${th.primaryDk})` : inputBg,
            color: tab === t ? '#fff' : textSec,
            fontWeight: 700, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.2s',
          }}>
            {t === 'export' ? '⬇️ Экспорт' : '⬆️ Импорт'}
          </button>
        ))}
      </div>

      {tab === 'export' && (
        <div>
          <div style={{ fontSize: 13, color: textSec, marginBottom: 16, lineHeight: 1.6 }}>
            Скачайте все данные участников в удобном формате. CSV открывается в Excel, JSON — для разработчиков.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => doExport('csv')} disabled={exporting} style={{
              padding: '10px 24px', borderRadius: 10, border: `1px solid ${border}`,
              background: inputBg, color: text, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = primary}
              onMouseLeave={e => e.currentTarget.style.borderColor = border}
            >
              <span style={{ fontSize: 18 }}>📊</span>
              {exporting ? 'Загрузка...' : 'Выгрузить CSV (Excel)'}
            </button>
            <button onClick={() => doExport('json')} disabled={exporting} style={{
              padding: '10px 24px', borderRadius: 10, border: `1px solid ${border}`,
              background: inputBg, color: text, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = primary}
              onMouseLeave={e => e.currentTarget.style.borderColor = border}
            >
              <span style={{ fontSize: 18 }}>📄</span>
              {exporting ? 'Загрузка...' : 'Выгрузить JSON'}
            </button>
          </div>
        </div>
      )}

      {tab === 'import' && (
        <div>
          <div style={{ fontSize: 13, color: textSec, marginBottom: 16, lineHeight: 1.6 }}>
            Загрузите CSV или JSON с данными участников. Обязательные поля: <b style={{ color: text }}>first_name, last_name, email</b>.
          </div>

          {/* Mode selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { v: 'insert', label: 'Только новые', desc: 'Пропускать если email уже есть' },
              { v: 'upsert', label: 'Обновлять', desc: 'Обновлять существующих' },
            ].map(m => (
              <div key={m.v} onClick={() => setImportMode(m.v)} style={{
                padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                border: `2px solid ${importMode === m.v ? primary : border}`,
                background: importMode === m.v ? `${primary}18` : inputBg,
                transition: 'all 0.2s', flex: 1,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: importMode === m.v ? primary : text }}>{m.label}</div>
                <div style={{ fontSize: 11, color: textSec, marginTop: 2 }}>{m.desc}</div>
              </div>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? primary : border}`,
              borderRadius: 14, padding: '28px 20px', textAlign: 'center',
              cursor: 'pointer', background: dragOver ? `${primary}08` : inputBg,
              transition: 'all 0.2s', marginBottom: 14,
            }}
          >
            <input ref={fileRef} type="file" accept=".csv,.json" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
            <div style={{ fontSize: 32, marginBottom: 8 }}>
              {previewFile ? '📋' : '📁'}
            </div>
            {previewFile ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: primary }}>{previewFile.name}</div>
                <div style={{ fontSize: 12, color: textSec, marginTop: 4 }}>
                  {previewRows.length} строк в предпросмотре · Нажми для другого файла
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: text }}>Перетащи файл или нажми</div>
                <div style={{ fontSize: 12, color: textSec, marginTop: 4 }}>CSV или JSON · поддержка UTF-8</div>
              </>
            )}
          </div>

          {/* Preview table */}
          {previewRows.length > 0 && (
            <div style={{ marginBottom: 14, overflowX: 'auto', borderRadius: 10, border: `1px solid ${border}` }}>
              <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: textSec, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1px solid ${border}` }}>
                Предпросмотр (первые {previewRows.length} строк)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['first_name', 'last_name', 'email', 'role', 'country'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: textSec, fontWeight: 600, borderBottom: `1px solid ${border}`, background: card }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {['first_name', 'last_name', 'email', 'role', 'country'].map(h => (
                        <td key={h} style={{ padding: '6px 10px', color: text, borderBottom: `1px solid ${border}22` }}>{row[h] || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 14,
              background: importResult.error ? 'rgba(255,72,96,0.1)' : 'rgba(0,229,168,0.1)',
              border: `1px solid ${importResult.error ? 'rgba(255,72,96,0.3)' : 'rgba(0,229,168,0.3)'}`,
            }}>
              {importResult.error ? (
                <div style={{ color: '#FF4860', fontSize: 13 }}>⚠️ Ошибка: {importResult.error}</div>
              ) : (
                <div style={{ color: '#00E5A8', fontSize: 13, lineHeight: 1.8 }}>
                  ✅ Импорт завершён!<br />
                  ➕ Добавлено: <b>{importResult.inserted}</b> · 
                  ✏️ Обновлено: <b>{importResult.updated}</b> · 
                  ⏭️ Пропущено: <b>{importResult.skipped}</b>
                </div>
              )}
            </div>
          )}

          <button onClick={doImport} disabled={!previewFile || importing} style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: previewFile && !importing
              ? `linear-gradient(135deg, ${primary}, ${th.primaryDk})`
              : 'rgba(255,255,255,0.1)',
            color: previewFile && !importing ? '#fff' : textSec,
            fontSize: 13, fontWeight: 700, cursor: previewFile && !importing ? 'pointer' : 'default',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
          }}>
            {importing ? '⏳ Импорт...' : '⬆️ Начать импорт'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Notification Settings Panel ──────────────────────────────────────
function NotificationsPanel({ th }) {
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const border = th.border
  const card = th.card
  const inputBg = th.inputBg
  const textSec = th.textSec
  const text = th.text
  const primary = th.primary

  async function sendTestDaily() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/daily-stats', { method: 'GET' })
      const data = await res.json()
      setTestResult(data.sent ? '✅ Статистика отправлена в Telegram!' : '⚠️ Проверь TELEGRAM_BOT_TOKEN и TELEGRAM_ADMIN_CHAT_ID в Vercel')
    } catch { setTestResult('⚠️ Ошибка запроса') }
    setTesting(false)
  }

  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        🔔 Telegram-уведомления
      </div>
      <div style={{ fontSize: 13, color: textSec, marginBottom: 18, lineHeight: 1.6 }}>
        Бот автоматически уведомляет администратора о новых регистрациях, изменениях и удалениях участников через Supabase Webhooks.
        Каждый день в <b style={{ color: text }}>09:00 (Алматы)</b> приходит сводная статистика.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        {[
          { icon: '🎉', title: 'Новая регистрация', desc: 'Мгновенное уведомление при добавлении участника' },
          { icon: '✏️', title: 'Изменение данных', desc: 'Уведомление при редактировании профиля' },
          { icon: '🗑️', title: 'Удаление участника', desc: 'Фиксация факта удаления с данными' },
          { icon: '📊', title: 'Ежедневная статистика', desc: 'Автоматический отчёт каждое утро' },
        ].map(item => (
          <div key={item.title} style={{
            background: inputBg, border: `1px solid ${border}`,
            borderRadius: 10, padding: '12px 14px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: textSec, lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: inputBg, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: textSec, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
          Требуемые переменные окружения (Vercel)
        </div>
        {[
          { key: 'TELEGRAM_BOT_TOKEN', desc: 'Токен бота от @BotFather' },
          { key: 'TELEGRAM_ADMIN_CHAT_ID', desc: 'Ваш chat_id (узнать у @userinfobot)' },
          { key: 'SUPABASE_WEBHOOK_SECRET', desc: 'Любая строка для защиты webhook' },
          { key: 'ANTHROPIC_API_KEY', desc: 'API ключ Claude для ИИ-ассистента' },
        ].map(v => (
          <div key={v.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${border}22` }}>
            <code style={{ fontSize: 12, color: primary, background: `${primary}15`, padding: '2px 8px', borderRadius: 6 }}>{v.key}</code>
            <span style={{ fontSize: 11, color: textSec }}>{v.desc}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={sendTestDaily} disabled={testing} style={{
          padding: '9px 20px', borderRadius: 10, border: `1px solid ${border}`,
          background: inputBg, color: text, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {testing ? '⏳ Отправка...' : '🧪 Тест: отправить статистику сейчас'}
        </button>
        {testResult && (
          <span style={{ fontSize: 12, color: testResult.startsWith('✅') ? '#00E5A8' : '#FF4860' }}>
            {testResult}
          </span>
        )}
      </div>

      <div style={{ marginTop: 14, padding: '12px 16px', background: `${primary}10`, border: `1px solid ${primary}33`, borderRadius: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: primary, marginBottom: 4 }}>📋 Настройка Supabase Webhook</div>
        <div style={{ fontSize: 11, color: textSec, lineHeight: 1.7 }}>
          1. Supabase Dashboard → <b style={{ color: text }}>Database → Webhooks</b><br />
          2. Нажми <b style={{ color: text }}>Add Webhook</b><br />
          3. URL: <code style={{ color: primary }}>https://твой-сайт.vercel.app/api/supabase-webhook</code><br />
          4. Table: <code style={{ color: primary }}>participants</code>, Events: <code style={{ color: primary }}>INSERT, UPDATE, DELETE</code><br />
          5. Header: <code style={{ color: primary }}>x-webhook-secret</code> = значение из SUPABASE_WEBHOOK_SECRET
        </div>
      </div>
    </div>
  )
}

// ─── Main Admin Page ───────────────────────────────────────────────────
function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [login, setLogin] = useState('')
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [participants, setParticipants] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('FirstName')
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editError, setEditError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('users')

  useEffect(() => {
    const saved = localStorage.getItem('admin_logged_in')
    if (saved === 'true') setIsLoggedIn(true)
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    if (isLoggedIn && activeTab === 'users') loadParticipants()
  }, [isLoggedIn, search, filter, sort, activeTab])

  async function loadParticipants() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filter !== 'All') params.set('role', filter)
      params.set('sort', sort)
      const res = await fetch(`/api/admin-participants?${params}`, { headers: { 'x-admin-secret': 'marathon_admin_2026' } })
      const data = await res.json()
      setParticipants(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  function doLogin() {
    if (login === 'admin' && pwd === 'admin') {
      setIsLoggedIn(true)
      localStorage.setItem('admin_logged_in', 'true')
      setError('')
    } else {
      setError('⚠ Неверный логин или пароль')
      setPwd('')
    }
  }

  function openEdit(p) {
    setEditing(p.id)
    setEditForm({ first_name: p.first_name, last_name: p.last_name, email: p.email, role: p.role, phone: p.phone, country: p.country, birth_date: p.birth_date, gender: p.gender, bmi: p.bmi, bmi_category: p.bmi_category })
    setEditError('')
  }

  async function saveEdit() {
    if (!editForm.first_name || !editForm.last_name) { setEditError('⚠ Заполните имя и фамилию'); return }
    try {
      const res = await fetch(`/api/admin-participants?id=${editing}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) { setEditing(null); loadParticipants() }
      else setEditError('⚠ Ошибка сохранения')
    } catch { setEditError('⚠ Ошибка сети') }
  }

  async function deleteParticipant(id) {
    if (!confirm('Удалить участника?')) return
    await fetch(`/api/admin-participants?id=${id}`, { method: 'DELETE', headers: { 'x-admin-secret': 'marathon_admin_2026' } })
    loadParticipants()
  }

  if (!authChecked) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#081320' }}>
      <div style={{ color:'#00C6FF', fontFamily:'Rajdhani,sans-serif', fontSize:18 }}>Загрузка...</div>
    </div>
  )

  if (!isLoggedIn) return (
    <div style={{ minHeight:'100vh', background:'#081320', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ background:'#06121A', border:'1px solid #1E3C64', borderRadius:20, padding:'40px 36px', width:380, maxWidth:'92vw', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:26, fontWeight:700, textAlign:'center', marginBottom:6, color:'#fff' }}>Авторизация</div>
        <div style={{ fontSize:13, color:'#C9D4E5', textAlign:'center', marginBottom:28, lineHeight:1.6 }}>Пожалуйста, авторизуйтесь в системе,<br/>используя ваш логин и пароль.</div>
        {error && <div style={{ background:'rgba(255,72,96,0.1)', border:'1px solid rgba(255,72,96,0.3)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#FF4860', textAlign:'center', marginBottom:14 }}>{error}</div>}
        {[
          { label:'Логин:', value:login, set:setLogin, type:'text', placeholder:'Введите ваш логин' },
          { label:'Пароль:', value:pwd, set:setPwd, type:'password', placeholder:'Введите ваш пароль', onKey:true },
        ].map(f => (
          <div key={f.label} style={{ display:'grid', gridTemplateColumns:'100px 1fr', alignItems:'center', gap:12, marginBottom:14 }}>
            <label style={{ fontSize:13, fontWeight:600, color:'#C9D4E5', textAlign:'right' }}>{f.label}</label>
            <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
              placeholder={f.placeholder} autoComplete="off"
              onKeyDown={f.onKey ? e => e.key==='Enter' && doLogin() : undefined}
              style={{ padding:'10px 14px', background:'#0C1E34', border:'1px solid #1E3C64', borderRadius:10, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none' }}
            />
          </div>
        ))}
        <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:20 }}>
          <button onClick={doLogin} style={{ padding:'10px 28px', borderRadius:10, background:'linear-gradient(135deg,#00C6FF,#0072FF)', color:'#fff', fontWeight:700, fontSize:14, border:'none', cursor:'pointer', fontFamily:'inherit' }}>
            Войти
          </button>
        </div>
      </div>
    </div>
  )

  // Edit page
  if (editing) return (
    <Layout>
      {(th) => (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
          <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:20, padding:'36px 40px', width:620, maxWidth:'96vw', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:22, fontWeight:700, textAlign:'center', marginBottom:24 }}>Редактирование пользователя</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:th.textSec, textTransform:'uppercase', letterSpacing:0.8 }}>Email</div>
                <div style={{ fontSize:13, color:th.textSec, fontStyle:'italic' }}>{editForm.email}</div>
                {[
                  { label:'Имя', key:'first_name', placeholder:'Имя' },
                  { label:'Фамилия', key:'last_name', placeholder:'Фамилия' },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize:12, fontWeight:600, color:th.textSec, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>{f.label}</div>
                    <input value={editForm[f.key]||''} onChange={e => setEditForm(ef => ({...ef, [f.key]:e.target.value}))}
                      placeholder={f.placeholder}
                      style={{ width:'100%', padding:'10px 14px', background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:10, color:th.text, fontSize:14, fontFamily:'inherit', outline:'none' }}
                    />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:th.textSec, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Роль</div>
                  <select value={editForm.role||'Runner'} onChange={e => setEditForm(ef => ({...ef, role:e.target.value}))}
                    style={{ width:'100%', padding:'10px 14px', background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:10, color:th.text, fontSize:14, fontFamily:'inherit', outline:'none', cursor:'pointer' }}
                  >
                    <option value="Runner">Бегун</option>
                    <option value="Coordinator">Координатор</option>
                    <option value="Administrator">Администратор</option>
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:th.textSec, textTransform:'uppercase', letterSpacing:0.8 }}>Дополнительно</div>
                {[
                  { label:'Телефон', key:'phone' },
                  { label:'Страна', key:'country' },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize:12, fontWeight:600, color:th.textSec, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>{f.label}</div>
                    <input value={editForm[f.key]||''} onChange={e => setEditForm(ef => ({...ef, [f.key]:e.target.value}))}
                      style={{ width:'100%', padding:'10px 14px', background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:10, color:th.text, fontSize:14, fontFamily:'inherit', outline:'none' }}
                    />
                  </div>
                ))}
                {editError && <div style={{ background:'rgba(255,72,96,0.1)', border:'1px solid rgba(255,72,96,0.3)', borderRadius:8, padding:'10px 14px', color:'#FF4860', fontSize:12 }}>{editError}</div>}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:24 }}>
              <button onClick={saveEdit} style={{ padding:'10px 24px', borderRadius:10, background:`linear-gradient(135deg,${th.primary},${th.primaryDk})`, color:'#fff', fontWeight:700, fontSize:14, border:'none', cursor:'pointer', fontFamily:'inherit' }}>💾 Сохранить</button>
              <button onClick={() => setEditing(null)} style={{ padding:'10px 20px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:`1px solid ${th.border}`, color:th.textSec, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )

  // Main admin panel
  return (
    <Layout>
      {(th) => (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

          {/* Header */}
          <div style={{ padding:'20px 32px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <h2 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:28, fontWeight:800, color:th.primary }}>👑 Панель администратора</h2>
            <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('admin_logged_in') }} style={{ padding:'7px 16px', borderRadius:8, background:'rgba(255,72,96,0.1)', border:'1px solid rgba(255,72,96,0.25)', color:'#FF4860', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Logout</button>
          </div>

          {/* Tabs */}
          <div style={{ padding:'16px 32px 0', display:'flex', gap:4, flexShrink:0 }}>
            {[
              { id: 'users', label: '👥 Участники' },
              { id: 'export', label: '📦 Экспорт / Импорт' },
              { id: 'notifications', label: '🔔 Уведомления' },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: '8px 18px', borderRadius: '10px 10px 0 0', border: 'none',
                borderBottom: activeTab === t.id ? `2px solid ${th.primary}` : `2px solid transparent`,
                background: activeTab === t.id ? `${th.primary}15` : 'transparent',
                color: activeTab === t.id ? th.primary : th.textSec,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>{t.label}</button>
            ))}
          </div>

          <div style={{ height: 1, background: th.border, marginBottom: 16, flexShrink: 0, margin: '0 32px 16px' }} />

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 24px' }}>

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <>
                <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
                    style={{ flex:1, minWidth:180, padding:'9px 14px', background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:10, color:th.text, fontSize:13, fontFamily:'inherit', outline:'none' }}
                  />
                  <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding:'9px 14px', background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:10, color:th.text, fontSize:13, fontFamily:'inherit', cursor:'pointer', outline:'none' }}>
                    <option value="All">Все роли</option>
                    <option value="Runner">Бегун</option>
                    <option value="Coordinator">Координатор</option>
                    <option value="Administrator">Администратор</option>
                  </select>
                  <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding:'9px 14px', background:th.inputBg, border:`1px solid ${th.border}`, borderRadius:10, color:th.text, fontSize:13, fontFamily:'inherit', cursor:'pointer', outline:'none' }}>
                    <option value="FirstName">По имени</option>
                    <option value="LastName">По фамилии</option>
                    <option value="Id">По ID</option>
                  </select>
                </div>

                <div style={{ fontSize:13, color:th.textSec, marginBottom:10 }}>
                  Всего пользователей: <span style={{ color:th.text, fontWeight:600 }}>{participants.length}</span>
                </div>

                {loading ? (
                  <div style={{ textAlign:'center', padding:40, color:th.textSec }}>Загрузка...</div>
                ) : (
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr>
                        {['Имя','Фамилия','Email','Роль',''].map(h => (
                          <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, letterSpacing:1, color:th.textSec, textTransform:'uppercase', background:th.nav, borderBottom:`1px solid ${th.border}`, position:'sticky', top:0 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map(p => (
                        <tr key={p.id} style={{ borderBottom:`1px solid rgba(255,255,255,0.04)` }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}
                        >
                          <td style={{ padding:'12px 14px', fontWeight:600 }}>{p.first_name}</td>
                          <td style={{ padding:'12px 14px' }}>{p.last_name}</td>
                          <td style={{ padding:'12px 14px', color:th.textSec, fontSize:12 }}>{p.email}</td>
                          <td style={{ padding:'12px 14px' }}>
                            <span style={{ background:`${ROLE_COLORS[p.role]||'#888'}1a`, border:`1px solid ${ROLE_COLORS[p.role]||'#888'}44`, borderRadius:6, padding:'2px 10px', color:ROLE_COLORS[p.role]||'#888', fontWeight:600, fontSize:12 }}>
                              {ROLE_RU[p.role]||p.role}
                            </span>
                          </td>
                          <td style={{ padding:'12px 14px', display:'flex', gap:8 }}>
                            <button onClick={() => openEdit(p)} style={{ padding:'5px 14px', borderRadius:7, background:`${th.primary}22`, border:`1px solid ${th.primary}44`, color:th.primary, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Edit</button>
                            <button onClick={() => deleteParticipant(p.id)} style={{ padding:'5px 14px', borderRadius:7, background:'rgba(255,72,96,0.1)', border:'1px solid rgba(255,72,96,0.3)', color:'#FF4860', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* EXPORT/IMPORT TAB */}
            {activeTab === 'export' && <ExportImportPanel th={th} />}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && <NotificationsPanel th={th} />}
          </div>
        </div>
      )}
    </Layout>
  )
}

export default AdminPage
