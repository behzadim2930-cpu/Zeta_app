import React, { useState, useMemo, useEffect } from 'react';
import {
  JalaliDate,
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEK_DAYS,
  toPersianDigits,
  getJalaliMonthDays,
  getJalaliFirstDayOfWeek,
  getTodayJalali,
  isSameJalaliDate,
  formatJalali,
  getWeekRangeFromJalali,
  PersianWeekInfo,
} from '../utils/jalali';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Sparkles,
  Clock,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';

export interface PersianDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  mode?: 'single' | 'week';
  targetField?: 'start' | 'end' | 'createdDate';
  initialDate?: JalaliDate;
  onSelectDate?: (formattedDate: string, jalali: JalaliDate) => void;
  onSelectWeek?: (weekInfo: PersianWeekInfo) => void;
}

export function PersianDatePickerModal({
  isOpen,
  onClose,
  title = 'انتخابگر تقویم شمسی',
  mode = 'single',
  targetField,
  initialDate,
  onSelectDate,
  onSelectWeek,
}: PersianDatePickerProps) {
  const today = useMemo(() => getTodayJalali(), []);

  const [viewYear, setViewYear] = useState<number>(() => (initialDate ? initialDate.year : today.year));
  const [viewMonth, setViewMonth] = useState<number>(() => (initialDate ? initialDate.month : today.month));
  const [selectedDate, setSelectedDate] = useState<JalaliDate>(() => (initialDate || today));
  // Range type: 'fromSelected' starts 7 days on the exact selected day; 'saturdayToFriday' snaps to Saturday
  const [rangeType, setRangeType] = useState<'fromSelected' | 'saturdayToFriday'>('fromSelected');

  // Prevent background scroll while modal is active (prevents scroll chaining bug on mobile/Telegram)
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
      };
    }
  }, [isOpen]);

  // Sync initial date if opened with new date
  useEffect(() => {
    if (isOpen && initialDate) {
      setViewYear(initialDate.year);
      setViewMonth(initialDate.month);
      setSelectedDate(initialDate);
    }
  }, [isOpen, initialDate]);

  // Calculate live week info based on selected date & range type
  const selectedWeekInfo = useMemo(() => {
    return getWeekRangeFromJalali(selectedDate, rangeType);
  }, [selectedDate, rangeType]);

  if (!isOpen) return null;

  const daysInMonth = getJalaliMonthDays(viewYear, viewMonth);
  const firstDayOfWeek = getJalaliFirstDayOfWeek(viewYear, viewMonth); // 0 = شنبه

  // Days from previous month
  const prevMonth = viewMonth === 1 ? 12 : viewMonth - 1;
  const prevMonthYear = viewMonth === 1 ? viewYear - 1 : viewYear;
  const daysInPrevMonth = getJalaliMonthDays(prevMonthYear, prevMonth);
  const prevMonthDaysToFill = firstDayOfWeek;

  // Days from next month to complete standard grid (35 or 42 slots)
  const totalOccupied = prevMonthDaysToFill + daysInMonth;
  const totalSlots = totalOccupied > 35 ? 42 : 35;
  const nextMonthDaysToFill = totalSlots - totalOccupied;
  const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1;
  const nextMonthYear = viewMonth === 12 ? viewYear + 1 : viewYear;

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Check if a date belongs to the currently selected week
  const isInSelectedWeek = (date: JalaliDate): boolean => {
    if (mode !== 'week') return false;
    return selectedWeekInfo.weekDays.some((w) => isSameJalaliDate(w.jalali, date));
  };

  // Handle click on a day cell
  const handleDayClick = (dayNum: number, targetM = viewMonth, targetY = viewYear) => {
    const newSelected: JalaliDate = { year: targetY, month: targetM, day: dayNum };
    setSelectedDate(newSelected);
    if (targetM !== viewMonth) {
      setViewMonth(targetM);
      setViewYear(targetY);
    }

    if (mode === 'single' && onSelectDate) {
      const formatted = formatJalali(newSelected, 'fullWithDay');
      onSelectDate(formatted, newSelected);
      onClose();
    }
  };

  // Confirm week selection
  const handleConfirmWeek = () => {
    if (onSelectWeek) {
      onSelectWeek(selectedWeekInfo);
    }
    onClose();
  };

  // Quick jump to today
  const handleJumpToToday = () => {
    setViewYear(today.year);
    setViewMonth(today.month);
    setSelectedDate(today);
    if (mode === 'single' && onSelectDate) {
      onSelectDate(formatJalali(today, 'fullWithDay'), today);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs z-[99999] flex items-center justify-center p-2.5 sm:p-4 overscroll-none animate-fadeIn select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900 font-sans">
        {/* 1. Header (Sticky Top - Shrink 0) */}
        <div className="shrink-0 bg-neutral-900 text-white p-3.5 sm:p-4.5 px-4 sm:px-5 flex items-center justify-between border-b-2 border-[#FF4F12]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF4F12] text-white flex items-center justify-center shadow-xs shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white leading-tight">{title}</h3>
              <p className="text-[11px] text-neutral-300">
                {mode === 'week'
                  ? 'انتخاب روز شروع برنامه و تنظیم خودکار ۷ روز متوالی'
                  : 'انتخاب دقیق تاریخ شمسی'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Mode Segmented Controls for Week Mode (Sticky Top - Shrink 0) */}
        {mode === 'week' && (
          <div className="shrink-0 bg-neutral-100 p-2 border-b border-neutral-200 flex items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setRangeType('fromSelected')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-[11.5px] ${
                rangeType === 'fromSelected'
                  ? 'bg-white text-[#C93A00] font-black shadow-xs border border-orange-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF4F12]" />
              <span>شروع ۷ روز از روز انتخابی (شناور)</span>
            </button>
            <button
              type="button"
              onClick={() => setRangeType('saturdayToFriday')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-[11.5px] ${
                rangeType === 'saturdayToFriday'
                  ? 'bg-white text-[#C93A00] font-black shadow-xs border border-orange-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-neutral-500" />
              <span>هفته سنتی (شنبه تا جمعه)</span>
            </button>
          </div>
        )}

        {/* 3. Scrollable Calendar Body (Flex 1, Overflow Y Auto, Never cut off!) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-3.5 text-xs">
          {/* Month & Year Navigation Bar */}
          <div className="flex items-center justify-between bg-neutral-100/90 p-2 sm:p-2.5 rounded-2xl border border-neutral-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 sm:px-2 rounded-xl hover:bg-white text-neutral-700 hover:text-neutral-900 transition shadow-2xs cursor-pointer flex items-center gap-1 font-bold text-[11px]"
              title="ماه قبل"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden xs:inline">ماه قبل</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 font-black text-sm text-neutral-800">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-white border border-neutral-300 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-bold text-neutral-900 focus:ring-1 focus:ring-[#FF4F12] focus:outline-none cursor-pointer shadow-2xs"
              >
                {PERSIAN_MONTH_NAMES.map((mName, idx) => (
                  <option key={mName} value={idx + 1}>
                    {mName}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-white border border-neutral-300 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-bold text-neutral-900 focus:ring-1 focus:ring-[#FF4F12] focus:outline-none cursor-pointer shadow-2xs"
              >
                {[1402, 1403, 1404, 1405, 1406, 1407].map((yr) => (
                  <option key={yr} value={yr}>
                    {toPersianDigits(yr)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 sm:px-2 rounded-xl hover:bg-white text-neutral-700 hover:text-neutral-900 transition shadow-2xs cursor-pointer flex items-center gap-1 font-bold text-[11px]"
              title="ماه بعد"
            >
              <span className="hidden xs:inline">ماه بعد</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-neutral-500 pb-1 border-b border-neutral-200">
            {PERSIAN_WEEK_DAYS.map((wd) => (
              <div key={wd.full} className="py-1">
                {wd.short}
              </div>
            ))}
          </div>

          {/* Complete 42/35 Day Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
            {/* Days of previous month */}
            {Array.from({ length: prevMonthDaysToFill }).map((_, idx) => {
              const dayNum = daysInPrevMonth - prevMonthDaysToFill + idx + 1;
              const prevDate: JalaliDate = { year: prevMonthYear, month: prevMonth, day: dayNum };
              const inRange = isInSelectedWeek(prevDate);
              return (
                <button
                  key={`prev_${idx}`}
                  type="button"
                  onClick={() => handleDayClick(dayNum, prevMonth, prevMonthYear)}
                  className={`h-9 sm:h-9.5 rounded-xl flex items-center justify-center text-[11.5px] transition cursor-pointer ${
                    inRange
                      ? 'bg-[#FFF1EA] text-[#C93A00] font-extrabold border border-[#ffd2bf]'
                      : 'text-neutral-300 hover:bg-neutral-100 hover:text-neutral-600'
                  }`}
                  title={`${dayNum} ${PERSIAN_MONTH_NAMES[prevMonth - 1]}`}
                >
                  {toPersianDigits(dayNum)}
                </button>
              );
            })}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const currentDayJalali: JalaliDate = {
                year: viewYear,
                month: viewMonth,
                day: dayNum,
              };

              const isSelected = isSameJalaliDate(currentDayJalali, selectedDate);
              const isToday = isSameJalaliDate(currentDayJalali, today);
              const inWeekRange = isInSelectedWeek(currentDayJalali);

              let buttonStyle = 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200/80';

              if (mode === 'single') {
                if (isSelected) {
                  buttonStyle = 'bg-[#FF4F12] text-white font-black shadow-md border-[#FF4F12] scale-105';
                } else if (isToday) {
                  buttonStyle = 'bg-amber-50 text-amber-900 border-amber-300 font-black';
                }
              } else {
                // Week mode
                if (isSelected) {
                  buttonStyle = 'bg-[#FF4F12] text-white font-black shadow-md border-[#FF4F12] scale-105 z-10';
                } else if (inWeekRange) {
                  buttonStyle = 'bg-[#FFF1EA] text-[#C93A00] font-extrabold border-[#ffd2bf]';
                } else if (isToday) {
                  buttonStyle = 'bg-amber-50 text-amber-900 border-amber-300 font-black';
                }
              }

              return (
                <button
                  key={`day_${dayNum}`}
                  type="button"
                  onClick={() => handleDayClick(dayNum)}
                  className={`h-9 sm:h-9.5 rounded-xl flex flex-col items-center justify-center text-[12px] transition cursor-pointer relative ${buttonStyle}`}
                >
                  <span>{toPersianDigits(dayNum)}</span>
                  {isToday && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF4F12] absolute bottom-1"></span>
                  )}
                </button>
              );
            })}

            {/* Days of next month */}
            {Array.from({ length: nextMonthDaysToFill }).map((_, idx) => {
              const dayNum = idx + 1;
              const nextDate: JalaliDate = { year: nextMonthYear, month: nextMonth, day: dayNum };
              const inRange = isInSelectedWeek(nextDate);
              return (
                <button
                  key={`next_${idx}`}
                  type="button"
                  onClick={() => handleDayClick(dayNum, nextMonth, nextMonthYear)}
                  className={`h-9 sm:h-9.5 rounded-xl flex items-center justify-center text-[11.5px] transition cursor-pointer ${
                    inRange
                      ? 'bg-[#FFF1EA] text-[#C93A00] font-extrabold border border-[#ffd2bf]'
                      : 'text-neutral-300 hover:bg-neutral-100 hover:text-neutral-600'
                  }`}
                  title={`${dayNum} ${PERSIAN_MONTH_NAMES[nextMonth - 1]}`}
                >
                  {toPersianDigits(dayNum)}
                </button>
              );
            })}
          </div>

          {/* Week Mode Summary Callout Card */}
          {mode === 'week' && (
            <div className="bg-[#FFF1EA] border border-[#ffd2bf] rounded-2xl p-3 sm:p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-black text-[#C93A00]">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-[#FF4F12]" />
                  <span>
                    {rangeType === 'fromSelected'
                      ? `برنامه ۷ روزه (شروع از روز ${selectedWeekInfo.weekDays[0].name})`
                      : 'بازه تقویمی استاندارد (شنبه تا جمعه)'}
                  </span>
                </div>
                <span className="text-[10px] bg-white text-[#C93A00] border border-[#ffd2bf] px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
                  ۷ روز درسی متوالی
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
                <div className="bg-white/90 p-2 sm:p-2.5 rounded-xl border border-[#ffd2bf]/80 space-y-0.5 shadow-2xs">
                  <span className="text-neutral-500 text-[10px] font-bold block">
                    روز اول (شروع):
                  </span>
                  <b className="text-neutral-900 font-extrabold text-xs block truncate">
                    {selectedWeekInfo.startStr}
                  </b>
                </div>
                <div className="bg-white/90 p-2 sm:p-2.5 rounded-xl border border-[#ffd2bf]/80 space-y-0.5 shadow-2xs">
                  <span className="text-neutral-500 text-[10px] font-bold block">
                    روز هفتم (پایان):
                  </span>
                  <b className="text-[#C93A00] font-extrabold text-xs block truncate">
                    {selectedWeekInfo.endStr}
                  </b>
                </div>
              </div>

              {/* Day Chips Preview */}
              <div className="pt-1 border-t border-[#ffd2bf]/60">
                <span className="text-[10px] text-neutral-600 font-bold block mb-1.5">
                  ترتیب روزهای هفته در جدول و برگه PDF:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
                  {selectedWeekInfo.weekDays.map((wd, i) => (
                    <div
                      key={wd.dayIndex}
                      className="shrink-0 bg-white border border-[#ffd2bf] px-2.5 py-1 rounded-xl text-center shadow-2xs"
                    >
                      <div className="font-black text-[#C93A00] flex items-center justify-center gap-1">
                        <span className="text-[9px] text-neutral-400 font-normal">#{toPersianDigits(i + 1)}</span>
                        <span>{wd.name}</span>
                      </div>
                      <div className="text-[9.5px] text-neutral-500 font-bold mt-0.5">{wd.dateStr}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick direct apply button inside callout */}
              <button
                type="button"
                onClick={handleConfirmWeek}
                className="w-full bg-[#FF4F12] hover:bg-[#e0450f] text-white py-2 px-3 rounded-xl font-extrabold text-xs shadow-xs hover:shadow transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ثبت همین بازه ۷ روزه ({selectedWeekInfo.weekDays[0].name} تا {selectedWeekInfo.weekDays[6].name})</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. Footer Actions (Sticky Bottom - Shrink 0, ALWAYS VISIBLE!) */}
        <div className="shrink-0 bg-neutral-50 p-3 sm:p-4 border-t border-neutral-200 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-300 px-2.5 sm:px-3 py-2 rounded-xl font-bold transition shadow-2xs cursor-pointer text-[11px] sm:text-xs"
          >
            <Clock className="w-3.5 h-3.5 text-[#FF4F12]" />
            <span>امروز ({toPersianDigits(today.day)} {PERSIAN_MONTH_NAMES[today.month - 1]})</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 transition cursor-pointer text-xs"
            >
              انصراف
            </button>

            {mode === 'week' ? (
              <button
                type="button"
                onClick={handleConfirmWeek}
                className="flex items-center gap-1.5 bg-[#FF4F12] hover:bg-[#e0450f] text-white px-3.5 sm:px-4 py-2 rounded-xl font-black shadow-md hover:shadow-lg transition cursor-pointer text-xs"
              >
                <Check className="w-4 h-4" />
                <span>تأیید و تنظیم ۷ روز برنامه</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onSelectDate) {
                    onSelectDate(formatJalali(selectedDate, 'fullWithDay'), selectedDate);
                  }
                  onClose();
                }}
                className="flex items-center gap-1.5 bg-[#FF4F12] hover:bg-[#e0450f] text-white px-3.5 sm:px-4 py-2 rounded-xl font-black shadow-md hover:shadow-lg transition cursor-pointer text-xs"
              >
                <Check className="w-4 h-4" />
                <span>تأیید تاریخ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
