import { useState, useRef, useEffect } from 'react'
import './App.css'

// Import assets
import logo from './assets/logo.png'
import viFlag from './assets/vietnam.png'
import bnaFlag from './assets/bana.png'
import edeFlag from './assets/ede.png'

type LangCode = 'vi' | 'bna' | 'ede'

type ApiError = {
  message?: string
  details?: string[]
}

const LANG_META: Record<LangCode, { label: string; flag: string }> = {
  vi: { label: 'Vietnamese', flag: viFlag },
  bna: { label: 'Ba Na', flag: bnaFlag },
  ede: { label: 'Ê-đê', flag: edeFlag },
}

const MAX_CHARS = 5000

/* ── SVG Icons ─────────────────────────────────────────── */
const IconSwap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16V4m0 0L3 8m4-4l4 4" />
    <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
  </svg>
)

const IconCopy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const IconTranslate = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 8l6 6" />
    <path d="M4 14l6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="M22 22l-5-10-5 10" />
    <path d="M14 18h6" />
  </svg>
)

const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const IconInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

export default function App() {
  const [sourceLang, setSourceLang] = useState<LangCode>('vi')
  const [targetLang, setTargetLang] = useState<LangCode>('bna')
  const [inputText, setInputText] = useState<string>('')
  const [outputText, setOutputText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [toast, setToast] = useState<boolean>(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Show toast then hide after 2 s */
  const showToast = () => {
    setToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(false), 2000)
  }
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  /* ── Handlers ──────────────────────────────────────────── */
  const swapDirection = () => {
    setError('')
    const [ps, pt, pi, po] = [sourceLang, targetLang, inputText, outputText]
    setSourceLang(pt); setTargetLang(ps)
    setInputText(po); setOutputText(pi)
  }

  const clearAll = () => { setError(''); setInputText(''); setOutputText('') }

  const copyOutput = async () => {
    const text = outputText.trim()
    if (!text) { setError('Chưa có nội dung để copy.'); return }
    try {
      await navigator.clipboard.writeText(text)
      setError('')
      showToast()
    } catch {
      setError('Không thể copy tự động trên trình duyệt này.')
    }
  }

  const doTranslate = async () => {
    setError('')
    const clean = inputText.trim()
    if (!clean) { setError('Vui lòng nhập văn bản để dịch.'); return }
    if (sourceLang === targetLang) { setError('Ngôn ngữ nguồn và đích không được giống nhau.'); return }

    setLoading(true)
    try {
      const resp = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, sourceLang, targetLang }),
      })
      if (!resp.ok) {
        const err = (await resp.json().catch(() => null)) as ApiError | null
        setError(err?.message || 'Dịch thất bại. Vui lòng thử lại.')
        setOutputText('')
        return
      }
      const data = await resp.json()
      setOutputText(data?.translatedText ?? '')
    } catch {
      setError('Không thể kết nối tới máy chủ dịch. Kiểm tra lại backend.')
      setOutputText('')
    } finally {
      setLoading(false)
    }
  }

  const handleSourceChange = (val: LangCode) => {
    setSourceLang(val)
    if (val === targetLang) setTargetLang(val === 'vi' ? 'bna' : 'vi')
    setOutputText(''); setError('')
  }

  const handleTargetChange = (val: LangCode) => {
    setTargetLang(val)
    if (val === sourceLang) setSourceLang(val === 'vi' ? 'bna' : 'vi')
    setOutputText(''); setError('')
  }

  /* ── Derived ────────────────────────────────────────────── */
  const srcMeta = LANG_META[sourceLang]
  const tgtMeta = LANG_META[targetLang]
  const charCount = inputText.length
  const paneTitle = (lang: LangCode) =>
    lang === 'vi' ? 'Vietnamese text' : `Translated (${LANG_META[lang].label}) A/あ`

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <main className="page">
      {/* ── Header ────────────────────────────────────────── */}
      <header className="topbar">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="app-logo" />
        </div>
        <div className="brand">Minority Language Translator</div>
        <div className="subtitle">VIETNAMESE ↔ BA NA / Ê-ĐÊ</div>
      </header>

      {/* ── Card ──────────────────────────────────────────── */}
      <section className="card">

        {/* ── Toolbar ───────────────────────────────────── */}
        <div className="toolbar">
          {/* Source */}
          <div className="lang">
            <label htmlFor="sourceLang">Từ</label>
            <div className="lang-select-wrap">
              <span className="lang-flag">
                <img src={srcMeta.flag} alt={srcMeta.label} className="flag-icon" />
              </span>
              <select
                id="sourceLang"
                value={sourceLang}
                onChange={(e) => handleSourceChange(e.target.value as LangCode)}
              >
                <option value="vi">Vietnamese</option>
                <option value="bna">Ba Na </option>
                <option value="ede">Ê-đê</option>
              </select>
              <span className="lang-arrow">▾</span>
            </div>
          </div>

          {/* Swap */}
          <div className="swap-wrap">
            <button id="swapBtn" className="btn-swap" type="button"
              title="Hoán đổi chiều dịch" onClick={swapDirection}>
              <IconSwap /> Swap
            </button>
          </div>

          {/* Target */}
          <div className="lang">
            <label htmlFor="targetLang">Đến</label>
            <div className="lang-select-wrap">
              <span className="lang-flag">
                <img src={tgtMeta.flag} alt={tgtMeta.label} className="flag-icon" />
              </span>
              <select
                id="targetLang"
                value={targetLang}
                onChange={(e) => handleTargetChange(e.target.value as LangCode)}
              >
                <option value="vi">Vietnamese</option>
                <option value="bna">Ba Na</option>
                <option value="ede">Ê-đê</option>
              </select>
              <span className="lang-arrow">▾</span>
            </div>
          </div>
        </div>

        {/* ── Text panes ────────────────────────────────── */}
        <div className="panes">
          {/* Input */}
          <div className="pane">
            <div className="pane-title">
              <img src={srcMeta.flag} alt="" className="pane-flag" />
              {paneTitle(sourceLang)}
            </div>
            <div className="textarea-wrap">
              <textarea
                id="inputText"
                placeholder="Nhập văn bản..."
                value={inputText}
                maxLength={MAX_CHARS}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void doTranslate()
                }}
              />
              <button
                id="clearInlineBtn"
                className={`btn-clear-inline${inputText ? ' visible' : ''}`}
                type="button"
                title="Xóa văn bản"
                onClick={clearAll}
              >✕</button>
              <span className="char-count">{charCount}/{MAX_CHARS}</span>
            </div>
          </div>

          {/* Output */}
          <div className="pane">
            <div className="pane-title">
              <img src={tgtMeta.flag} alt="" className="pane-flag" />
              {paneTitle(targetLang)}
            </div>
            <div className="textarea-wrap output-area">
              <textarea
                id="outputText"
                placeholder="Kết quả sẽ hiển thị ở đây..."
                value={outputText}
                readOnly
              />
              <button
                id="copyInlineBtn"
                className="btn-copy-inline"
                type="button"
                title="Copy kết quả"
                onClick={() => void copyOutput()}
              >
                <IconCopy />
              </button>
            </div>
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────── */}
        {error && (
          <div id="errorBox" className="error-box">
            ⚠️ {error}
          </div>
        )}

        {/* ── Actions ───────────────────────────────────── */}
        <div className="actions">
          <div className="actions-left">
            <button id="clearBtn" className="btn-secondary" type="button" onClick={clearAll}>
              Xóa nhanh
            </button>
            <button id="copyBtn" className="btn-secondary" type="button"
              onClick={() => void copyOutput()}>
              <IconCopy /> Copy
            </button>
          </div>

          <button
            id="translateBtn"
            className="btn-translate"
            type="button"
            disabled={loading}
            onClick={() => void doTranslate()}
          >
            {loading
              ? <><span className="spinner" /> Đang dịch...</>
              : <><IconTranslate /> Translate</>
            }
          </button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="footer">
        <a href="#" id="rateLink"><IconStar /> Rate Translation</a>
        <span className="footer-dot">or</span>
        <a href="#" id="infoLink"><IconInfo /> App Info</a>
      </footer>

      {/* ── Toast ─────────────────────────────────────────── */}
      <div id="copyToast" className={`toast${toast ? ' show' : ''}`}>
        ✓ Đã copy vào clipboard!
      </div>
    </main>
  )
}
