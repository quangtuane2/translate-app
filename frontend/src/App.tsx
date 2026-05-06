import { useState, useRef, useEffect } from 'react'
import './App.css'

// Import assets
import logo from './assets/logo.png'
import viFlag from './assets/vietnam.png'
import bnaFlag from './assets/bana.png'
import edeFlag from './assets/ede.png'
import khmerFlag from './assets/khmer.png'
import VirtualKeyboard from './VirtualKeyboard'

type LangCode = 'vi' | 'bna' | 'ede' | 'km'

type ExampleItem = {
  vi: string
  ethnic: string
}

type HistoryItem = {
  id: string
  sourceText: string
  targetText: string
  sourceLang: LangCode
  targetLang: LangCode
  timestamp: number
}

type ApiError = {
  message?: string
  details?: string[]
}

const LANG_META: Record<LangCode, { label: string; flag: string }> = {
  vi: { label: 'Vietnamese', flag: viFlag },
  bna: { label: 'Ba Na', flag: bnaFlag },
  ede: { label: 'Ê-đê', flag: edeFlag },
  km: { label: 'Khmer', flag: khmerFlag },
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

// const IconStar = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
//     strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
//     <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
//   </svg>
// )

const IconInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const IconKeyboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
    <line x1="7" y1="8" x2="7" y2="8" />
    <line x1="12" y1="8" x2="12" y2="8" />
    <line x1="17" y1="8" x2="17" y2="8" />
    <line x1="7" y1="12" x2="7" y2="12" />
    <line x1="12" y1="12" x2="12" y2="12" />
    <line x1="17" y1="12" x2="17" y2="12" />
    <line x1="7" y1="16" x2="7" y2="16" />
    <line x1="12" y1="16" x2="17" y2="16" />
  </svg>
)

const IconMic = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

