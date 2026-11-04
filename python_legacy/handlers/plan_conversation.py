"""
Zeta Telegram Bot - Plan Conversation Handler Module
مدیریت کامل جریان گفتگوی چند مرحله‌ای (ConversationHandler) برای ثبت برنامه هفتگی
"""

import asyncio
import io
import logging
import re
from typing import Any, Dict, List

import jdatetime
from telegram import Update
from telegram.constants import ChatAction, ParseMode
from telegram.ext import (
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

import config
from handlers import keyboards, start
import pdf_builder

logger = logging.getLogger(__name__)

MONTH_NAMES_FA = {
    1: "فروردین",
    2: "اردیبهشت",
    3: "خرداد",
    4: "تیر",
    5: "مرداد",
    6: "شهریور",
    7: "مهر",
    8: "آبان",
    9: "آذر",
    10: "دی",
    11: "بهمن",
    12: "اسفند",
}


def parse_time_pair(text: str) -> tuple[str, str] | None:
    """استخراج ساعت شروع و پایان از متن‌های ورودی متنوع (مانند 08:00 تا 09:30 یا 08:00-09:30)"""
    cleaned = pdf_builder.to_english_digits(text).strip()
    pattern = r"(\d{1,2}:\d{2})\s*(?:تا|-|–|to|\s)\s*(\d{1,2}:\d{2})"
    match = re.search(pattern, cleaned)
    if not match:
        return None

    s_str, e_str = match.group(1), match.group(2)
    s_parsed = pdf_builder.parse_time_str(s_str)
    e_parsed = pdf_builder.parse_time_str(e_str)
    if not s_parsed or not e_parsed:
        return None

    # ساعت پایان باید بعد از ساعت شروع باشد
    if (e_parsed[0] * 60 + e_parsed[1]) <= (s_parsed[0] * 60 + s_parsed[1]):
        return None

    return f"{s_parsed[0]:02d}:{s_parsed[1]:02d}", f"{e_parsed[0]:02d}:{e_parsed[1]:02d}"


async def start_new_plan(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """شروع فرآیند ثبت برنامه جدید هفتگی"""
    if not await start.check_access(update):
        return ConversationHandler.END

    user = update.effective_user
    default_advisor = user.full_name if user else "مشاور موسسه"

    # آماده‌سازی ساختار موقت در context.user_data
    context.user_data["plan"] = {
        "advisor_name": default_advisor,
        "student_name": "",
        "student_grade": "",
        "student_field": "",
        "student_target": "",
        "start_date_str": "",
        "end_date_str": "",
        "week_title": "",
        "created_date": jdatetime.date.today().strftime("%d %B %Y"),
        "current_day_index": 0,
        "editing_day_index": None,
        "days": [],
        "temp_block": {},
        "goals_text": "",
    }

    prompt_text = (
        "📋 **مرحله ۱ از ۶: مشخصات مشاور**\n\n"
        f"نام پیش‌فرض شما: **{default_advisor}**\n\n"
        "اگر مایلید همین نام در سربرگ PDF درج شود، لطفاً عدد `1` را ارسال کنید یا "
        "نام و عنوان کامل خود را تایپ و ارسال فرمایید:\n"
        "(مثال: مهدی رضایی / دکتر سارا کریمی)"
    )

    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.message.reply_text(
            prompt_text, parse_mode=ParseMode.MARKDOWN
        )
    else:
        await update.message.reply_text(
            prompt_text, parse_mode=ParseMode.MARKDOWN
        )

    return config.STATE_ADVISOR_NAME


async def advisor_name_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت نام مشاور"""
    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    text = update.message.text.strip()
    if text != "1":
        plan["advisor_name"] = text

    prompt_text = (
        f"✅ نام مشاور: **{plan['advisor_name']}**\n\n"
        "👤 **مرحله ۲ از ۶: مشخصات دانش‌آموز**\n"
        "لطفاً **نام و نام خانوادگی دانش‌آموز** را ارسال فرمایید:\n"
        "(مثال: سارا محمدی)"
    )

    await update.message.reply_text(prompt_text, parse_mode=ParseMode.MARKDOWN)
    return config.STATE_STUDENT_NAME


async def student_name_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت نام دانش‌آموز"""
    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    student_name = update.message.text.strip()
    if len(student_name) < 2:
        await update.message.reply_text(
            "⚠️ لطفاً یک نام معتبر برای دانش‌آموز وارد کنید:"
        )
        return config.STATE_STUDENT_NAME

    plan["student_name"] = student_name

    prompt_text = (
        f"✅ دانش‌آموز: **{student_name}**\n\n"
        "📚 لطفاً **پایه تحصیلی** دانش‌آموز را انتخاب فرمایید:"
    )

    await update.message.reply_text(
        prompt_text,
        reply_markup=keyboards.get_grades_keyboard(),
        parse_mode=ParseMode.MARKDOWN,
    )
    return config.STATE_STUDENT_GRADE


async def student_grade_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت پایه تحصیلی از دکمه شیشه‌ای"""
    query = update.callback_query
    await query.answer()

    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    grade = query.data.replace("grade_", "")
    plan["student_grade"] = grade

    prompt_text = (
        f"✅ پایه تحصیلی: **{grade}**\n\n"
        "🔬 لطفاً **رشته تحصیلی** دانش‌آموز را انتخاب فرمایید:"
    )

    await query.edit_message_text(
        prompt_text,
        reply_markup=keyboards.get_fields_keyboard(),
        parse_mode=ParseMode.MARKDOWN,
    )
    return config.STATE_STUDENT_FIELD


async def student_field_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت رشته تحصیلی از دکمه شیشه‌ای"""
    query = update.callback_query
    await query.answer()

    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    field = query.data.replace("field_", "")
    plan["student_field"] = field

    prompt_text = (
        f"✅ رشته تحصیلی: **{field}**\n\n"
        "🎯 **هدف دانش‌آموز** را وارد فرمایید:\n"
        "(مثال: رتبه زیر ۵۰۰ کنکور تجربی / قبولی پزشکی دانشگاه تهران / معدل بالای ۱۹)"
    )

    await query.edit_message_text(prompt_text, parse_mode=ParseMode.MARKDOWN)
    return config.STATE_STUDENT_TARGET


async def student_target_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت هدف دانش‌آموز"""
    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    plan["student_target"] = update.message.text.strip()

    prompt_text = (
        "📅 **مرحله ۳ از ۶: بازه زمانی هفته**\n\n"
        "لطفاً **تاریخ شروع هفته (روز شنبه)** را با فرمت شمسی سال/ماه/روز وارد نمایید:\n"
        "(مثال: `1405/08/02` یا `۱۴۰۵/۰۸/۰۲` یا `1403/08/05`)\n\n"
        "💡 *تاریخ پایان و روزهای کل هفته به صورت خودکار محاسبه خواهند شد.*"
    )

    await update.message.reply_text(prompt_text, parse_mode=ParseMode.MARKDOWN)
    return config.STATE_START_DATE


def setup_days_from_start_jdate(plan: Dict[str, Any], start_jdate: jdatetime.date) -> None:
    """محاسبه ۷ روز هفته شمسی از شنبه تا جمعه بر اساس تاریخ شروع"""
    days = []
    for i in range(7):
        cur_date = start_jdate + jdatetime.timedelta(days=i)
        day_name = config.WEEKDAYS_FA[i]
        date_str = f"{cur_date.day} {MONTH_NAMES_FA.get(cur_date.month, '')}"
        days.append(
            {
                "name": day_name,
                "date_str": date_str,
                "jdate_str": cur_date.strftime("%Y/%m/%d"),
                "is_rest": False,
                "rest_text": "امروز برنامه درسی نداری. استراحت، پیاده‌روی و خواب کافی هم بخشی از برنامه است.",
                "blocks": [],
            }
        )

    end_jdate = start_jdate + jdatetime.timedelta(days=6)
    start_str = (
        f"شنبه {start_jdate.day} {MONTH_NAMES_FA.get(start_jdate.month, '')} {start_jdate.year}"
    )
    end_str = (
        f"جمعه {end_jdate.day} {MONTH_NAMES_FA.get(end_jdate.month, '')} {end_jdate.year}"
    )

    plan["start_date_str"] = start_str
    plan["end_date_str"] = end_str
    plan["week_title"] = (
        f"هفته {MONTH_NAMES_FA.get(start_jdate.month, '')} ماه {start_jdate.year}"
    )
    plan["days"] = days
    plan["current_day_index"] = 0


async def start_date_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت و اعتبارسنجی تاریخ شروع هفته"""
    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    raw_text = pdf_builder.to_english_digits(update.message.text.strip())
    match = re.search(r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})", raw_text)
    if not match:
        await update.message.reply_text(
            "⚠️ فرمت تاریخ نامعتبر است. لطفاً تاریخ شمسی را با فرمت سال/ماه/روز وارد کنید:\n"
            "مثال: `1405/08/02`"
        )
        return config.STATE_START_DATE

    y, m, d = int(match.group(1)), int(match.group(2)), int(match.group(3))
    try:
        start_jdate = jdatetime.date(y, m, d)
    except ValueError as e:
        await update.message.reply_text(
            f"⚠️ تاریخ وارد شده از نظر تقویم شمسی نامعتبر است ({e}). لطفاً دوباره وارد فرمایید:"
        )
        return config.STATE_START_DATE

    # بررسی اینکه آیا تاریخ انتخابی شنبه است یا خیر
    # در تقویم شمسی شنبه معمولاً روز اول هفته است
    day_name_in_week = start_jdate.strftime("%A")
    is_saturday = day_name_in_week in ("شنبه", "Saturday") or (
        start_jdate.weekday() == 5
    )

    context.user_data["pending_start_jdate"] = start_jdate

    if not is_saturday:
        warning_text = (
            f"⚠️ **توجه:** تاریخ وارد شده (`{start_jdate.strftime('%Y/%m/%d')}`) معادل **{day_name_in_week}** است، نه روز شنبه!\n\n"
            "معمولاً برنامه‌های هفتگی از روز شنبه آغاز می‌شوند. آیا مایلید با همین تاریخ ادامه دهید یا می‌خواهید تاریخ را اصلاح نمایید؟"
        )
        await update.message.reply_text(
            warning_text,
            reply_markup=keyboards.get_non_saturday_keyboard(),
            parse_mode=ParseMode.MARKDOWN,
        )
        return config.STATE_CONFIRM_NON_SATURDAY

    setup_days_from_start_jdate(plan, start_jdate)
    return await prompt_current_day(update, context)


async def non_saturday_confirmed(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """مدیریت دکمه‌های تایید یا ویرایش در صورت غیر شنبه بودن تاریخ"""
    query = update.callback_query
    await query.answer()

    plan = context.user_data.get("plan")
    start_jdate = context.user_data.get("pending_start_jdate")
    if not plan or not start_jdate:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    if query.data == "confirm_date_edit":
        await query.edit_message_text(
            "✏️ لطفاً تاریخ شروع شنبه را مجدداً وارد فرمایید:\n(مثال: `1405/08/02`)"
        )
        return config.STATE_START_DATE

    # confirm_date_yes
    setup_days_from_start_jdate(plan, start_jdate)
    return await prompt_current_day(update, context)


async def prompt_current_day(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """ارسال پیام انتخاب عملیات برای روز جاری (افزودن بخش درسی، کپی از روز قبل یا روز استراحت)"""
    plan = context.user_data.get("plan")
    idx = plan["current_day_index"]
    day = plan["days"][idx]

    # بررسی امکان کپی از روز قبل
    can_copy = False
    if idx > 0 and len(plan["days"][idx - 1].get("blocks", [])) > 0:
        can_copy = True

    progress_bar = "🟩" * (idx + 1) + "⬜" * (6 - idx)

    day_header = (
        f"📊 پیشرفت ثبت روزها: [{progress_bar}] روز {pdf_builder.to_persian_digits(idx + 1)} از ۷\n"
        f"📅 **{day['name']} ({pdf_builder.to_persian_digits(day['date_str'])})**\n\n"
        "برای این روز کدام گزینه را انتخاب می‌فرمایید؟"
    )

    markup = keyboards.get_day_action_keyboard(
        can_copy_prev=can_copy,
        is_edit=(plan.get("editing_day_index") is not None)
    )

    if update.callback_query:
        await update.callback_query.edit_message_text(
            day_header, reply_markup=markup, parse_mode=ParseMode.MARKDOWN
        )
    elif update.message:
        await update.message.reply_text(
            day_header, reply_markup=markup, parse_mode=ParseMode.MARKDOWN
        )

    return config.STATE_DAY_ACTION


async def day_action_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """پردازش انتخاب «افزودن بخش»، «کپی از روز قبل» یا «روز استراحت»"""
    query = update.callback_query
    await query.answer()

    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    action = query.data
    idx = plan["current_day_index"]
    day = plan["days"][idx]

    if action == "day_action_rest":
        day["is_rest"] = True
        day["blocks"] = []
        msg = f"☕ روز **{day['name']}** به عنوان **روز استراحت** ثبت گردید."
        await query.edit_message_text(msg, parse_mode=ParseMode.MARKDOWN)
        return await advance_to_next_day_or_finish(update, context)

    elif action == "day_action_copy_prev":
        prev_day = plan["days"][idx - 1]
        import copy
        day["blocks"] = copy.deepcopy(prev_day.get("blocks", []))
        day["is_rest"] = False
        await query.answer("بخش‌های روز قبل با موفقیت برای امروز کپی شدند! 📋", show_alert=False)
        return await show_day_summary(update, context)

    # day_action_add_block
    day["is_rest"] = False
    plan["temp_block"] = {}

    prompt_text = (
        f"📌 **بخش درسی جدید برای {day['name']} ({pdf_builder.to_persian_digits(day['date_str'])})**\n\n"
        "لطفاً **نوع فعالیت** را انتخاب نمایید:"
    )

    await query.edit_message_text(
        prompt_text,
        reply_markup=keyboards.get_activity_types_keyboard(),
        parse_mode=ParseMode.MARKDOWN,
    )
    return config.STATE_BLOCK_TYPE


async def block_type_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت نوع فعالیت درسی"""
    query = update.callback_query
    await query.answer()

    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    act_key = query.data.replace("act_", "")
    plan["temp_block"]["type"] = act_key
    act_title = config.ACTIVITY_TYPES.get(act_key, {}).get("title", act_key)

    prompt_text = (
        f"نوع فعالیت: **{act_title}** ✅\n\n"
        "📖 لطفاً **درس مربوطه** را انتخاب فرمایید یا در صورت نبودن، گزینه «سایر درس‌ها» را بزنید:"
    )

    await query.edit_message_text(
        prompt_text,
        reply_markup=keyboards.get_subjects_keyboard(),
        parse_mode=ParseMode.MARKDOWN,
    )
    return config.STATE_BLOCK_SUBJECT


async def block_subject_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت درس از لیست یا هدایت به تایپ نام دلخواه"""
    query = update.callback_query
    await query.answer()

    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    if query.data == "subj_custom":
        await query.edit_message_text(
            "✏️ لطفاً **نام درس** مورد نظر را تایپ و ارسال فرمایید:\n"
            "(مثال: حسابان ۲ / زیست دهم / فیزیک اتمی)"
        )
        return config.STATE_BLOCK_CUSTOM_SUBJECT

    subject = query.data.replace("subj_", "")
    plan["temp_block"]["subject"] = subject

    prompt_text = (
        f"درس: **{subject}** ✅\n\n"
        "📝 لطفاً **مبحث یا فصل** را وارد فرمایید:\n"
        "(مثال: گوارش و جذب مواد / حد و پیوستگی / الکتریسیته ساکن)"
    )

    await query.edit_message_text(prompt_text, parse_mode=ParseMode.MARKDOWN)
    return config.STATE_BLOCK_TOPIC


async def block_custom_subject_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت نام درس سفارشی به صورت متن"""
    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    subject = update.message.text.strip()
    plan["temp_block"]["subject"] = subject

    prompt_text = (
        f"درس: **{subject}** ✅\n\n"
        "📝 لطفاً **مبحث یا فصل** را وارد فرمایید:\n"
        "(مثال: گوارش و جذب مواد / حد و پیوستگی)"
    )

    await update.message.reply_text(prompt_text, parse_mode=ParseMode.MARKDOWN)
    return config.STATE_BLOCK_TOPIC


async def block_topic_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت مبحث و درخواست ساعت با گزینه‌های سریع"""
    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    plan["temp_block"]["topic"] = update.message.text.strip()

    prompt_text = (
        f"مبحث: **{plan['temp_block']['topic']}** ✅\n\n"
        "⏰ **ساعت شروع و پایان** این بخش را انتخاب فرمایید یا تایپ کنید:\n"
        "• می‌توانید یکی از بازه‌های زمانی آماده زیر را لمس نمایید،\n"
        "• یا ساعت دلخواه را تایپ کنید (مثلاً: `08:00 تا 09:30` یا `۸:۰۰ تا ۹:۳۰`)"
    )

    await update.message.reply_text(
        prompt_text,
        reply_markup=keyboards.get_time_presets_keyboard(),
        parse_mode=ParseMode.MARKDOWN,
    )
    return config.STATE_BLOCK_TIME


async def block_time_callback_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت ساعت از دکمه‌های سریع اینلاین"""
    query = update.callback_query
    await query.answer()

    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    if query.data == "time_manual":
        await query.edit_message_text(
            "✏️ لطفاً ساعت شروع و پایان را با کیبورد تایپ و ارسال فرمایید:\n"
            "(مثال: `08:00 تا 09:30` یا `۱۶:۰۰ تا ۱۷:۳۰`)"
        )
        return config.STATE_BLOCK_TIME

    # Format: time_08:00_09:30
    parts = query.data.replace("time_", "").split("_")
    if len(parts) == 2:
        start_t, end_t = parts[0], parts[1]
        diff_m = pdf_builder.calculate_minutes_difference(start_t, end_t)
        duration_str = pdf_builder.format_duration_persian(diff_m)

        plan["temp_block"]["start_time"] = start_t
        plan["temp_block"]["end_time"] = end_t

        prompt_text = (
            f"زمان: **{pdf_builder.to_persian_digits(start_t)} تا {pdf_builder.to_persian_digits(end_t)}** ({duration_str}) ✅\n\n"
            "📊 **تعداد تست یا تعداد صفحه/جلسه** (اختیاری):\n"
            "یکی از مقادیر زیر را انتخاب کنید یا عدد دلخواه بنویسید (یا دکمه رد کردن را لمس فرمایید):"
        )

        await query.edit_message_text(
            prompt_text,
            reply_markup=keyboards.get_extra_presets_keyboard(),
            parse_mode=ParseMode.MARKDOWN,
        )
        return config.STATE_BLOCK_EXTRA

    return config.STATE_BLOCK_TIME


async def block_time_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت ساعت شروع و پایان تایپ شده توسط کاربر"""
    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    raw_text = update.message.text.strip()
    time_pair = parse_time_pair(raw_text)

    if not time_pair:
        await update.message.reply_text(
            "⚠️ ساعت وارد شده نامعتبر است یا ساعت پایان قبل از ساعت شروع است!\n"
            "لطفاً به شکل صحیح وارد فرمایید (مانند `08:00 تا 09:30` یا `۸:۰۰ تا ۹:۳۰`) "
            "یا از دکمه‌های آماده استفاده نمایید:",
            reply_markup=keyboards.get_time_presets_keyboard(),
        )
        return config.STATE_BLOCK_TIME

    start_t, end_t = time_pair
    diff_m = pdf_builder.calculate_minutes_difference(start_t, end_t)
    duration_str = pdf_builder.format_duration_persian(diff_m)

    plan["temp_block"]["start_time"] = start_t
    plan["temp_block"]["end_time"] = end_t

    prompt_text = (
        f"زمان: **{pdf_builder.to_persian_digits(start_t)} تا {pdf_builder.to_persian_digits(end_t)}** ({duration_str}) ✅\n\n"
        "📊 **تعداد تست یا تعداد صفحه/جلسه** (اختیاری):\n"
        "یکی از مقادیر آماده زیر را انتخاب کنید یا عدد دلخواه بنویسید (یا دکمه رد کردن را بزنید):"
    )

    await update.message.reply_text(
        prompt_text,
        reply_markup=keyboards.get_extra_presets_keyboard(),
        parse_mode=ParseMode.MARKDOWN,
    )
    return config.STATE_BLOCK_EXTRA


async def block_extra_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت تعداد تست/صفحه یا رد کردن آن"""
    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    extra_val = ""
    if update.callback_query:
        query = update.callback_query
        await query.answer()
        if query.data.startswith("extra_"):
            extra_val = query.data.replace("extra_", "")
    elif update.message:
        text = update.message.text.strip()
        if text not in ("/skip", "رد"):
            # اگر فقط عدد وارد شده بود به تست تعبیر می‌کنیم
            digits_only = pdf_builder.to_english_digits(text)
            if digits_only.isdigit():
                extra_val = f"{pdf_builder.to_persian_digits(digits_only)} تست"
            else:
                extra_val = pdf_builder.to_persian_digits(text)

    plan["temp_block"]["extra"] = extra_val

    prompt_text = (
        "📝 **توضیحات، تکالیف یا یادداشت برای دانش‌آموز** (اختیاری):\n"
        "می‌توانید توضیحات مورد نظر را بنویسید (متن بلند و چندخطی مجاز است)، یا دکمه «رد کردن» را لمس کنید:"
    )

    if update.callback_query:
        await update.callback_query.edit_message_text(
            prompt_text,
            reply_markup=keyboards.get_skip_keyboard("رد کردن و ثبت بخش ⏭"),
            parse_mode=ParseMode.MARKDOWN,
        )
    else:
        await update.message.reply_text(
            prompt_text,
            reply_markup=keyboards.get_skip_keyboard("رد کردن و ثبت بخش ⏭"),
            parse_mode=ParseMode.MARKDOWN,
        )

    return config.STATE_BLOCK_NOTE


async def block_note_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت توضیحات نهایی بخش و افزودن به روز جاری"""
    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    note_val = ""
    if update.callback_query:
        await update.callback_query.answer()
    elif update.message:
        text = update.message.text.strip()
        if text not in ("/skip", "رد"):
            note_val = text

    plan["temp_block"]["note"] = note_val

    # ثبت قطعی بخش در لیست بخش‌های روز
    idx = plan["current_day_index"]
    day = plan["days"][idx]
    day["blocks"].append(plan["temp_block"])
    plan["temp_block"] = {}

    return await show_day_summary(update, context)


async def show_day_summary(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """نمایش خلاصه بخش‌های ثبت شده در این روز و دکمه‌های اقدام بعدی"""
    plan = context.user_data.get("plan")
    idx = plan["current_day_index"]
    day = plan["days"][idx]

    blocks = day.get("blocks", [])
    total_m = sum(
        pdf_builder.calculate_minutes_difference(b["start_time"], b["end_time"])
        for b in blocks
    )
    total_str = pdf_builder.format_duration_persian(total_m)

    lines = [
        f"📅 **{day['name']} ({pdf_builder.to_persian_digits(day['date_str'])})**",
        f"⏱ مجموع مطالعه: **{total_str}** ({pdf_builder.to_persian_digits(len(blocks))} پارت)\n",
    ]

    for i, b in enumerate(blocks, 1):
        act_title = config.ACTIVITY_TYPES.get(b["type"], {}).get("title", b["type"])
        t_range = (
            f"{pdf_builder.to_persian_digits(b['start_time'])} تا {pdf_builder.to_persian_digits(b['end_time'])}"
        )
        extra_str = f" · {b['extra']}" if b.get("extra") else ""
        lines.append(
            f"🔹 {pdf_builder.to_persian_digits(i)}. **{b['subject']}** · {b['topic']}\n"
            f"   ▫️ {act_title} | ⏰ {t_range}{extra_str}"
        )
        if b.get("note"):
            lines.append(f"   💡 _{b['note']}_")

    summary_text = "\n".join(lines)

    markup = keyboards.get_day_summary_keyboard(idx)

    if update.callback_query:
        await update.callback_query.edit_message_text(
            summary_text, reply_markup=markup, parse_mode=ParseMode.MARKDOWN
        )
    else:
        await update.message.reply_text(
            summary_text, reply_markup=markup, parse_mode=ParseMode.MARKDOWN
        )

    return config.STATE_DAY_SUMMARY


async def day_summary_action(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """مدیریت دکمه‌های خلاصه روز (افزودن بخش دیگر، ویرایش یا حذف آخرین بخش، رفتن به روز بعد)"""
    query = update.callback_query
    await query.answer()

    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    action = query.data
    idx = plan["current_day_index"]
    day = plan["days"][idx]

    if action == "day_add_another":
        plan["temp_block"] = {}
        prompt_text = (
            f"➕ **افزودن بخش جدید برای {day['name']}**\n\n"
            "لطفاً **نوع فعالیت** را انتخاب فرمایید:"
        )
        await query.edit_message_text(
            prompt_text,
            reply_markup=keyboards.get_activity_types_keyboard(),
            parse_mode=ParseMode.MARKDOWN,
        )
        return config.STATE_BLOCK_TYPE

    elif action == "day_delete_last":
        if day["blocks"]:
            removed = day["blocks"].pop()
            await query.answer(f"بخش {removed.get('subject')} حذف شد.", show_alert=False)
        else:
            await query.answer("بخشی برای حذف وجود ندارد!", show_alert=True)
        return await show_day_summary(update, context)

    elif action == "day_edit_last":
        if day["blocks"]:
            last_block = day["blocks"].pop()
            plan["temp_block"] = last_block
            await query.edit_message_text(
                f"✏️ ویرایش آخرین بخش ({last_block.get('subject')}):\nلطفاً **نوع فعالیت** را مجدداً انتخاب کنید:",
                reply_markup=keyboards.get_activity_types_keyboard(),
                parse_mode=ParseMode.MARKDOWN,
            )
            return config.STATE_BLOCK_TYPE
        else:
            await query.answer("بخشی برای ویرایش وجود ندارد!", show_alert=True)
            return await show_day_summary(update, context)

    elif action == "day_next_step":
        return await advance_to_next_day_or_finish(update, context)

    return config.STATE_DAY_SUMMARY


async def advance_to_next_day_or_finish(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """رفتن به روز بعد یا در صورت اتمام جمعه، رفتن به ثبت اهداف مشاور"""
    plan = context.user_data.get("plan")

    # اگر در حال ویرایش یک روز خاص بودیم، مستقیماً به پیش‌نمایش بازگرد
    if plan.get("editing_day_index") is not None:
        plan["editing_day_index"] = None
        return await show_final_preview(update, context)

    plan["current_day_index"] += 1
    if plan["current_day_index"] < 7:
        return await prompt_current_day(update, context)

    # اتمام تمام ۷ روز، رفتن به ثبت اهداف و توصیه‌ها
    goals_prompt = (
        "🎯 **مرحله ۵ از ۶: اهداف و توصیه‌های مشاور**\n\n"
        "لطفاً توصیه‌ها، اولویت‌های مطالعاتی و نکات کلیدی این هفته را برای دانش‌آموز مرقوم فرمایید:\n"
        "(متن چندخطی و بلند مجاز است)\n\n"
        "یا دکمه «رد کردن» را لمس نمایید تا متن استاندارد قرار گیرد:"
    )

    markup = keyboards.get_skip_keyboard("رد کردن و استفاده از متن پیش‌فرض ⏭")

    if update.callback_query:
        await update.callback_query.edit_message_text(
            goals_prompt, reply_markup=markup, parse_mode=ParseMode.MARKDOWN
        )
    else:
        await update.message.reply_text(
            goals_prompt, reply_markup=markup, parse_mode=ParseMode.MARKDOWN
        )

    return config.STATE_GOALS


async def goals_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت اهداف مشاور یا استفاده از متن پیش‌فرض"""
    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    if update.callback_query:
        await update.callback_query.answer()
        plan["goals_text"] = ""
    elif update.message:
        text = update.message.text.strip()
        if text not in ("/skip", "رد"):
            plan["goals_text"] = text
        else:
            plan["goals_text"] = ""

    return await show_final_preview(update, context)


async def show_final_preview(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """نمایش پیش‌نمایش متنی جامع برنامه هفتگی همراه با دکمه‌های تایید و ویرایش"""
    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    # محاسبه آمار
    total_week_m = 0
    active_days = 0
    day_summaries = []

    for d in plan.get("days", []):
        if d.get("is_rest"):
            day_summaries.append(f"• **{d['name']}**: ☕ روز استراحت")
        else:
            blocks = d.get("blocks", [])
            m = sum(
                pdf_builder.calculate_minutes_difference(b["start_time"], b["end_time"])
                for b in blocks
            )
            total_week_m += m
            if m > 0:
                active_days += 1
            day_summaries.append(
                f"• **{d['name']}**: {pdf_builder.format_duration_persian(m)} ({pdf_builder.to_persian_digits(len(blocks))} بخش)"
            )

    avg_m = (total_week_m // active_days) if active_days > 0 else 0

    preview_lines = [
        "🔍 **مرحله ۶ از ۶: پیش‌نمایش متنی برنامه هفتگی**\n",
        f"👤 **دانش‌آموز:** {plan['student_name']} ({plan['student_grade']} {plan['student_field']})",
        f"🎯 **هدف:** {plan['student_target']}",
        f"👨‍🏫 **مشاور:** {plan['advisor_name']}",
        f"📅 **بازه هفته:** {plan['start_date_str']} تا {plan['end_date_str']}",
        f"⏱ **مجموع ساعات هفته:** {pdf_builder.format_duration_persian(total_week_m)} ({pdf_builder.format_hhmm_persian(total_week_m)})",
        f"📊 **روزهای فعال:** {pdf_builder.to_persian_digits(active_days)} روز | میانگین روزانه: {pdf_builder.format_duration_persian(avg_m)}\n",
        "**خلاصه روزهای هفته:**",
    ]
    preview_lines.extend(day_summaries)
    preview_lines.append(
        "\nآیا اطلاعات بالا مورد تایید است؟ با زدن دکمه تایید، فایل **PDF طراحی‌شده استاندارد** فوراً تولید و برای شما ارسال خواهد شد:"
    )

    text = "\n".join(preview_lines)
    markup = keyboards.get_final_confirm_keyboard()

    if update.callback_query:
        await update.callback_query.edit_message_text(
            text, reply_markup=markup, parse_mode=ParseMode.MARKDOWN
        )
    else:
        await update.message.reply_text(
            text, reply_markup=markup, parse_mode=ParseMode.MARKDOWN
        )

    return config.STATE_CONFIRM_PLAN


async def confirm_plan_action(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """پردازش تصمیم نهایی: تولید PDF یا رفتن به ویرایش روزها"""
    query = update.callback_query
    await query.answer()

    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    action = query.data

    if action == "confirm_edit_days":
        await query.edit_message_text(
            "✏️ لطفاً روزی را که می‌خواهید ویرایش نمایید انتخاب فرمایید:",
            reply_markup=keyboards.get_days_selection_keyboard(),
        )
        return config.STATE_EDIT_DAY_SELECT

    elif action == "confirm_edit_goals":
        await query.edit_message_text(
            "✏️ لطفاً اهداف و توصیه‌های جدید مشاور را ارسال فرمایید:",
            reply_markup=keyboards.get_skip_keyboard("انصراف و بدون تغییر ⏭"),
        )
        return config.STATE_GOALS

    elif action == "confirm_generate_pdf":
        safe_student = re.sub(r"[^\w\s-]", "", plan.get("student_name", "student")).strip().replace(" ", "_")
        safe_date = (
            plan.get("days", [{}])[0].get("jdate_str", "1405-08-02").replace("/", "-")
        )
        default_filename = f"برنامه_هفتگی_{safe_student}_{safe_date}.pdf"
        plan["suggested_filename"] = default_filename

        prompt_text = (
            "📄 **مرحله نهایی: تعیین نام فایل PDF توسط مشاور**\n\n"
            f"نام پیشنهادی سامانه:\n`{default_filename}`\n\n"
            "• اگر همین نام مورد تایید شماست، دکمه **«تایید با نام پیشنهادی»** را لمس فرمایید.\n"
            "• یا در صورتی که مایلید نام اختصاصی دیگری داشته باشد، **نام دلخواه خود را تایپ و ارسال کنید**:\n"
            "(مثال: `برنامه_سارا_محمدی_کنکور۱۴۰۵` یا `برنامه_هفته_اول_سارا` یا `Zeta_Plan_Sara`)\n\n"
            "💡 *پسوند .pdf به صورت خودکار به انتهای نام فایل اضافه خواهد شد.*"
        )

        await query.edit_message_text(
            prompt_text,
            reply_markup=keyboards.get_filename_choice_keyboard(default_filename),
            parse_mode=ParseMode.MARKDOWN,
        )
        return config.STATE_PDF_FILENAME

    return config.STATE_CONFIRM_PLAN


async def pdf_filename_choice_action(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """پاسخ به دکمه‌های تایید نام پیشنهادی یا بازگشت به پیش‌نمایش"""
    query = update.callback_query
    await query.answer()

    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    if query.data == "filename_back_to_preview":
        return await show_final_preview(update, context)

    # filename_use_default
    filename = plan.get("suggested_filename", "برنامه_هفتگی.pdf")
    return await generate_and_send_pdf(update, context, filename)


async def pdf_filename_custom_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """دریافت نام سفارشی تایپ شده توسط مشاور برای فایل PDF"""
    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    raw_name = update.message.text.strip()
    # حذف کاراکترهای نامعتبر در نام‌گذاری فایل سیستم
    sanitized = re.sub(r'[/\\?%*:|"<>]+', '', raw_name).strip().replace(" ", "_")
    if not sanitized:
        sanitized = "برنامه_هفتگی"

    if not sanitized.lower().endswith(".pdf"):
        sanitized += ".pdf"

    return await generate_and_send_pdf(update, context, sanitized)


async def generate_and_send_pdf(update: Update, context: ContextTypes.DEFAULT_TYPE, filename: str) -> int:
    """تولید و ارسال فایل PDF با نام انتخابی مشاور"""
    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    chat_id = update.effective_chat.id
    wait_text = (
        f"⏳ **در حال ساخت فایل PDF با نام:**\n`{filename}`\n\n"
        "لطفاً چند ثانیه شکیبا باشید..."
    )

    if update.callback_query:
        wait_msg = await update.callback_query.edit_message_text(
            wait_text, parse_mode=ParseMode.MARKDOWN
        )
    else:
        wait_msg = await update.message.reply_text(
            wait_text, parse_mode=ParseMode.MARKDOWN
        )

    await context.bot.send_chat_action(
        chat_id=chat_id, action=ChatAction.UPLOAD_DOCUMENT
    )

    try:
        # ساخت PDF در ترد ناهمگام تا رویدادهای سرور بلاک نشوند
        pdf_bytes = await asyncio.to_thread(pdf_builder.build_pdf_bytes, plan)

        pdf_file = io.BytesIO(pdf_bytes)
        pdf_file.name = filename

        total_study_minutes = sum(
            pdf_builder.calculate_minutes_difference(b["start_time"], b["end_time"])
            for d in plan.get("days", [])
            for b in d.get("blocks", [])
        )

        caption = (
            f"🎉 **برنامه هفتگی دانش‌آموز «{plan['student_name']}» با نام انتخابی شما آماده شد!**\n\n"
            f"🏢 **موسسه آموزشی زتا | Zeta**\n"
            f"📄 نام فایل: `{filename}`\n"
            f"👨‍🏫 مشاور: {plan['advisor_name']}\n"
            f"📅 بازه: {plan['start_date_str']} تا {plan['end_date_str']}\n"
            f"⏱ جمع ساعت مطالعه: {pdf_builder.format_duration_persian(total_study_minutes)}"
        )

        await context.bot.send_document(
            chat_id=chat_id,
            document=pdf_file,
            filename=filename,
            caption=caption,
            reply_markup=keyboards.get_post_pdf_keyboard(),
            parse_mode=ParseMode.MARKDOWN,
        )

        try:
            await wait_msg.delete()
        except Exception:
            pass

    except Exception as e:
        logger.error(f"Error generating PDF: {e}", exc_info=True)
        error_msg = (
            f"⚠️ متاسفانه در فرآیند تولید PDF خطایی رخ داد: `{e}`\n"
            "لطفاً مجدداً دکمه تایید را لمس فرمایید یا با پشتیبانی تماس بگیرید."
        )
        if update.callback_query:
            await update.callback_query.message.reply_text(
                error_msg,
                reply_markup=keyboards.get_final_confirm_keyboard(),
                parse_mode=ParseMode.MARKDOWN,
            )
        else:
            await update.message.reply_text(
                error_msg,
                reply_markup=keyboards.get_final_confirm_keyboard(),
                parse_mode=ParseMode.MARKDOWN,
            )
        return config.STATE_CONFIRM_PLAN

    return ConversationHandler.END


async def edit_day_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """انتخاب یک روز خاص برای ویرایش مجدد"""
    query = update.callback_query
    await query.answer()

    plan = context.user_data.get("plan")
    if not plan:
        await start.session_expired_handler(update, context)
        return ConversationHandler.END

    if query.data == "edit_day_back":
        return await show_final_preview(update, context)

    day_idx = int(query.data.replace("edit_day_", ""))
    plan["current_day_index"] = day_idx
    plan["editing_day_index"] = day_idx

    # بازنشانی بخش‌های این روز جهت ثبت مجدد تمیز
    day = plan["days"][day_idx]
    day["blocks"] = []
    day["is_rest"] = False

    prompt_text = (
        f"✏️ **ویرایش روز {day['name']} ({pdf_builder.to_persian_digits(day['date_str'])})**\n\n"
        "بخش‌های قبلی این روز بازنشانی شدند. مایلید این روز را چگونه تنظیم کنید؟"
    )

    await query.edit_message_text(
        prompt_text,
        reply_markup=keyboards.get_day_action_keyboard(is_edit=True),
        parse_mode=ParseMode.MARKDOWN,
    )
    return config.STATE_DAY_ACTION


def get_plan_conversation_handler() -> ConversationHandler:
    """ساخت و برگرداندن هندلر کامل مکالمه ثبت برنامه هفتگی"""
    return ConversationHandler(
        entry_points=[
            CallbackQueryHandler(start_new_plan, pattern="^btn_new_plan$"),
            CommandHandler("newplan", start_new_plan),
        ],
        states={
            config.STATE_ADVISOR_NAME: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, advisor_name_received)
            ],
            config.STATE_STUDENT_NAME: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, student_name_received)
            ],
            config.STATE_STUDENT_GRADE: [
                CallbackQueryHandler(student_grade_selected, pattern="^grade_")
            ],
            config.STATE_STUDENT_FIELD: [
                CallbackQueryHandler(student_field_selected, pattern="^field_")
            ],
            config.STATE_STUDENT_TARGET: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, student_target_received)
            ],
            config.STATE_START_DATE: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, start_date_received)
            ],
            config.STATE_CONFIRM_NON_SATURDAY: [
                CallbackQueryHandler(
                    non_saturday_confirmed, pattern="^confirm_date_"
                )
            ],
            config.STATE_DAY_ACTION: [
                CallbackQueryHandler(day_action_selected, pattern="^day_action_")
            ],
            config.STATE_BLOCK_TYPE: [
                CallbackQueryHandler(block_type_selected, pattern="^act_")
            ],
            config.STATE_BLOCK_SUBJECT: [
                CallbackQueryHandler(block_subject_selected, pattern="^subj_")
            ],
            config.STATE_BLOCK_CUSTOM_SUBJECT: [
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND, block_custom_subject_received
                )
            ],
            config.STATE_BLOCK_TOPIC: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, block_topic_received)
            ],
            config.STATE_BLOCK_TIME: [
                CallbackQueryHandler(
                    block_time_callback_received, pattern="^time_"
                ),
                MessageHandler(filters.TEXT & ~filters.COMMAND, block_time_received),
            ],
            config.STATE_BLOCK_EXTRA: [
                CallbackQueryHandler(
                    block_extra_received, pattern="^(btn_skip|extra_)"
                ),
                MessageHandler(filters.TEXT & ~filters.COMMAND, block_extra_received),
            ],
            config.STATE_BLOCK_NOTE: [
                CallbackQueryHandler(block_note_received, pattern="^btn_skip$"),
                MessageHandler(filters.TEXT & ~filters.COMMAND, block_note_received),
            ],
            config.STATE_DAY_SUMMARY: [
                CallbackQueryHandler(day_summary_action, pattern="^day_")
            ],
            config.STATE_GOALS: [
                CallbackQueryHandler(goals_received, pattern="^btn_skip$"),
                MessageHandler(filters.TEXT & ~filters.COMMAND, goals_received),
            ],
            config.STATE_CONFIRM_PLAN: [
                CallbackQueryHandler(confirm_plan_action, pattern="^confirm_")
            ],
            config.STATE_EDIT_DAY_SELECT: [
                CallbackQueryHandler(edit_day_selected, pattern="^edit_day_")
            ],
            config.STATE_PDF_FILENAME: [
                CallbackQueryHandler(
                    pdf_filename_choice_action, pattern="^filename_"
                ),
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND, pdf_filename_custom_received
                ),
            ],
        },
        fallbacks=[
            CommandHandler("cancel", start.cancel_command),
            CallbackQueryHandler(start.cancel_command, pattern="^btn_cancel$"),
            CommandHandler("start", start.start_command),
            CallbackQueryHandler(start.start_command, pattern="^btn_start$"),
        ],
        allow_reentry=True,
    )
