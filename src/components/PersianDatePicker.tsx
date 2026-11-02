import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

export interface PersianDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  mode?: 'single' | 'week';
  initialDate?: JalaliDate;
  onSelectDate?: (formattedDate: string, jalali: JalaliDate) => void;
  onSelectWeek?: (weekInfo: PersianWeekInfo) => void;
}

export function PersianDatePickerModal({
  isOpen,
  onClose,
  title = 'انتخابگر تقویم شمسی',
  mode = 'single',
  initialDate,
  onSelectDate,
  onSelectWeek,
}: PersianDatePickerProps) {
  const today = useMemo(() => getTodayJalali(), []);

  const [viewYear, setViewYear] = useState<number>(() => (initialDate ? initialDate.year : today.year));
  const [viewMonth, setViewMonth] = useState<number>(() => (initialDate ? initialDate.month : today.month));
  const [selectedDate, setSelectedDate] = useState<JalaliDate>(() => (initialDate || today));

  // If in week mode, calculate the live week info for the selected date
  const selectedWeekInfo = useMemo(() => {
    return getWeekRangeFromJalali(selectedDate);
  }, [selectedDate]);

  if (!isOpen) return null;

  const daysInMonth = getJalaliMonthDays(viewYear, viewMonth);
  const firstDayOfWeek = getJalaliFirstDayOfWeek(viewYear, viewMonth); // 0 = شنبه

  // Days from previous month to fill the first row
  const prevMonth = viewMonth === 1 ? 12 : viewMonth - 1;
  const prevMonthYear = viewMonth === 1 ? viewYear - 1 : viewYear;
  const daysInPrevMonth = getJalaliMonthDays(prevMonthYear, prevMonth);

  const prevMonthDaysToFill = firstDayOfWeek;

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
  const handleDayClick = (dayNum: number) => {
    const newSelected: JalaliDate = { year: viewYear, month: viewMonth, day: dayNum };
    setSelectedDate(newSelected);

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
    <div className="fixed inset-0 bg-neutral-900/70 backdrop-blur-xs z-[99999] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden text-neutral-900 font-sans">
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-4.5 px-5 flex items-center justify-between border-b-2 border-[#FF4F12]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FF4F12] text-white flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">{title}</h3>
              <p className="text-[11px] text-neutral-300">
                {mode === 'week' ? 'انتخاب تقویمی بازه شنبه تا جمعه' : 'انتخاب دقیق تاریخ شمسی'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Month & Year Controls */}
          <div className="flex items-center justify-between bg-neutral-100/80 p-2.5 rounded-2xl border border-neutral-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white text-neutral-700 hover:text-neutral-900 transition shadow-2xs cursor-pointer flex items-center gap-1 font-bold text-[11px]"
              title="ماه قبل"
            >
              <ChevronRight className="w-4 h-4" />
              <span>ماه قبل</span>
            </button>

            <div className="flex items-center gap-2 font-black text-sm text-neutral-800">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-bold text-neutral-900 focus:ring-1 focus:ring-[#FF4F12] focus:outline-none cursor-pointer shadow-2xs"
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
                className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-bold text-neutral-900 focus:ring-1 focus:ring-[#FF4F12] focus:outline-none cursor-pointer shadow-2xs"
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
              className="p-1.5 rounded-xl hover:bg-white text-neutral-700 hover:text-neutral-900 transition shadow-2xs cursor-pointer flex items-center gap-1 font-bold text-[11px]"
              title="ماه بعد"
            >
              <span>ماه بعد</span>
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

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {/* Days of previous month */}
            {Array.from({ length: prevMonthDaysToFill }).map((_, idx) => {
              const dayNum = daysInPrevMonth - prevMonthDaysToFill + idx + 1;
              return (
                <div
                  key={`prev_${idx}`}
                  className="h-9 flex items-center justify-center text-[11px] text-neutral-300 font-medium select-none"
                >
                  {toPersianDigits(dayNum)}
                </div>
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
                  className={`h-9 rounded-xl flex flex-col items-center justify-center text-[12px] transition cursor-pointer relative ${buttonStyle}`}
                >
                  <span>{toPersianDigits(dayNum)}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-[#FF4F12] absolute bottom-1"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Week Mode Summary Callout */}
          {mode === 'week' && (
            <div className="bg-[#FFF1EA] border border-[#ffd2bf] rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-[#C93A00]">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-[#FF4F12]" />
                  <span>بازه زمانی کامل هفتگی:</span>
                </div>
                <span className="text-[10px] bg-white text-[#C93A00] border border-[#ffd2bf] px-2 py-0.5 rounded-full font-bold">
                  ۷ روز درسی
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-white/80 p-2 rounded-xl border border-[#ffd2bf]/70 space-y-0.5">
                  <span className="text-neutral-500 text-[10px] block">شروع هفته (شنبه):</span>
                  <b className="text-neutral-900 font-extrabold">{selectedWeekInfo.startStr}</b>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-[#ffd2bf]/70 space-y-0.5">
                  <span className="text-neutral-500 text-[10px] block">پایان هفته (جمعه):</span>
                  <b className="text-[#C93A00] font-extrabold">{selectedWeekInfo.endStr}</b>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-neutral-50 p-4 border-t border-neutral-200 flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-300 px-3 py-2 rounded-xl font-bold transition shadow-2xs cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-[#FF4F12]" />
            <span>امروز ({toPersianDigits(today.day)} {PERSIAN_MONTH_NAMES[today.month - 1]})</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 transition cursor-pointer"
            >
              انصراف
            </button>

            {mode === 'week' ? (
              <button
                type="button"
                onClick={handleConfirmWeek}
                className="flex items-center gap-1.5 bg-[#FF4F12] hover:bg-[#e0450f] text-white px-4 py-2 rounded-xl font-extrabold shadow transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>تنظیم خودکار این هفته</span>
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
                className="flex items-center gap-1.5 bg-[#FF4F12] hover:bg-[#e0450f] text-white px-4 py-2 rounded-xl font-extrabold shadow transition cursor-pointer"
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