const IconHistory = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconStar = ({ filled }: { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

export default function App() {
  const [sourceLang, setSourceLang] = useState<LangCode>('vi')
  const [targetLang, setTargetLang] = useState<LangCode>('bna')
  const [inputText, setInputText] = useState<string>('')
  const [outputText, setOutputText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [examples, setExamples] = useState<ExampleItem[]>([])
  const [loadingExamples, setLoadingExamples] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false)
  const [isListening, setIsListening] = useState<boolean>(false)
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('translate_history')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [favorites, setFavorites] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('translate_favorites')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [showHistory, setShowHistory] = useState<boolean>(false)
  const [showFavorites, setShowFavorites] = useState<boolean>(false)
  const [toast, setToast] = useState<boolean>(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Show toast then hide after 2 s */
  const showToast = () => {
    setToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(false), 2000)
  }
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
  }, [])

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('translate_history', JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem('translate_favorites', JSON.stringify(favorites))
  }, [favorites])

  /* ── Handlers ──────────────────────────────────────────── */
  const swapDirection = () => {
    setError('')
    const [ps, pt, pi, po] = [sourceLang, targetLang, inputText, outputText]
    setSourceLang(pt); setTargetLang(ps)
    setInputText(po); setOutputText(pi)
  }

  const clearAll = () => { setError(''); setInputText(''); setOutputText(''); setExamples([]) }

  const copyOutput = async () => {
    const text = outputText.trim()
    if (!text) { setError('Chưa có nội dung kết quả để copy.'); return }
    try {
      await navigator.clipboard.writeText(text)
      setError('')
      showToast()
    } catch {
      setError('Không thể copy tự động trên trình duyệt này.')
    }
  }

  const copyInput = async () => {
    const text = inputText.trim()
    if (!text) { setError('Chưa có nội dung nguồn để copy.'); return }
    try {
      await navigator.clipboard.writeText(text)
      setError('')
      showToast()
    } catch {
      setError('Không thể copy tự động trên trình duyệt này.')
    }
  }

  const doTranslate = async (overrideText?: string) => {
    setError('')
    const textToUse = overrideText !== undefined ? overrideText : inputText
    const clean = textToUse.trim()
    if (!clean) { setError('Vui lòng nhập văn bản để dịch.'); return }
    if (sourceLang === targetLang) { setError('Ngôn ngữ nguồn và đích không được giống nhau.'); return }

    setLoading(true)
    setExamples([])

    // Fetch Translation
    try {
      const resp = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToUse, sourceLang, targetLang }),
      })
      if (!resp.ok) {
        const err = (await resp.json().catch(() => null)) as ApiError | null
        setError(err?.message || 'Dịch thất bại. Vui lòng thử lại.')
        setOutputText('')
        setLoading(false)
        return
      }
      const data = await resp.json()
      const resultText = data?.translatedText ?? ''
      setOutputText(resultText)

      // Add to History
      if (resultText && clean) {
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          sourceText: clean,
          targetText: resultText,
          sourceLang,
          targetLang,
          timestamp: Date.now()
        }
        setHistory(prev => {
          // Avoid duplicates (same text and langs)
          const isDup = prev.find(h => h.sourceText === clean && h.sourceLang === sourceLang && h.targetLang === targetLang)
          if (isDup) return prev
          return [newItem, ...prev].slice(0, 50) // Keep last 50
        })
      }
    } catch {
      setError('Không thể kết nối tới máy chủ dịch. Kiểm tra lại backend.')
      setOutputText('')
    } finally {
      setLoading(false)
    }

    // Fetch Examples (concurrently or after)
    fetchExamples(clean, sourceLang, targetLang)
  }

  const fetchExamples = async (text: string, sl: LangCode, tl: LangCode) => {
    const query = text.trim()
    if (!query || query.length < 2) {
      setExamples([])
      setLoadingExamples(false)
      return
    }

    setLoadingExamples(true)
    try {
      const resp = await fetch('/api/examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query, sourceLang: sl, targetLang: tl }),
      })
      if (resp.ok) {
        const data = await resp.json()
        setExamples(data?.examples || [])
      }
    } catch (err) {
      console.error("Failed to fetch examples", err)
    } finally {
      setLoadingExamples(false)
    }
  }

  const handleInputChange = (val: string) => {
    setInputText(val)
    setError('')
    // Debounce fetching examples
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      void fetchExamples(val, sourceLang, targetLang)
    }, 600) // Wait 600ms after user stops typing
  }

  const saveCurrentToFavorites = () => {
    const sText = inputText.trim()
    const tText = outputText.trim()
    if (!sText || !tText) {
      setError('Cần có cả văn bản gốc và kết quả dịch để lưu vào yêu thích.')
      return
    }

    const item: HistoryItem = {
      id: Date.now().toString(),
      sourceText: sText,
      targetText: tText,
      sourceLang,
      targetLang,
      timestamp: Date.now()
    }
    toggleFavorite(item)
  }

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'vi-VN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      setError('Có lỗi khi thu âm. Vui lòng kiểm tra micro.')
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      handleInputChange(transcript)
      // Call translate with the direct transcript to avoid state lag
      void doTranslate(transcript)
    }

    recognition.start()
  }

  const toggleFavorite = (item: HistoryItem) => {
    setFavorites(prev => {
      // Check by content and language to sync across form/history
      const isFav = prev.find(f => 
        f.sourceText === item.sourceText && 
        f.targetText === item.targetText && 
        f.targetLang === item.targetLang
      )
      if (isFav) {
        return prev.filter(f => f.id !== isFav.id)
      }
      return [item, ...prev]
    })
  }

  const isFavorited = (sText: string, tText: string, tLang: LangCode) => {
    return !!favorites.find(f => 
      f.sourceText === sText.trim() && 
      f.targetText === tText.trim() && 
      f.targetLang === tLang
    )
  }

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  const clearAllHistory = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử dịch?')) {
      setHistory([])
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
        <div className="subtitle">VIETNAMESE ↔ BA NA / Ê-ĐÊ / KHMER</div>
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
                <option value="km">Khmer</option>
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
                <option value="km">Khmer</option>
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
                onChange={(e) => handleInputChange(e.target.value)}
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
              <button
                id="copyInputInlineBtn"
                className="btn-copy-inline-input"
                type="button"
                title="Copy văn bản gốc"
                onClick={() => void copyInput()}
              >
                <IconCopy />
              </button>
              {sourceLang === 'vi' && (
                <button
                  id="micBtn"
                  className={`btn-mic-inline${isListening ? ' listening' : ''}`}
                  type="button"
                  title="Thu âm tiếng Việt"
                  onClick={toggleListening}
                >
                  <IconMic />
                </button>
              )}
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
              <button
                id="favInlineBtn"
                className={`btn-fav-inline ${isFavorited(inputText, outputText, targetLang) ? 'active' : ''}`}
                type="button"
                title="Lưu vào yêu thích"
                onClick={saveCurrentToFavorites}
              >
                <IconStar filled={isFavorited(inputText, outputText, targetLang)} />
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
            <button
              id="keyboardBtn"
              className={`btn-secondary${showKeyboard ? ' active' : ''}`}
              type="button"
              onClick={() => setShowKeyboard(!showKeyboard)}
            >
              <IconKeyboard /> Bàn phím
            </button>
            <button
              className={`btn-secondary${showHistory ? ' active' : ''}`}
              type="button"
              onClick={() => { setShowHistory(!showHistory); setShowFavorites(false); setShowKeyboard(false) }}
            >
              <IconHistory /> Lịch sử
            </button>
            <button
              className={`btn-secondary${showFavorites ? ' active' : ''}`}
              type="button"
              onClick={() => { setShowFavorites(!showFavorites); setShowHistory(false); setShowKeyboard(false) }}
            >
              <IconStar filled={showFavorites} /> Yêu thích
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

        {/* ── Dictionary & Examples ─────────────────────── */}
        {(examples.length > 0 || loadingExamples || (inputText.trim().length >= 2 && !loadingExamples)) && (
          <div className="examples-section">
            <h3 className="examples-title">
              <IconInfo /> Từ điển Ngữ cảnh & Ví dụ
            </h3>
            {loadingExamples ? (
              <div className="examples-loading">
                <span className="spinner" /> Đang tìm ví dụ...
              </div>
            ) : examples.length > 0 ? (
              <div className="examples-list">
                {examples.map((ex, idx) => (
                  <div key={idx} className="example-item">
                    <div className="example-vi">
                      <span className="bullet">•</span> {ex.vi}
                    </div>
                    <div className="example-ethnic">
                      {ex.ethnic}
                    </div>
                  </div>
                ))}
              </div>
            ) : inputText.trim().length >= 2 ? (
              <div className="examples-empty">
                Chưa có ví dụ cho từ khóa này trong bộ dữ liệu.
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* ── Virtual Keyboard (Outside Card) ──────────────── */}
      {showKeyboard && (
        <div className="keyboard-outer-wrap">
          <VirtualKeyboard
            input={inputText}
            onChange={handleInputChange}
            language={sourceLang}
            onClose={() => setShowKeyboard(false)}
          />
        </div>
      )}

      {/* ── History Section ─────────────────────────────── */}
      {showHistory && (
        <div className="extra-section history-section">
          <div className="section-header">
            <h3><IconHistory /> Lịch sử dịch gần đây</h3>
            <button className="btn-text" onClick={clearAllHistory}>
              <IconTrash /> Xóa hết
            </button>
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <p className="empty-msg">Chưa có lịch sử dịch nào.</p>
            ) : (
              history.map(item => (
                <div key={item.id} className="history-item-card">
                  <div className="item-langs">
                    {LANG_META[item.sourceLang].label} → {LANG_META[item.targetLang].label}
                  </div>
                  <div className="item-content">
                    <div className="item-source">{item.sourceText}</div>
                    <div className="item-target">{item.targetText}</div>
                  </div>
                  <div className="item-actions">
                    <button 
                      className={`btn-star ${isFavorited(item.sourceText, item.targetText, item.targetLang) ? 'active' : ''}`}
                      onClick={() => toggleFavorite(item)}
                    >
                      <IconStar filled={isFavorited(item.sourceText, item.targetText, item.targetLang)} />
                    </button>
                    <button className="btn-delete" onClick={() => deleteHistoryItem(item.id)}>
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Favorites Section ───────────────────────────── */}
      {showFavorites && (
        <div className="extra-section favorites-section">
          <div className="section-header">
            <h3><IconStar filled /> Từ vựng đã lưu</h3>
            <span className="count-badge">{favorites.length} mục</span>
          </div>
          <div className="history-list">
            {favorites.length === 0 ? (
              <p className="empty-msg">Bạn chưa lưu từ vựng nào.</p>
            ) : (
              favorites.map(item => (
                <div key={item.id} className="history-item-card favorite">
                  <div className="item-langs">
                    {LANG_META[item.sourceLang].label} → {LANG_META[item.targetLang].label}
                  </div>
                  <div className="item-content">
                    <div className="item-source">{item.sourceText}</div>
                    <div className="item-target">{item.targetText}</div>
                  </div>
                  <div className="item-actions">
                    <button className="btn-star active" onClick={() => toggleFavorite(item)}>
                      <IconStar filled />
                    </button>
                    <button className="btn-delete" onClick={() => toggleFavorite(item)}>
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Popular Dictionaries ─────────────────────────── */}
      <div className="popular-section">
        <h2 className="section-title">Popular and recommended dictionaries</h2>
        <div className="popular-grid">
          {[
            { from: 'vi', to: 'bna', label: 'Vietnamese - Bahnar' },
            { from: 'bna', to: 'vi', label: 'Bahnar - Vietnamese' },
            { from: 'vi', to: 'ede', label: 'Vietnamese - Ê-đê' },
            { from: 'ede', to: 'vi', label: 'Ê-đê - Vietnamese' },
            { from: 'vi', to: 'km', label: 'Vietnamese - Khmer' },
            { from: 'km', to: 'vi', label: 'Khmer - Vietnamese' },
            { from: 'vi', to: 'en', label: 'Vietnamese - English' },
            { from: 'en', to: 'vi', label: 'English - Vietnamese' },
          ].map((pair, idx) => (
            <div
              key={idx}
              className="dict-card"
              onClick={() => {
                setSourceLang(pair.from as any);
                setTargetLang(pair.to as any);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className="dict-card-info">
                <span className="dict-card-type">Dictionary</span>
                <span className="dict-card-name">{pair.label}</span>
              </div>
              <div className="dict-card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">🌍</span>
              <span className="logo-text">EthnicTranslate</span>
            </div>
            <p className="footer-tagline">Proudly made with ❤️ in Vietnam</p>
          </div>

          <div className="footer-links">
            <div className="link-group">
              <h4>Tools</h4>
              <a href="#">Dictionary builder</a>
              <a href="#">Pronunciation recorder</a>
              <a href="#">Add translations</a>
              <a href="#">All dictionaries</a>
            </div>
            <div className="link-group">
              <h4>About</h4>
              <a href="#">About us</a>
              <a href="#">Partners</a>
              <a href="#">Privacy policy</a>
              <a href="#">Terms of Service</a>
            </div>
            <div className="link-group">
              <h4>Stay in touch</h4>
              <a href="#">Facebook</a>
              <a href="#">Twitter</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; 2024 EthnicTranslate. All rights reserved.
        </div>
      </footer>

      {/* ── Toast ─────────────────────────────────────────── */}
      <div id="copyToast" className={`toast${toast ? ' show' : ''}`}>
        ✓ Đã copy vào clipboard!
      </div>
    </main>
  )
}
