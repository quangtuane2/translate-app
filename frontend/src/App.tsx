import { useState } from 'react'
import './App.css'

type LangCode = 'vi' | 'bna' | 'ede'

type ApiError = {
  message?: string
  details?: string[]
}

export default function App() {
  const [sourceLang, setSourceLang] = useState<LangCode>('vi')
  const [targetLang, setTargetLang] = useState<LangCode>('bna')
  const [inputText, setInputText] = useState<string>('')
  const [outputText, setOutputText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const setErrorBox = (message: string) => {
    setError(message)
  }

  const swapDirection = () => {
    setErrorBox('')
    const prevSource = sourceLang
    const prevTarget = targetLang
    const prevInput = inputText
    const prevOutput = outputText

    setSourceLang(prevTarget)
    setTargetLang(prevSource)
    setInputText(prevOutput)
    setOutputText(prevInput)
  }

  const clearAll = () => {
    setErrorBox('')
    setInputText('')
    setOutputText('')
  }

  const copyOutput = async () => {
    const text = (outputText || '').trim()
    if (!text) {
      setErrorBox('Chưa có nội dung để copy.')
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setErrorBox('')
    } catch {
      setErrorBox('Không thể copy tự động trên trình duyệt này.')
    }
  }

  const doTranslate = async () => {
    setErrorBox('')

    const clean = (inputText || '').trim()
    if (!clean) {
      setErrorBox('Vui lòng nhập văn bản để dịch.')
      return
    }

    if (sourceLang === targetLang) {
      setErrorBox('Ngôn ngữ nguồn và đích không được giống nhau.')
      return
    }

    setLoading(true)

    try {
      const resp = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          sourceLang,
          targetLang,
        }),
      })

      if (!resp.ok) {
        const err = (await resp.json().catch(() => null)) as ApiError | null
        setErrorBox(err?.message || 'Dịch thất bại. Vui lòng thử lại.')
        setOutputText('')
        return
      }

      const data = await resp.json()
      setOutputText(data?.translatedText ?? '')
    } catch {
      setErrorBox('Không thể kết nối tới máy chủ dịch. Kiểm tra lại backend.')
      setOutputText('')
    } finally {
      setLoading(false)
    }
  }

  // When user picks the same lang on both sides, auto-flip the other side
  const handleSourceChange = (val: LangCode) => {
    setSourceLang(val)
    if (val === targetLang) {
      // pick a sensible default for target
      setTargetLang(val === 'vi' ? 'bna' : 'vi')
    }
    setOutputText('')
    setErrorBox('')
  }

  const handleTargetChange = (val: LangCode) => {
    setTargetLang(val)
    if (val === sourceLang) {
      setSourceLang(val === 'vi' ? 'bna' : 'vi')
    }
    setOutputText('')
    setErrorBox('')
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">VN ↔ Ba Na / Ê-đê Translator</div>
        <div className="subtitle">Giao diện giống Google Dịch</div>
      </header>

      <section className="card">
        <div className="toolbar">
          <div className="lang">
            <label htmlFor="sourceLang">Từ</label>
            <select
              id="sourceLang"
              value={sourceLang}
              onChange={(e) => handleSourceChange(e.target.value as LangCode)}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="bna">Tiếng Ba Na</option>
              <option value="ede">Tiếng Ê-đê</option>
            </select>
          </div>

          <button
            id="swapBtn"
            className="btn btn-secondary"
            type="button"
            title="Hoán đổi chiều dịch"
            onClick={swapDirection}
          >
            Swap
          </button>

          <div className="lang">
            <label htmlFor="targetLang">Đến</label>
            <select
              id="targetLang"
              value={targetLang}
              onChange={(e) => handleTargetChange(e.target.value as LangCode)}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="bna">Tiếng Ba Na</option>
              <option value="ede">Tiếng Ê-đê</option>
            </select>
          </div>
        </div>

        <div className="panes">
          <div className="pane">
            <div className="pane-title">Văn bản gốc</div>
            <textarea
              id="inputText"
              placeholder="Nhập văn bản..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  void doTranslate()
                }
              }}
            />
          </div>

          <div className="pane">
            <div className="pane-title">Bản dịch</div>
            <textarea
              id="outputText"
              placeholder="Kết quả sẽ hiển thị ở đây..."
              value={outputText}
              readOnly
            />
          </div>
        </div>

        <div id="errorBox" className="error-box" hidden={!error}>
          {error}
        </div>

        <div className="actions">
          <button
            id="clearBtn"
            className="btn btn-secondary"
            type="button"
            onClick={clearAll}
          >
            Xóa nhanh
          </button>

          <button
            id="copyBtn"
            className="btn btn-secondary"
            type="button"
            onClick={() => void copyOutput()}
          >
            Copy
          </button>

          <button
            id="translateBtn"
            className="btn btn-primary"
            type="button"
            disabled={loading}
            onClick={() => void doTranslate()}
          >
            <span id="translateLabel">{loading ? '' : 'Dịch'}</span>
            <span id="translateLoading" className="loading" hidden={!loading}>
              Loading...
            </span>
          </button>
        </div>
      </section>
    </main>
  )
}
