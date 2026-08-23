import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'orbitly_lang'

// Core UI strings. Anything not present here falls back to the English value,
// and then to the key itself — so partial translation never breaks the UI.
const TRANSLATIONS = {
  en: {
    // sections
    'section.overview': 'Overview',
    'section.tasks': 'Tasks',
    'section.workspace': 'Workspace',
    // nav
    'nav.dashboard': 'Dashboard',
    'nav.board': 'Board',
    'nav.calendar': 'Calendar',
    'nav.messages': 'Messages',
    'nav.myTasks': 'My Tasks',
    'nav.assigned': 'Assigned to Me',
    'nav.teamTasks': 'Team Tasks',
    'nav.workspaceTasks': 'Workspace Tasks',
    'nav.team': 'Team',
    'nav.teams': 'Teams',
    'nav.workspace': 'Workspace',
    'nav.profile': 'Profile',
    'nav.subscription': 'Billing',
    'nav.console': 'Founder',
    // topbar / menu
    'menu.viewProfile': 'View profile',
    'menu.signOut': 'Sign out',
    'common.language': 'Language',
    // auth
    'auth.signIn': 'Sign in',
    'auth.signInSubtitle': 'Enter your credentials to reach the console.',
    'auth.emailOrUsername': 'Email or username',
    'auth.password': 'Password',
    'auth.signingIn': 'Signing in…',
    'auth.forgot': 'Forgot your password?',
    'auth.startingFresh': 'Starting fresh?',
    'auth.createCompany': 'Create a company',
    'auth.alreadyRegistered': 'Already registered?',
    // dashboard
    'dash.welcome': 'Welcome back',
    'dash.refresh': 'Refresh',
    'common.rights': 'All rights reserved.'
  },
  ar: {
    'section.overview': 'نظرة عامة',
    'section.tasks': 'المهام',
    'section.workspace': 'مساحة العمل',
    'nav.dashboard': 'لوحة التحكم',
    'nav.board': 'اللوحة',
    'nav.calendar': 'التقويم',
    'nav.messages': 'الرسائل',
    'nav.myTasks': 'مهامي',
    'nav.assigned': 'المُسندة إليّ',
    'nav.teamTasks': 'مهام الفريق',
    'nav.workspaceTasks': 'مهام مساحة العمل',
    'nav.team': 'الفريق',
    'nav.teams': 'الفِرق',
    'nav.workspace': 'مساحة العمل',
    'nav.profile': 'الملف الشخصي',
    'nav.subscription': 'الاشتراك',
    'nav.console': 'المؤسس',
    'menu.viewProfile': 'عرض الملف الشخصي',
    'menu.signOut': 'تسجيل الخروج',
    'common.language': 'اللغة',
    'auth.signIn': 'تسجيل الدخول',
    'auth.signInSubtitle': 'أدخل بياناتك للوصول إلى لوحة التحكم.',
    'auth.emailOrUsername': 'البريد أو اسم المستخدم',
    'auth.password': 'كلمة المرور',
    'auth.signingIn': 'جارٍ الدخول…',
    'auth.forgot': 'هل نسيت كلمة المرور؟',
    'auth.startingFresh': 'تبدأ من جديد؟',
    'auth.createCompany': 'أنشئ شركة',
    'auth.alreadyRegistered': 'مسجّل بالفعل؟',
    'dash.welcome': 'مرحباً بعودتك',
    'dash.refresh': 'تحديث',
    'common.rights': 'جميع الحقوق محفوظة.'
  }
}

function getInitialLang() {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'ar' || stored === 'en' ? stored : 'en'
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang)

  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('lang', lang)
    root.setAttribute('dir', dir)
    localStorage.setItem(STORAGE_KEY, lang)
  }, [lang, dir])

  const setLang = useCallback((next) => setLangState(next === 'ar' ? 'ar' : 'en'), [])
  const toggleLang = useCallback(() => setLangState((p) => (p === 'ar' ? 'en' : 'ar')), [])

  const t = useCallback(
    (key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key,
    [lang]
  )

  const value = useMemo(() => ({ lang, dir, isRTL: dir === 'rtl', setLang, toggleLang, t }), [lang, dir, setLang, toggleLang, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useI18n must be used within a LanguageProvider')
  return ctx
}
