// Comprehensive Shamsi (Solar Hijri / Jalali) Calendar Utilities
// 100% pure TypeScript, zero external dependencies

export interface JalaliDate {
  year: number;  // e.g. 1403, 1404, 1405
  month: number; // 1 to 12
  day: number;   // 1 to 31
}

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const PERSIAN_DAY_NAMES = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
];

export const PERSIAN_WEEK_DAYS = [
  { short: 'ش', full: 'شنبه' },
  { short: 'ی', full: 'یکشنبه' },
  { short: 'د', full: 'دوشنبه' },
  { short: 'س', full: 'سه‌شنبه' },
  { short: 'چ', full: 'چهارشنبه' },
  { short: 'پ', full: 'پنجشنبه' },
  { short: 'ج', full: 'جمعه' },
];

export const PERSIAN_SEASONS = [
  { name: 'بهار', months: [1, 2, 3] },
  { name: 'تابستان', months: [4, 5, 6] },
  { name: 'پاییز', months: [7, 8, 9] },
  { name: 'زمستان', months: [10, 11, 12] },
];

/**
 * تبدیل اعداد انگلیسی به فارسی
 */
export function toPersianDigits(n: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/\d/g, (c) => persianDigits[Number(c)]);
}

/**
 * تبدیل اعداد فارسی به انگلیسی
 */
export function toEnglishDigits(str: string): string {
  const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[۰-۹]/g, (c) => String(fa.indexOf(c)));
}

/**
 * تبدیل تاریخ میلادی به شمسی با الگوریتم دقیق بورکوفسکی
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { year: jy, month: jm, day: jd };
}

/**
 * تبدیل تاریخ شمسی به میلادی
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const sal_a = [0, 31, 62, 93, 124, 155, 186, 216, 246, 276, 306, 336];
  const jy2 = jy - 979;
  let days = 365 * jy2 + Math.floor(jy2 / 33) * 8 + Math.floor(((jy2 % 33) + 3) / 4) + 78 + jd + sal_a[jm - 1];
  let gy = 1600 + 400 * Math.floor(days / 146097);
  days %= 146097;
  let leap = true;
  if (days >= 36525) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days++;
    else leap = false;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days >= 366) {
    leap = false;
    days--;
    gy += Math.floor(days / 365);
    days %= 365;
  }
  const g_d_m = [0, 31, (leap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 12 && days >= g_d_m[gm + 1]) {
    days -= g_d_m[gm + 1];
    gm++;
  }
  const gd = days + 1;
  return new Date(gy, gm, gd, 12, 0, 0);
}

/**
 * تعداد روزهای ماه شمسی
 */
export function getJalaliMonthDays(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // بررسی سال کبیسه
  const isLeap = ((jy - (jy > 0 ? 474 : 473)) % 2820 + 474 + 38) * 682 % 2816 < 682;
  return isLeap ? 30 : 29;
}

/**
 * روز شروع ماه در هفته (۰ = شنبه، ۱ = یکشنبه، ... ۶ = جمعه)
 */
export function getJalaliFirstDayOfWeek(jy: number, jm: number): number {
  const gDate = jalaliToGregorian(jy, jm, 1);
  const gDay = gDate.getDay(); // 0 is Sunday, 6 is Saturday
  return (gDay + 1) % 7;
}

/**
 * دریافت تاریخ امروز شمسی
 */
