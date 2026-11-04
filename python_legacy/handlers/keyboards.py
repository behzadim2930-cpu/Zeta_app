"""
Zeta Telegram Bot - Inline Keyboards Module
سازنده کیبوردهای شیشه‌ای اینلاین برای تمام مراحل ثبت برنامه
طراحی شیک، ساده، مینیمال و کاربرپسند
"""

from typing import List
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

import config


def get_start_keyboard() -> InlineKeyboardMarkup:
    """کیبورد پیام خوش‌آمدگویی و شروع"""
    keyboard = [
        [
            InlineKeyboardButton(
                "➕ ثبت برنامه جدید", callback_data="btn_new_plan"
            )
        ],
        [
            InlineKeyboardButton(
                "📖 راهنمای سریع", callback_data="btn_help"
            )
        ],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_grades_keyboard() -> InlineKeyboardMarkup:
    """کیبورد انتخاب پایه تحصیلی دانش‌آموز"""
    buttons = [
        [
            InlineKeyboardButton("هفتم", callback_data="grade_هفتم"),
            InlineKeyboardButton("هشتم", callback_data="grade_هشتم"),
            InlineKeyboardButton("نهم", callback_data="grade_نهم"),
        ],
        [
            InlineKeyboardButton("دهم", callback_data="grade_دهم"),
            InlineKeyboardButton("یازدهم", callback_data="grade_یازدهم"),
            InlineKeyboardButton("دوازدهم", callback_data="grade_دوازدهم"),
        ],
        [
            InlineKeyboardButton("🎓 فارغ‌التحصیل / کنکوری", callback_data="grade_فارغ‌التحصیل"),
        ],
        [InlineKeyboardButton("❌ انصراف", callback_data="btn_cancel")],
    ]
    return InlineKeyboardMarkup(buttons)


def get_fields_keyboard() -> InlineKeyboardMarkup:
    """کیبورد انتخاب رشته تحصیلی دانش‌آموز"""
    buttons = [
        [
            InlineKeyboardButton("🩺 تجربی", callback_data="field_تجربی"),
            InlineKeyboardButton("📐 ریاضی", callback_data="field_ریاضی"),
        ],
        [
            InlineKeyboardButton("⚖️ انسانی", callback_data="field_انسانی"),
            InlineKeyboardButton("🔹 سایر رشته‌ها", callback_data="field_سایر"),
        ],
        [InlineKeyboardButton("❌ انصراف", callback_data="btn_cancel")],
    ]
    return InlineKeyboardMarkup(buttons)


def get_non_saturday_keyboard() -> InlineKeyboardMarkup:
    """کیبورد تایید یا ویرایش در صورت غیر شنبه بودن تاریخ شروع"""
    keyboard = [
        [
            InlineKeyboardButton(
                "✅ ادامه با همین تاریخ", callback_data="confirm_date_yes"
            ),
            InlineKeyboardButton(
                "✏️ ویرایش تاریخ", callback_data="confirm_date_edit"
            ),
        ],
        [InlineKeyboardButton("❌ انصراف", callback_data="btn_cancel")],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_day_action_keyboard(can_copy_prev: bool = False, is_edit: bool = False) -> InlineKeyboardMarkup:
    """کیبورد شروع روز: افزودن بخش، کپی از روز قبل، یا ثبت روز استراحت"""
    keyboard = [
        [
            InlineKeyboardButton(
                "➕ افزودن پارت درسی", callback_data="day_action_add_block"
            )
        ],
    ]
    if can_copy_prev:
        keyboard.append([
            InlineKeyboardButton(
                "📋 کپی پارت‌های دیروز به امروز", callback_data="day_action_copy_prev"
            )
        ])
    keyboard.extend([
        [
            InlineKeyboardButton(
                "☕ ثبت به عنوان روز استراحت", callback_data="day_action_rest"
            )
        ],
        [InlineKeyboardButton("❌ انصراف", callback_data="btn_cancel")],
    ])
    return InlineKeyboardMarkup(keyboard)


def get_activity_types_keyboard() -> InlineKeyboardMarkup:
    """کیبورد انواع فعالیت درسی شیک و منظم"""
    keyboard = [
        [
            InlineKeyboardButton("📖 مطالعه", callback_data="act_study"),
            InlineKeyboardButton("🔄 مرور", callback_data="act_review"),
        ],
        [
            InlineKeyboardButton("✍️ تست‌زنی", callback_data="act_test"),
            InlineKeyboardButton("🎥 کلاس / ویدیو", callback_data="act_video"),
        ],
        [
            InlineKeyboardButton("📝 آزمون", callback_data="act_exam"),
            InlineKeyboardButton("🎯 جمع‌بندی", callback_data="act_summary"),
        ],
        [
            InlineKeyboardButton("💡 رفع اشکال", callback_data="act_doubt"),
        ],
        [InlineKeyboardButton("❌ انصراف", callback_data="btn_cancel")],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_subjects_keyboard(subjects: List[str] = None) -> InlineKeyboardMarkup:
    """کیبورد انتخاب درس‌های رایج با دکمه سایر برای تایپ دستی"""
    if subjects is None:
        subjects = config.DEFAULT_SUBJECTS

    buttons = []
    row = []
    for s in subjects:
        row.append(InlineKeyboardButton(s, callback_data=f"subj_{s}"))
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)

    buttons.append(
        [
            InlineKeyboardButton(
                "✏️ سایر درس‌ها (تایپ نام)", callback_data="subj_custom"
            )
        ]
    )
    buttons.append([InlineKeyboardButton("❌ انصراف", callback_data="btn_cancel")])
    return InlineKeyboardMarkup(buttons)


def get_skip_keyboard(button_text: str = "⏩ رد کردن این مرحله") -> InlineKeyboardMarkup:
    """دکمه رد کردن مراحل اختیاری"""
    keyboard = [
        [InlineKeyboardButton(button_text, callback_data="btn_skip")],
        [InlineKeyboardButton("❌ انصراف", callback_data="btn_cancel")],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_time_presets_keyboard() -> InlineKeyboardMarkup:
    """کیبورد ساعت‌های پیشنهادی رایج مطالعاتی + دکمه ورود دستی"""
    keyboard = [
        [
            InlineKeyboardButton("🌅 ۰۸:۰۰ تا ۰۹:۳۰", callback_data="time_08:00_09:30"),
            InlineKeyboardButton("☀️ ۰۹:۴۵ تا ۱۱:۱۵", callback_data="time_09:45_11:15"),
        ],
        [
            InlineKeyboardButton("🌤 ۱۱:۳۰ تا ۱۳:۰۰", callback_data="time_11:30_13:00"),
            InlineKeyboardButton("☕ ۱۶:۰۰ تا ۱۷:۳۰", callback_data="time_16:00_17:30"),
        ],
        [
            InlineKeyboardButton("🌆 ۱۸:۰۰ تا ۱۹:۳۰", callback_data="time_18:00_19:30"),
            InlineKeyboardButton("🌙 ۲۰:۰۰ تا ۲۱:۳۰", callback_data="time_20:00_21:30"),
        ],
        [
            InlineKeyboardButton("✏️ تایپ ساعت دلخواه", callback_data="time_manual")
        ],
        [InlineKeyboardButton("❌ انصراف", callback_data="btn_cancel")],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_extra_presets_keyboard() -> InlineKeyboardMarkup:
    """کیبورد سریع تعداد تست و صفحات رایج"""
    keyboard = [
        [
            InlineKeyboardButton("۲۰ تست", callback_data="extra_۲۰ تست"),
            InlineKeyboardButton("۳۰ تست", callback_data="extra_۳۰ تست"),
            InlineKeyboardButton("۵۰ تست", callback_data="extra_۵۰ تست"),
        ],
        [
            InlineKeyboardButton("۱۵ صفحه", callback_data="extra_۱۵ صفحه"),
            InlineKeyboardButton("۲۰ صفحه", callback_data="extra_۲۰ صفحه"),
            InlineKeyboardButton("تست زوج و فرد", callback_data="extra_تست‌های زوج و فرد"),
        ],
        [
            InlineKeyboardButton("⏩ رد کردن (بدون ثبت)", callback_data="btn_skip"),
        ],
        [InlineKeyboardButton("❌ انصراف", callback_data="btn_cancel")],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_day_summary_keyboard(day_index: int) -> InlineKeyboardMarkup:
    """کیبورد پایان ثبت بخش در یک روز و رفتن به بخش یا روز بعد"""
    is_last_day = (day_index >= 6)
    next_btn_text = (
        "🏁 اتمام روزها و ثبت اهداف ➡️"
        if is_last_day
        else "➡️ تایید و رفتن به روز بعد"
    )

    keyboard = [
        [
            InlineKeyboardButton(
                "➕ پارت بعدی برای امروز",
                callback_data="day_add_another",
            )
        ],
        [
            InlineKeyboardButton(
                next_btn_text, callback_data="day_next_step"
            )
        ],
        [
            InlineKeyboardButton(
                "🗑 حذف پارت آخر", callback_data="day_delete_last"
            ),
            InlineKeyboardButton("❌ انصراف", callback_data="btn_cancel"),
        ],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_final_confirm_keyboard() -> InlineKeyboardMarkup:
    """کیبورد پیش‌نمایش و تایید نهایی برای ساخت PDF"""
    keyboard = [
        [
            InlineKeyboardButton(
                "📄 تایید و صدور فایل PDF",
                callback_data="confirm_generate_pdf",
            )
        ],
        [
            InlineKeyboardButton(
                "✏️ ویرایش روزها",
                callback_data="confirm_edit_days",
            ),
            InlineKeyboardButton(
                "✏️ ویرایش اهداف",
                callback_data="confirm_edit_goals",
            ),
        ],
        [InlineKeyboardButton("❌ انصراف", callback_data="btn_cancel")],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_days_selection_keyboard() -> InlineKeyboardMarkup:
    """کیبورد انتخاب روز برای ویرایش سریع"""
    buttons = []
    row = []
    for idx, day_name in enumerate(config.WEEKDAYS_FA):
        row.append(
            InlineKeyboardButton(day_name, callback_data=f"edit_day_{idx}")
        )
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)

    buttons.append(
        [InlineKeyboardButton("🔙 بازگشت به پیش‌نمایش", callback_data="edit_day_back")]
    )
    return InlineKeyboardMarkup(buttons)


def get_post_pdf_keyboard() -> InlineKeyboardMarkup:
    """کیبورد بعد از ارسال موفقیت‌آمیز فایل PDF"""
    keyboard = [
        [
            InlineKeyboardButton(
                "➕ ثبت برنامه دانش‌آموز بعدی",
                callback_data="btn_new_plan",
            )
        ],
        [
            InlineKeyboardButton(
                "🔄 ویرایش همین برنامه و صدور مجدد",
                callback_data="btn_reedit_plan",
            )
        ],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_filename_choice_keyboard(default_name: str) -> InlineKeyboardMarkup:
    """کیبورد انتخاب یا تایید نام فایل ارسالی PDF توسط مشاور"""
    keyboard = [
        [
            InlineKeyboardButton(
                "✅ تایید همین نام پیشنهادی",
                callback_data="filename_use_default",
            )
        ],
        [
            InlineKeyboardButton(
                "🔙 بازگشت به پیش‌نمایش",
                callback_data="filename_back_to_preview",
            )
        ],
        [InlineKeyboardButton("❌ انصراف", callback_data="btn_cancel")],
    ]
    return InlineKeyboardMarkup(keyboard)
