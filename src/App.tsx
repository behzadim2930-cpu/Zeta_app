import React, { useState, useRef, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import zetaLogo from './assets/logo.png';
import {
  FileText,
  Bot,
  Code2,
  Rocket,
  Download,
  Printer,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Save,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  BookOpen,
  Coffee,
  Eye,
  Sliders,
  Send,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  FileCheck,
  Smartphone,
  Key,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  SendHorizontal,
  Globe,
  Zap,
  CalendarDays,
} from 'lucide-react';
import { PersianDatePickerModal } from './components/PersianDatePicker';
import { PersianWeekInfo, formatJalali, get7DaysPlanFromStartDate } from './utils/jalali';

interface Block {
  id: string;
  type: string;
  typeTitle: string;
  cssClass: string;
  subject: string;
  topic: string;
  startTime: string;
  endTime: string;
  duration: string;
  extra?: string;
  note?: string;
}

interface DayPlan {
  id: number;
  name: string;
  dateStr: string;
  isRest: boolean;
  restText?: string;
  blocks: Block[];
}

export const ACTIVITY_TYPES = [
  { type: 'study', title: 'مطالعه', cssClass: 'c-study', badgeColor: 'bg-blue-100 text-blue-900 border-blue-300' },
  { type: 'test', title: 'تست‌زنی', cssClass: 'c-test', badgeColor: 'bg-neutral-900 text-white border-neutral-700' },
  { type: 'review', title: 'مرور', cssClass: 'c-review', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { type: 'video', title: 'ویدیو / کلاس', cssClass: 'c-video', badgeColor: 'bg-purple-100 text-purple-900 border-purple-300' },
  { type: 'exam', title: 'آزمون آزمایشی', cssClass: 'c-exam', badgeColor: 'bg-rose-100 text-rose-900 border-rose-300' },
  { type: 'summary', title: 'جمع‌بندی', cssClass: 'c-summary', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300' },
  { type: 'doubt', title: 'رفع اشکال', cssClass: 'c-doubt', badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
];

export interface SubjectGroup {
  groupName: string;
  subjects: string[];
}

export const HIGH_SCHOOL_SUBJECT_GROUPS: SubjectGroup[] = [
  {
    groupName: "زیست‌شناسی (تفکیک پایه‌ها)",
    subjects: [
      "زیست‌شناسی دهم",
      "زیست‌شناسی یازدهم",
      "زیست‌شناسی دوازدهم",
      "زیست‌شناسی جامع",
    ],
  },
  {
    groupName: "ریاضیات (مبحثی)",
    subjects: [
      "ریاضی",
      "حسابان",
      "هندسه",
      "گسسته",
      "آمار و احتمال",
      "ریاضی و آمار انسانی",
    ],
  },
  {
    groupName: "فیزیک (تفکیک پایه‌ها)",
    subjects: [
      "فیزیک دهم",
      "فیزیک یازدهم",
      "فیزیک دوازدهم",
      "فیزیک جامع",
    ],
  },
  {
    groupName: "شیمی (تفکیک پایه‌ها)",
    subjects: [
      "شیمی دهم",
      "شیمی یازدهم",
      "شیمی دوازدهم",
      "شیمی جامع",
    ],
  },
  {
    groupName: "زمین‌شناسی",
    subjects: [
      "زمین‌شناسی",
    ],
  },
  {
    groupName: "دروس تخصصی رشته انسانی",
    subjects: [
      "فلسفه و منطق",
      "جامعه‌شناسی",
      "روان‌شناسی",
      "اقتصاد",
      "علوم و فنون ادبی",
      "تاریخ",
      "جغرافیا",
    ],
  },
  {
    groupName: "دروس عمومی و نهایی",
    subjects: [
      "ادبیات فارسی دهم",
      "ادبیات فارسی یازدهم",
      "ادبیات فارسی دوازدهم",
      "عربی دهم",
      "عربی یازدهم",
      "عربی دوازدهم",
      "دین و زندگی دهم",
      "دین و زندگی یازدهم",
      "دین و زندگی دوازدهم",
      "زبان انگلیسی دهم",
      "زبان انگلیسی یازدهم",
      "زبان انگلیسی دوازدهم",
      "ادبیات فارسی",
      "عربی",
      "دین و زندگی",
      "زبان انگلیسی",
      "سلامت و بهداشت",
      "هویت اجتماعی",
    ],
  },
  {
    groupName: "آزمون و ارزیابی",
    subjects: [
      "آزمون آزمایشی",
      "تحلیل آزمون",
      "مرور و جمع‌بندی",
    ],
  },
];

export const ALL_SUBJECTS_LIST: string[] = HIGH_SCHOOL_SUBJECT_GROUPS.flatMap((g) => g.subjects);

export const QUICK_SUBJECTS = [
  "زیست‌شناسی دهم",
  "زیست‌شناسی یازدهم",
  "زیست‌شناسی دوازدهم",
  "ریاضی",
  "فیزیک دوازدهم",
  "شیمی دوازدهم",
  "ادبیات فارسی",
  "عربی",
  "دین و زندگی",
  "زبان انگلیسی",
  "فلسفه و منطق",
  "جامعه‌شناسی",
  "زمین‌شناسی",
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'builder' | 'preview' | 'telegram'>('builder');
  const [activePage, setActivePage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(85);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<string | null>(null);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  // Telegram Web App State & Auto-detection
  const [isInTelegram, setIsInTelegram] = useState<boolean>(false);
  const [telegramUser, setTelegramUser] = useState<{ id: string; firstName?: string; username?: string } | null>(null);

  // Official Pre-configured Telegram Bot Details provided by Zeta administration
  const DEFAULT_BOT_TOKEN = "8915898130:AAFVjJnKCsQvYkKOlqpzOVEvJMcKkFdlTvw";
  const DEFAULT_BOT_USERNAME = "Zetagroupbot";
  const DEFAULT_BOT_FIRSTNAME = "Zeta | زتــا";

  // Pre-configured Telegram State: Advisors do NOT need to enter bot token manually!
  const [botToken, setBotToken] = useState<string>(() => {
    const saved = localStorage.getItem('zeta_bot_token');
    return (saved && saved.trim()) ? saved : DEFAULT_BOT_TOKEN;
  });
  const [chatId, setChatId] = useState<string>(() => {
    const saved = localStorage.getItem('zeta_chat_id');
    return (saved && saved.trim()) ? saved.trim() : '';
  });
  const [telegramCaption, setTelegramCaption] = useState<string>(() => "📋 برنامه هفتگی تحصیلی موسسه زتا (فایل پی‌دی‌اف استاندارد A4)");
  const [isTestingToken, setIsTestingToken] = useState<boolean>(false);
  const [botInfo, setBotInfo] = useState<{ ok: boolean; username?: string; first_name?: string } | null>({
    ok: true,
    username: DEFAULT_BOT_USERNAME,
    first_name: DEFAULT_BOT_FIRSTNAME,
  });
  const [isFetchingChatId, setIsFetchingChatId] = useState<boolean>(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState<boolean>(false);
  const [telegramSendResult, setTelegramSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [bypassWorkerUrl, setBypassWorkerUrl] = useState<string>(() => localStorage.getItem('zeta_bypass_url') || 'https://zeta-app.ketabkhan1234ketab.workers.dev/');
  const [isUpdatingMenuUrl, setIsUpdatingMenuUrl] = useState<boolean>(false);
  const [updateUrlResult, setUpdateUrlResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedWorkerCode, setCopiedWorkerCode] = useState<boolean>(false);

  // Clean Public Shared URL (ensures no 403 Forbidden in Telegram Mini App by using public -pre- URL)
  const publicAppUrl = typeof window !== 'undefined'
    ? window.location.origin.replace('-dev-', '-pre-')
    : 'https://ais-pre-sc62ancbog6atlg2ssl57i-512949655823.europe-west3.run.app';

  // Update Bot Menu URL and start message button automatically
  const handleUpdateBotMenuUrl = async (urlToSet: string) => {
    const cleanUrl = urlToSet.trim();
    if (!cleanUrl || !cleanUrl.startsWith('https://')) {
      setUpdateUrlResult({ success: false, message: 'لطفاً یک آدرس اینترنتی معتبر که با https:// شروع می‌شود وارد نمایید.' });
      return;
    }
    setIsUpdatingMenuUrl(true);
    setUpdateUrlResult(null);
    try {
      const resp = await fetch('/api/telegram/updateMenuUrl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, token: botToken }),
      });
      const data = await resp.json();
      if (data.ok) {
        localStorage.setItem('zeta_bypass_url', cleanUrl);
        setUpdateUrlResult({
          success: true,
          message: '✅ با موفقیت در ربات تلگرام ثبت شد! هم‌اکنون دکمه منوی ربات و پیام /start به این آدرس متصل شدند.',
        });
      } else {
        setUpdateUrlResult({
          success: false,
          message: `خطا در برقراری ارتباط: ${data.error || 'پاسخ ناموفق از سرور تلگرام'}`,
        });
      }
    } catch (e: any) {
      setUpdateUrlResult({ success: false, message: `خطا: ${e.message}` });
    } finally {
      setIsUpdatingMenuUrl(false);
    }
  };

  // Telegram WebApp Initialization Hook (ensures Mini App loads seamlessly for any consultant)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        tg.expand();
        if (tg.enableClosingConfirmation) {
          tg.enableClosingConfirmation();
        }
        if (tg.initDataUnsafe?.user) {
          const u = tg.initDataUnsafe.user;
          setIsInTelegram(true);
          const uid = String(u.id);
          setTelegramUser({ id: uid, firstName: u.first_name, username: u.username });
          setChatId(uid);
          localStorage.setItem('zeta_chat_id', uid);
          if (u.first_name) {
            setAdvisor(prev => ({
              ...prev,
              name: prev.name ? prev.name : `${u.first_name} ${u.last_name || ''}`.trim()
            }));
          }

          // Send confirmation message to the consultant in Telegram that bot is connected & ready
          const sessionKey = `zeta_start_notified_${uid}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, 'true');
            fetch('/api/telegram/notifyStart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chatId: uid, firstName: u.first_name || 'مشاور گرامی' }),
            }).catch(() => {
              // Direct fallback to Telegram API
              fetch(`https://api.telegram.org/bot${DEFAULT_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: uid,
                  text: `🌟 سلام ${u.first_name || 'مشاور گرامی'}، به سامانه برنامه‌ریزی هفتگی موسسه زتا (Zeta) خوش آمدید!\n\n✅ ربات با موفقیت متصل است و هیچ مشکلی وجود ندارد.\n\n📋 هم‌اکنون می‌توانید مشخصات دانش‌آموز را وارد کرده و با زدن دکمه «دریافت مستقیم PDF»، فایل برنامه را در همین چت تحویل بگیرید.`,
                }),
              }).catch(() => {});
            });
          }
        }
        // Check for start_param in Telegram WebApp
        const startParam = tg.initDataUnsafe?.start_param;
        if (startParam && startParam.startsWith('token_')) {
          const extractedToken = startParam.replace('token_', '');
          setBotToken(extractedToken);
          localStorage.setItem('zeta_bot_token', extractedToken);
        }
      }

      // Check URL query params for bot token or chat_id
      if (typeof window !== 'undefined' && window.location) {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token') || urlParams.get('bot_token');
        if (tokenParam) {
          setBotToken(tokenParam);
          localStorage.setItem('zeta_bot_token', tokenParam);
        }
        const chatParam = urlParams.get('chat_id');
        if (chatParam) {
          setChatId(chatParam);
          localStorage.setItem('zeta_chat_id', chatParam);
        }
      }
    } catch (e) {
      console.warn("Telegram WebApp init:", e);
    }
  }, []);

  // Dynamic references for multi-page PDF generation (supports any number of pages)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Editable state (Clean blank defaults so consultants enter everything from scratch)
  const [student, setStudent] = useState({
    name: "",
    grade: "دوازدهم",
    field: "تجربی",
    target: "",
  });

  const [advisor, setAdvisor] = useState({
    name: "",
    weekTitle: "برنامه هفتگی",
    createdDate: "",
  });

  const [weekRange, setWeekRange] = useState({
    start: "شنبه",
    end: "جمعه",
  });

  // Persian Date Picker State
  const [datePickerState, setDatePickerState] = useState<{
    isOpen: boolean;
    mode: 'single' | 'week';
    targetField?: 'start' | 'end' | 'createdDate';
    title: string;
  }>({
    isOpen: false,
    mode: 'week',
    title: 'انتخابگر تقویم شمسی',
  });

  // Handle Persian Week Selection from Calendar (Auto-fills start, end, and all 7 day names and dates!)
  const handleSelectPersianWeek = (weekInfo: PersianWeekInfo) => {
    setWeekRange({
      start: weekInfo.startStr,
      end: weekInfo.endStr,
    });

    // Auto-update each day's day of week name and date string with the chosen start day
    setDays((prevDays) =>
      prevDays.map((d, idx) => {
        const matched = weekInfo.weekDays[idx];
        if (matched) {
          return {
            ...d,
            name: matched.name,      // e.g. "دوشنبه", "سه‌شنبه", ...
            dateStr: matched.dateStr // e.g. "۱۲ آبان", "۱۳ آبان", ...
          };
        }
        return d;
      })
    );

    // Auto-fill creation date if blank
    setAdvisor((prev) => ({
      ...prev,
      createdDate: prev.createdDate || weekInfo.weekDays[0].dateStr,
    }));

    setPdfSuccessMessage(`📅 برنامه ۷ روزه از «${weekInfo.weekDays[0].name} ${weekInfo.weekDays[0].dateStr}» تا «${weekInfo.weekDays[6].name} ${weekInfo.weekDays[6].dateStr}» با موفقیت تنظیم شد.`);
    setTimeout(() => setPdfSuccessMessage(null), 5000);
  };

  // Handle Single Date Selection from Calendar
  const handleSelectSingleDate = (formattedDate: string, jalali: any) => {
    if (datePickerState.targetField === 'start') {
      // If consultant picks start date, automatically calculate 7-day plan starting from that day!
      const weekInfo = get7DaysPlanFromStartDate(jalali);
      handleSelectPersianWeek(weekInfo);
    } else if (datePickerState.targetField === 'end') {
      setWeekRange((prev) => ({ ...prev, end: formattedDate }));
    } else if (datePickerState.targetField === 'createdDate') {
      setAdvisor((prev) => ({ ...prev, createdDate: formatJalali(jalali, 'full') }));
    }
  };

  // Helper to allow consultant to edit day name manually if desired
  const updateDayName = (dayId: number, newName: string) => {
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, name: newName } : d))
    );
  };

  const [goals, setGoals] = useState([
    "تثبیت و تسلط بر مباحث تدریس شده و حل منظم تست‌ها.",
    "ثبت گزارش مطالعه در جدول ارزیابی روزانه و خواب کافی شبانه.",
  ]);

  const [days, setDays] = useState<DayPlan[]>([
    { id: 0, name: "شنبه", dateStr: "شنبه", isRest: false, blocks: [] },
    { id: 1, name: "یکشنبه", dateStr: "یکشنبه", isRest: false, blocks: [] },
    { id: 2, name: "دوشنبه", dateStr: "دوشنبه", isRest: false, blocks: [] },
    { id: 3, name: "سه‌شنبه", dateStr: "سه‌شنبه", isRest: false, blocks: [] },
    { id: 4, name: "چهارشنبه", dateStr: "چهارشنبه", isRest: false, blocks: [] },
    { id: 5, name: "پنجشنبه", dateStr: "پنجشنبه", isRest: false, blocks: [] },
    { id: 6, name: "جمعه", dateStr: "جمعه", isRest: false, blocks: [] },
  ]);

  // Toggle for whether study blocks have fixed clock times (ساعت شروع و پایان) or floating/volume study (برنامه حجمی و شناور)
  const [includeTimings, setIncludeTimings] = useState<boolean>(true);

  // Compute stats
  const calculateTotalMinutes = (d: DayPlan) => {
    if (d.isRest) return 0;
    return d.blocks.reduce((acc, b) => {
      // Basic parse: "۰۸:۰۰"
      const enStart = b.startTime.replace(/[۰-۹]/g, (c) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(c)]);
      const enEnd = b.endTime.replace(/[۰-۹]/g, (c) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(c)]);
      const [sh, sm] = enStart.split(':').map(Number);
      const [eh, em] = enEnd.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(eh)) {
        return acc + ((eh * 60 + em) - (sh * 60 + sm));
      }
      return acc + 90;
    }, 0);
  };

  const dayMinutes = days.map(calculateTotalMinutes);
  const totalMinutes = dayMinutes.reduce((a, b) => a + b, 0);
  const totalBlocksCount = days.reduce((acc, d) => acc + (d.isRest ? 0 : d.blocks.length), 0);
  const activeDaysCount = includeTimings
    ? dayMinutes.filter((m) => m > 0).length
    : days.filter((d) => !d.isRest && d.blocks.length > 0).length;
  const avgMinutes = activeDaysCount > 0 ? Math.round(totalMinutes / activeDaysCount) : 0;
  const avgBlocks = activeDaysCount > 0 ? (totalBlocksCount / activeDaysCount).toFixed(1).replace('.', '٫').replace(/\d/g, (c) => "۰۱۲۳۴۵۶۷۸۹"[Number(c)]) : '۰';
  const maxDayMinutes = Math.max(...dayMinutes, 60);
  const maxDayBlocks = Math.max(...days.map((d) => (d.isRest ? 0 : d.blocks.length)), 1);

  const formatHhMmFa = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const str = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return str.replace(/\d/g, (c) => "۰۱۲۳۴۵۶۷۸۹"[Number(c)]);
  };

  const chartBarsData = days.map((d, i) => {
    if (!includeTimings) {
      const count = d.isRest ? 0 : d.blocks.length;
      const isZero = count === 0;
      return {
        name: d.name,
        val: isZero ? '–' : `${String(count).replace(/\d/g, (c) => "۰۱۲۳۴۵۶۷۸۹"[Number(c)])} پارت`,
        height: isZero ? 3 : Math.max(12, Math.round((count / maxDayBlocks) * 100)),
        isZero,
      };
    }
    const m = dayMinutes[i];
    const isZero = m === 0;
    return {
      name: d.name,
      val: isZero ? '–' : formatHhMmFa(m),
      height: isZero ? 3 : Math.max(10, Math.round((m / maxDayMinutes) * 100)),
      isZero,
    };
  });

  // SVG Renderer
  const renderIcon = (type: string) => {
    switch (type) {
      case 'study':
        return (
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
            <path d="M12 6.5C10.5 5.3 8.2 4.8 4 5v12c4.2-.2 6.5.3 8 1.5 1.5-1.2 3.8-1.7 8-1.5V5c-4.2-.2-6.5.3-8 1.5z" />
            <path d="M12 6.5v12" />
          </svg>
        );
      case 'review':
        return (
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
            <path d="M20 11a8 8 0 0 0-14.5-4.2L4 8.5" />
            <path d="M4 4v4.5h4.5" />
            <path d="M4 13a8 8 0 0 0 14.5 4.2L20 15.5" />
            <path d="M20 20v-4.5h-4.5" />
          </svg>
        );
      case 'test':
        return (
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
            <rect x="4" y="3.5" width="16" height="17" rx="3" />
            <path d="M8 9l1.5 1.5L12 8" />
            <path d="M14 9.5h3" />
            <path d="M8 15l1.5 1.5L12 14" />
            <path d="M14 15.5h3" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
            <rect x="3" y="4.5" width="18" height="12.5" rx="3" />
            <path d="M10 8.5v5l4.2-2.5z" />
            <path d="M8 20.5h8" />
          </svg>
        );
      case 'exam':
        return (
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
            <path d="M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 20V5A1.5 1.5 0 0 1 6.5 3.5z" />
            <path d="M14 3.5V8h4" />
            <path d="M8.5 13h7M8.5 17h4" />
          </svg>
        );
      case 'summary':
        return (
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8.5" />
            <circle cx="12" cy="12" r="4.5" />
            <circle cx="12" cy="12" r=".8" />
          </svg>
        );
      case 'doubt':
        return (
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M9.6 9.6a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.8" />
            <path d="M12 16.8v.1" />
          </svg>
        );
      case 'rest':
        return (
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
            <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
            <path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H15.5" />
            <path d="M8 3.5v2M11 3.5v2" />
          </svg>
        );
      default:
        return null;
    }
  };

  interface PageSection {
    dayId: number;
    dayName: string;
    dateStr: string;
    isRest: boolean;
    restText?: string;
    isContinued?: boolean;
    blocks: Block[];
    totalDayMinutes: number;
    totalDayBlocks: number;
  }

  interface DynamicPage {
    pageNumber: number;
    isFirstPage: boolean;
    title: string;
    sections: PageSection[];
    hasGoalsAndTracker: boolean;
    estimatedHeight: number;
  }

  /**
   * تابع کمکی جهت محاسبه دقیق ارتفاع هر بلوک بر حسب پیکسل در برگه فیزیکی A4
   * با در نظر گرفتن ارتفاع پایه ردیف (۴۴ پیکسل)، خطوط طولانی مبحث و یادداشت‌های مشاور
   */
  const calculateBlockHeight = (block: Block): number => {
    let height = 44; // ارتفاع پایه ردیف با پدینگ عمودی و فونت استاندارد
    const topicLen = (block.topic || '').trim().length;
    if (topicLen > 28) {
      const extraTopicLines = Math.ceil((topicLen - 28) / 28);
      height += extraTopicLines * 16;
    }
    if (block.extra && block.extra.trim()) {
      height += 2;
    }
    if (block.note && block.note.trim()) {
      const noteLen = block.note.trim().length;
      const noteLines = Math.max(1, Math.ceil(noteLen / 45));
      height += 6 + (noteLines * 17);
    }
    return Math.ceil(height);
  };

  /**
   * تابع کمکی برای محاسبه دقیق ارتفاع کارت یک روز
   */
  const calculateDayHeight = (day: DayPlan | PageSection): number => {
    if (day.isRest) {
      return 74; // کارت روز استراحت با پیام انگیزشی
    }
    if (day.blocks.length === 0) {
      return 58; // کارت روز خالی
    }
    let total = 36; // ارتفاع هدر کارت روز به همراه بوردرها
    for (const block of day.blocks) {
      total += calculateBlockHeight(block);
    }
    return total;
  };

  /**
   * الگوریتم هوشمند صفحه‌بندی داینامیک و ضد سرریز A4:
   * ارتفاع فیزیکی A4 برابر ۱۱۲۳ پیکسل است.
   * هدر اصلی، مشخصات دانش‌آموز، نمودار و راهنما در صفحه اول حدود ۳۹۶ پیکسل فضا دارند (بودجه امن روزها: ۵۴۰ پیکسل).
   * در صفحات بعدی هدر مختصر است و بودجه امن روزها معادل ۸۸۰ پیکسل است.
   * بخش اهداف و جدول ارزیابی به ۳۳۰ پیکسل فضا نیاز دارد.
   */
  const dynamicPages = useMemo<DynamicPage[]>(() => {
    const PAGE1_DAYS_BUDGET = 540;
    const SUBSEQUENT_PAGE_BUDGET = 880;
    const GOALS_TRACKER_HEIGHT = 330;

    const pages: DynamicPage[] = [];
    let currentPageNum = 1;
    let isFirstPage = true;
    let currentSections: PageSection[] = [];
    let currentHeight = 0;
    let currentBudget = PAGE1_DAYS_BUDGET;

    const finalizeCurrentPage = (hasGoals: boolean) => {
      const dayNames = currentSections.map((s) => s.dayName).join('، ');
      pages.push({
        pageNumber: currentPageNum,
        isFirstPage,
        title: hasGoals 
          ? (currentSections.length > 0 ? `صفحه ${currentPageNum} (${dayNames} + اهداف)` : `صفحه ${currentPageNum} (اهداف و ارزیابی)`)
          : `صفحه ${currentPageNum} (${dayNames || 'برنامه'})`,
        sections: currentSections,
        hasGoalsAndTracker: hasGoals,
        estimatedHeight: currentHeight + (hasGoals ? GOALS_TRACKER_HEIGHT : 0),
      });
      currentPageNum++;
      isFirstPage = false;
      currentBudget = SUBSEQUENT_PAGE_BUDGET;
      currentSections = [];
      currentHeight = 0;
    };

    // پیمایش ترتیبی تمام روزهای هفته
    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const day = days[dayIdx];
      const dayMins = calculateTotalMinutes(day);

      if (day.isRest) {
        const secHeight = 74;
        const gap = currentSections.length > 0 ? 8 : 0;
        if (currentHeight + gap + secHeight > currentBudget && currentSections.length > 0) {
          finalizeCurrentPage(false);
        }
        currentSections.push({
          dayId: day.id,
          dayName: day.name,
          dateStr: day.dateStr,
          isRest: true,
          restText: day.restText,
          blocks: [],
          totalDayMinutes: 0,
          totalDayBlocks: 0,
        });
        currentHeight += (currentSections.length > 1 ? 8 : 0) + secHeight;
        continue;
      }

      if (day.blocks.length === 0) {
        const secHeight = 58;
        const gap = currentSections.length > 0 ? 8 : 0;
        if (currentHeight + gap + secHeight > currentBudget && currentSections.length > 0) {
          finalizeCurrentPage(false);
        }
        currentSections.push({
          dayId: day.id,
          dayName: day.name,
          dateStr: day.dateStr,
          isRest: false,
          blocks: [],
          totalDayMinutes: 0,
          totalDayBlocks: 0,
        });
        currentHeight += (currentSections.length > 1 ? 8 : 0) + secHeight;
        continue;
      }

      // روز دارای پارت‌های درسی
      let remainingBlocks = [...day.blocks];
      let chunkIndex = 1;

      while (remainingBlocks.length > 0) {
        const gap = currentSections.length > 0 ? 8 : 0;
        const availableHeight = currentBudget - currentHeight - gap;

        // محاسبه کل ارتفاع پارت‌های باقیمانده این روز
        let fullDayHeight = 36;
        for (const b of remainingBlocks) {
          fullDayHeight += calculateBlockHeight(b);
        }

        // اگر کل پارت‌ها در فضای باقیمانده جا می‌شوند:
        if (fullDayHeight <= availableHeight) {
          currentSections.push({
            dayId: day.id,
            dayName: chunkIndex === 1 ? day.name : `${day.name} (ادامه)`,
            dateStr: day.dateStr,
            isRest: false,
            isContinued: chunkIndex > 1,
            blocks: remainingBlocks,
            totalDayMinutes: dayMins,
            totalDayBlocks: day.blocks.length,
          });
          currentHeight += gap + fullDayHeight;
          remainingBlocks = [];
        } else {
          // در فضای باقیمانده جا نمی‌شود:
          // اگر صفحه جاری قبلاً روزهایی دارد و فضای باقیمانده کمتر از ۱۶۰ پیکسل است، تمیزتر است صفحه بعدی شروع شود:
          if (currentSections.length > 0 && availableHeight < 160) {
            finalizeCurrentPage(false);
            continue;
          }

          // پارت‌هایی که در فضای موجود جا می‌گیرند را جدا می‌کنیم:
          let chunkBlocks: Block[] = [];
          let chunkH = 36;
          for (let bi = 0; bi < remainingBlocks.length; bi++) {
            const bh = calculateBlockHeight(remainingBlocks[bi]);
            if (chunkH + bh <= availableHeight) {
              chunkBlocks.push(remainingBlocks[bi]);
              chunkH += bh;
            } else {
              break;
            }
          }

          if (chunkBlocks.length > 0) {
            currentSections.push({
              dayId: day.id,
              dayName: chunkIndex === 1 ? day.name : `${day.name} (ادامه)`,
              dateStr: day.dateStr,
              isRest: false,
              isContinued: chunkIndex > 1,
              blocks: chunkBlocks,
              totalDayMinutes: dayMins,
              totalDayBlocks: day.blocks.length,
            });
            currentHeight += gap + chunkH;
            remainingBlocks = remainingBlocks.slice(chunkBlocks.length);
            chunkIndex++;
            finalizeCurrentPage(false);
          } else {
            finalizeCurrentPage(false);
          }
        }
      }
    }

    // بررسی جانمایی بخش اهداف و جدول ارزیابی
    if (currentSections.length > 0) {
      const remainingSpace = currentBudget - currentHeight - 12;

      // اگر در صفحه جاری فضای کافی (حداقل ۳۳۰ پیکسل) وجود داشته باشد:
      if (remainingSpace >= GOALS_TRACKER_HEIGHT) {
        finalizeCurrentPage(true);
      } else {
        // صفحه فعلی با روزها بسته می‌شود
        finalizeCurrentPage(false);

        // ایجاد صفحه اختصاصی برای اهداف و جدول ارزیابی هفتگی
        pages.push({
          pageNumber: currentPageNum,
          isFirstPage: false,
          title: `صفحه ${currentPageNum} (اهداف و جدول ارزیابی)`,
          sections: [],
          hasGoalsAndTracker: true,
          estimatedHeight: GOALS_TRACKER_HEIGHT,
        });
      }
    } else {
      pages.push({
        pageNumber: 1,
        isFirstPage: true,
        title: 'صفحه ۱',
        sections: [],
        hasGoalsAndTracker: true,
        estimatedHeight: 400,
      });
    }

    return pages;
  }, [days, includeTimings, goals]);

  // اطمینان از قرار داشتن شماره صفحه جاری در محدوده صفحات موجود
  useEffect(() => {
    if (activePage > dynamicPages.length) {
      setActivePage(dynamicPages.length);
    } else if (activePage < 1) {
      setActivePage(1);
    }
  }, [dynamicPages.length, activePage]);

  // بودجه صفحه در حال نمایش
  const currentPageData = dynamicPages[activePage - 1] || dynamicPages[0];
  const activePageBudget = useMemo(() => {
    if (!currentPageData) {
      return { totalHeight: 0, maxBudget: 880, percentage: 0, isOptimal: true };
    }
    const maxBudget = currentPageData.isFirstPage ? 540 : 880;
    const totalHeight = currentPageData.estimatedHeight;
    return {
      totalHeight,
      maxBudget,
      percentage: Math.min(100, Math.round((totalHeight / maxBudget) * 100)),
      isOptimal: totalHeight <= maxBudget,
    };
  }, [currentPageData]);

  // Rock-solid table-based block row renderer (prevents any RTL flex overlapping & enforces break-inside: avoid)
  const renderBlockRow = (b: Block) => {
    return (
      <div
        key={b.id}
        className="block-row py-1.5 px-3 space-y-0.5"
        style={{
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        }}
      >
        <div style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
          <div style={{ display: 'table-cell', width: '110px', verticalAlign: 'middle' }}>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-black ${
                b.type === 'study'
                  ? 'bg-[#FFF1EA] text-[#C93A00]'
                  : b.type === 'test'
                  ? 'bg-[#111111] text-white'
                  : b.type === 'video'
                  ? 'bg-white text-[#C93A00] border border-[#FF4F12]'
                  : b.type === 'review'
                  ? 'bg-[#F6F3EF] text-[#444] border border-[#e3ddd5]'
                  : b.type === 'exam'
                  ? 'bg-[#FF4F12] text-white'
                  : b.type === 'summary'
                  ? 'bg-white text-[#111111] border border-[#111111]'
                  : 'bg-[#E8E8E8] text-[#111111]'
              }`}
            >
              {renderIcon(b.type)}
              <span>{b.typeTitle}</span>
            </span>
          </div>
          <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '0 8px', textAlign: 'right' }}>
            <div className="font-black text-[12.5px] leading-[18px] text-[#111111]" style={{ letterSpacing: 'normal' }}>{b.subject}</div>
            <div className="text-[10.5px] leading-[16px] text-[#3e3e3e] break-words font-medium" style={{ letterSpacing: 'normal' }}>{b.topic}</div>
          </div>
          <div style={{ display: 'table-cell', width: '120px', verticalAlign: 'middle', textAlign: 'left' }}>
            {includeTimings ? (
              <>
                <div className="font-black text-[11.5px] leading-[17px] whitespace-nowrap text-[#111111]" style={{ letterSpacing: 'normal' }}>
                  {(b.startTime || b.endTime) ? `${b.startTime || '—'} – ${b.endTime || '—'}` : 'ساعت شناور'}
                </div>
                <div className="text-[9.5px] leading-[14px] text-[#6B6B6B] font-semibold" style={{ letterSpacing: 'normal' }}>{b.duration || 'مدت دلخواه'}</div>
              </>
            ) : (
              <div>
                <div className="font-bold text-[10px] leading-[16px] whitespace-nowrap text-[#222222] bg-[#f0eee9] border border-[#d8d3ca] rounded-md px-1.5 py-0.5 inline-block" style={{ letterSpacing: 'normal' }}>
                  ⏱️ زمان شناور
                </div>
                {b.duration && b.duration !== 'شناور' && (
                  <div className="text-[9px] leading-[13px] text-[#6B6B6B] font-semibold mt-0.5" style={{ letterSpacing: 'normal' }}>{b.duration}</div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'table-cell', width: '56px', verticalAlign: 'middle', textAlign: 'left' }}>
            {b.extra && (
              <span className="inline-block text-[9.5px] font-black text-[#C93A00] bg-[#FFF1EA] rounded px-1.5 py-0.5 whitespace-nowrap border border-[#ffd2bf]" style={{ letterSpacing: 'normal' }}>
                {b.extra}
              </span>
            )}
          </div>
        </div>
        {b.note && (
          <div className="border-r-[2.5px] border-[#FF4F12] pr-2 text-[10px] leading-[1.6] text-[#444] mt-1 break-words font-medium" style={{ letterSpacing: 'normal' }}>
            <span className="text-[#C93A00] font-bold ml-1">توصیه مشاور:</span>
            <span>{b.note}</span>
          </div>
        )}
      </div>
    );
  };

  const [customFilename, setCustomFilename] = useState<string>("برنامه_هفتگی.pdf");

  // Automatically sync custom filename and caption whenever student name or dates change
  useEffect(() => {
    if (student.name && student.name.trim()) {
      const clean = student.name.trim().replace(/\s+/g, '_');
      setCustomFilename(`برنامه_هفتگی_${clean}.pdf`);
      setTelegramCaption(`📋 برنامه هفتگی تحصیلی موسسه زتا (فایل PDF قطع استاندارد A4)\nدانش‌آموز: ${student.name.trim()}\nمشاور: ${advisor.name || 'مشاور تحصیلی'}\nبازه زمانی: ${(weekRange.start || 'شنبه')} تا ${(weekRange.end || 'جمعه')}`);
    } else {
      setCustomFilename('برنامه_هفتگی.pdf');
      setTelegramCaption(`📋 برنامه هفتگی تحصیلی موسسه زتا (فایل PDF قطع استاندارد A4)`);
    }
  }, [student.name, advisor.name, weekRange.start, weekRange.end]);

  // Calculate Duration string automatically from Persian or English times
  const calculateDurationString = (start: string, end: string): string => {
    try {
      const enStart = (start || '').replace(/[۰-۹]/g, (c) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(c)]);
      const enEnd = (end || '').replace(/[۰-۹]/g, (c) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(c)]);
      const [sh, sm] = enStart.split(':').map(Number);
      const [eh, em] = enEnd.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 24 * 60;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        const hFa = String(h).replace(/\d/g, (c) => "۰۱۲۳۴۵۶۷۸۹"[Number(c)]);
        const mFa = String(m).replace(/\d/g, (c) => "۰۱۲۳۴۵۶۷۸۹"[Number(c)]);
        if (h > 0 && m > 0) {
          return `${hFa} ساعت و ${mFa} دقیقه`;
        } else if (h > 0) {
          return `${hFa} ساعت`;
        } else if (m > 0) {
          return `${mFa} دقیقه`;
        }
      }
    } catch {
      // fallback
    }
    return '۱ ساعت و ۳۰ دقیقه';
  };

  // Block management functions for full user editing
  const updateBlock = (dayId: number, blockId: string, updates: Partial<Block>) => {
    setDays((prevDays) =>
      prevDays.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          blocks: day.blocks.map((b) => {
            if (b.id !== blockId) return b;
            const updated = { ...b, ...updates };
            if (updates.type) {
              const matched = ACTIVITY_TYPES.find((t) => t.type === updates.type);
              if (matched) {
                updated.typeTitle = matched.title;
                updated.cssClass = matched.cssClass;
              }
            }
            if (updates.startTime || updates.endTime) {
              const newDur = calculateDurationString(
                updates.startTime ?? b.startTime,
                updates.endTime ?? b.endTime
              );
              if (newDur) {
                updated.duration = newDur;
              }
            }
            return updated;
          }),
        };
      })
    );
  };

  const addBlockToDay = (dayId: number) => {
    setDays((prevDays) =>
      prevDays.map((day) => {
        if (day.id !== dayId) return day;
        const newBlock: Block = {
          id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'study',
          typeTitle: 'مطالعه',
          cssClass: 'c-study',
          subject: 'زیست‌شناسی',
          topic: '',
          startTime: includeTimings ? '۰۸:۰۰' : '',
          endTime: includeTimings ? '۰۹:۳۰' : '',
          duration: includeTimings ? '۱ ساعت و ۳۰ دقیقه' : 'شناور',
          extra: '',
          note: '',
        };
        return {
          ...day,
          blocks: [...day.blocks, newBlock],
        };
      })
    );
  };

  const removeBlockFromDay = (dayId: number, blockId: string) => {
    setDays((prevDays) =>
      prevDays.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          blocks: day.blocks.filter((b) => b.id !== blockId),
        };
      })
    );
  };

  const duplicateBlockInDay = (dayId: number, block: Block) => {
    setDays((prevDays) =>
      prevDays.map((day) => {
        if (day.id !== dayId) return day;
        const dup: Block = {
          ...block,
          id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          topic: block.topic ? `${block.topic} (ادامه)` : '',
        };
        return {
          ...day,
          blocks: [...day.blocks, dup],
        };
      })
    );
  };

  const updateDayDateStr = (dayId: number, dateStr: string) => {
    setDays((prevDays) =>
      prevDays.map((d) => (d.id === dayId ? { ...d, dateStr } : d))
    );
  };

  const updateDayRestStatus = (dayId: number, isRest: boolean) => {
    setDays((prevDays) =>
      prevDays.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          isRest,
          restText: isRest
            ? (d.restText || 'امروز برنامه درسی نداری. استراحت، تفریح و خواب کافی بخشی از مسیر موفقیت است.')
            : d.restText,
        };
      })
    );
  };

  const updateDayRestText = (dayId: number, restText: string) => {
    setDays((prevDays) =>
      prevDays.map((d) => (d.id === dayId ? { ...d, restText } : d))
    );
  };

  const addGoal = () => {
    setGoals((prev) => [...prev, "تکمیل و تحلیل منظم تست‌های علامت‌دار هفتگی."]);
  };

  const updateGoal = (index: number, val: string) => {
    setGoals((prev) => prev.map((g, i) => (i === index ? val : g)));
  };

  const removeGoal = (index: number) => {
    setGoals((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear form for entering a brand-new student's schedule from scratch
  const handleClearFormForNewStudent = () => {
    setStudent({
      name: '',
      grade: 'دوازدهم',
      field: 'تجربی',
      target: '',
    });
    setAdvisor(prev => ({
      ...prev,
      weekTitle: 'برنامه هفتگی',
      createdDate: '',
    }));
    setWeekRange({
      start: 'شنبه',
      end: 'جمعه',
    });
    setDays([
      { id: 0, name: "شنبه", dateStr: "شنبه", isRest: false, blocks: [] },
      { id: 1, name: "یکشنبه", dateStr: "یکشنبه", isRest: false, blocks: [] },
      { id: 2, name: "دوشنبه", dateStr: "دوشنبه", isRest: false, blocks: [] },
      { id: 3, name: "سه‌شنبه", dateStr: "سه‌شنبه", isRest: false, blocks: [] },
      { id: 4, name: "چهارشنبه", dateStr: "چهارشنبه", isRest: false, blocks: [] },
      { id: 5, name: "پنجشنبه", dateStr: "پنجشنبه", isRest: false, blocks: [] },
      { id: 6, name: "جمعه", dateStr: "جمعه", isRest: false, blocks: [] },
    ]);
    setGoals([
      "تثبیت و تسلط بر مباحث تدریس شده و حل منظم تست‌ها.",
      "ثبت گزارش مطالعه در جدول ارزیابی روزانه و خواب کافی شبانه."
    ]);
    setCustomFilename('برنامه_هفتگی.pdf');
    setPdfSuccessMessage('✨ فرم برای ورود برنامه دانش‌آموز جدید آماده شد. مشخصات و پارت‌های درسی را وارد فرمایید.');
    setTimeout(() => setPdfSuccessMessage(null), 4000);
  };

  const loadSamplePlan = () => {
    setStudent({
      name: "سارا محمدی",
      grade: "دوازدهم",
      field: "تجربی",
      target: "رتبه زیر ۵۰۰ کنکور سراسری",
    });
    setAdvisor({
      name: "مهدی رضایی",
      weekTitle: "هفته هفتم – مهر تا آبان",
      createdDate: "۱ آبان ۱۴۰۵",
    });
    setWeekRange({
      start: "شنبه ۲ آبان ۱۴۰۵",
      end: "جمعه ۸ آبان ۱۴۰۵",
    });
    setGoals([
      "اولویت این هفته تثبیت فصل‌های زیست‌شناسی و کم کردن خطای محاسباتی در ریاضی است. قبل از شروع هر جلسه، ۵ دقیقه نکات جلسه قبل را مرور کن.",
      "خواب منظم (حداقل ۷ ساعت) و پرهیز از موبایل در ساعت‌های مطالعه شرط اصلی اجرای این برنامه است. اگر جایی از برنامه عقب افتادی، نگران نباش و در جلسه هفتگی با هم تنظیمش می‌کنیم.",
    ]);
    setDays([
      {
        id: 0,
        name: "شنبه",
        dateStr: "۲ آبان",
        isRest: false,
        blocks: [
          { id: 'b1', type: 'study', typeTitle: 'مطالعه', cssClass: 'c-study', subject: 'زیست‌شناسی', topic: 'گوارش و جذب مواد', startTime: '۰۸:۰۰', endTime: '۰۹:۳۰', duration: '۱ ساعت و ۳۰ دقیقه', extra: '۱۸ صفحه', note: 'تصویرها و جدول آنزیم‌ها را حتماً با دست بکش.' },
          { id: 'b2', type: 'test', typeTitle: 'تست‌زنی', cssClass: 'c-test', subject: 'ریاضی', topic: 'حد و پیوستگی', startTime: '۰۹:۴۵', endTime: '۱۱:۱۵', duration: '۱ ساعت و ۳۰ دقیقه', extra: '۴۰ تست' },
          { id: 'b3', type: 'video', typeTitle: 'ویدیو / کلاس', cssClass: 'c-video', subject: 'فیزیک', topic: 'الکتریسیته ساکن – جلسه ۳', startTime: '۱۶:۰۰', endTime: '۱۷:۳۰', duration: '۱ ساعت و ۳۰ دقیقه' },
          { id: 'b4', type: 'review', typeTitle: 'مرور', cssClass: 'c-review', subject: 'شیمی', topic: 'ترمودینامیک (مرور فصل ۲)', startTime: '۱۸:۰۰', endTime: '۱۹:۰۰', duration: '۱ ساعت', note: 'فقط نکات خلاصه‌برگه‌ها.' },
        ],
      },
      {
        id: 1,
        name: "یکشنبه",
        dateStr: "۳ آبان",
        isRest: false,
        blocks: [
          { id: 'b5', type: 'study', typeTitle: 'مطالعه', cssClass: 'c-study', subject: 'شیمی', topic: 'محلول‌ها و غلظت', startTime: '۰۸:۰۰', endTime: '۱۰:۰۰', duration: '۲ ساعت', extra: '۲۲ صفحه' },
          { id: 'b6', type: 'review', typeTitle: 'مرور', cssClass: 'c-review', subject: 'ریاضی', topic: 'مشتق – نکات کلیدی', startTime: '۱۰:۱۵', endTime: '۱۱:۱۵', duration: '۱ ساعت' },
          { id: 'b7', type: 'test', typeTitle: 'تست‌زنی', cssClass: 'c-test', subject: 'فیزیک', topic: 'کار و انرژی', startTime: '۱۶:۰۰', endTime: '۱۷:۰۰', duration: '۱ ساعت', extra: '۳۰ تست', note: 'سؤال‌های اشتباه را در دفتر خطاها یادداشت کن.' },
          { id: 'b8', type: 'doubt', typeTitle: 'رفع اشکال', cssClass: 'c-doubt', subject: 'فیزیک', topic: 'تحلیل پاسخ‌نامه تست‌های جلسه قبل', startTime: '۱۷:۱۵', endTime: '۱۸:۰۰', duration: '۴۵ دقیقه' },
        ],
      },
      {
        id: 2,
        name: "دوشنبه",
        dateStr: "۴ آبان",
        isRest: false,
        blocks: [
          { id: 'b9', type: 'study', typeTitle: 'مطالعه', cssClass: 'c-study', subject: 'زیست‌شناسی', topic: 'گردش مواد در بدن', startTime: '۰۸:۰۰', endTime: '۱۰:۰۰', duration: '۲ ساعت', extra: '۲۵ صفحه' },
          { id: 'b10', type: 'test', typeTitle: 'تست‌زنی', cssClass: 'c-test', subject: 'زیست‌شناسی', topic: 'تست‌های ترکیبی گوارش و گردش مواد', startTime: '۱۰:۱۵', endTime: '۱۱:۴۵', duration: '۱ ساعت و ۳۰ دقیقه', extra: '۴۵ تست' },
          { id: 'b11', type: 'video', typeTitle: 'ویدیو / کلاس', cssClass: 'c-video', subject: 'ریاضی', topic: 'مثلثات – جلسه ۴', startTime: '۱۶:۰۰', endTime: '۱۷:۳۰', duration: '۱ ساعت و ۳۰ دقیقه' },
        ],
      },
      {
        id: 3,
        name: "سه‌شنبه",
        dateStr: "۵ آبان",
        isRest: true,
        restText: "امروز برنامه درسی نداری. استراحت، پیاده‌روی و خواب کافی هم بخشی از برنامه است.",
        blocks: [],
      },
      {
        id: 4,
        name: "چهارشنبه",
        dateStr: "۶ آبان",
        isRest: false,
        blocks: [
          { id: 'b12', type: 'study', typeTitle: 'مطالعه', cssClass: 'c-study', subject: 'فیزیک', topic: 'جریان الکتریکی', startTime: '۰۸:۰۰', endTime: '۱۰:۰۰', duration: '۲ ساعت', extra: '۲۰ صفحه' },
          { id: 'b13', type: 'test', typeTitle: 'تست‌زنی', cssClass: 'c-test', subject: 'شیمی', topic: 'محلول‌ها', startTime: '۱۰:۱۵', endTime: '۱۱:۴۵', duration: '۱ ساعت و ۳۰ دقیقه', extra: '۴۰ تست' },
          { id: 'b14', type: 'summary', typeTitle: 'جمع‌بندی', cssClass: 'c-summary', subject: 'ریاضی و فیزیک', topic: 'فرمول‌های هفته', startTime: '۱۷:۱۵', endTime: '۱۸:۰۰', duration: '۴۵ دقیقه', note: 'یک برگه A4 خلاصه‌شده تحویل بده.' },
        ],
      },
      {
        id: 5,
        name: "پنجشنبه",
        dateStr: "۷ آبان",
        isRest: false,
        blocks: [
          { id: 'b15', type: 'exam', typeTitle: 'آزمون آزمایشی', cssClass: 'c-exam', subject: 'آزمون جامع', topic: 'عمومی + اختصاصی (دفترچه آزمایشی)', startTime: '۰۸:۰۰', endTime: '۱۱:۳۰', duration: '۳ ساعت و ۳۰ دقیقه', note: 'آزمون را دقیقاً در شرایط واقعی بزن: بدون موبایل، با زمان‌سنج، و پاسخ‌نامه را همان لحظه پر کن.' },
          { id: 'b16', type: 'doubt', typeTitle: 'رفع اشکال', cssClass: 'c-doubt', subject: 'تحلیل آزمون', topic: 'بررسی پاسخ‌نامه تشریحی', startTime: '۱۶:۰۰', endTime: '۱۷:۳۰', duration: '۱ ساعت و ۳۰ دقیقه' },
        ],
      },
      {
        id: 6,
        name: "جمعه",
        dateStr: "۸ آبان",
        isRest: false,
        blocks: [
          { id: 'b17', type: 'review', typeTitle: 'مرور', cssClass: 'c-review', subject: 'ادبیات', topic: 'مرور درس‌های هفته', startTime: '۰۹:۰۰', endTime: '۱۰:۰۰', duration: '۱ ساعت' },
          { id: 'b18', type: 'summary', typeTitle: 'جمع‌بندی', cssClass: 'c-summary', subject: 'برنامه هفته', topic: 'بررسی پیشرفت و آماده‌سازی هفته بعد', startTime: '۱۰:۱۵', endTime: '۱۰:۴۵', duration: '۳۰ دقیقه' },
        ],
      },
    ]);
    setPdfSuccessMessage('📋 نمونه کامل برنامه هفتگی با موفقیت بارگذاری شد.');
    setTimeout(() => setPdfSuccessMessage(null), 4000);
  };

  // UNIFIED ROCK-SOLID A4 PDF GENERATOR (Returns jsPDF, Blob, and custom filename)
  const generatePdfDocument = async (onlyActivePage: boolean = false): Promise<{ pdf: jsPDF; filename: string; blob: Blob }> => {
    // Ensure all custom fonts (especially Vazirmatn) are completely loaded
    if (document.fonts) {
      await document.fonts.ready;
    }

    setPdfProgress("در حال آماده‌سازی فونت‌ها و رندر قالب استاندارد A4...");

    // Create true A4 PDF document in portrait mode (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Check all dynamic page refs
    let allPages = pageRefs.current.slice(0, dynamicPages.length).filter(Boolean) as HTMLDivElement[];
    if (allPages.length < dynamicPages.length) {
      await new Promise((r) => setTimeout(r, 150));
      allPages = pageRefs.current.slice(0, dynamicPages.length).filter(Boolean) as HTMLDivElement[];
    }

    if (allPages.length === 0) {
      throw new Error("خطا در بارگذاری عناصر برگه A4 در حافظه مرورگر.");
    }

    const targetPages = onlyActivePage
      ? [pageRefs.current[activePage - 1] || allPages[0]].filter(Boolean) as HTMLDivElement[]
      : allPages;

    const savedScrollX = window.scrollX;
    const savedScrollY = window.scrollY;
    if (savedScrollY !== 0 || savedScrollX !== 0) {
      window.scrollTo(0, 0);
    }

    try {
      for (let i = 0; i < targetPages.length; i++) {
        const pageEl = targetPages[i];
        const pageNum = onlyActivePage ? activePage : i + 1;
        setPdfProgress(`در حال پردازش و ثبت گرافیک صفحه ${pageNum} از ${targetPages.length} با قطع فیزیکی A4...`);

        // Ensure pageEl is temporarily visible in DOM so browser calculates all layout metrics
        const prevDisplay = pageEl.style.display;
        pageEl.style.display = 'flex';

        // Clone page element into a standalone unscaled attached container
        const clone = pageEl.cloneNode(true) as HTMLDivElement;
        clone.style.display = 'flex';
        clone.style.flexDirection = 'column';
        clone.style.justifyContent = 'space-between';
        clone.style.position = 'fixed';
        clone.style.left = '0';
        clone.style.top = '0';
        clone.style.width = '794px'; // 210mm at 96 DPI
        clone.style.minHeight = '1123px'; // 297mm at 96 DPI
        clone.style.height = '1123px';
        clone.style.maxHeight = '1123px';
        clone.style.transform = 'none';
        clone.style.zIndex = '99998';
        clone.style.opacity = '1'; // 100% fully opaque - never transparent!
        clone.style.visibility = 'visible';
        clone.style.pointerEvents = 'none';
        clone.style.backgroundColor = '#ffffff';
        clone.style.boxSizing = 'border-box';
        clone.style.overflow = 'hidden';
        clone.style.direction = 'rtl';
        clone.style.fontFamily = "'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        clone.style.letterSpacing = 'normal';

        // Explicitly enforce letter-spacing: normal, full opacity and visibility on every descendant
        const allChildren = clone.querySelectorAll<HTMLElement>('*');
        allChildren.forEach((child) => {
          child.style.letterSpacing = 'normal';
          child.style.fontFeatureSettings = 'normal';
          child.style.wordSpacing = 'normal';
          if (child.style.opacity === '0' || child.style.opacity === '0.01') {
            child.style.opacity = '1';
          }
        });

        // Preload and wait for any images inside the clone
        const images = Array.from(clone.querySelectorAll('img'));
        await Promise.all(
          images.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          })
        );

        document.body.appendChild(clone);

        // Wait a short tick for layout to compute
        await new Promise((resolve) => setTimeout(resolve, 80));

        // Optimized high-speed canvas capture with crystal-clear print quality
        const canvas = await html2canvas(clone, {
          scale: 1.6, // High DPI, 3x faster generation and 60% smaller file size
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 10000,
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
          width: 794,
          height: 1123,
          windowWidth: 794,
          windowHeight: 1123,
          onclone: (clonedDoc: Document) => {
            clonedDoc.body.style.backgroundColor = '#ffffff';
            clonedDoc.body.style.color = '#111111';
          },
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);

        // Clean up clone & restore original display
        document.body.removeChild(clone);
        pageEl.style.display = prevDisplay;

        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        // Exact physical A4 dimensions: 210mm x 297mm
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }
    } finally {
      if (savedScrollY !== 0 || savedScrollX !== 0) {
        window.scrollTo(savedScrollX, savedScrollY);
      }
    }

    setPdfProgress("در حال نهایی‌سازی و ساخت فایل خروجی...");

    let finalFilename = customFilename.trim();
    if (!finalFilename) {
      const safeName = student.name.replace(/\s+/g, '_');
      finalFilename = `برنامه_هفتگی_${safeName}.pdf`;
    } else if (!finalFilename.toLowerCase().endsWith('.pdf')) {
      finalFilename += '.pdf';
    }

    if (onlyActivePage) {
      const extIndex = finalFilename.lastIndexOf('.');
      finalFilename = `${finalFilename.substring(0, extIndex)}_صفحه_${activePage}.pdf`;
    }

    const blob = pdf.output('blob');
    return { pdf, filename: finalFilename, blob };
  };

  // REAL A4 PDF DOWNLOAD IMPLEMENTATION
  const downloadRealPdf = async (onlyActivePage: boolean = false) => {
    setIsGeneratingPdf(true);
    setPdfSuccessMessage(null);

    try {
      const { pdf, filename } = await generatePdfDocument(onlyActivePage);

      // Save real binary .pdf file directly
      pdf.save(filename);

      setPdfSuccessMessage(`✅ فایل «${filename}» با نام انتخابی شما و قطع استاندارد فیزیکی A4 (${onlyActivePage ? `صفحه ${activePage}` : `${dynamicPages.length} صفحه کامل هفتگی`}) با موفقیت دانلود شد!`);
      setTimeout(() => setPdfSuccessMessage(null), 6000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      // Fallback to native print
      window.print();
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  // SERVERLESS DIRECT TELEGRAM BOT INTEGRATION
  // Sends PDF directly from the browser to Telegram API with ZERO server
  const checkBotToken = async () => {
    if (!botToken.trim()) {
      setTelegramSendResult({ success: false, message: 'لطفاً ابتدا توکن ربات تلگرام خود را وارد فرمایید.' });
      return;
    }
    setIsTestingToken(true);
    setBotInfo(null);
    setTelegramSendResult(null);
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/getMe`);
      const data = await res.json();
      if (data.ok && data.result) {
        setBotInfo({ ok: true, username: data.result.username, first_name: data.result.first_name });
        localStorage.setItem('zeta_bot_token', botToken.trim());
        setTelegramSendResult({ success: true, message: `✅ اتصال موفق به ربات: ${data.result.first_name} (@${data.result.username})` });
      } else {
        setBotInfo({ ok: false });
        setTelegramSendResult({ success: false, message: `❌ توکن نامعتبر است: ${data.description || 'بررسی بفرمایید.'}` });
      }
    } catch (err: any) {
      setBotInfo({ ok: false });
      setTelegramSendResult({ success: false, message: '❌ خطای اتصال به api.telegram.org. در صورت محدودیت اینترنت از ابزار تغییر IP مناسب استفاده فرمایید.' });
    } finally {
      setIsTestingToken(false);
    }
  };

  const fetchLatestChatId = async () => {
    setIsFetchingChatId(true);
    setTelegramSendResult(null);
    try {
      const activeToken = botToken.trim() || DEFAULT_BOT_TOKEN;
      let foundId = '';
      let foundName = '';

      // Strategy 1: European server endpoint (100% unblocked in Iran)
      try {
        const sRes = await fetch(`/api/telegram/getLatestChatId?token=${encodeURIComponent(activeToken)}`);
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.ok && sData.chatId) {
            foundId = String(sData.chatId);
            foundName = sData.firstName || sData.username || 'مشاور گرامی';
          }
        }
      } catch (_) {}

      // Strategy 2: Proxy via /tg/bot.../getUpdates
      if (!foundId) {
        try {
          const res = await fetch(`/tg/bot${activeToken}/getUpdates?limit=15`);
          const data = await res.json();
          if (data.ok && Array.isArray(data.result)) {
            for (let j = data.result.length - 1; j >= 0; j--) {
              const item = data.result[j];
              const c = item.message?.chat || item.channel_post?.chat;
              if (c && c.id) {
                foundId = String(c.id);
                foundName = c.first_name || c.title || c.username || 'مشاور گرامی';
                break;
              }
            }
          }
        } catch (_) {}
      }

      if (foundId) {
        setChatId(foundId);
        localStorage.setItem('zeta_chat_id', foundId);
        setTelegramSendResult({ success: true, message: `✅ شناسه چت اختصاصی شما (${foundName} - ${foundId}) با موفقیت استخراج و متصل شد!` });
      } else {
        setTelegramSendResult({
          success: false,
          message: '⚠️ پیامی از اکانت شما در ربات پیدا نشد. لطفاً در تلگرام وارد @Zetagroupbot شده و دکمه Start یا یک پیام بفرستید، سپس مجدداً این دکمه را لمس فرمایید.',
        });
      }
    } catch (err: any) {
      setTelegramSendResult({ success: false, message: 'خطا در استخراج شناسه از تلگرام.' });
    } finally {
      setIsFetchingChatId(false);
    }
  };

  // Open Telegram Bot via WebApp openTelegramLink (Smooth in-app experience) or window.open
  const handleOpenBotInTelegram = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const botUrl = 'https://t.me/Zetagroupbot?start=start';
    try {
      const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
      if (tg && typeof tg.openTelegramLink === 'function') {
        tg.openTelegramLink(botUrl);
        return;
      }
    } catch (_) {}
    window.open(botUrl, '_blank');
  };

  const sendPdfToTelegram = async () => {
    const activeToken = botToken.trim() || DEFAULT_BOT_TOKEN;

    // 1. Determine targetChatId:
    // If inside Telegram WebApp, ALWAYS strictly use the authenticated consultant's OWN ID
    let targetChatId = '';
    const tgUser = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user : null;
    if (tgUser?.id) {
      targetChatId = String(tgUser.id);
      setChatId(targetChatId);
      localStorage.setItem('zeta_chat_id', targetChatId);
    } else {
      targetChatId = chatId.trim();
    }

    if (!targetChatId) {
      setTelegramSendResult({
        success: false,
        message: '⚠️ شناسه تلگرام شما مشخص نیست. لطفاً شناسه چت خود را در کادر تنظیمات تلگرام وارد فرمایید یا برنامه را مستقیماً از داخل تلگرام باز کنید.',
      });
      return;
    }

    setIsSendingTelegram(true);
    setTelegramSendResult(null);

    try {
      // 1. Generate the physical A4 PDF in memory (Fast & lightweight)
      const { blob, filename } = await generatePdfDocument(false);
      const cap = telegramCaption.trim() || `📋 برنامه هفتگی اختصاصی ${student.name || 'دانش‌آموز'}\nمشاور: ${advisor.name || 'مشاور تحصیلی'}\nموسسه آموزشی و مشاوره‌ای زتا (@Zetagroupbot)`;

      // Convert Blob to Base64 for 100% reliable proxy transfer
      const base64Pdf = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      let sendSuccess = false;
      let responseData: any = null;

      // Strategy 1: High-Speed Backend Proxy via /api/telegram/sendPdf (Base64 JSON)
      try {
        const proxyRes = await fetch('/api/telegram/sendPdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: targetChatId,
            pdfBase64: base64Pdf,
            filename,
            caption: cap,
            token: activeToken,
          }),
        });

        if (proxyRes.ok) {
          responseData = await proxyRes.json();
          if (responseData && responseData.ok) {
            sendSuccess = true;
          }
        } else {
          try {
            responseData = await proxyRes.json();
          } catch (_) {}
        }
      } catch (proxyErr) {
        console.warn("Backend sendPdf JSON route failed, trying /tg/ proxy:", proxyErr);
      }

      // Strategy 2: Direct Telegram Proxy via /tg/ (Cloudflare Worker on same origin)
      if (!sendSuccess) {
        try {
          const formData = new FormData();
          formData.append('chat_id', targetChatId);
          formData.append('document', blob, filename);
          formData.append('caption', cap);

          const tgProxyRes = await fetch(`/tg/bot${activeToken}/sendDocument`, {
            method: 'POST',
            body: formData,
          });
          if (tgProxyRes.ok) {
            responseData = await tgProxyRes.json();
            if (responseData && responseData.ok) {
              sendSuccess = true;
            }
          }
        } catch (tgProxyErr) {
          console.warn("Direct /tg/ proxy failed:", tgProxyErr);
        }
      }

      // Strategy 3: Dedicated Cloudflare Bypass Worker (Bypasses Iran filtering without VPN)
      if (!sendSuccess && bypassWorkerUrl && bypassWorkerUrl.trim()) {
        try {
          const cleanBypass = bypassWorkerUrl.trim().replace(/\/+$/, '');
          const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
          if (cleanBypass !== currentOrigin) {
            // Try Base64 endpoint on worker
            try {
              const bRes = await fetch(`${cleanBypass}/api/telegram/sendPdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chatId: targetChatId,
                  pdfBase64: base64Pdf,
                  filename,
                  caption: cap,
                  token: activeToken,
                }),
              });
              if (bRes.ok) {
                const bData = await bRes.json();
                if (bData && bData.ok) {
                  sendSuccess = true;
                  responseData = bData;
                }
              }
            } catch (_) {}

            // Try /tg/ endpoint on worker
            if (!sendSuccess) {
              const bFormData = new FormData();
              bFormData.append('chat_id', targetChatId);
              bFormData.append('document', blob, filename);
              bFormData.append('caption', cap);

              const bTgRes = await fetch(`${cleanBypass}/tg/bot${activeToken}/sendDocument`, {
                method: 'POST',
                body: bFormData,
              });
              if (bTgRes.ok) {
                const bTgData = await bTgRes.json();
                if (bTgData && bTgData.ok) {
                  sendSuccess = true;
                  responseData = bTgData;
                }
              }
            }
          }
        } catch (bErr) {
          console.warn("Dedicated bypass worker failed:", bErr);
        }
      }

      // Strategy 4: Direct fetch (Works when VPN is ON)
      if (!sendSuccess) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const formData = new FormData();
          formData.append('chat_id', targetChatId);
          formData.append('document', blob, filename);
          formData.append('caption', cap);

          const directRes = await fetch(`https://api.telegram.org/bot${activeToken}/sendDocument`, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          responseData = await directRes.json();
          if (responseData && responseData.ok) {
            sendSuccess = true;
          }
        } catch (_) {}
      }

      if (sendSuccess) {
        localStorage.setItem('zeta_bot_token', activeToken);
        localStorage.setItem('zeta_chat_id', targetChatId);
        const successNotice = `🎉 فایل «${filename}» با قطع استاندارد فیزیکی A4 با موفقیت مستقیماً به پی‌وی تلگرام شما (@${DEFAULT_BOT_USERNAME}) ارسال شد!`;
        setTelegramSendResult({
          success: true,
          message: successNotice,
        });
        setPdfSuccessMessage(successNotice);
        setTimeout(() => setPdfSuccessMessage(null), 8000);
      } else {
        // AUTOMATIC INSTANT DOWNLOAD FAILSAFE:
        // Ensure user never loses work or waits if Telegram API rejects or blocks
        try {
          const downloadUrl = URL.createObjectURL(blob);
          const dlLink = document.createElement('a');
          dlLink.href = downloadUrl;
          dlLink.download = filename;
          document.body.appendChild(dlLink);
          dlLink.click();
          document.body.removeChild(dlLink);
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
        } catch (dlErr) {
          console.warn("Auto-download failsafe:", dlErr);
        }

        const desc = (responseData?.description || responseData?.persianMessage || '').toLowerCase();
        let errorNotice = `⚠️ عدم برقراری ارتباط با تلگرام به دلیل خاموش بودن فیلترشکن: بدون وی‌پی‌ان، ارسال به تلگرام نیازمند فعال‌سازی پروکسی ورکر است. فایل PDF فوراً در دستگاه شما دانلود شد!`;
        
        if (desc.includes("blocked") || responseData?.persianMessage?.includes("مسدود")) {
          errorNotice = `🚫 اکانت تلگرام (${targetChatId}) ربات @Zetagroupbot را متوقف و مسدود (Stop and Block) کرده است. لطفاً دکمه «شروع مجدد در تلگرام» را بزنید تا رفع مسدودی شود. (فایل PDF دانلود شد).`;
        } else if (desc.includes("can't initiate conversation") || desc.includes("chat not found") || desc.includes("initiate")) {
          errorNotice = `⚠️ ربات @Zetagroupbot اجازه شروع گفتگو با چت (${targetChatId}) را ندارد زیرا هنوز ربات در تلگرام استارت نشده است. لطفاً دکمه «استارت ربات» را لمس فرمایید. (فایل PDF دانلود شد).`;
        } else if (responseData?.persianMessage) {
          errorNotice = `${responseData.persianMessage} (فایل PDF شما در دستگاه دانلود شد).`;
        } else if (responseData?.description) {
          errorNotice = `خطای تلگرام: ${responseData.description} (فایل PDF در دستگاه شما ذخیره شد).`;
        }

        setTelegramSendResult({
          success: false,
          message: errorNotice,
        });
      }
    } catch (err: any) {
      console.error("Telegram send error:", err);
      // Trigger instant download as fallback
      downloadRealPdf(false);
      setTelegramSendResult({
        success: false,
        message: `خطای ارسال به تلگرام: فایل PDF مستقیماً در دستگاه شما ذخیره گردید. (${err?.message || 'بررسی ارتباط'})`,
      });
    } finally {
      setIsSendingTelegram(false);
      setPdfProgress(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-['Vazirmatn']" style={{ backgroundColor: '#f5f5f5', color: '#171717' }} dir="rtl">
      {/* Top Navbar */}
      <header className="bg-neutral-900 text-white border-b-4 border-[#FF4F12] sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1 shadow">
              <img
                src={zetaLogo}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
                alt="Zeta"
                className="max-w-full max-h-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xl text-white">Zeta | زتا</span>
                <span className="bg-[#FF4F12] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  پنل هوشمند مشاوران تحصیلی
                </span>
                {isInTelegram && telegramUser && (
                  <span className="bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <Smartphone className="w-3 h-3 text-emerald-400" />
                    <span>مشاور تلگرام: {telegramUser.firstName || telegramUser.username || telegramUser.id}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                سامانه ثبت برنامه هفتگی دانش‌آموزان و صدور مستقیم فایل PDF استاندارد A4 (بدون باگ)
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 bg-neutral-800/80 p-1 rounded-xl border border-neutral-700/60 text-xs font-medium">
            <button
              onClick={() => setActiveTab('builder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'builder' ? 'bg-[#FF4F12] text-white font-bold shadow' : 'text-neutral-300 hover:text-white hover:bg-neutral-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>✏️ ورود و ویرایش برنامه دانش‌آموز</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'preview' ? 'bg-[#FF4F12] text-white font-bold shadow' : 'text-neutral-300 hover:text-white hover:bg-neutral-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>👁 پیش‌نمایش و دانلود PDF A4</span>
            </button>
            <button
              onClick={() => setActiveTab('telegram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'telegram' ? 'bg-[#0088cc] text-white font-bold shadow' : 'text-neutral-300 hover:text-white hover:bg-neutral-700'
              }`}
            >
              <SendHorizontal className="w-3.5 h-3.5 text-[#54c7fc]" />
              <span>✈️ ارسال به تلگرام (بدون سرور)</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Success notification banner */}
      {pdfSuccessMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{pdfSuccessMessage}</span>
        </div>
      )}

      {/* Global Interactive Telegram Alert Banner (Visible on all tabs when Telegram error happens) */}
      {telegramSendResult && !telegramSendResult.success && (
        <div className="bg-amber-50 border-y border-amber-300 p-3 px-4 text-xs font-bold text-amber-950 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 max-w-3xl">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="leading-relaxed">{telegramSendResult.message}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenBotInTelegram}
              className="bg-[#0088cc] hover:bg-[#0077b5] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>📱 شروع مجدد و رفع مسدودی @Zetagroupbot</span>
            </button>
            <button
              type="button"
              onClick={() => downloadRealPdf(false)}
              className="bg-[#FF4F12] hover:bg-[#C93A00] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>📥 دانلود مستقیم PDF</span>
            </button>
            <button
              type="button"
              onClick={fetchLatestChatId}
              disabled={isFetchingChatId}
              className="bg-neutral-800 hover:bg-neutral-900 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تشخیص مجدد</span>
            </button>
            <button
              onClick={() => setTelegramSendResult(null)}
              className="text-neutral-500 hover:text-neutral-800 p-1 rounded-md text-xs font-bold cursor-pointer"
              title="بستن پیام"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {/* Fullscreen PDF Progress Indicator Modal */}
        {pdfProgress && (
          <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-neutral-200 animate-fadeIn">
              <div className="w-16 h-16 bg-[#FFF1EA] text-[#FF4F12] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h3 className="font-black text-base text-neutral-900">پردازش فایل PDF استاندارد A4</h3>
                <p className="text-xs text-neutral-600 mt-2 font-bold leading-relaxed">{pdfProgress}</p>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                <div className="bg-[#FF4F12] h-full rounded-full animate-pulse w-4/5"></div>
              </div>
              <div className="text-[11px] text-neutral-400 font-medium">لطفاً چند لحظه صبر فرمایید...</div>
            </div>
          </div>
        )}

        {/* TAB 1: Live A4 PDF Preview & Direct Download (Permanently mounted off-screen when inactive to guarantee zero blank PDF generation) */}
        <div className={`space-y-4 ${activeTab === 'preview' ? 'block' : 'fixed -left-[99999px] top-0 pointer-events-none opacity-0 -z-50'}`}>
            {/* Control Bar */}
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-neutral-700">صفحه A4 در حال نمایش:</span>
                <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5 border border-neutral-200 overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => setActivePage(Math.max(1, activePage - 1))}
                    disabled={activePage <= 1}
                    className="p-1.5 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="صفحه قبلی"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {dynamicPages.map((p) => (
                    <button
                      key={p.pageNumber}
                      type="button"
                      onClick={() => setActivePage(p.pageNumber)}
                      className={`px-2.5 py-1 rounded-md font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                        activePage === p.pageNumber
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                      }`}
                    >
                      {p.title}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setActivePage(Math.min(dynamicPages.length, activePage + 1))}
                    disabled={activePage >= dynamicPages.length}
                    className="p-1.5 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="صفحه بعدی"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200">
                  <span className="text-neutral-500 font-medium">بزرگ‌نمایی:</span>
                  <button onClick={() => setZoomLevel(Math.max(60, zoomLevel - 10))} className="p-0.5 hover:bg-neutral-200 rounded font-bold">
                    -
                  </button>
                  <span className="font-bold text-neutral-800 w-10 text-center">{zoomLevel}٪</span>
                  <button onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))} className="p-0.5 hover:bg-neutral-200 rounded font-bold">
                    +
                  </button>
                </div>

                {/* Custom Filename Input */}
                <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-300 shadow-xs">
                  <FileText className="w-3.5 h-3.5 text-[#FF4F12] shrink-0" />
                  <span className="text-neutral-500 font-bold whitespace-nowrap">نام فایل PDF:</span>
                  <input
                    type="text"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    dir="ltr"
                    className="bg-white border border-neutral-300 rounded px-2 py-0.5 text-xs font-mono font-bold text-neutral-800 w-64 focus:outline-none focus:ring-1 focus:ring-[#FF4F12]"
                    placeholder="برنامه_هفتگی.pdf"
                    title="نام فایل را به دلخواه خود تغییر دهید"
                  />
                </div>

                {/* DIRECT REAL PDF DOWNLOAD BUTTONS */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => downloadRealPdf(false)}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-2 bg-[#FF4F12] hover:bg-[#C93A00] text-white px-4 py-2 rounded-xl font-extrabold shadow transition cursor-pointer disabled:opacity-60"
                    title={`دانلود فایل PDF واقعی با نام انتخابی و قطع فیزیکی استاندارد A4 (شامل هر ${dynamicPages.length} صفحه)`}
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>در حال صدور PDF واقعی...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>دانلود کل برنامه ({dynamicPages.length} صفحه PDF واقعی)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => downloadRealPdf(true)}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3 py-2 rounded-xl font-bold border border-neutral-300 transition cursor-pointer disabled:opacity-60"
                    title={`دانلود فقط صفحه جاری (${activePage}) به صورت فایل PDF مستقل A4`}
                  >
                    <FileCheck className="w-3.5 h-3.5 text-[#FF4F12]" />
                    <span>دانلود صفحه {activePage}</span>
                  </button>
                </div>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-2 rounded-xl font-bold shadow transition cursor-pointer"
                  title="چاپ مستقیم از طریق سیستم عامل"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>پرینت</span>
                </button>

                <button
                  onClick={sendPdfToTelegram}
                  disabled={isSendingTelegram}
                  className="flex items-center gap-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white px-3.5 py-2 rounded-xl font-bold shadow transition cursor-pointer disabled:opacity-60"
                  title="دریافت مستقیم فایل PDF در پی‌وی تلگرام مشاور (@Zetagroupbot)"
                >
                  {isSendingTelegram ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال ارسال...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{isInTelegram ? '🚀 دریافت مستقیم PDF در تلگرام من' : '🚀 دریافت در تلگرام (@Zetagroupbot)'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Smart Height & Layout Budget Monitor Bar */}
            <div className="bg-white px-4 py-2.5 rounded-2xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-neutral-800">محاسبه هوشمند ارتفاع بلوک‌ها:</span>
                <span className="text-neutral-600">
                  صفحه {activePage} از {dynamicPages.length} با ارتفاع دقیق محاسباتی <b className="text-neutral-900 font-extrabold">{activePageBudget.totalHeight}px</b> از {activePageBudget.maxBudget}px ({activePageBudget.percentage}٪) ·
                  <span className="text-emerald-700 font-bold mx-1">
                    {activePageBudget.isOptimal ? 'کاملاً استاندارد A4 و بدون سرریز' : 'توصیه: سبک‌سازی تعداد بلوک‌ها'}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>قانون break-inside: avoid بر روی کارت‌ها و بلوک‌ها فعال است</span>
              </div>
            </div>

            {/* A4 True Dimensional Render Container */}
            <div className="flex justify-center overflow-x-auto py-2">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  width: '210mm',
                  minHeight: '297mm',
                  transition: 'transform 0.15s ease',
                }}
                className="bg-white shadow-2xl rounded-none relative border border-neutral-300 flex flex-col text-[11.5px] leading-[1.7]"
              >
                {/* DYNAMIC MULTI-PAGE RENDERER (Dynamically expands or contracts pages based on schedule volume) */}
                {(() => {
                  const renderMainHeader = () => (
                    <header className="bg-[#111111] text-white flex items-center gap-4 px-[12mm] py-[3.5mm] border-b-[3.5px] border-[#FF4F12]">
                      <div className="w-[20mm] h-[20mm] bg-white rounded-xl flex items-center justify-center p-1.5 shrink-0 shadow">
                        <img
                          src={zetaLogo}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo.png';
                          }}
                          alt="Zeta"
                          className="max-w-full max-h-full"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h1 className="text-[23px] font-black leading-tight" style={{ letterSpacing: 'normal' }}>برنامه هفتگی</h1>
                          <span className="bg-[#FF4F12] text-white text-[9px] font-black px-2 py-0.5 rounded-full" style={{ letterSpacing: 'normal' }}>
                            ZETA PLAN
                          </span>
                        </div>
                        <div className="w-[42px] h-[3px] bg-[#FF4F12] rounded-full my-0.5"></div>
                        <div className="text-[11px] text-neutral-300 font-medium" style={{ letterSpacing: 'normal' }}>موسسه آموزشی و مشاوره‌ای زتا</div>
                      </div>
                      <div className="flex flex-col gap-0.5 text-[10.5px] text-white border-r-2 border-neutral-700 pr-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-400 text-[10px]">شروع:</span>
                          <span className="font-bold" style={{ letterSpacing: 'normal' }}>{weekRange.start || 'شنبه'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-400 text-[10px]">پایان:</span>
                          <span className="font-bold text-[#ffb79c]" style={{ letterSpacing: 'normal' }}>{weekRange.end || 'جمعه'}</span>
                        </div>
                      </div>
                    </header>
                  );

                  const renderMiniHeader = () => (
                    <div className="mx-[12mm] py-2 flex justify-between items-center text-[11px] text-[#6B6B6B] border-b border-[#E8E8E8]">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[13px] text-[#111111]" style={{ letterSpacing: 'normal' }}>Zeta | زتا</span>
                        <span className="text-[9.5px] font-bold bg-[#FF4F12] text-white px-2 py-0.5 rounded-full">برنامه هفتگی اختصاصی</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-neutral-400">دانش‌آموز:</span>
                        <span className="font-black text-[#111111] text-[12.5px]" style={{ letterSpacing: 'normal' }}>{student.name || 'نام دانش‌آموز'}</span>
                        <span className="text-neutral-300 mx-1.5">|</span>
                        <span className="font-semibold text-neutral-600">{(weekRange.start || 'شنبه') + ' تا ' + (weekRange.end || 'جمعه')}</span>
                      </div>
                    </div>
                  );

                  const renderPageFooter = (pageNum: number, totalPages: number) => (
                    <footer className="mx-[12mm] py-2 border-t-[1.5px] border-[#FF4F12] flex justify-between items-center text-[10px] text-[#6B6B6B] shrink-0">
                      <span className="font-extrabold text-[#111111]">Zeta | زتا</span>
                      <span>صفحه {pageNum} از {totalPages}</span>
                      <span>{advisor.createdDate || 'برنامه هفتگی اختصاصی'}</span>
                    </footer>
                  );

                  const renderInfoCard = () => (
                    <div style={{ display: 'table', width: '100%', tableLayout: 'fixed' }} className="border-[1.5px] border-[#FF4F12] rounded-[12px] overflow-hidden bg-white shadow-2xs">
                      <div style={{ display: 'table-cell', width: '50%', verticalAlign: 'top' }} className="p-2 px-3">
                        <div className="flex items-center justify-between border-b border-[#f0ece6] pb-1 mb-1">
                          <div className="flex items-center gap-1.5 text-[10.5px] font-black text-[#C93A00]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4F12]"></span>
                            <span>مشخصات دانش‌آموز</span>
                          </div>
                          <span className="text-[9.5px] font-bold text-neutral-600 bg-[#f6f3ef] px-2 py-0.5 rounded-full border border-[#e5ded4]" style={{ letterSpacing: 'normal' }}>
                            {student.grade} · {student.field}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-neutral-400 shrink-0 w-[36px]">نام:</span>
                            <span className="text-[15px] font-black text-[#111111] leading-tight" style={{ letterSpacing: 'normal' }}>
                              {student.name || 'نام دانش‌آموز'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-[10px] font-bold text-neutral-400 shrink-0 w-[36px]">هدف:</span>
                            <span className="font-bold text-[#C93A00] leading-tight" style={{ letterSpacing: 'normal' }}>
                              {student.target ? `🎯 ${student.target}` : '🎯 هدف تحصیلی'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'table-cell', width: '50%', verticalAlign: 'top' }} className="p-2 px-3 border-r border-[#ffd2bf] bg-[#FFF1EA]">
                        <div className="flex items-center justify-between border-b border-[#ffd2bf] pb-1 mb-1">
                          <div className="flex items-center gap-1.5 text-[10.5px] font-black text-[#C93A00]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4F12]"></span>
                            <span>مشاور تحصیلی و برنامه‌ریز</span>
                          </div>
                          <span className="text-[9.5px] font-bold text-[#C93A00] bg-white px-2 py-0.5 rounded-full border border-[#ffd2bf]" style={{ letterSpacing: 'normal' }}>
                            {advisor.weekTitle || 'برنامه هفتگی'}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#9e705b] shrink-0 w-[36px]">مشاور:</span>
                            <span className="text-[14px] font-black text-[#111111] leading-tight" style={{ letterSpacing: 'normal' }}>
                              {advisor.name || 'مشاور تحصیلی'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-[10px] font-bold text-[#9e705b] shrink-0 w-[36px]">تنظیم:</span>
                            <span className="font-semibold text-neutral-700 leading-tight" style={{ letterSpacing: 'normal' }}>
                              📅 {advisor.createdDate || 'تاریخ صدور'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                  const renderChartAndStats = () => (
                    <div style={{ display: 'table', width: '100%', tableLayout: 'fixed' }} className="bg-[#F6F3EF] rounded-[12px] p-2.5">
                      <div style={{ display: 'table-cell', width: '130px', verticalAlign: 'middle', paddingLeft: '10px', borderLeft: '1px solid #e3ddd5' }}>
                        {includeTimings ? (
                          <>
                            <div className="flex flex-col border-b border-[#e3ddd5] pb-0.5 leading-tight">
                              <b className="text-[17px] font-extrabold text-[#FF4F12]">{formatHhMmFa(totalMinutes)}</b>
                              <span className="text-[9.5px] text-[#6B6B6B]">ساعت کل هفته</span>
                            </div>
                            <div className="flex flex-col border-b border-[#e3ddd5] pb-0.5 leading-tight mt-0.5">
                              <b className="text-[17px] font-extrabold text-[#111111]">{String(activeDaysCount).replace(/\d/g, (c) => "۰۱۲۳۴۵۶۷۸۹"[Number(c)])}</b>
                              <span className="text-[9.5px] text-[#6B6B6B]">روز فعال</span>
                            </div>
                            <div className="flex flex-col leading-tight mt-0.5">
                              <b className="text-[17px] font-extrabold text-[#111111]">{formatHhMmFa(avgMinutes)}</b>
                              <span className="text-[9.5px] text-[#6B6B6B]">میانگین روزانه</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col border-b border-[#e3ddd5] pb-0.5 leading-tight">
                              <b className="text-[17px] font-extrabold text-[#FF4F12]">{String(totalBlocksCount).replace(/\d/g, (c) => "۰۱۲۳۴۵۶۷۸۹"[Number(c)])}</b>
                              <span className="text-[9.5px] text-[#6B6B6B]">تعداد کل پارت‌ها</span>
                            </div>
                            <div className="flex flex-col border-b border-[#e3ddd5] pb-0.5 leading-tight mt-0.5">
                              <b className="text-[17px] font-extrabold text-[#111111]">{String(activeDaysCount).replace(/\d/g, (c) => "۰۱۲۳۴۵۶۷۸۹"[Number(c)])}</b>
                              <span className="text-[9.5px] text-[#6B6B6B]">روز مطالعه فعال</span>
                            </div>
                            <div className="flex flex-col leading-tight mt-0.5">
                              <b className="text-[16px] font-extrabold text-neutral-800">{avgBlocks}</b>
                              <span className="text-[9.5px] text-[#6B6B6B]">میانگین پارت در روز</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div style={{ display: 'table-cell', verticalAlign: 'bottom', paddingRight: '8px' }}>
                        <div style={{ display: 'table', width: '100%', height: '80px', tableLayout: 'fixed' }}>
                          {chartBarsData.map((bar, i) => (
                            <div key={i} style={{ display: 'table-cell', width: '14.28%', verticalAlign: 'bottom', textAlign: 'center' }}>
                              <div className="text-[9px] text-[#6B6B6B] h-[14px] leading-[14px]">{bar.val}</div>
                              <div className="h-[46px] w-full flex items-end justify-center">
                                <div
                                  style={{ height: `${bar.height}%` }}
                                  className={`w-[58%] mx-auto rounded-t-sm ${bar.isZero ? 'bg-[#cfcac3] min-h-[3px]' : 'bg-[#FF4F12]'}`}
                                ></div>
                              </div>
                              <div className="text-[9px] font-semibold mt-0.5 h-[15px] leading-[15px] whitespace-nowrap">{bar.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );

                  const renderLegendChips = () => (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FFF1EA] text-[#C93A00]">
                        {renderIcon('study')}
                        <span>مطالعه</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F6F3EF] text-[#444] border border-[#e3ddd5]">
                        {renderIcon('review')}
                        <span>مرور</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#111111] text-white">
                        {renderIcon('test')}
                        <span>تست‌زنی</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white text-[#C93A00] border border-[#FF4F12]">
                        {renderIcon('video')}
                        <span>ویدیو / کلاس</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FF4F12] text-white">
                        {renderIcon('exam')}
                        <span>آزمون</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white text-[#111111] border border-[#111111]">
                        {renderIcon('summary')}
                        <span>جمع‌بندی</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E8E8E8] text-[#111111]">
                        {renderIcon('doubt')}
                        <span>رفع اشکال</span>
                      </span>
                    </div>
                  );

                  const renderDayCard = (section: PageSection) => (
                    <div
                      key={`${section.dayId}_${section.isContinued ? 'cont' : 'main'}`}
                      data-day-id={section.dayId}
                      data-day-card="true"
                      className="day day-card border border-[#E8E8E8] rounded-[12px] overflow-hidden break-inside-avoid bg-white shadow-2xs"
                      style={{
                        breakInside: 'avoid',
                        pageBreakInside: 'avoid',
                      }}
                    >
                      {section.isRest ? (
                        <>
                          <div className="flex justify-between items-center bg-[#F6F3EF] px-3 py-1.5 border-b border-[#E8E8E8]">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-black text-[#111111]" style={{ letterSpacing: 'normal' }}>{section.dayName}</span>
                              <span className="text-[9.5px] font-bold text-neutral-500 bg-white px-2 py-0.5 rounded-md border border-[#e5dfd7]">
                                {section.dateStr}
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] font-black bg-[#FFF1EA] text-[#C93A00] border border-[#ffd2bf]">
                              {renderIcon('rest')}
                              <span>روز استراحت و ریکاوری</span>
                            </span>
                          </div>
                          <div className="p-3 text-[10.5px] text-[#555] leading-relaxed font-medium">
                            {section.restText || 'امروز برنامه درسی نداری. استراحت و خواب کافی بخشی از برنامه است.'}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center bg-[#F6F3EF] px-3 py-1.5 border-b-2 border-[#111111]">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-black text-[#111111]" style={{ letterSpacing: 'normal' }}>{section.dayName}</span>
                              <span className="text-[9.5px] font-bold text-[#C93A00] bg-white px-2 py-0.5 rounded-md border border-[#e5dfd7]">
                                {section.dateStr}
                              </span>
                              {section.isContinued && (
                                <span className="text-[9px] font-black text-neutral-600 bg-neutral-200 px-1.5 py-0.5 rounded">
                                  ادامه از صفحه قبل
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[9.5px] text-[#6B6B6B]">
                              {includeTimings ? (
                                <>
                                  <span className="font-medium">جمع مطالعه:</span>
                                  <b className="text-[14px] font-black text-[#FF4F12]" style={{ letterSpacing: 'normal' }}>{formatHhMmFa(section.totalDayMinutes)}</b>
                                  <span className="text-[9px]">ساعت</span>
                                </>
                              ) : (
                                <>
                                  <span className="font-medium">تعداد فعالیت:</span>
                                  <b className="text-[14px] font-black text-[#FF4F12]" style={{ letterSpacing: 'normal' }}>{String(section.blocks.length).replace(/\d/g, (c) => "۰۱۲۳۴۵۶۷۸۹"[Number(c)])}</b>
                                  <span className="text-[9px]">پارت شناور</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="divide-y divide-[#E8E8E8]">
                            {section.blocks.length > 0 ? (
                              section.blocks.map(renderBlockRow)
                            ) : (
                              <div className="p-2.5 text-center text-[10px] text-neutral-400 font-medium">
                                برنامه‌ای برای این روز ثبت نشده است.
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );

                  const renderGoalsAndTracker = (isDedicatedPage: boolean = false) => (
                    <div className="space-y-2.5">
                      {/* Goals Section */}
                      <div
                        className="day-card card-avoid-break bg-[#FFF1EA] rounded-[12px] p-2.5 border border-[#ffd2bf] break-inside-avoid shadow-2xs"
                        style={{
                          breakInside: 'avoid',
                          pageBreakInside: 'avoid',
                        }}
                      >
                        <div className="flex items-center justify-between border-b border-[#ffd2bf] pb-1 mb-1">
                          <h2 className="text-[12.5px] font-black text-[#111111] flex items-center gap-1.5 before:content-[''] before:w-1.5 before:h-3.5 before:bg-[#FF4F12] before:rounded-xs">
                            اهداف و توصیه‌های طلایی مشاور
                          </h2>
                          <span className="text-[9.5px] font-bold text-[#C93A00] bg-white px-2 py-0.5 rounded-full border border-[#ffd2bf]">
                            توصیه‌های کلیدی هفته
                          </span>
                        </div>
                        <div className="text-[10.5px] leading-[1.8] text-[#2b2b2b] space-y-0.5 font-medium">
                          {goals.map((g, idx) => (
                            <p key={idx} className="flex items-start gap-1.5">
                              <span className="text-[#FF4F12] font-black mt-0.5">•</span>
                              <span>{g}</span>
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Tracker Table */}
                      <div
                        className="day-card card-avoid-break break-inside-avoid"
                        style={{
                          breakInside: 'avoid',
                          pageBreakInside: 'avoid',
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h2 className="text-[12.5px] font-black text-[#111111] flex items-center gap-1.5 before:content-[''] before:w-1.5 before:h-3.5 before:bg-[#FF4F12] before:rounded-xs">
                            جدول ارزیابی و پیگیری اجرای برنامه
                          </h2>
                          <span className="text-[9.5px] text-neutral-500 font-semibold">تکمیل روزانه توسط دانش‌آموز</span>
                        </div>
                        <table className="w-full border-separate border-spacing-0 border border-[#E8E8E8] rounded-xl overflow-hidden text-center">
                          <thead>
                            <tr className="bg-[#111111] text-white text-[10px] font-bold">
                              <th className="p-1 px-2 text-right font-bold">روز</th>
                              <th className="p-1 px-2 font-bold">انجام شد ✓</th>
                              <th className="p-1 px-2 font-bold">نیمه‌کاره ◐</th>
                              <th className="p-1 px-2 font-bold">انجام نشد ✕</th>
                              <th className="p-1 px-2 text-right font-bold">یادداشت و بررسی علت</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8E8E8] text-[10px]">
                            {days.map((day, idx) => (
                              <tr key={day.id} className={idx % 2 === 1 ? 'bg-[#FCFAF8]' : 'bg-white'}>
                                <td className="p-1 px-2 font-black text-right w-[70px] text-neutral-800">{day.name}</td>
                                <td className="p-1 px-2"><i className="inline-block w-3.5 h-3.5 border-[1.5px] border-[#111111] rounded align-middle"></i></td>
                                <td className="p-1 px-2"><i className="inline-block w-3.5 h-3.5 border-[1.5px] border-[#111111] rounded align-middle"></i></td>
                                <td className="p-1 px-2"><i className="inline-block w-3.5 h-3.5 border-[1.5px] border-[#111111] rounded align-middle"></i></td>
                                <td className="p-1 px-2 w-[38%]"></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Extra Rich Tools if on Dedicated Page (Fills page handsomely and meaningfully) */}
                      {isDedicatedPage && (
                        <>
                          {/* Sleep & Focus Habit Tracker */}
                          <div className="day-card card-avoid-break break-inside-avoid">
                            <div className="flex items-center justify-between mb-1">
                              <h2 className="text-[12px] font-black text-[#111111] flex items-center gap-1.5 before:content-[''] before:w-1.5 before:h-3.5 before:bg-[#FF4F12] before:rounded-xs">
                                جدول پایش کیفیت خواب، تمرکز و مدیریت زمان
                              </h2>
                              <span className="text-[9.5px] text-neutral-500 font-semibold">ثبت عادات مهم تحصیلی</span>
                            </div>
                            <table className="w-full border-separate border-spacing-0 border border-[#E8E8E8] rounded-xl overflow-hidden text-center text-[9.5px]">
                              <thead>
                                <tr className="bg-neutral-800 text-white font-bold">
                                  <th className="p-1 px-2 text-right">روز هفته</th>
                                  <th className="p-1 px-2">ساعت خواب شب</th>
                                  <th className="p-1 px-2">ساعت بیداری</th>
                                  <th className="p-1 px-2">مجموع خواب</th>
                                  <th className="p-1 px-2">زمان استفاده از گوشی</th>
                                  <th className="p-1 px-2">نمره تمرکز (۱ تا ۱۰)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E8E8E8]">
                                {days.map((day, idx) => (
                                  <tr key={day.id} className={idx % 2 === 1 ? 'bg-[#FCFAF8]' : 'bg-white'}>
                                    <td className="p-1 px-2 font-bold text-right text-neutral-800">{day.name}</td>
                                    <td className="p-1 px-2 text-neutral-400">__:__</td>
                                    <td className="p-1 px-2 text-neutral-400">__:__</td>
                                    <td className="p-1 px-2 text-neutral-400">__ ساعت</td>
                                    <td className="p-1 px-2 text-neutral-400">__ دقیقه</td>
                                    <td className="p-1 px-2 text-neutral-400 font-bold">__/۱۰</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Consultant Final Assessment & Signature Box */}
                          <div className="border border-[#ffd2bf] rounded-xl p-2.5 bg-[#FFF9F5] space-y-1.5">
                            <div className="flex items-center justify-between border-b border-[#ffd2bf] pb-1">
                              <span className="text-[11px] font-black text-[#C93A00]">
                                ✍️ ارزیابی هفتگی مشاور و نکات جلسه تحلیلی:
                              </span>
                              <span className="text-[9.5px] font-bold text-neutral-500">
                                امضا و تایید مشاور: ........................
                              </span>
                            </div>
                            <div className="h-[48px] border-b border-dashed border-[#e8d5cc] flex flex-col justify-between py-1">
                              <div className="border-b border-dashed border-[#e8d5cc] h-[20px]"></div>
                              <div className="h-[20px]"></div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );

                  return dynamicPages.map((page, idx) => (
                    <div
                      key={page.pageNumber}
                      ref={(el) => {
                        pageRefs.current[idx] = el;
                      }}
                      style={{ display: activePage === page.pageNumber ? 'flex' : 'none' }}
                      className="print-page flex flex-col h-[297mm] max-h-[297mm] w-[210mm] justify-between bg-white box-border overflow-hidden"
                    >
                      <div className="flex-1 flex flex-col justify-start">
                        {page.isFirstPage ? (
                          <>
                            {renderMainHeader()}
                            <div className="px-[12mm] py-[3.5mm] flex flex-col gap-2">
                              {renderInfoCard()}
                              {renderChartAndStats()}
                              {renderLegendChips()}
                              {page.sections.map(renderDayCard)}
                              {page.hasGoalsAndTracker && renderGoalsAndTracker(page.sections.length === 0)}
                            </div>
                          </>
                        ) : (
                          <>
                            {renderMiniHeader()}
                            <div className="px-[12mm] py-[3.5mm] flex flex-col gap-2">
                              {page.sections.map(renderDayCard)}
                              {page.hasGoalsAndTracker && renderGoalsAndTracker(page.sections.length === 0)}
                            </div>
                          </>
                        )}
                      </div>

                      {renderPageFooter(page.pageNumber, dynamicPages.length)}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

        {/* TAB 2: Visual Plan Builder Studio (Full Interactive Editing for Every Part) */}
        {activeTab === 'builder' && (
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-neutral-200 space-y-6 text-xs">
            {/* Global Datalist for High School Subjects Autocomplete */}
            <datalist id="high-school-subjects-list">
              {ALL_SUBJECTS_LIST.map((subj) => (
                <option key={subj} value={subj} />
              ))}
            </datalist>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-neutral-200 gap-3">
              <div>
                <h2 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#FF4F12]" />
                  <span>سامانه ثبت و ویرایش برنامه درسی دانش‌آموز</span>
                </h2>
                <p className="text-neutral-500 mt-0.5">مشخصات، زمان‌بندی و پارت‌های درسی را وارد کرده و خروجی PDF باکیفیت و بدون باگ A4 دریافت فرمایید.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearFormForNewStudent}
                  className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3 py-2 rounded-xl font-bold border border-neutral-300 transition cursor-pointer"
                  title="پاک کردن فرم برای شروع ثبت برنامه دانش‌آموز جدید"
                >
                  <UserPlus className="w-4 h-4 text-[#FF4F12]" />
                  <span>➕ دانش‌آموز جدید (فرم خالی)</span>
                </button>

                <button
                  type="button"
                  onClick={loadSamplePlan}
                  className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3 py-2 rounded-xl font-bold border border-neutral-300 transition cursor-pointer"
                  title="بارگذاری نمونه کامل برنامه جهت مشاهده یا الگوبرداری"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>📋 بارگذاری نمونه برنامه</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-900 text-white px-3.5 py-2 rounded-xl font-bold shadow transition cursor-pointer"
                  title="مشاهده پیش‌نمایش چاپی برگه فیزیکی A4"
                >
                  <Eye className="w-4 h-4" />
                  <span>پیش‌نمایش A4</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadRealPdf(false)}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-1.5 bg-[#FF4F12] hover:bg-[#C93A00] text-white px-4 py-2 rounded-xl font-bold shadow transition cursor-pointer disabled:opacity-60"
                  title="دانلود فایل PDF واقعی با قطع استاندارد فیزیکی A4"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود PDF واقعی A4</span>
                </button>

                <button
                  type="button"
                  onClick={sendPdfToTelegram}
                  disabled={isSendingTelegram}
                  className="flex items-center gap-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white px-3.5 py-2 rounded-xl font-bold shadow transition cursor-pointer disabled:opacity-60"
                  title="دریافت مستقیم فایل PDF در پی‌وی تلگرام مشاور (@Zetagroupbot)"
                >
                  {isSendingTelegram ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال ارسال مستقیم به تلگرام...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isInTelegram ? '🚀 دریافت مستقیم PDF در پی‌وی تلگرام من' : '🚀 دریافت PDF در تلگرام (@Zetagroupbot)'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Meta Inputs with Shamsi Calendar Picker */}
            <div className="bg-neutral-50/70 p-4 rounded-xl border border-neutral-200 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/80 pb-2.5">
                <h3 className="font-extrabold text-neutral-800 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF4F12]"></span>
                  <span>مشخصات دانش‌آموز، مشاور و بازه زمانی هفته:</span>
                </h3>

                {/* Prominent Shamsi Week Picker Trigger */}
                <button
                  type="button"
                  onClick={() =>
                    setDatePickerState({
                      isOpen: true,
                      mode: 'week',
                      title: 'انتخاب تقویمی بازه برنامه هفتگی (شروع از هر روز دلخواه)',
                    })
                  }
                  className="bg-[#FF4F12] hover:bg-[#e0450f] text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs hover:shadow transition cursor-pointer"
                  title="انتخاب روز شروع برنامه و تنظیم خودکار نام و تاریخ تمام ۷ روز"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>📅 انتخاب تقویمی شروع برنامه (تنظیم خودکار ۷ روز)</span>
                </button>
              </div>

              {/* Calendar Quick Guidance & Active Week Banner */}
              <div className="bg-gradient-to-r from-orange-50 via-white to-amber-50/70 p-2.5 rounded-xl border border-orange-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#FFF1EA] text-[#C93A00] flex items-center justify-center font-black shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-neutral-700 font-bold text-[11.5px]">
                    بازه زمانی فعال برنامه: <b className="text-neutral-900 font-black">{weekRange.start || 'روز شروع'}</b> تا <b className="text-[#C93A00] font-black">{weekRange.end || 'روز پایان'}</b>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] text-neutral-500 hidden sm:inline">
                    برنامه می‌تواند از هر روزی آغاز شود؛ ۷ روز هفته به صورت هوشمند مرتب می‌شوند
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDatePickerState({
                        isOpen: true,
                        mode: 'week',
                        title: 'انتخاب تقویمی تاریخ شروع برنامه هفتگی',
                      })
                    }
                    className="bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                  >
                    <span>تغییر تقویمی بازه</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">نام و نام خانوادگی دانش‌آموز:</label>
                  <input
                    type="text"
                    value={student.name}
                    onChange={(e) => setStudent({ ...student, name: e.target.value })}
                    placeholder="مثال: سارا محمدی"
                    className="w-full bg-white border border-neutral-300 rounded-xl p-2 text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-[#FF4F12] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">پایه تحصیلی:</label>
                  <select
                    value={student.grade}
                    onChange={(e) => setStudent({ ...student, grade: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-xl p-2 text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-[#FF4F12] focus:outline-none cursor-pointer"
                  >
                    <option value="دوازدهم">دوازدهم</option>
                    <option value="یازدهم">یازدهم</option>
                    <option value="دهم">دهم</option>
                    <option value="فارغ‌التحصیل / کنکوری">فارغ‌التحصیل / کنکوری</option>
                    <option value="متوسطه اول">متوسطه اول</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">رشته تحصیلی:</label>
                  <input
                    type="text"
                    value={student.field}
                    onChange={(e) => setStudent({ ...student, field: e.target.value })}
                    placeholder="مثال: علوم تجربی / ریاضی / انسانی"
                    className="w-full bg-white border border-neutral-300 rounded-xl p-2 text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-[#FF4F12] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">هدف دانش‌آموز:</label>
                  <input
                    type="text"
                    value={student.target}
                    onChange={(e) => setStudent({ ...student, target: e.target.value })}
                    placeholder="مثال: رتبه زیر ۵۰۰ کنکور تجربی"
                    className="w-full bg-white border border-neutral-300 rounded-xl p-2 text-xs font-bold text-[#C93A00] focus:ring-2 focus:ring-[#FF4F12] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">نام مشاور تحصیلی:</label>
                  <input
                    type="text"
                    value={advisor.name}
                    onChange={(e) => setAdvisor({ ...advisor, name: e.target.value })}
                    placeholder="مثال: مهدی رضایی"
                    className="w-full bg-white border border-neutral-300 rounded-xl p-2 text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-[#FF4F12] focus:outline-none"
                  />
                </div>

                {/* Week Start with Calendar Icon */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-700">شروع هفته (روز اول):</label>
                    <button
                      type="button"
                      onClick={() =>
                        setDatePickerState({
                          isOpen: true,
                          mode: 'week',
                          targetField: 'start',
                          title: 'انتخاب تاریخ شروع برنامه هفتگی (تنظیم خودکار ۷ روز)',
                        })
                      }
                      className="text-[10.5px] text-[#FF4F12] hover:text-[#C93A00] flex items-center gap-1 font-bold cursor-pointer transition"
                      title="انتخاب تاریخ شروع و محاسبه خودکار روزهای هفته"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>تقویم هوشمند</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={weekRange.start}
                      onChange={(e) => setWeekRange({ ...weekRange, start: e.target.value })}
                      placeholder="مثال: دوشنبه ۱۲ آبان ۱۴۰۵"
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2 pl-8 text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-[#FF4F12] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDatePickerState({
                          isOpen: true,
                          mode: 'week',
                          targetField: 'start',
                          title: 'انتخاب تاریخ شروع برنامه هفتگی (تنظیم خودکار ۷ روز)',
                        })
                      }
                      className="absolute left-2.5 top-2.5 text-neutral-400 hover:text-[#FF4F12] transition cursor-pointer"
                      title="انتخاب تاریخ شروع از تقویم"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Week End with Calendar Icon */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-700">پایان هفته (روز هفتم):</label>
                    <button
                      type="button"
                      onClick={() =>
                        setDatePickerState({
                          isOpen: true,
                          mode: 'single',
                          targetField: 'end',
                          title: 'انتخاب تقویمی تاریخ پایان هفته',
                        })
                      }
                      className="text-[10.5px] text-[#FF4F12] hover:text-[#C93A00] flex items-center gap-1 font-bold cursor-pointer transition"
                      title="انتخاب از تقویم شمسی"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>تقویم</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={weekRange.end}
                      onChange={(e) => setWeekRange({ ...weekRange, end: e.target.value })}
                      placeholder="مثال: یکشنبه ۱۸ آبان ۱۴۰۵"
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2 pl-8 text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-[#FF4F12] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDatePickerState({
                          isOpen: true,
                          mode: 'single',
                          targetField: 'end',
                          title: 'انتخاب تقویمی تاریخ پایان هفته',
                        })
                      }
                      className="absolute left-2.5 top-2.5 text-neutral-400 hover:text-[#FF4F12] transition cursor-pointer"
                      title="انتخاب از تقویم شمسی"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Issue Date with Calendar Icon */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-700">تاریخ صدور / تنظیم:</label>
                    <button
                      type="button"
                      onClick={() =>
                        setDatePickerState({
                          isOpen: true,
                          mode: 'single',
                          targetField: 'createdDate',
                          title: 'انتخاب تقویمی تاریخ صدور برنامه',
                        })
                      }
                      className="text-[10.5px] text-[#FF4F12] hover:text-[#C93A00] flex items-center gap-1 font-bold cursor-pointer transition"
                      title="انتخاب از تقویم شمسی"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>تقویم</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={advisor.createdDate}
                      onChange={(e) => setAdvisor({ ...advisor, createdDate: e.target.value })}
                      placeholder="۱ آبان ۱۴۰۵"
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2 pl-8 text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-[#FF4F12] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDatePickerState({
                          isOpen: true,
                          mode: 'single',
                          targetField: 'createdDate',
                          title: 'انتخاب تقویمی تاریخ صدور برنامه',
                        })
                      }
                      className="absolute left-2.5 top-2.5 text-neutral-400 hover:text-[#FF4F12] transition cursor-pointer"
                      title="انتخاب از تقویم شمسی"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Days Accordion / Block Management */}
            <div className="space-y-4">
              {/* Timing Toggle Card: Set fixed clock hours vs floating/volume study */}
              <div className="bg-gradient-to-r from-orange-50/90 via-white to-amber-50/60 p-4 rounded-2xl border-2 border-orange-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    includeTimings ? 'bg-[#FF4F12] text-white' : 'bg-neutral-800 text-white'
                  }`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-neutral-900">تنظیم شیوه زمان‌بندی پارت‌های مطالعاتی:</span>
                      <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full ${
                        includeTimings
                          ? 'bg-[#FF4F12] text-white shadow-xs'
                          : 'bg-emerald-600 text-white shadow-xs'
                      }`}>
                        {includeTimings ? '⏰ دارای ساعت دقیق (ساعت شروع و پایان)' : '🎯 برنامه حجمی و شناور (بدون ساعت؛ دلخواه دانش‌آموز)'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-1">
                      {includeTimings
                        ? 'برای هر پارت ساعت شروع و پایان ثبت می‌شود و در جدول و برگه PDF قرار می‌گیرد.'
                        : 'نیازی به وارد کردن ساعت نیست؛ دانش‌آموز هر پارت را بر اساس حجم و میزان کشش خود به صورت شناور مطالعه می‌کند.'}
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer select-none bg-white p-2.5 px-4 rounded-xl border-2 border-neutral-300 hover:border-[#FF4F12] transition shadow-xs shrink-0">
                  <input
                    type="checkbox"
                    checked={includeTimings}
                    onChange={(e) => setIncludeTimings(e.target.checked)}
                    className="w-5 h-5 text-[#FF4F12] rounded focus:ring-[#FF4F12] accent-[#FF4F12] cursor-pointer"
                  />
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-black text-neutral-900">
                      {includeTimings ? 'تیک فعال بودن ساعت پارت‌ها' : 'حالت برنامه شناور و حجمی'}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {includeTimings ? 'تیک را بردارید تا ساعت‌ها حذف شوند' : 'تیک بزنید تا ساعت اضافه شود'}
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <h3 className="font-extrabold text-sm text-neutral-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FF4F12]" />
                  <span>برنامه تفکیک‌شده روزهای هفته (ویرایش کامل پارت‌ها، دروس، ساعت و توضیحات)</span>
                </h3>
                <span className="text-neutral-500 text-xs">
                  {includeTimings ? (
                    <>تعداد کل روزها: {days.length} روز · جمع کل مطالعه هفته: <b className="text-[#FF4F12]">{formatHhMmFa(totalMinutes)} ساعت</b></>
                  ) : (
                    <>تعداد کل روزها: {days.length} روز · کل پارت‌های تعیین‌شده: <b className="text-[#FF4F12]">{totalBlocksCount} پارت شناور</b></>
                  )}
                </span>
              </div>

              <div className="space-y-4">
                {days.map((day) => {
                  const dayMins = calculateTotalMinutes(day);
                  const dayH = calculateDayHeight(day);
                  return (
                    <div
                      key={day.id}
                      className="rounded-2xl border-2 border-neutral-200 bg-white shadow-xs overflow-hidden transition"
                    >
                      {/* Day Header Bar */}
                      <div className="bg-neutral-100/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-neutral-900 text-white px-2.5 py-1 rounded-xl shadow-xs">
                            <span className="text-[10px] text-neutral-400 font-bold">روز:</span>
                            <input
                              type="text"
                              value={day.name}
                              onChange={(e) => updateDayName(day.id, e.target.value)}
                              className="font-black text-xs text-white bg-transparent w-20 text-center focus:outline-none focus:ring-1 focus:ring-[#FF4F12] rounded"
                              title="نام روز هفته (برای ویرایش مستقیم کلیک کنید)"
                            />
                          </div>
                          
                          {/* Inline editable date string */}
                          <div className="flex items-center gap-1.5 bg-white border border-neutral-300 rounded-lg px-2 py-0.5 shadow-2xs">
                            <span className="text-[11px] text-neutral-400 font-bold">تاریخ:</span>
                            <input
                              type="text"
                              value={day.dateStr}
                              onChange={(e) => updateDayDateStr(day.id, e.target.value)}
                              placeholder="۲ آبان"
                              className="w-20 text-xs font-bold text-neutral-800 text-center focus:outline-none"
                              title="برای تغییر تاریخ این روز کلیک کنید"
                            />
                          </div>

                          {day.isRest ? (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Coffee className="w-3 h-3 text-amber-700" />
                              <span>روز استراحت</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              {includeTimings ? (
                                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-emerald-700" />
                                  <span>{day.blocks.length} پارت ({formatHhMmFa(dayMins)} ساعت)</span>
                                </span>
                              ) : (
                                <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Layers className="w-3 h-3 text-purple-700" />
                                  <span>{day.blocks.length} پارت (زمان شناور و آزاد)</span>
                                </span>
                              )}
                              <span className="bg-neutral-200/90 text-neutral-700 text-[10px] font-bold px-2 py-0.5 rounded-full" title="محاسبه دقیق ارتفاع کارت جهت استاندارد فیزیکی A4">
                                ارتفاع کارت: {dayH}px
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Toggle Study / Rest */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateDayRestStatus(day.id, !day.isRest)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                              day.isRest
                                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                : 'bg-neutral-200 text-neutral-700 border-neutral-300 hover:bg-neutral-300'
                            }`}
                          >
                            {day.isRest ? (
                              <>
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>تبدیل به روز مطالعه و ثبت پارت</span>
                              </>
                            ) : (
                              <>
                                <Coffee className="w-3.5 h-3.5" />
                                <span>تبدیل به روز استراحت</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Day Content */}
                      <div className="p-4 space-y-3">
                        {day.isRest ? (
                          <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl space-y-2">
                            <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                              <Coffee className="w-4 h-4 text-amber-700" />
                              <span>متن و پیام توصیه روز استراحت برای دانش‌آموز (قابل ویرایش):</span>
                            </label>
                            <textarea
                              rows={2}
                              value={day.restText || ''}
                              onChange={(e) => updateDayRestText(day.id, e.target.value)}
                              placeholder="امروز برنامه درسی نداری. استراحت، تفریح و خواب کافی بخشی از برنامه است..."
                              className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs text-neutral-800 leading-relaxed focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {day.blocks.length === 0 ? (
                              <div className="text-center py-6 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 space-y-2">
                                <BookOpen className="w-7 h-7 text-neutral-300 mx-auto" />
                                <p className="text-xs text-neutral-500 font-bold">هنوز هیچ پارت درسی برای {day.name} ثبت نشده است.</p>
                                <p className="text-[11px] text-neutral-400">روی دکمه زیر کلیک کنید تا پارت اول را اضافه کنید و نام درس و ساعت را بنویسید.</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {day.blocks.map((b, bIdx) => (
                                  <div
                                    key={b.id}
                                    className="bg-neutral-50/60 hover:bg-neutral-50 p-3.5 rounded-xl border border-neutral-300 shadow-2xs space-y-3 transition"
                                  >
                                    {/* Top Row: Type, Number, Actions */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10.5px] font-black">
                                          {bIdx + 1}
                                        </span>

                                        <label className="text-[11px] font-bold text-neutral-600">نوع فعالیت:</label>
                                        <select
                                          value={b.type}
                                          onChange={(e) => updateBlock(day.id, b.id, { type: e.target.value })}
                                          className="bg-white text-neutral-900 border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-1 focus:ring-[#FF4F12] focus:outline-none cursor-pointer shadow-2xs"
                                        >
                                          {ACTIVITY_TYPES.map((t) => (
                                            <option key={t.type} value={t.type}>
                                              {t.title}
                                            </option>
                                          ))}
                                        </select>

                                        <span className="bg-white border border-neutral-200 text-neutral-700 font-bold text-[10.5px] px-2 py-0.5 rounded-md shadow-2xs">
                                          {includeTimings
                                            ? `${b.startTime || '—'} تا ${b.endTime || '—'} (${b.duration || 'مدت زمان'})`
                                            : '⏱️ مطالعه شناور (دلخواه)'}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => duplicateBlockInDay(day.id, b)}
                                          className="text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                                          title="کپی و تکرار این پارت در همین روز"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>کپی پارت</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeBlockFromDay(day.id, b.id)}
                                          className="text-red-600 hover:text-red-800 bg-white hover:bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                                          title="حذف این بخش درسی"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>حذف</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Field Row 1: Subject & Topic */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                      <div className="md:col-span-5 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                          <label className="text-[11px] font-bold text-neutral-700">نام درس:</label>
                                          <span className="text-[10px] text-neutral-400">انتخاب از منو یا تایپ دستی</span>
                                        </div>

                                        <div className="flex gap-1.5">
                                          {/* Dropdown with all categorized high school subjects */}
                                          <select
                                            value={ALL_SUBJECTS_LIST.includes(b.subject) ? b.subject : ''}
                                            onChange={(e) => {
                                              if (e.target.value) {
                                                updateBlock(day.id, b.id, { subject: e.target.value });
                                              }
                                            }}
                                            className="w-1/2 bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-bold text-neutral-900 focus:ring-1 focus:ring-[#FF4F12] focus:outline-none shadow-2xs cursor-pointer"
                                            title="انتخاب سریع درس از میان تمامی دروس تخصصی و عمومی"
                                          >
                                            <option value="">📚 انتخاب درس...</option>
                                            {HIGH_SCHOOL_SUBJECT_GROUPS.map((group) => (
                                              <optgroup key={group.groupName} label={group.groupName}>
                                                {group.subjects.map((subj) => (
                                                  <option key={subj} value={subj}>
                                                    {subj}
                                                  </option>
                                                ))}
                                              </optgroup>
                                            ))}
                                          </select>

                                          {/* Text input with datalist support for typing or customizing */}
                                          <input
                                            type="text"
                                            list="high-school-subjects-list"
                                            value={b.subject}
                                            onChange={(e) => updateBlock(day.id, b.id, { subject: e.target.value })}
                                            placeholder="یا تایپ نام درس..."
                                            className="w-1/2 bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-bold text-neutral-900 focus:ring-1 focus:ring-[#FF4F12] focus:outline-none shadow-2xs"
                                          />
                                        </div>

                                        {/* Quick Subject Chips */}
                                        <div className="flex flex-wrap gap-1 pt-0.5">
                                          {QUICK_SUBJECTS.map((qs) => (
                                            <button
                                              key={qs}
                                              type="button"
                                              onClick={() => updateBlock(day.id, b.id, { subject: qs })}
                                              className={`text-[9.5px] px-1.5 py-0.5 rounded border transition cursor-pointer ${
                                                b.subject === qs
                                                  ? 'bg-[#FF4F12] text-white border-[#FF4F12] font-black'
                                                  : 'bg-white hover:bg-[#FFF1EA] hover:text-[#C93A00] text-neutral-700 border-neutral-200 font-semibold'
                                              }`}
                                            >
                                              {qs}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="md:col-span-7 space-y-1.5">
                                        <label className="text-[11px] font-bold text-neutral-700">مبحث و سرفصل آموزشی:</label>
                                        <input
                                          type="text"
                                          value={b.topic}
                                          onChange={(e) => updateBlock(day.id, b.id, { topic: e.target.value })}
                                          placeholder="مثال: فصل ۲: گوارش و جذب مواد - گفتار ۱ و ۲"
                                          className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 font-medium focus:ring-1 focus:ring-[#FF4F12] focus:outline-none shadow-2xs"
                                        />
                                      </div>
                                    </div>

                                    {/* Field Row 2: Timing, Duration, Extra */}
                                    {includeTimings ? (
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                                        <div className="space-y-1">
                                          <label className="text-[10.5px] font-bold text-neutral-600">ساعت شروع:</label>
                                          <input
                                            type="text"
                                            value={b.startTime}
                                            onChange={(e) => updateBlock(day.id, b.id, { startTime: e.target.value })}
                                            placeholder="۰۸:۰۰"
                                            className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-bold text-center text-neutral-800 focus:ring-1 focus:ring-[#FF4F12] focus:outline-none shadow-2xs"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[10.5px] font-bold text-neutral-600">ساعت پایان:</label>
                                          <input
                                            type="text"
                                            value={b.endTime}
                                            onChange={(e) => updateBlock(day.id, b.id, { endTime: e.target.value })}
                                            placeholder="۰۹:۳۰"
                                            className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-bold text-center text-neutral-800 focus:ring-1 focus:ring-[#FF4F12] focus:outline-none shadow-2xs"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[10.5px] font-bold text-neutral-600">مدت زمان:</label>
                                          <input
                                            type="text"
                                            value={b.duration}
                                            onChange={(e) => updateBlock(day.id, b.id, { duration: e.target.value })}
                                            placeholder="۱ ساعت و ۳۰ دقیقه"
                                            className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-bold text-center text-[#FF4F12] focus:ring-1 focus:ring-[#FF4F12] focus:outline-none shadow-2xs"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[10.5px] font-bold text-neutral-600">حجم کار / تست:</label>
                                          <input
                                            type="text"
                                            value={b.extra || ''}
                                            onChange={(e) => updateBlock(day.id, b.id, { extra: e.target.value })}
                                            placeholder="مثال: ۳۰ تست سراسری"
                                            className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-bold text-center text-neutral-800 focus:ring-1 focus:ring-[#FF4F12] focus:outline-none shadow-2xs"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 items-center">
                                        <div className="md:col-span-6 bg-purple-50/80 border border-purple-200 rounded-lg p-2.5 flex items-center gap-2 text-purple-900">
                                          <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                                          <span className="text-[11px] font-bold leading-relaxed">
                                            پارت شناور: نیازی به قید ساعت نیست؛ دانش‌آموز بر اساس حجم مشخص‌شده هر چقدر خواست مطالعه می‌کند.
                                          </span>
                                        </div>

                                        <div className="md:col-span-4 space-y-1">
                                          <label className="text-[10.5px] font-bold text-neutral-700">حجم کار / تعداد تست یا صفحات:</label>
                                          <input
                                            type="text"
                                            value={b.extra || ''}
                                            onChange={(e) => updateBlock(day.id, b.id, { extra: e.target.value })}
                                            placeholder="مثال: ۳۰ تست سراسری یا ۲۰ صفحه"
                                            className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-bold text-neutral-800 focus:ring-1 focus:ring-[#FF4F12] focus:outline-none shadow-2xs"
                                          />
                                        </div>

                                        <div className="md:col-span-2 space-y-1">
                                          <label className="text-[10.5px] font-bold text-neutral-700">مدت دلخواه (اختیاری):</label>
                                          <input
                                            type="text"
                                            value={b.duration === '۱ ساعت و ۳۰ دقیقه' ? 'شناور' : b.duration}
                                            onChange={(e) => updateBlock(day.id, b.id, { duration: e.target.value })}
                                            placeholder="شناور"
                                            className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-bold text-neutral-800 text-center focus:ring-1 focus:ring-[#FF4F12] focus:outline-none shadow-2xs"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Field Row 3: Advisor Note */}
                                    <div className="space-y-1 pt-1 border-t border-neutral-200">
                                      <label className="text-[10.5px] font-bold text-neutral-700 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF4F12]"></span>
                                        <span>توصیه مشاور برای این پارت (اختیاری - در برگه چاپ می‌شود):</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={b.note || ''}
                                        onChange={(e) => updateBlock(day.id, b.id, { note: e.target.value })}
                                        placeholder="مثال: تست‌ها زمان‌دار باشد و نکات جدول آنزیم‌ها را در دفترچه ثبت کن."
                                        className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs text-neutral-800 focus:ring-1 focus:ring-[#FF4F12] focus:outline-none shadow-2xs font-medium"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Part Button */}
                            <button
                              type="button"
                              onClick={() => addBlockToDay(day.id)}
                              className="w-full py-2.5 border-2 border-dashed border-[#FF4F12] text-[#FF4F12] hover:bg-[#FFF1EA] rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>➕ افزودن بخش درسی جدید به {day.name}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Goals & Consultant Recommendations Editor */}
            <div className="bg-neutral-50/80 p-4 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-neutral-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF4F12]"></span>
                  <span>اهداف و توصیه‌های طلایی مشاور (در صفحه ۳ برگه A4 چاپ می‌شود):</span>
                </h3>
                <button
                  type="button"
                  onClick={addGoal}
                  className="bg-white hover:bg-neutral-100 text-[#FF4F12] border border-[#FF4F12] px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن هدف جدید</span>
                </button>
              </div>

              <div className="space-y-2">
                {goals.map((g, gIdx) => (
                  <div key={gIdx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-neutral-300 shadow-2xs">
                    <span className="font-bold text-neutral-400 text-xs w-5 text-center">{gIdx + 1}.</span>
                    <input
                      type="text"
                      value={g}
                      onChange={(e) => updateGoal(gIdx, e.target.value)}
                      className="flex-1 text-xs text-neutral-800 focus:outline-none font-medium"
                      placeholder="متن توصیه مشاور..."
                    />
                    <button
                      type="button"
                      onClick={() => removeGoal(gIdx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      title="حذف این هدف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Serverless Direct Telegram Bot Integration */}
        {activeTab === 'telegram' && (
          <div className="space-y-6">
            {/* Header Hero Banner */}
            <div className="bg-gradient-to-r from-[#0088cc] via-[#0077b5] to-[#005580] text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>روش ۱۰۰٪ بدون سرور (Serverless)</span>
                  </span>
                  <span className="bg-emerald-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    بدون نیاز به Render یا پایتون
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-black">
                  اتصال مستقیم به ربات تلگرام و ارسال PDF با نام انتخابی شما
                </h1>
                <p className="text-sm text-sky-100 max-w-3xl leading-relaxed">
                  از طریق API رسمی تلگرام، فایل PDF فوق‌العاده باکیفیت و بدون باگ A4 مستقیماً از حافظه همین مرورگر به تلگرام شما یا دانش‌آموزتان ارسال می‌شود؛ بدون اینکه نیاز به نصب پایتون، اجاره سرور یا پرداخت هزینه هاستینگ داشته باشید!
                </p>
              </div>
            </div>

            {/* Main Interactive Controls & Sender Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form & Action */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 space-y-5">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h2 className="font-extrabold text-base text-neutral-900 flex items-center gap-2">
                    <SendHorizontal className="w-5 h-5 text-[#0088cc]" />
                    <span>تنظیمات ربات و ارسال مستقیم به تلگرام</span>
                  </h2>
                  <span className="text-xs text-neutral-500 font-semibold">ذخیره‌سازی امن در مرورگر شما</span>
                </div>

                {/* Pre-configured Bot Status Banner */}
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-emerald-950">ربات رسمی زتا متصل و آماده است</span>
                        <span className="bg-emerald-600 text-white text-[10.5px] font-bold px-2 py-0.5 rounded-full">
                          @{DEFAULT_BOT_USERNAME}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                        توکن ربات به صورت سیستمی تنظیم شده است. هیچ مشاوری نیاز به وارد کردن توکن ندارد و فایل مستقیماً به تلگرام ارسال می‌شود.
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block text-[11px] font-bold bg-white text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl shadow-2xs">
                    آماده ارسال آنی
                  </span>
                </div>

                {/* Step 1: Bot Token (Collapsible or Pre-filled) */}
                <div className="space-y-2 bg-neutral-50/60 p-3.5 rounded-xl border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-neutral-700 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[#0088cc]" />
                      <span>۱. توکن ربات تلگرام (پیش‌فرض تنظیم‌شده):</span>
                    </label>
                    <span className="text-[11px] text-emerald-600 font-bold">✓ تنظیم سیستمی</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={botToken}
                      onChange={(e) => {
                        setBotToken(e.target.value);
                        setBotInfo(null);
                      }}
                      dir="ltr"
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                      className="flex-1 bg-white border border-neutral-300 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-[#0088cc] focus:outline-none"
                    />
                    <button
                      onClick={checkBotToken}
                      disabled={isTestingToken || !botToken.trim()}
                      className="bg-neutral-800 hover:bg-neutral-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isTestingToken ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>تست اتصال</span>
                    </button>
                  </div>
                  {botInfo && botInfo.ok && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>ربات تایید شد: {botInfo.first_name} (@{botInfo.username})</span>
                    </div>
                  )}
                </div>

                {/* Step 2: Chat ID */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-neutral-700 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-[#0088cc]" />
                      <span>۲. شناسه چت مشاور (Chat ID):</span>
                    </label>
                    {isInTelegram && telegramUser && (
                      <span className="text-[11px] text-emerald-600 font-bold">
                        ✓ شناسایی خودکار اکانت مشاور
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      dir="ltr"
                      placeholder="شناسه عددی اکانت تلگرام شما"
                      className="flex-1 bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-[#0088cc] focus:outline-none"
                    />
                    <button
                      onClick={fetchLatestChatId}
                      disabled={isFetchingChatId || !botToken.trim()}
                      className="bg-[#0088cc] hover:bg-[#0077b5] text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 shadow-xs"
                      title="یک پیام یا /start به ربات بفرستید و این دکمه را بزنید تا چت آیدی خودکار دریافت شود"
                    >
                      {isFetchingChatId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>🔍 تشخیص Chat ID</span>
                    </button>
                  </div>
                  {isInTelegram && telegramUser ? (
                    <p className="text-[11px] text-emerald-700 font-medium">
                      🎯 شما با اکانت <b>{telegramUser.firstName || telegramUser.username}</b> (شناسه: <code className="font-mono">{telegramUser.id}</code>) وارد شده‌اید و نیازی به وارد کردن هیچ رمزی ندارید؛ با زدن دریافت PDF، فایل مستقیماً به پی‌وی شما فرستاده می‌شود.
                    </p>
                  ) : (
                    <p className="text-[11px] text-neutral-500 leading-normal">
                      💡 <b>نکته:</b> هر مشاوری که ربات <a href="https://t.me/Zetagroupbot" target="_blank" rel="noopener noreferrer" className="text-[#0088cc] font-bold underline">@Zetagroupbot</a> را در تلگرام باز کند، نیازی به وارد کردن هیچ شناسه‌ای ندارد و برنامه مستقیماً به تلگرام او ارسال می‌شود.
                    </p>
                  )}
                </div>

                {/* Step 3: Custom Filename */}
                <div className="space-y-1.5">
                  <label className="font-bold text-xs text-neutral-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#FF4F12]" />
                    <span>۳. نام فایل ارسالی در تلگرام (به انتخاب مشاور):</span>
                  </label>
                  <input
                    type="text"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    dir="ltr"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-xs font-mono font-bold text-neutral-800 focus:ring-2 focus:ring-[#FF4F12] focus:outline-none"
                    placeholder="برنامه_هفتگی_سارا_محمدی.pdf"
                  />
                  <p className="text-[11px] text-neutral-500">
                    فایل دقیقاً با همین نام انتخابی در تلگرام برای مخاطب دانلود و نمایش داده می‌شود.
                  </p>
                </div>

                {/* Step 4: Caption / Message Text */}
                <div className="space-y-1.5">
                  <label className="font-bold text-xs text-neutral-700">۴. متن همراه فایل در تلگرام (Caption):</label>
                  <textarea
                    rows={3}
                    value={telegramCaption}
                    onChange={(e) => setTelegramCaption(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-xs leading-relaxed focus:ring-2 focus:ring-[#0088cc] focus:outline-none"
                    placeholder="توضیحات و توصیه‌های مشاور همراه فایل..."
                  />
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <button
                    onClick={sendPdfToTelegram}
                    disabled={isSendingTelegram}
                    className="w-full bg-[#0088cc] hover:bg-[#0077b5] text-white py-3 px-4 rounded-xl font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSendingTelegram ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>در حال تولید PDF کریستالی و ارسال مستقیم به تلگرام...</span>
                      </>
                    ) : (
                      <>
                        <SendHorizontal className="w-5 h-5" />
                        <span>🚀 ارسال مستقیم فایل PDF به ربات تلگرام (بدون سرور)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Results / Feedback Message */}
                {telegramSendResult && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-bold border space-y-2.5 ${
                      telegramSendResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {telegramSendResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <span className="leading-relaxed">{telegramSendResult.message}</span>
                    </div>

                    {!telegramSendResult.success && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-200/60">
                        <button
                          type="button"
                          onClick={handleOpenBotInTelegram}
                          className="bg-[#0088cc] hover:bg-[#0077b5] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>📱 شروع مجدد و رفع مسدودی @Zetagroupbot</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadRealPdf(false)}
                          className="bg-[#FF4F12] hover:bg-[#C93A00] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>📥 دانلود مستقیم فایل PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={fetchLatestChatId}
                          disabled={isFetchingChatId}
                          className="bg-neutral-800 hover:bg-neutral-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-60"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>🔍 استخراج خودکار Chat ID من</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Serverless Guides & Mini App Blueprint */}
              <div className="lg:col-span-5 space-y-4">
                {/* Visual Step-by-Step Guide */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200 space-y-3.5 text-xs">
                  <h3 className="font-extrabold text-sm text-neutral-900 flex items-center gap-2 pb-2 border-b border-neutral-100">
                    <HelpCircle className="w-4 h-4 text-[#0088cc]" />
                    <span>راهنمای ۳ مرحله‌ای راه‌اندازی (بدون سرور)</span>
                  </h3>

                  <div className="space-y-3">
                    <div className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#0088cc] text-white flex items-center justify-center font-bold text-xs shrink-0">۱</span>
                      <div className="space-y-0.5">
                        <b className="text-neutral-800">ساخت ربات در BotFather:</b>
                        <p className="text-neutral-600 leading-relaxed">
                          در تلگرام وارد <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-[#0088cc] font-bold underline">@BotFather</a> شوید، دستور <code className="bg-neutral-100 px-1 py-0.5 rounded text-[11px]">/newbot</code> را بفرستید و پس از انتخاب نام، <b>Token</b> دریافتی را در کادر بالا قرار دهید.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#0088cc] text-white flex items-center justify-center font-bold text-xs shrink-0">۲</span>
                      <div className="space-y-0.5">
                        <b className="text-neutral-800">شروع چت با رباتتان:</b>
                        <p className="text-neutral-600 leading-relaxed">
                          وارد ربات خود شوید و دکمه <b>Start</b> یا هر پیامی را ارسال کنید. سپس دکمه <b>«تشخیص خودکار Chat ID»</b> در فرم را لمس فرمایید.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#0088cc] text-white flex items-center justify-center font-bold text-xs shrink-0">۳</span>
                      <div className="space-y-0.5">
                        <b className="text-neutral-800">ارسال و تحویل فوری فایل:</b>
                        <p className="text-neutral-600 leading-relaxed">
                          دکمه آبی <b>ارسال به تلگرام</b> را بزنید. مرورگر در همان لحظه PDF استاندارد A4 را می‌سازد و فایل کامل ۳ صفحه‌ای را به چت تلگرام شما تحویل می‌دهد.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 403 Error Fix & Iranian Anti-Sanction Bypass Guide */}
                <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 text-white rounded-2xl p-5 shadow-sm space-y-4 text-xs border border-neutral-700">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-700">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#FF4F12]" />
                      <span className="font-extrabold text-sm text-white">حل خطای ۴۰۳ بدون فیلترشکن برای مشاوران داخل ایران</span>
                    </div>
                    <span className="bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      تضمینی و دائمی
                    </span>
                  </div>

                  {/* Root Cause Explanation */}
                  <div className="bg-neutral-800/80 border border-neutral-700 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>علت بروز خطای ۴۰۳ (Forbidden) بدون فیلترشکن چیست؟</span>
                    </div>
                    <p className="text-[11.5px] text-neutral-300 leading-relaxed">
                      سرورهای <b>Google Cloud Run</b> به دلیل تحریم‌های تجاری شرکت گوگل، ارتباط مستقیم از IPهای داخل ایران (همراه اول، ایرانسل، شاتل و...) را در لبه شبکه مسدود می‌کنند. به همین دلیل وقتی فیلترشکن روشن است کار می‌کند، ولی بدون فیلترشکن خطای ۴۰۳ نمایش داده می‌شود.
                    </p>
                  </div>

                  {/* Solution: Free Cloudflare Worker Reverse Proxy */}
                  <div className="bg-gradient-to-r from-[#FF4F12]/15 to-orange-500/5 border border-[#FF4F12]/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-white font-extrabold text-xs">
                        <Zap className="w-4 h-4 text-[#FF4F12]" />
                        <span>راهکار: پروکسی معکوس رایگان کلادفلر (Cloudflare Worker)</span>
                      </div>
                      <span className="text-[10px] bg-neutral-950 px-2 py-0.5 rounded text-neutral-300 font-mono">رایگان و بدون سرور</span>
                    </div>

                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      سایت <b>Cloudflare</b> در ایران بدون فیلترشکن باز است و هیچ تحریمی روی ایران ندارد. کلادفلر ترافیک مینی‌اپ را در ایران تحویل می‌گیرد و از سرورهای اروپایی خود به سرور ارسال می‌کند؛ بنابراین گوگل آی‌پی اروپا را دیده و <b>هرگز ارور ۴۰۳ نمی‌دهد</b>.
                    </p>

                    {/* Step-by-Step Tutorial */}
                    <div className="space-y-2 text-[11px] text-neutral-300 pt-1">
                      <div className="flex gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#FF4F12] text-white flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">۱</span>
                        <span>وارد سایت رایگان <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-[#54c7fc] font-bold underline">dash.cloudflare.com</a> شوید و از منوی سمت چپ روی <b>Workers & Pages</b> و سپس <b>Create application</b> کلیک کنید.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#FF4F12] text-white flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">۲</span>
                        <span>گزینه <b>Create Worker</b> را بزنید، روی <b>Deploy</b> کلیک کرده و سپس <b>Edit code</b> را بزنید.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#FF4F12] text-white flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">۳</span>
                        <span>کد موجود را پاک کرده و کد آماده زیر را داخل آن بچسبانید و دکمه <b>Deploy</b> را بزنید:</span>
                      </div>
                    </div>

                    {/* Ready-to-copy Worker Code Block */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="text-neutral-400 font-medium">کد آماده جاوااسکریپت Cloudflare Worker:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const workerCode = `export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    // 1. Telegram API Reverse Proxy (بدون نیاز به وی‌پی‌ان در ایران)
    if (url.pathname.startsWith('/tg/') || url.pathname.startsWith('/bot')) {
      const tgPath = url.pathname.startsWith('/tg/') ? url.pathname.slice(4) : url.pathname.slice(1);
      const tgUrl = \`https://api.telegram.org/\${tgPath}\${url.search}\`;

      const forwardHeaders = new Headers();
      for (const [key, value] of request.headers.entries()) {
        const l = key.toLowerCase();
        if (l !== 'host' && l !== 'content-length' && !l.startsWith('cf-')) {
          forwardHeaders.set(key, value);
        }
      }

      const tgResp = await fetch(tgUrl, {
        method: request.method,
        headers: forwardHeaders,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });

      const respHeaders = new Headers(tgResp.headers);
      respHeaders.set('Access-Control-Allow-Origin', '*');
      respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      respHeaders.set('Access-Control-Allow-Headers', '*');

      return new Response(tgResp.body, { status: tgResp.status, headers: respHeaders });
    }

    // 2. Static Assets or Proxy Frontend
    const destination = new URL("${publicAppUrl}");
    url.hostname = destination.hostname;
    url.protocol = destination.protocol;
    url.port = destination.port;

    const modifiedRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: "follow"
    });

    return fetch(modifiedRequest);
  }
};`;
                            navigator.clipboard.writeText(workerCode);
                            setCopiedWorkerCode(true);
                            setTimeout(() => setCopiedWorkerCode(false), 3000);
                          }}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white px-2.5 py-1 rounded text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition border border-neutral-600"
                        >
                          {copiedWorkerCode ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedWorkerCode ? 'کد کپی شد!' : 'کپی آسان کد'}</span>
                        </button>
                      </div>

                      <pre className="bg-neutral-950 p-2.5 rounded-lg font-mono text-[10.5px] text-emerald-400 overflow-x-auto border border-neutral-800 max-h-48" dir="ltr">
{`export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 1. CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    // 2. Telegram API Proxy (بدون فیلترشکن در ایران)
    if (url.pathname.startsWith('/tg/') || url.pathname.startsWith('/bot')) {
      const tgPath = url.pathname.startsWith('/tg/') ? url.pathname.slice(4) : url.pathname.slice(1);
      const tgUrl = \`https://api.telegram.org/\${tgPath}\${url.search}\`;

      const headers = new Headers();
      for (const [k, v] of request.headers.entries()) {
        const l = k.toLowerCase();
        if (l !== 'host' && l !== 'content-length' && !l.startsWith('cf-')) {
          headers.set(k, v);
        }
      }

      const tgResp = await fetch(tgUrl, {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });

      const respHeaders = new Headers(tgResp.headers);
      respHeaders.set('Access-Control-Allow-Origin', '*');
      respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      respHeaders.set('Access-Control-Allow-Headers', '*');

      return new Response(tgResp.body, { status: tgResp.status, headers: respHeaders });
    }

    // 3. Proxy Frontend
    const destination = new URL("${publicAppUrl}");
    url.hostname = destination.hostname;
    url.protocol = destination.protocol;
    url.port = destination.port;

    const modifiedRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: "follow"
    });

    return fetch(modifiedRequest);
  }
};`}
                      </pre>
                    </div>
                  </div>

                  {/* Automated Bot Menu URL Updater */}
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-white">⚡ ثبت خودکار آدرس بدون تحریم در ربات تلگرام:</span>
                      <span className="text-[10px] text-neutral-400">بدون نیاز به رفتن به BotFather</span>
                    </div>

                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      پس از ساخت Worker، آدرس لینک آن (مثلاً <code className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300 font-mono">https://zeta-bot.YOUR_NAME.workers.dev</code>) یا دامنه اختصاصی خود را در کادر زیر وارد کنید و دکمه را بزنید تا دکمه ربات فوراً به‌روز شود:
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={bypassWorkerUrl}
                        onChange={(e) => setBypassWorkerUrl(e.target.value)}
                        placeholder="https://zeta-bot.YOUR_ACCOUNT.workers.dev"
                        className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 placeholder:text-neutral-500 focus:ring-1 focus:ring-[#FF4F12] focus:outline-none"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        disabled={isUpdatingMenuUrl}
                        onClick={() => handleUpdateBotMenuUrl(bypassWorkerUrl)}
                        className="bg-[#FF4F12] hover:bg-[#e0450f] disabled:bg-neutral-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shrink-0"
                      >
                        {isUpdatingMenuUrl ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>در حال ثبت...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ثبت در ربات تلگرام</span>
                          </>
                        )}
                      </button>
                    </div>

                    {updateUrlResult && (
                      <div
                        className={`p-2.5 rounded-lg text-[11px] font-bold border ${
                          updateUrlResult.success
                            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                            : 'bg-red-950/60 border-red-500/50 text-red-300'
                        }`}
                      >
                        {updateUrlResult.message}
                      </div>
                    )}
                  </div>

                  {/* Alternative 2: Custom Institute Domain */}
                  <div className="border-t border-neutral-800 pt-3 space-y-1.5 text-[11px] text-neutral-400">
                    <b className="text-neutral-200">روش دوم (دامنه اختصاصی موسسه زتا):</b>
                    <p className="leading-relaxed">
                      اگر موسسه زتا دارای دامنه اینترنتی (مثل <code className="text-amber-300">zetagroup.ir</code> یا <code className="text-amber-300">.com</code>) است، می‌توانید یک ساب‌دامین مثل <code className="text-emerald-300">app.zetagroup.ir</code> را در کلادفلر یا ابرآروان تعریف کرده و CNAME آن را به آدرس این اپلیکیشن متصل فرمایید. در این حالت نیز بدون نیاز به فیلترشکن، برنامه با دامنه برند زتا لود خواهد شد.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Shamsi / Persian Date Picker Modal */}
      <PersianDatePickerModal
        isOpen={datePickerState.isOpen}
        onClose={() => setDatePickerState((prev) => ({ ...prev, isOpen: false }))}
        title={datePickerState.title}
        mode={datePickerState.mode}
        targetField={datePickerState.targetField}
        onSelectDate={handleSelectSingleDate}
        onSelectWeek={handleSelectPersianWeek}
      />
    </div>
  );
}

// Bot Simulator Component
function BotSimulator() {
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; buttons?: string[] }>>([
    {
      sender: 'bot',
      text: '✨ **موسسه آموزشی زتا | Zeta**\nسامانه هوشمند تنظیم برنامه هفتگی دانش‌آموزان\n\nسلام مشاور گرامی، خوش آمدید.\nجهت شروع و تنظیم برنامه جدید برای دانش‌آموز، دکمه زیر را لمس فرمایید:',
      buttons: ['➕ ثبت برنامه جدید', '📖 راهنمای سریع'],
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [step, setStep] = useState(0);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const newMsgs = [...messages, { sender: 'user' as const, text }];
    setInputVal('');

    setTimeout(() => {
      if (text.includes('ثبت برنامه هفتگی جدید') || text.includes('ثبت برنامه جدید') || step === 0) {
        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: '📋 **مرحله ۱ از ۶: مشخصات مشاور تحصیلی**\n\nلطفاً **نام و نام خانوادگی خودتان (مشاور)** را ارسال فرمایید تا در سربرگ PDF چاپ شود:\n(یا نام خود را تایپ نمایید)',
            buttons: ['مشاور تحصیلی'],
          },
        ]);
        setStep(1);
      } else if (step === 1) {
        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: '👤 **مرحله ۲ از ۶: مشخصات دانش‌آموز**\nلطفاً **نام و نام خانوادگی دانش‌آموز** را ارسال فرمایید:\n(مثال: سارا محمدی)',
          },
        ]);
        setStep(2);
      } else if (step === 2) {
        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: `✅ دانش‌آموز: **${text}**\n\n📚 لطفاً **پایه تحصیلی** دانش‌آموز را انتخاب فرمایید:`,
            buttons: ['دوازدهم', 'یازدهم', 'دهم', 'فارغ‌التحصیل'],
          },
        ]);
        setStep(3);
      } else if (step === 3) {
        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: `✅ پایه: **${text}**\n\n🔬 لطفاً **رشته تحصیلی** دانش‌آموز را انتخاب نمایید:`,
            buttons: ['تجربی', 'ریاضی', 'انسانی', 'سایر'],
          },
        ]);
        setStep(4);
      } else if (step === 4) {
        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: `✅ رشته: **${text}**\n\n🎯 **هدف دانش‌آموز** را وارد فرمایید:\n(مثال: رتبه زیر ۵۰۰ کنکور تجربی)`,
          },
        ]);
        setStep(5);
      } else if (step === 5) {
        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: `📅 **مرحله ۳ از ۶: بازه زمانی هفته**\n\nلطفاً **تاریخ شروع هفته (روز شنبه)** را وارد فرمایید:\n(مثال: 1405/08/02)`,
            buttons: ['1405/08/02'],
          },
        ]);
        setStep(6);
      } else if (step === 6) {
        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: `📊 پیشرفت ثبت روزها: [🟩⬜⬜⬜⬜⬜⬜] روز ۱ از ۷\n📅 **شنبه (۲ آبان)**\n\nبرای این روز کدام گزینه را انتخاب می‌فرمایید؟`,
            buttons: ['➕ افزودن بخش درسی (Block)', '☕ ثبت به عنوان روز استراحت'],
          },
        ]);
        setStep(7);
      } else if (step === 7) {
        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: `📌 **بخش درسی برای شنبه**\nلطفاً **نوع فعالیت** را انتخاب نمایید:`,
            buttons: ['📖 مطالعه', '🔄 مرور', '✍️ تست‌زنی', '🎥 ویدیو / کلاس', '📝 آزمون', '🎯 جمع‌بندی', '🔍 رفع اشکال'],
          },
        ]);
        setStep(8);
      } else if (step === 8) {
        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: `نوع فعالیت: **${text}** ✅\nلطفاً **درس مربوطه** را انتخاب فرمایید:`,
            buttons: ['زیست‌شناسی', 'ریاضی', 'فیزیک', 'شیمی', 'ادبیات فارسی', '✏️ سایر درس‌ها'],
          },
        ]);
        setStep(9);
      } else if (step === 9) {
        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: `درس: **${text}** ✅\nلطفاً **مبحث یا فصل** را وارد فرمایید:\n(مثال: گوارش و جذب مواد / حد و پیوستگی)`,
          },
        ]);
        setStep(10);
      } else if (step === 10) {
        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: `مبحث: **${text}** ✅\n⏰ **ساعت شروع و پایان** این بخش را انتخاب فرمایید یا تایپ کنید:`,
            buttons: [
              '🌅 ۰۸:۰۰ تا ۰۹:۳۰',
              '☀️ ۰۹:۴۵ تا ۱۱:۱۵',
              '🌤 ۱۱:۳۰ تا ۱۳:۰۰',
              '☕ ۱۶:۰۰ تا ۱۷:۳۰',
              '🌆 ۱۸:۰۰ تا ۱۹:۳۰',
              '✏️ تایپ ساعت دلخواه',
            ],
          },
        ]);
        setStep(11);
      } else if (step === 11) {
        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: `زمان: **۰۸:۰۰ تا ۰۹:۳۰** (۱ ساعت و ۳۰ دقیقه) ✅\n\n📊 **تعداد تست یا تعداد صفحه/جلسه** (اختیاری):`,
            buttons: ['۲۰ تست', '۳۰ تست', '۴۰ تست', '۱۵ صفحه', '۲۰ صفحه', 'رد کردن (اختیاری) ⏭'],
          },
        ]);
        setStep(12);
      } else if (step === 12) {
        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: `📄 **مرحله نهایی: تعیین نام فایل PDF توسط مشاور**\n\nنام پیشنهادی سامانه:\n\`برنامه_هفتگی_دانش_آموز.pdf\`\n\n• اگر همین نام مورد تایید شماست، دکمه **«تایید با نام پیشنهادی»** را لمس فرمایید،\n• یا **نام دلخواه خود را تایپ و ارسال کنید**:\n(مثال: \`برنامه_هفتگی_کنکور\` یا \`Zeta_Weekly_Plan.pdf\`)`,
            buttons: ['✅ تایید با نام پیشنهادی', 'برنامه_هفتگی_کنکور.pdf', 'Zeta_Weekly_Plan.pdf'],
          },
        ]);
        setStep(13);
      } else {
        const chosen = text.includes('تایید')
          ? 'برنامه_هفتگی_دانش_آموز.pdf'
          : text.toLowerCase().endsWith('.pdf')
          ? text
          : `${text}.pdf`;

        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: `🎉 **برنامه هفتگی با نام انتخابی شما آماده و صادر شد!**\n\n📄 نام فایل: **${chosen}**\nقطع سند: **استاندارد واقعی A4**\n\nفایل PDF به چت تلگرام شما ارسال شد. همچنین در تب «طرح اصلی A4 و دانلود PDF» می‌توانید همین حالا فایل PDF واقعی را دانلود فرمایید.`,
            buttons: ['📋 ثبت دانش‌آموز بعدی', '🔄 ویرایش همین برنامه'],
          },
        ]);
      }
    }, 350);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col h-[650px]">
      {/* Simulator Header */}
      <div className="bg-[#242f3d] text-white p-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 shadow">
            <img
              src={zetaLogo}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
              alt="Bot"
              className="max-w-full max-h-full"
            />
          </div>
          <div>
            <div className="font-bold text-sm">Zeta Weekly Plan Bot</div>
            <div className="text-[11px] text-green-400">آنلاین | آماده صدور PDF مستقیم</div>
          </div>
        </div>
        <button
          onClick={() => {
            setStep(0);
            setMessages([
              {
                sender: 'bot',
                text: 'سلام مشاور گرامی، به ربات هوشمند برنامه‌ریزی هفتگی **Zeta | زتا** خوش آمدید! 🌟\n\nبرای شروع ثبت برنامه هفتگی دانش‌آموز خود، دکمه زیر را لمس فرمایید:',
                buttons: ['📋 ثبت برنامه هفتگی جدید', 'ℹ️ راهنمای کار با ربات'],
              },
            ]);
          }}
          className="flex items-center gap-1 text-xs bg-neutral-700/60 hover:bg-neutral-700 px-2.5 py-1 rounded-lg transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>شروع مجدد</span>
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0e1621]/5 text-xs">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[85%] p-3 rounded-2xl shadow-sm whitespace-pre-wrap leading-relaxed ${
                m.sender === 'user' ? 'bg-[#FF4F12] text-white rounded-br-xs' : 'bg-white text-neutral-800 border border-neutral-200 rounded-bl-xs'
              }`}
            >
              {m.text}
            </div>

            {/* Inline Buttons */}
            {m.buttons && m.buttons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                {m.buttons.map((btn, bIdx) => (
                  <button
                    key={bIdx}
                    onClick={() => handleSend(btn)}
                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 font-semibold px-3 py-1.5 rounded-xl text-xs transition shadow-xs"
                  >
                    {btn}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(inputVal)}
          placeholder="پیام یا ورودی خود را بنویسید..."
          className="flex-1 bg-neutral-100 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF4F12]"
        />
        <button
          onClick={() => handleSend(inputVal)}
          className="bg-[#FF4F12] hover:bg-[#C93A00] text-white p-2 rounded-xl transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Deploy Guide Component
function DeployGuide() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 space-y-6 text-xs text-neutral-800 leading-relaxed">
      <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
        <div className="w-10 h-10 rounded-xl bg-[#FFF1EA] text-[#FF4F12] flex items-center justify-center">
          <Rocket className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-neutral-900">راهنمای استقرار (Deploy) ربات روی پلن رایگان Render با Docker</h2>
          <p className="text-neutral-500">مراحل گام‌به‌گام اتصال وب‌هوک، تنظیمات امنیتی مشاوران و راه‌اندازی UptimeRobot</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-neutral-900">
            <span className="w-5 h-5 rounded-full bg-[#FF4F12] text-white flex items-center justify-center text-[11px]">۱</span>
            <span>دریافت توکن از BotFather</span>
          </div>
          <p className="text-neutral-600">
            در تلگرام به <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800">@BotFather</code> پیام دهید، دستور <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800">/newbot</code> را بفرستید و توکن API را کپی کنید.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-neutral-900">
            <span className="w-5 h-5 rounded-full bg-[#FF4F12] text-white flex items-center justify-center text-[11px]">۲</span>
            <span>شناسایی آیدی عددی مشاوران</span>
          </div>
          <p className="text-neutral-600">
            هر مشاور به ربات <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800">@userinfobot</code> پیام می‌دهد تا آیدی عددی خود را بگیرد. این آیدی‌ها در <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800">ALLOWED_IDS</code> قرار می‌گیرند.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-neutral-900">
            <span className="w-5 h-5 rounded-full bg-[#FF4F12] text-white flex items-center justify-center text-[11px]">۳</span>
            <span>ساخت Web Service در Render</span>
          </div>
          <p className="text-neutral-600">
            در Render روی <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800">New +</code> و سپس <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800">Web Service</code> کلیک کرده، ریپازیتوری را متصل و محیط را روی <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800">Docker</code> بگذارید.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-neutral-900">
            <span className="w-5 h-5 rounded-full bg-[#FF4F12] text-white flex items-center justify-center text-[11px]">۴</span>
            <span>تنظیم UptimeRobot روی /health</span>
          </div>
          <p className="text-neutral-600">
            در سایت UptimeRobot یک مانیتور از نوع HTTP با آدرس <code className="bg-neutral-200 px-1 py-0.5 rounded text-neutral-800">https://your-app.onrender.com/health</code> روی فاصله ۵ دقیقه ایجاد کنید تا سرور هرگز به خواب نرود.
          </p>
        </div>
      </div>

      <div className="bg-neutral-900 text-neutral-200 p-4 rounded-xl font-mono text-xs space-y-2" dir="ltr">
        <div className="text-neutral-400 font-bold mb-1"># Render Environment Variables Checklist:</div>
        <div>BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ</div>
        <div>WEBHOOK_URL=https://zeta-bot.onrender.com</div>
        <div>ALLOWED_IDS=123456789,987654321</div>
        <div>PORT=10000</div>
      </div>
    </div>
  );
}

// Helper to provide code content in Tab 4
function getFileContent(file: string): string {
  switch (file) {
    case 'bot.py':
      return `# Zeta Telegram Bot - Webhook & Health Server (aiohttp)
from aiohttp import web
from telegram import Update
from telegram.ext import ApplicationBuilder
import config
from handlers import plan_conversation, start

bot_app = ApplicationBuilder().token(config.BOT_TOKEN).build()
bot_app.add_handler(plan_conversation.get_plan_conversation_handler())
bot_app.add_handler(CommandHandler("start", start.start_command))

async def health_check_handler(request):
    return web.json_response({"status": "healthy", "service": "Zeta Bot"})

async def telegram_webhook_handler(request):
    data = await request.json()
    update = Update.de_json(data, bot_app.bot)
    await bot_app.update_queue.put(update)
    return web.Response(text="OK")`;

    case 'config.py':
      return `# Zeta Configuration Module
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
WEBHOOK_URL = os.getenv("WEBHOOK_URL", "").strip().rstrip("/")
PORT = int(os.getenv("PORT", "10000"))
ALLOWED_IDS = {int(x) for x in os.getenv("ALLOWED_IDS", "").split(",") if x.strip().isdigit()}`;

    case 'pdf_builder.py':
      return `# PDF Builder with WeasyPrint & Jinja2
import weasyprint
from jinja2 import Environment, FileSystemLoader

def build_pdf_bytes(plan_data: dict) -> bytes:
    html_content = render_html_template(plan_data)
    html = weasyprint.HTML(string=html_content, base_url=str(config.BASE_DIR))
    return html.write_pdf(presentational_hints=True)`;

    case 'Dockerfile':
      return `FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends \\
    libpango-1.0-0 libcairo2 libgdk-pixbuf-2.0-0 libffi-dev shared-mime-info fonts-liberation \\
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 10000
CMD ["python", "bot.py"]`;

    case 'requirements.txt':
      return `python-telegram-bot[webhooks]==21.10
aiohttp==3.11.13
weasyprint==64.0
jinja2==3.1.5
jdatetime==5.2.0`;

    default:
      return `# File: ${file}\n# Refer to project root for full implementation.`;
  }
}
