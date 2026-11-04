"""
Zeta Telegram Bot - Configuration Module
تنظیمات محیطی، ثابت‌ها، لیست درس‌ها، انواع فعالیت‌ها و متغیرهای پیکربندی موسسه زتا
"""

import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
FONTS_DIR = BASE_DIR / "fonts"
ASSETS_DIR = BASE_DIR / "assets"
LOGO_PATH = ASSETS_DIR / "logo.png"

# Environment Variables
BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
WEBHOOK_URL = os.getenv("WEBHOOK_URL", "").strip().rstrip("/")
PORT = int(os.getenv("PORT", "10000"))
DEBUG = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

# Allowed numeric Telegram IDs for advisors
# Format in .env: ALLOWED_IDS=12345678,87654321
_allowed_ids_raw = os.getenv("ALLOWED_IDS", "").strip()
if _allowed_ids_raw:
    ALLOWED_IDS = {
        int(x.strip()) for x in _allowed_ids_raw.split(",") if x.strip().isdigit()
    }
else:
    ALLOWED_IDS = set()

# Institute Branding
INSTITUTE_NAME = "Zeta | زتا"
INSTITUTE_TITLE_FA = "موسسه آموزشی زتا"

# Default subjects (مشاور می‌تواند از طریق config.py یا دکمه سایر درس را سفارشی کند)
DEFAULT_SUBJECTS = [
    "زیست‌شناسی",
    "ریاضی",
    "فیزیک",
    "شیمی",
    "ادبیات فارسی",
    "عربی",
    "زبان انگلیسی",
    "دین و زندگی",
    "زمین‌شناسی",
    "هندسه",
    "حسابان",
    "گسسته",
]

# Activity types with keys, Persian labels, CSS chip classes, and SVG icon identifiers
ACTIVITY_TYPES = {
    "study": {
        "title": "مطالعه",
        "css_class": "c-study",
        "icon_id": "i-study",
    },
    "review": {
        "title": "مرور",
        "css_class": "c-review",
        "icon_id": "i-review",
    },
    "test": {
        "title": "تست‌زنی",
        "css_class": "c-test",
        "icon_id": "i-test",
    },
    "video": {
        "title": "ویدیو / کلاس",
        "css_class": "c-video",
        "icon_id": "i-video",
    },
    "exam": {
        "title": "آزمون",
        "css_class": "c-exam",
        "icon_id": "i-exam",
    },
    "summary": {
        "title": "جمع‌بندی",
        "css_class": "c-summary",
        "icon_id": "i-summary",
    },
    "doubt": {
        "title": "رفع اشکال",
        "css_class": "c-doubt",
        "icon_id": "i-doubt",
    },
}

# Grades (پایه‌های تحصیلی)
GRADES = [
    "هفتم",
    "هشتم",
    "نهم",
    "دهم",
    "یازدهم",
    "دوازدهم",
    "فارغ‌التحصیل",
]

# Major/Fields of Study (رشته‌ها)
FIELDS = [
    "تجربی",
    "ریاضی",
    "انسانی",
    "سایر",
]

# Days of the week in Persian order
WEEKDAYS_FA = [
    "شنبه",
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
]

# Conversation Steps / States for telegram.ext.ConversationHandler
(
    STATE_ADVISOR_NAME,
    STATE_STUDENT_NAME,
    STATE_STUDENT_GRADE,
    STATE_STUDENT_FIELD,
    STATE_STUDENT_TARGET,
    STATE_START_DATE,
    STATE_CONFIRM_NON_SATURDAY,
    STATE_DAY_ACTION,           # انتخاب افزودن بخش یا روز استراحت
    STATE_BLOCK_TYPE,           # انتخاب نوع فعالیت
    STATE_BLOCK_SUBJECT,        # انتخاب یا ورود درس
    STATE_BLOCK_CUSTOM_SUBJECT, # ورود دستی نام درس اگر سایر انتخاب شد
    STATE_BLOCK_TOPIC,          # مبحث / فصل
    STATE_BLOCK_TIME,           # ساعت شروع و پایان
    STATE_BLOCK_EXTRA,          # تعداد تست یا صفحه (اختیاری)
    STATE_BLOCK_NOTE,           # توضیحات (اختیاری)
    STATE_DAY_SUMMARY,          # خلاصه بخش‌های روز + تصمیم بعدی
    STATE_EDIT_DAY_SELECT,      # انتخاب روز برای ویرایش
    STATE_GOALS,                # اهداف و توصیه‌های مشاور
    STATE_CONFIRM_PLAN,         # پیش‌نمایش متنی و تایید نهایی برای ساخت PDF
    STATE_PDF_FILENAME,         # تعیین نام فایل PDF توسط مشاور
) = range(20)
