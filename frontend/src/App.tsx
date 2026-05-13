import { useState, useRef, useEffect } from 'react'
import './App.css'

// Import assets
import logo from './assets/logo.png'
import viFlag from './assets/vietnam.png'
import bnaFlag from './assets/bana.png'
import edeFlag from './assets/ede.png'
import khmerFlag from './assets/khmer.png'
import VirtualKeyboard from './VirtualKeyboard'
import { useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import FeedbackModal from './components/FeedbackModal';
import AdminDashboard from './components/AdminDashboard';

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

type OcrBlock = {
  originalText: string;
  translatedText: string;
  x: number;
  y: number;
  width: number;
  height: number;
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

const IconSpeaker = ({ isSpeaking = false }: { isSpeaking?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={isSpeaking ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    {!isSpeaking ? (
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    ) : (
      <>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </>
    )}
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

const IconImage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, marginRight: 6 }}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

const IconText = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, marginRight: 6 }}>
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
)

const IconShare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const IconDocument = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, marginRight: 6 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

export default function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialSourceLang = (searchParams.get('sl') as LangCode) || 'vi';
  const initialTargetLang = (searchParams.get('tl') as LangCode) || 'bna';
  const initialInputText = searchParams.get('text') || '';

  const [sourceLang, setSourceLang] = useState<LangCode>(initialSourceLang)
  const [targetLang, setTargetLang] = useState<LangCode>(initialTargetLang)
  const [inputText, setInputText] = useState<string>(initialInputText)
  const [outputText, setOutputText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [examples, setExamples] = useState<ExampleItem[]>([])
  const [loadingExamples, setLoadingExamples] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false)
  const [isListening, setIsListening] = useState<boolean>(false)
  const [isSpeakingInput, setIsSpeakingInput] = useState<boolean>(false)
  const [isSpeakingOutput, setIsSpeakingOutput] = useState<boolean>(false)
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

  const [translateMode, setTranslateMode] = useState<'text' | 'image' | 'document'>('text')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [ocrBlocks, setOcrBlocks] = useState<OcrBlock[]>([])
  const [showOriginalImage, setShowOriginalImage] = useState<boolean>(false)
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false)
  const [imageScale, setImageScale] = useState({ x: 1, y: 1 });

  const [docFile, setDocFile] = useState<File | null>(null)
  const [docResult, setDocResult] = useState<{ originalText: string, translatedText: string } | null>(null)
  const [isDocProcessing, setIsDocProcessing] = useState<boolean>(false)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentAudio = useRef<HTMLAudioElement | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [feedbackConfig, setFeedbackConfig] = useState<{ isOpen: boolean, type: 'EDIT' | 'VOTE', historyId: string | number }>({ isOpen: false, type: 'EDIT', historyId: 0 })
  const [votedHistoryIds, setVotedHistoryIds] = useState<Set<string | number>>(new Set());
  const [currentHistoryId, setCurrentHistoryId] = useState<number | string>(0);
  const [view, setView] = useState<'TRANSLATE' | 'ADMIN'>('TRANSLATE');

  const handleImageLoad = () => {
    if (imageRef.current) {
      const scaleX = imageRef.current.clientWidth / imageRef.current.naturalWidth;
      const scaleY = imageRef.current.clientHeight / imageRef.current.naturalHeight;
      setImageScale({ x: scaleX, y: scaleY });
    }
  }

  useEffect(() => {
    const handleResize = () => handleImageLoad();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imagePreviewUrl]);

  // Fetch History and Favorites on Login
  useEffect(() => {
    if (user) {
      // Fetch History
      fetch('/api/history', {
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data)) {
            const formattedHistory = data.map((item: any) => ({
              id: item.id.toString(),
              sourceText: item.originalText,
              targetText: item.translatedText,
              sourceLang: item.sourceLang,
              targetLang: item.targetLang,
              timestamp: new Date(item.createdAt).getTime()
            }));
            setHistory(formattedHistory);
          }
        })
        .catch(console.error);

      // Fetch Favorites
      fetch('/api/favorites', {
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data)) {
            const formattedFavorites = data.map((fav: any) => ({
              id: fav.history.id.toString(),
              sourceText: fav.history.originalText,
              targetText: fav.history.translatedText,
              sourceLang: fav.history.sourceLang,
              targetLang: fav.history.targetLang,
              timestamp: new Date(fav.createdAt).getTime()
            }));
            setFavorites(formattedFavorites);
          }
        })
        .catch(console.error);
    } else {
      // User logged out, restore local
      try {
        const savedHistory = localStorage.getItem('translate_history');
        const savedFavs = localStorage.getItem('translate_favorites');
        setHistory(savedHistory ? JSON.parse(savedHistory) : []);
        setFavorites(savedFavs ? JSON.parse(savedFavs) : []);
      } catch { }
    }
  }, [user]);

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

  // Save to LocalStorage ONLY for guests
  useEffect(() => {
    if (!user) {
      localStorage.setItem('translate_history', JSON.stringify(history))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history])

  useEffect(() => {
    if (!user) {
      localStorage.setItem('translate_favorites', JSON.stringify(favorites))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites])

  // Auto translate on load if text is in URL
  useEffect(() => {
    if (initialInputText) {
      void doTranslate(initialInputText, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Image Handlers ────────────────────────────────────── */
  const handleImageUpload = async (file: File) => {
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setOcrBlocks([]);
    setIsOcrProcessing(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceLang', sourceLang);
    formData.append('targetLang', targetLang);

    try {
      const resp = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        throw new Error('Lỗi khi phân tích hình ảnh.');
      }
      const data = await resp.json();
      if (data.blocks) {
        setOcrBlocks(data.blocks);
        // Recalculate scale just in case
        setTimeout(handleImageLoad, 100);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Lỗi không xác định.');
      } else {
        setError('Lỗi không xác định.');
      }
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (translateMode === 'image' && file.type.startsWith('image/')) {
        handleImageUpload(file);
      } else if (translateMode === 'document') {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'txt' || ext === 'docx' || ext === 'pdf') {
          handleDocUpload(file);
        } else {
          setError('Định dạng file không hỗ trợ. Hỗ trợ .txt, .docx, .pdf');
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    setOcrBlocks([]);
    setError('');
  };

  const downloadTranslatedImage = () => {
    if (!imageRef.current || !imageFile) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Draw OCR blocks if not showing original
    if (!showOriginalImage) {
      ocrBlocks.forEach(block => {
        // Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(block.x, block.y, block.width, block.height);

        // Text
        ctx.fillStyle = '#111';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        // Calculate font size
        const fontSize = Math.max(10, block.height * 0.7);
        ctx.font = `500 ${fontSize}px Inter, sans-serif`;

        const centerX = block.x + block.width / 2;
        const centerY = block.y + block.height / 2;
        ctx.fillText(block.translatedText, centerX, centerY, block.width - 4);
      });
    }

    // Trigger download
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated_${imageFile.name}`;
    a.click();
  };

  /* ── Document Handlers ─────────────────────────────────── */
  const handleDocUpload = async (file: File) => {
    setDocFile(file);
    setDocResult(null);
    setIsDocProcessing(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceLang', sourceLang);
    formData.append('targetLang', targetLang);

    try {
      const resp = await fetch('/api/document', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        throw new Error('Lỗi khi xử lý tài liệu.');
      }
      const data = await resp.json();
      setDocResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Lỗi không xác định.');
      } else {
        setError('Lỗi không xác định.');
      }
    } finally {
      setIsDocProcessing(false);
    }
  };

  const clearDoc = () => {
    setDocFile(null);
    setDocResult(null);
    setError('');
  };

  const downloadTranslatedDocument = () => {
    if (!docResult || !docFile) return;

    const element = document.createElement("a");
    const file = new Blob([docResult.translatedText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `translated_${docFile.name}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const openTranslatedDocument = () => {
    if (!docResult) return;
    setInputText(docResult.originalText);
    setOutputText(docResult.translatedText);
    setTranslateMode('text');
  };

  /* ── Handlers ──────────────────────────────────────────── */
  const swapDirection = () => {
    setError('')
    const [ps, pt, pi, po] = [sourceLang, targetLang, inputText, outputText]
    setSourceLang(pt); setTargetLang(ps)
    setInputText(po); setOutputText(pi)
  }

  const clearAll = () => { setError(''); setInputText(''); setOutputText(''); setExamples([]) }

  const generateShareLink = async () => {
    const text = inputText.trim()
    if (!text) { setError('Chưa có nội dung để chia sẻ.'); return }

    const url = new URL(window.location.href);
    url.searchParams.set('sl', sourceLang);
    url.searchParams.set('tl', targetLang);
    url.searchParams.set('text', text);

    try {
      await navigator.clipboard.writeText(url.toString())
      setError('')
      setToast(true)
      if (toastTimer.current) clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setToast(false), 2000)
    } catch {
      setError('Không thể copy link tự động trên trình duyệt này.')
    }
  }

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

  const doTranslate = async (overrideText?: string, saveToHistory: boolean = true) => {
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
      if (saveToHistory && resultText && clean) {
        let savedHistoryId: string | number = Date.now().toString();

        // If user logged in, save to API to get real ID
        if (user) {
          try {
            const histResp = await fetch('/api/history', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.accessToken}`
              },
              body: JSON.stringify({
                sourceLang,
                targetLang,
                originalText: clean,
                translatedText: resultText
              })
            });
            if (histResp.ok) {
              const histData = await histResp.json();
              savedHistoryId = histData.id;
            }
          } catch (e) {
            console.error('Failed to save history to DB', e);
          }
        }

        setCurrentHistoryId(savedHistoryId);

        const newItem: HistoryItem = {
          id: savedHistoryId.toString(),
          sourceText: clean,
          targetText: resultText,
          sourceLang,
          targetLang,
          timestamp: Date.now()
        }
        setHistory(prev => {
          // Avoid duplicates (same text and langs)
          const isDup = prev.find(h => h.sourceText === clean && h.sourceLang === sourceLang && h.targetLang === targetLang)
          if (isDup) {
            setCurrentHistoryId(isDup.id);
            return prev;
          }
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
    // Debounce fetching examples and auto-translating
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      void fetchExamples(val, sourceLang, targetLang)
      if (val.trim()) {
        void doTranslate(val, false) // Auto-translate but don't save to history
      } else {
        setOutputText('')
      }
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
      id: currentHistoryId ? currentHistoryId.toString() : Date.now().toString(),
      sourceText: sText,
      targetText: tText,
      sourceLang,
      targetLang,
      timestamp: Date.now()
    }
    toggleFavorite(item)
  }

  const toggleListening = () => {
    const win = window as unknown as { SpeechRecognition: unknown, webkitSpeechRecognition: unknown };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (win.SpeechRecognition || win.webkitSpeechRecognition) as any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputText(transcript)
      // Call translate directly and save to history
      void doTranslate(transcript, true)
      void fetchExamples(transcript, sourceLang, targetLang)
    }

    recognition.start()
  }

  const handleSpeak = async (text: string, isInput: boolean) => {
    if (!text.trim()) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.currentTime = 0;
    }

    // If clicking on the currently speaking one, just stop it and return
    if ((isInput && isSpeakingInput) || (!isInput && isSpeakingOutput)) {
      setIsSpeakingInput(false);
      setIsSpeakingOutput(false);
      return;
    }

    setIsSpeakingInput(false);
    setIsSpeakingOutput(false);

    try {
      if (isInput) setIsSpeakingInput(true);
      else setIsSpeakingOutput(true);

      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: 'vi' }),
      });

      if (!resp.ok) {
        throw new Error('TTS Failed');
      }

      const data = await resp.json();
      const audioBase64 = data.audioBase64;

      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      currentAudio.current = audio;

      audio.onended = () => {
        if (isInput) setIsSpeakingInput(false);
        else setIsSpeakingOutput(false);
      };
      audio.onerror = () => {
        if (isInput) setIsSpeakingInput(false);
        else setIsSpeakingOutput(false);
      };
      audio.play();

    } catch (err) {
      console.error(err);
      if (isInput) setIsSpeakingInput(false);
      else setIsSpeakingOutput(false);
      setError('Lỗi khi tải âm thanh. Vui lòng thử lại.');
    }
  }

  const toggleFavorite = async (item: HistoryItem) => {
    // If user is logged in, sync to database first
    if (user && item.id && !isNaN(Number(item.id))) {
      try {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
          },
          body: JSON.stringify({ historyId: Number(item.id) })
        });
      } catch (err) {
        console.error("Failed to toggle favorite on DB", err);
      }
    }

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
        <div className="auth-buttons" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 500 }}>Chào, <strong>{user.username}</strong></span>

              {user.role === 'ROLE_ADMIN' && (
                <button
                  className="btn-secondary"
                  onClick={() => setView(view === 'ADMIN' ? 'TRANSLATE' : 'ADMIN')}
                  style={{ padding: '8px 16px', fontSize: '13px', background: '#ffebee', borderColor: '#f44336', color: '#c62828' }}>
                  {view === 'ADMIN' ? '🔙 Trở về' : '👑 Admin'}
                </button>
              )}

              <button className="btn-secondary" onClick={logout} style={{ padding: '8px 16px', fontSize: '13px' }}>Đăng xuất</button>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => setShowAuthModal(true)} style={{ margin: 0 }}>Đăng nhập</button>
          )}
        </div>
      </header>

      {/* ── Main Content Area ─────────────────────────────── */}
      {view === 'ADMIN' ? (
        <AdminDashboard />
      ) : (
        <>
          {/* ── Card ──────────────────────────────────────────── */}
          <section className="card">

            {/* ── Mode Tabs ─────────────────────────────────── */}
            <div className="mode-tabs">
              <button className={`mode-tab ${translateMode === 'text' ? 'active' : ''}`} onClick={() => setTranslateMode('text')}>
                <IconText /> Văn bản
              </button>
              <button className={`mode-tab ${translateMode === 'image' ? 'active' : ''}`} onClick={() => setTranslateMode('image')}>
                <IconImage /> Hình ảnh
              </button>
              <button className={`mode-tab ${translateMode === 'document' ? 'active' : ''}`} onClick={() => setTranslateMode('document')}>
                <IconDocument /> Tài liệu
              </button>
            </div>

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

            {/* ── Text panes, Image pane, or Document pane ──────────────────── */}
            {translateMode === 'text' && (
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
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void doTranslate(undefined, true)
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
                    <button
                      className={`btn-speaker-inline-input ${isSpeakingInput ? 'speaking' : ''}`}
                      type="button"
                      title="Đọc phát âm"
                      onClick={() => handleSpeak(inputText, true)}
                    >
                      <IconSpeaker isSpeaking={isSpeakingInput} />
                    </button>
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
                    <button
                      className={`btn-speaker-inline-output ${isSpeakingOutput ? 'speaking' : ''}`}
                      type="button"
                      title="Đọc phát âm"
                      onClick={() => handleSpeak(outputText, false)}
                    >
                      <IconSpeaker isSpeaking={isSpeakingOutput} />
                    </button>
                    <button
                      className="btn-share-inline"
                      type="button"
                      title="Chia sẻ bản dịch này"
                      onClick={() => void generateShareLink()}
                    >
                      <IconShare />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px', paddingRight: '5px' }}>
                    <button
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '6px 12px' }}
                      title="Đề xuất bản dịch tốt hơn"
                      onClick={() => {
                        if (!user) return setShowAuthModal(true);
                        if (!currentHistoryId) { setError('Bạn chưa dịch nội dung nào'); return; }
                        setFeedbackConfig({ isOpen: true, type: 'EDIT', historyId: currentHistoryId });
                      }}>
                      ✏️ Edit
                    </button>

                    {votedHistoryIds.has(currentHistoryId) ? (
                      <button
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '6px 12px', opacity: 0.6, cursor: 'not-allowed' }}
                        title="Bạn đã đánh giá bản dịch này"
                        disabled
                      >
                        ✅ Voted
                      </button>
                    ) : (
                      <button
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '6px 12px' }}
                        title="Đánh giá bản dịch"
                        onClick={() => {
                          if (!user) return setShowAuthModal(true);
                          if (!currentHistoryId) { setError('Bạn chưa dịch nội dung nào'); return; }
                          setFeedbackConfig({ isOpen: true, type: 'VOTE', historyId: currentHistoryId });
                        }}>
                        ⭐ Voting
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {translateMode === 'image' && (
              <div className="image-pane">
                {imagePreviewUrl && (
                  <div className="image-pane-header" style={{ display: 'flex', alignItems: 'center', padding: '10px 15px', background: '#f8f9fa', borderBottom: '1px solid #e1e4e8', borderRadius: '12px 12px 0 0' }}>
                    <button className="btn-secondary" onClick={clearImage} style={{ marginRight: 10 }}>
                      ✕ Xóa ảnh
                    </button>
                    <button className="btn-secondary" onClick={downloadTranslatedImage} style={{ marginRight: 'auto' }} title="Tải xuống hình ảnh đã dịch">
                      <IconCopy /> Tải bản dịch
                    </button>
                    <span className="toggle-label" style={{ marginRight: 10, fontSize: 14, fontWeight: 500 }}>Hiện bản gốc</span>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={showOriginalImage} onChange={(e) => setShowOriginalImage(e.target.checked)} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                )}

                {!imagePreviewUrl ? (
                  <div
                    className="image-upload-zone"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="upload-icon"><IconImage /></div>
                    <h3>Kéo và thả hình ảnh vào đây</h3>
                    <p>hoặc</p>
                    <label className="btn-primary" style={{ cursor: 'pointer', padding: '10px 20px', borderRadius: 8, marginTop: 10, display: 'inline-block' }}>
                      Duyệt qua các tệp
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} />
                    </label>
                  </div>
                ) : (
                  <div className="image-viewer" style={{ padding: 20, textAlign: 'center', background: '#f8f9fa', borderRadius: '0 0 12px 12px' }}>
                    {isOcrProcessing && (
                      <div className="ocr-loading" style={{ padding: 20, color: '#1a73e8', fontWeight: 500 }}>
                        <span className="spinner" /> Đang phân tích và dịch hình ảnh...
                      </div>
                    )}
                    <div className="image-container" style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                      <img
                        ref={imageRef}
                        src={imagePreviewUrl}
                        alt="Uploaded"
                        onLoad={handleImageLoad}
                        style={{ maxWidth: '100%', maxHeight: '65vh', display: 'block', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      {!showOriginalImage && !isOcrProcessing && ocrBlocks.map((block, idx) => (
                        <div
                          key={idx}
                          className="ocr-block"
                          style={{
                            position: 'absolute',
                            left: block.x * imageScale.x,
                            top: block.y * imageScale.y,
                            width: block.width * imageScale.x,
                            height: block.height * imageScale.y,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            color: '#111',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            padding: '2px',
                            boxSizing: 'border-box',
                            fontSize: Math.max(10, (block.height * imageScale.y) * 0.7) + 'px',
                            fontWeight: 500,
                            borderRadius: 4,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            textAlign: 'center'
                          }}
                          title={block.originalText}
                        >
                          {block.translatedText}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {translateMode === 'document' && (
              <div className="document-pane" style={{ padding: '40px 20px', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {isDocProcessing ? (
                  <div className="doc-loading" style={{ padding: 20, color: '#1a73e8', fontWeight: 500 }}>
                    <span className="spinner" /> Đang dịch tài liệu...
                  </div>
                ) : docFile ? (
                  <div className="doc-result-container" style={{ width: '100%', maxWidth: 600 }}>
                    <div className="doc-file-info" style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', background: '#f1f3f4', borderRadius: 8, marginBottom: 20 }}>
                      <IconDocument />
                      <div style={{ flex: 1, marginLeft: 15 }}>
                        <div style={{ fontWeight: 500, color: '#202124' }}>{docFile.name}</div>
                        <div style={{ fontSize: 13, color: '#5f6368', marginTop: 4 }}>{(docFile.size / 1024).toFixed(0)} KB</div>
                      </div>
                      <button className="btn-clear-doc" onClick={clearDoc} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5f6368', fontSize: 18 }}>✕</button>
                    </div>

                    {docResult && (
                      <div className="doc-actions" style={{ display: 'flex', justifyContent: 'center', gap: 15 }}>
                        <button className="btn-secondary" onClick={downloadTranslatedDocument} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
                          <IconCopy /> Tải bản dịch xuống
                        </button>
                        <button className="btn-primary" onClick={openTranslatedDocument} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
                          <IconShare /> Mở bản dịch
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="doc-upload-zone"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    style={{ border: '2px dashed #dadce0', borderRadius: 12, padding: '40px 20px', textAlign: 'center', width: '100%', maxWidth: 600, background: '#f8f9fa' }}
                  >
                    <div className="upload-icon" style={{ fontSize: 40, color: '#1a73e8', marginBottom: 15 }}><IconDocument /></div>
                    <h3 style={{ color: '#202124', marginBottom: 8 }}>Kéo và thả tài liệu vào đây</h3>
                    <p style={{ color: '#5f6368', fontSize: 14 }}>Hỗ trợ các định dạng .docx, .pdf, .txt</p>
                    <p style={{ margin: '15px 0' }}>hoặc</p>
                    <label className="btn-primary" style={{ cursor: 'pointer', padding: '10px 20px', borderRadius: 8, display: 'inline-block' }}>
                      Duyệt qua các tệp
                      <input type="file" accept=".txt,.docx,.pdf" style={{ display: 'none' }} onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const file = e.target.files[0];
                          const ext = file.name.split('.').pop()?.toLowerCase();
                          if (ext === 'txt' || ext === 'docx' || ext === 'pdf') {
                            handleDocUpload(file);
                          } else {
                            setError('Định dạng file không hỗ trợ. Hỗ trợ .txt, .docx, .pdf');
                          }
                        }
                      }} />
                    </label>
                  </div>
                )}
              </div>
            )}

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
                onClick={() => void doTranslate(undefined, true)}
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
                    setSourceLang(pair.from as LangCode);
                    setTargetLang(pair.to as LangCode);
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
        </>
      )}

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

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {/* Feedback Modal */}
      {feedbackConfig.isOpen && (
        <FeedbackModal
          historyId={feedbackConfig.historyId}
          type={feedbackConfig.type}
          onClose={() => setFeedbackConfig({ ...feedbackConfig, isOpen: false })}
          onSuccess={() => {
            if (feedbackConfig.type === 'VOTE') {
              setVotedHistoryIds(prev => new Set(prev).add(feedbackConfig.historyId));
            }
          }}
        />
      )}
    </main>
  )
}