export function getTodayJalali(): JalaliDate {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * نام روز هفته یک تاریخ شمسی
 */
export function getJalaliDayOfWeekName(d: JalaliDate): string {
  const gDate = jalaliToGregorian(d.year, d.month, d.day);
  const gDay = gDate.getDay();
  const pDayIndex = (gDay + 1) % 7;
  return PERSIAN_DAY_NAMES[pDayIndex];
}

/**
 * قالب‌بندی تاریخ شمسی
 */
export function formatJalali(
  d: JalaliDate,
  format: 'fullWithDay' | 'full' | 'short' | 'dayAndMonth' = 'full'
): string {
  const dayName = getJalaliDayOfWeekName(d);
  const monthName = PERSIAN_MONTH_NAMES[d.month - 1];
  const dayFa = toPersianDigits(d.day);
  const yearFa = toPersianDigits(d.year);

  switch (format) {
    case 'fullWithDay':
      return `${dayName} ${dayFa} ${monthName} ${yearFa}`;
    case 'dayAndMonth':
      return `${dayFa} ${monthName}`;
    case 'short':
      return `${yearFa}/${toPersianDigits(String(d.month).padStart(2, '0'))}/${toPersianDigits(String(d.day).padStart(2, '0'))}`;
    case 'full':
    default:
      return `${dayFa} ${monthName} ${yearFa}`;
  }
}

export interface PersianWeekInfo {
  startStr: string; // e.g. "دوشنبه ۱۲ آبان ۱۴۰۵"
  endStr: string;   // e.g. "یکشنبه ۱۸ آبان ۱۴۰۵"
  startDate: JalaliDate;
  endDate: JalaliDate;
  weekDays: Array<{
    dayIndex: number; // 0 to 6
    name: string;     // نام روز هفته (مثلا "دوشنبه", "سه‌شنبه", ...)
    dateStr: string;  // "۱۲ آبان"
    fullStr: string;  // "دوشنبه ۱۲ آبان ۱۴۰۵"
    jalali: JalaliDate;
  }>;
}

/**
 * بر اساس تاریخ شروع دلخواه مشاور، برنامه ۷ روزه را محاسبه می‌کند:
 * از همان روز انتخاب شده شروع شده و به مدت ۷ روز متوالی ادامه می‌یابد
 * (مثلاً از دوشنبه تا یکشنبه یا از چهارشنبه تا سه‌شنبه)
 */
export function get7DaysPlanFromStartDate(startDate: JalaliDate): PersianWeekInfo {
  const gDate = jalaliToGregorian(startDate.year, startDate.month, startDate.day);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const targetGDate = new Date(gDate.getTime() + i * 86400000);
    const targetJ = gregorianToJalali(
      targetGDate.getFullYear(),
      targetGDate.getMonth() + 1,
      targetGDate.getDate()
    );
    const dayName = getJalaliDayOfWeekName(targetJ);
    const monthName = PERSIAN_MONTH_NAMES[targetJ.month - 1];
    const dayFa = toPersianDigits(targetJ.day);
    const yearFa = toPersianDigits(targetJ.year);

    weekDays.push({
      dayIndex: i,
      name: dayName,
      dateStr: `${dayFa} ${monthName}`,
      fullStr: `${dayName} ${dayFa} ${monthName} ${yearFa}`,
      jalali: targetJ,
    });
  }

  return {
    startStr: weekDays[0].fullStr,
    endStr: weekDays[6].fullStr,
    startDate: weekDays[0].jalali,
    endDate: weekDays[6].jalali,
    weekDays,
  };
}

/**
 * دریافت بازه هفته شمسی:
 * در صورت customStart = true، برنامه از همان تاریخ انتخابی شروع می‌شود
 * در صورت customStart = false، هفته به شنبه تا جمعه قفل می‌شود
 */
export function getWeekRangeFromJalali(
  selected: JalaliDate,
  rangeType: 'fromSelected' | 'saturdayToFriday' = 'fromSelected'
): PersianWeekInfo {
  if (rangeType === 'fromSelected') {
    return get7DaysPlanFromStartDate(selected);
  }

  // saturdayToFriday mode
  const gDate = jalaliToGregorian(selected.year, selected.month, selected.day);
  const jsDay = gDate.getDay(); // 0 is Sunday, 6 is Saturday
  const pDayIndex = (jsDay + 1) % 7; // 0 = شنبه, ..., 6 = جمعه

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const diffDays = i - pDayIndex;
    const targetGDate = new Date(gDate.getTime() + diffDays * 86400000);
    const targetJ = gregorianToJalali(
      targetGDate.getFullYear(),
      targetGDate.getMonth() + 1,
      targetGDate.getDate()
    );
    const monthName = PERSIAN_MONTH_NAMES[targetJ.month - 1];
    const dayFa = toPersianDigits(targetJ.day);
    const yearFa = toPersianDigits(targetJ.year);

    weekDays.push({
      dayIndex: i,
      name: PERSIAN_DAY_NAMES[i],
      dateStr: `${dayFa} ${monthName}`,
      fullStr: `${PERSIAN_DAY_NAMES[i]} ${dayFa} ${monthName} ${yearFa}`,
      jalali: targetJ,
    });
  }

  return {
    startStr: weekDays[0].fullStr,
    endStr: weekDays[6].fullStr,
    startDate: weekDays[0].jalali,
    endDate: weekDays[6].jalali,
    weekDays,
  };
}

/**
 * مقایسه دو تاریخ شمسی
 */
export function isSameJalaliDate(a: JalaliDate | null | undefined, b: JalaliDate | null | undefined): boolean {
  if (!a || !b) return false;
  return a.year === b.year && a.month === b.month && a.day === b.day;
}
