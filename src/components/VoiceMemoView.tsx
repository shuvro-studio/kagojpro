import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FilePlus2,
  FolderOpen,
  Mic,
  MicOff,
  Printer,
  Save,
  Search,
  Share2,
  Trash2,
} from 'lucide-react';
import type { TranslationDict } from '../i18n/translations';
import type { SpeechLang, VoiceNote } from '../types';
import {
  countWords,
  deriveNoteTitle,
  filterNotes,
  insertPunctuationAtCursor,
} from '../utils/textHelpers';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

interface VoiceMemoViewProps {
  notes: VoiceNote[];
  t: TranslationDict;
  activeNoteId: string | null;
  onSaveNote: (note: VoiceNote) => void;
  onDeleteNote: (id: string) => void;
  onSelectNote: (note: VoiceNote | null) => void;
  onPrintNote: (title: string, content: string) => void;
}

export function VoiceMemoView({
  notes,
  t,
  activeNoteId,
  onSaveNote,
  onDeleteNote,
  onSelectNote,
  onPrintNote,
}: VoiceMemoViewProps) {
  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) || null,
    [notes, activeNoteId]
  );

  const [speechLang, setSpeechLang] = useState<SpeechLang>('bn-BD');
  const [title, setTitle] = useState<string>(activeNote?.title ?? '');
  const [content, setContent] = useState<string>(activeNote?.content ?? '');
  const [interimText, setInterimText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const manualStopRef = useRef<boolean>(false);

  const speechSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const w = window as WindowWithSpeech;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }, []);

  // Sync editor fields when user selects a different saved note
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      setSpeechLang(activeNote.speechLang);
      setInterimText('');
    }
  }, [activeNote]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        manualStopRef.current = true;
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  const stopListening = () => {
    manualStopRef.current = true;
    setIsListening(false);
    setInterimText('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
  };

  const startListening = () => {
    setSpeechError(null);
    const w = window as WindowWithSpeech;
    const SpeechCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechCtor) {
      setSpeechError(t.speechUnsupportedBody);
      return;
    }

    try {
      const recognition = new SpeechCtor();
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      manualStopRef.current = false;

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let finalChunk = '';
        let interimChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? '';
          if (result.isFinal) {
            finalChunk += transcript;
          } else {
            interimChunk += transcript;
          }
        }
        if (finalChunk.trim().length > 0) {
          setContent((prev) => {
            const sep = prev.length > 0 && !/\s$/.test(prev) ? ' ' : '';
            return prev + sep + finalChunk.trim();
          });
        }
        setInterimText(interimChunk);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError(t.micPermissionError);
          stopListening();
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setSpeechError(t.micPermissionError);
          stopListening();
        }
      };

      recognition.onend = () => {
        setInterimText('');
        if (!manualStopRef.current) {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setSpeechError(t.micPermissionError);
      setIsListening(false);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSpeechLangChange = (nextLang: SpeechLang) => {
    setSpeechLang(nextLang);
    if (isListening) {
      stopListening();
    }
  };

  const handlePunctuation = (token: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? content.length;
    const res = insertPunctuationAtCursor(content, token, start, end);
    setContent(res.text);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(res.caretPosition, res.caretPosition);
      }
    });
  };

  const handleSave = () => {
    if (!content.trim() && !title.trim()) return;
    const now = new Date().toISOString();
    const noteId = activeNote?.id ?? `note-${Date.now()}`;
    const saved: VoiceNote = {
      id: noteId,
      title: deriveNoteTitle(title, content),
      content: content.trim(),
      speechLang,
      createdAt: activeNote?.createdAt ?? now,
      updatedAt: now,
    };
    onSaveNote(saved);
    onSelectNote(saved);
    setTitle(saved.title);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2200);
  };

  const handleNewNote = () => {
    if (isListening) stopListening();
    onSelectNote(null);
    setTitle('');
    setContent('');
    setInterimText('');
    setSpeechError(null);
    textareaRef.current?.focus();
  };

  const handleCopy = async () => {
    const fullText = title.trim() ? `${title.trim()}\n\n${content}` : content;
    if (!fullText.trim()) return;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback copy
      const temp = document.createElement('textarea');
      temp.value = fullText;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    const derivedTitle = deriveNoteTitle(title, content);
    const body = `${derivedTitle}\n${'='.repeat(Math.min(40, derivedTitle.length))}\n\n${content}\n`;
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KagojPro-Note-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const whatsappUrl = useMemo(() => {
    const text = title.trim() ? `*${title.trim()}*\n${content}` : content;
    return `https://wa.me/?text=${encodeURIComponent(text.trim())}`;
  }, [title, content]);

  const filteredNotes = useMemo(
    () => filterNotes(notes, searchQuery),
    [notes, searchQuery]
  );

  const wordCount = countWords(content);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {t.voiceTitle}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">{t.voiceSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleNewNote}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FilePlus2 className="w-4 h-4" />
          <span>{t.actionNewNote}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Voice Studio Column */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-5">
          {/* Speech Language + Tactile Mic Control */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
              <button
                type="button"
                onClick={() => handleSpeechLangChange('bn-BD')}
                className={`min-h-[40px] px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  speechLang === 'bn-BD'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.speechLangBangla}
              </button>
              <button
                type="button"
                onClick={() => handleSpeechLangChange('en-US')}
                className={`min-h-[40px] px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  speechLang === 'en-US'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.speechLangEnglish}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleMic}
                disabled={!speechSupported}
                aria-label={isListening ? t.tapToStop : t.tapToSpeak}
                className={`inline-flex items-center justify-center gap-2.5 min-h-[48px] px-5 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isListening
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    <span>{t.tapToStop}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>{t.tapToSpeak}</span>
                  </>
                )}
              </button>

              {isListening && (
                <div
                  aria-live="polite"
                  className="flex items-center gap-1.5 h-10 px-3 rounded-lg bg-red-50 border border-red-200 text-red-700"
                >
                  <div className="flex items-center gap-0.5 h-5" aria-hidden="true">
                    <span className="w-1 h-4 bg-red-600 rounded-full animate-voice-bar" />
                    <span
                      className="w-1 h-5 bg-red-600 rounded-full animate-voice-bar"
                      style={{ animationDelay: '0.15s' }}
                    />
                    <span
                      className="w-1 h-3.5 bg-red-600 rounded-full animate-voice-bar"
                      style={{ animationDelay: '0.3s' }}
                    />
                    <span
                      className="w-1 h-5 bg-red-600 rounded-full animate-voice-bar"
                      style={{ animationDelay: '0.45s' }}
                    />
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">
                    {t.listeningNow}
                  </span>
                </div>
              )}
            </div>
          </div>

          {!speechSupported && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700">
              <div className="font-semibold text-slate-900">{t.speechUnsupportedTitle}</div>
              <p className="mt-1 text-slate-600">{t.speechUnsupportedBody}</p>
            </div>
          )}

          {speechError && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800"
            >
              {speechError}
            </div>
          )}

          {/* Note Title & Editor */}
          <div className="space-y-3">
            <div>
              <label htmlFor="voice-note-title" className="sr-only">
                {t.noteTitlePlaceholder}
              </label>
              <input
                id="voice-note-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.noteTitlePlaceholder}
                className="w-full min-h-[44px] px-3.5 py-2 text-base font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="voice-note-content" className="sr-only">
                {t.noteContentPlaceholder}
              </label>
              <textarea
                id="voice-note-content"
                ref={textareaRef}
                rows={9}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.noteContentPlaceholder}
                className="w-full p-3.5 text-base leading-relaxed text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 resize-y"
              />
              {interimText && (
                <p className="mt-1.5 text-xs text-slate-500 italic">
                  {interimText}
                </p>
              )}
            </div>

            {/* Unboxed Metadata Line */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2 tabular-nums">
                <span>
                  {wordCount} {t.wordsCount}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {content.length} {t.charactersCount}
                </span>
              </div>
              {savedFeedback && (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  {t.noteSavedToast}
                </span>
              )}
            </div>
          </div>

          {/* Punctuation Helper Bar */}
          <div className="pt-2 border-t border-slate-200">
            <div className="text-xs font-medium text-slate-500 mb-2">
              {t.punctuationLabel}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePunctuation('।')}
                className="min-h-[44px] px-3.5 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.punctDari}
              </button>
              <button
                type="button"
                onClick={() => handlePunctuation(',')}
                className="min-h-[44px] px-3.5 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.punctComma}
              </button>
              <button
                type="button"
                onClick={() => handlePunctuation('?')}
                className="min-h-[44px] px-3.5 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.punctQuestion}
              </button>
              <button
                type="button"
                onClick={() => handlePunctuation('\n')}
                className="min-h-[44px] px-3.5 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.punctNewline}
              </button>
            </div>
          </div>

          {/* Primary & Export Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!content.trim() && !title.trim()}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{activeNote ? t.actionUpdateNote : t.actionSaveNote}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!content.trim() && !title.trim()}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t.actionCopied : t.actionCopy}</span>
            </button>

            <a
              href={content.trim() ? whatsappUrl : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!content.trim()}
              className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                !content.trim() ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              <span>{t.actionWhatsApp}</span>
            </a>

            <button
              type="button"
              onClick={handleDownloadTxt}
              disabled={!content.trim() && !title.trim()}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{t.actionDownloadTxt}</span>
            </button>

            <button
              type="button"
              onClick={() => onPrintNote(deriveNoteTitle(title, content), content)}
              disabled={!content.trim() && !title.trim()}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{t.actionPrintPdf}</span>
            </button>
          </div>
        </section>

        {/* Saved Notes Sidebar List */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              {t.recentNotesTitle}
            </h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {notes.length}
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchNotesPlaceholder}
              aria-label={t.searchNotesPlaceholder}
              className="w-full min-h-[44px] pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-600"
            />
          </div>

          {filteredNotes.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-slate-500">{t.noNotesEmpty}</p>
              <button
                type="button"
                onClick={handleNewNote}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
              >
                {t.noNotesAction}
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredNotes.map((note) => {
                const isSelected = note.id === activeNoteId;
                const formattedDate = note.updatedAt.slice(0, 10);
                return (
                  <li key={note.id} className="py-3 first:pt-1 last:pb-1">
                    <div
                      className={`rounded-lg p-2.5 transition-colors ${
                        isSelected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectNote(note)}
                          className="text-left flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {note.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 tabular-nums">
                            <span>{note.speechLang === 'bn-BD' ? 'বাংলা' : 'EN'}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formattedDate}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                            {note.content}
                          </p>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onSelectNote(note)}
                            aria-label={`${t.loadNote} '${note.title}'`}
                            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-500 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteNote(note.id)}
                            aria-label={`${t.deleteLabel} '${note.title}'`}
                            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
