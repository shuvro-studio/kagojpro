import { useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { LockKeyhole } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import type { TranslationDict } from '../i18n/translations';
import type { UiLang } from '../types';

interface AuthGateProps {
  t: TranslationDict;
  uiLang: UiLang;
  onChangeUiLang: (lang: UiLang) => void;
}

function mapFirebaseAuthError(code: string, t: TranslationDict, fallback: string): string {
  switch (code) {
    case 'auth/operation-not-allowed':
      return t.authEmailProviderNotice;
    case 'auth/weak-password':
      return t.authWeakPasswordError;
    case 'auth/popup-closed-by-user':
      return '';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in.';
    default:
      return fallback;
  }
}

export function AuthGate({
  t,
  uiLang,
  onChangeUiLang,
}: AuthGateProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code: unknown }).code)
          : '';
      const msg = mapFirebaseAuthError(
        code,
        t,
        err instanceof Error ? err.message : 'Unable to sign in with Google.'
      );
      if (msg) setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim() || (mode === 'signup' && !fullName.trim())) {
      setErrorMsg(t.authMissingFieldsError);
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMsg(t.authWeakPasswordError);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        await updateProfile(cred.user, {
          displayName: fullName.trim().slice(0, 100),
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code: unknown }).code)
          : '';
      const msg = mapFirebaseAuthError(
        code,
        t,
        err instanceof Error ? err.message : 'Authentication failed.'
      );
      if (msg) setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between gap-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0">
            ক
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            {t.appName}
          </span>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => onChangeUiLang('bn')}
            className={`min-h-[38px] px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              uiLang === 'bn'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            বাংলা
          </button>
          <button
            type="button"
            onClick={() => onChangeUiLang('en')}
            className={`min-h-[38px] px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              uiLang === 'en'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Editorial Intro Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <LockKeyhole className="w-4 h-4" />
              <span>{t.appSubtitle}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight [text-wrap:balance]">
              {t.authHeadline}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {t.authSubheadline}
            </p>
            <ul className="pt-2 space-y-2 text-sm text-slate-700">
              <li>• {t.voiceTitle}</li>
              <li>• {t.receiptTitle}</li>
              <li>• {t.historyTitle}</li>
            </ul>
          </div>

          {/* Auth Card */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
            {/* Google Sign-In Primary Action */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={submitting}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span className="w-5 h-5 rounded-full bg-white text-slate-900 flex items-center justify-center text-xs font-bold">
                G
              </span>
              <span>{t.authGoogleBtn}</span>
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              <span>{t.authOrDivider}</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Sign In / Sign Up Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className={`min-h-[40px] px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.authSignInTab}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className={`min-h-[40px] px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.authSignUpTab}
              </button>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="auth-fullname"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    {t.authFullNameLabel}
                  </label>
                  <input
                    id="auth-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.authFullNamePlaceholder}
                    autoComplete="name"
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  {t.authEmailLabel}
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.authEmailPlaceholder}
                  autoComplete="email"
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  {t.authPasswordLabel}
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.authPasswordPlaceholder}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800 leading-relaxed"
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {mode === 'signup' ? t.authSubmitSignUp : t.authSubmitSignIn}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
