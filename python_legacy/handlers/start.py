"""
Zeta Telegram Bot - Start & Common Handlers
دستورات /start و /help و /cancel و بررسی سطح دسترسی مشاوران مجاز
"""

import logging
from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes, ConversationHandler

import config
from handlers import keyboards

logger = logging.getLogger(__name__)


def is_user_allowed(user_id: int) -> bool:
    """بررسی اینکه آیا مشاور در لیست آیدی‌های عددی مجاز قرار دارد یا خیر"""
    if not config.ALLOWED_IDS:
        # اگر لیست مجازها تنظیم نشده بود، در حالت تست دسترسی آزاد است
        return True
    return user_id in config.ALLOWED_IDS


async def check_access(update: Update) -> bool:
    """بررسی دسترسی کاربر و ارسال پیام مودبانه در صورت عدم دسترسی"""
    user = update.effective_user
    if not user or not is_user_allowed(user.id):
        msg_text = (
            "⛔️ **همکار گرامی، شما دسترسی به این ربات را ندارید.**\n\n"
            f"لطفاً شناسه عددی تلگرام خود (`{user.id if user else 'نامشخص'}`) را "
            "جهت تعریف دسترسی به مدیریت موسسه **Zeta | زتا** اعلام فرمایید."
        )
        if update.callback_query:
            await update.callback_query.answer("عدم دسترسی!", show_alert=True)
            await update.callback_query.message.reply_text(
                msg_text, parse_mode=ParseMode.MARKDOWN
            )
        elif update.message:
            await update.message.reply_text(
                msg_text, parse_mode=ParseMode.MARKDOWN
            )
        return False
    return True


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """پاسخ به دستور /start یا لمس دکمه شروع"""
    if not await check_access(update):
        return ConversationHandler.END

    user = update.effective_user
    advisor_name = user.full_name if user else "مشاور گرامی"

    welcome_text = (
        "✨ **موسسه آموزشی زتا | Zeta**\n"
        "سامانه هوشمند تنظیم برنامه هفتگی دانش‌آموزان\n\n"
        f"سلام {advisor_name} عزیز، خوش آمدید.\n"
        "جهت شروع و تنظیم برنامه جدید، دکمه زیر را لمس فرمایید:"
    )

    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(
            welcome_text,
            reply_markup=keyboards.get_start_keyboard(),
            parse_mode=ParseMode.MARKDOWN,
        )
    else:
        await update.message.reply_text(
            welcome_text,
            reply_markup=keyboards.get_start_keyboard(),
            parse_mode=ParseMode.MARKDOWN,
        )

    return ConversationHandler.END


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """پاسخ به راهنمای ربات"""
    if not await check_access(update):
        return

    help_text = (
        "📖 **راهنمای سریع ثبت برنامه هفتگی (زتا)**\n\n"
        "▫️ **گام ۱:** مشخصات مشاور و دانش‌آموز\n"
        "▫️ **گام ۲:** تاریخ شروع شنبه (مانند `1405/08/02`)\n"
        "▫️ **گام ۳:** ثبت روزهای شنبه تا جمعه (پارت درسی، کپی از دیروز یا استراحت)\n"
        "▫️ **گام ۴:** توصیه‌های مشاور و پیش‌نمایش\n"
        "▫️ **گام ۵:** انتخاب نام فایل و دریافت مستقیم PDF استاندارد A4\n\n"
        "💡 *اعداد فارسی و انگلیسی و فرمت‌های مختلف ساعت (مانند ۰۸:۰۰ تا ۰۹:۳۰) پشتیبانی می‌شوند.*"
    )

    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.message.reply_text(
            help_text, parse_mode=ParseMode.MARKDOWN
        )
    else:
        await update.message.reply_text(
            help_text, parse_mode=ParseMode.MARKDOWN
        )


async def cancel_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """لغو فرآیند جاری و پاک‌سازی حافظه موقت"""
    context.user_data.clear()

    cancel_text = (
        "❌ فرآیند ثبت برنامه لغو شد و اطلاعات موقت پاک شدند.\n"
        "هر زمان مایل بودید می‌توانید با دستور /start برنامه جدیدی را ثبت فرمایید."
    )

    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(
            cancel_text,
            reply_markup=keyboards.get_start_keyboard(),
        )
    elif update.message:
        await update.message.reply_text(
            cancel_text,
            reply_markup=keyboards.get_start_keyboard(),
        )

    return ConversationHandler.END


async def session_expired_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """پاسخ به کلیک روی دکمه‌های قدیمی که نشست آن‌ها در سرور منقضی شده است"""
    if update.callback_query:
        await update.callback_query.answer(
            "نشست شما منقضی شده است. لطفاً /start را ارسال کنید.", show_alert=True
        )
        await update.callback_query.message.reply_text(
            "⚠️ نشست کاری شما منقضی شده است یا ربات بازنشانی گردیده است.\n"
            "لطفاً جهت شروع مجدد، دستور /start را ارسال کنید.",
            reply_markup=keyboards.get_start_keyboard(),
        )
