"""
Zeta Telegram Bot - PDF Builder Module
موتور تبدیل داده‌های برنامه هفتگی به HTML تمپلیت Jinja2 و خروجی نهایی PDF با WeasyPrint
"""

import base64
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import jdatetime
from jinja2 import Environment, FileSystemLoader

import config

# Persian & English digit mappings
PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"
ENGLISH_DIGITS = "0123456789"

EN_TO_FA_TRANS = str.maketrans("0123456789", PERSIAN_DIGITS)
FA_TO_EN_TRANS = str.maketrans(PERSIAN_DIGITS + ARABIC_DIGITS, "0123456789" * 2)


def to_persian_digits(value: Any) -> str:
    """تبدیل تمام ارقام انگلیسی یا اعداد به ارقام فارسی"""
    if value is None:
        return ""
    return str(value).translate(EN_TO_FA_TRANS)


def to_english_digits(value: Any) -> str:
    """تبدیل ارقام فارسی و عربی به انگلیسی جهت محاسبات عددی"""
    if value is None:
        return ""
    return str(value).translate(FA_TO_EN_TRANS)


def parse_time_str(time_str: str) -> Optional[Tuple[int, int]]:
    """تبدیل رشته ساعت (مانند 08:30 یا ۸:۳۰) به تاپل (ساعت, دقیقه)"""
    cleaned = to_english_digits(time_str).strip()
    match = re.match(r"^(\d{1,2}):(\d{2})$", cleaned)
    if not match:
        return None
    h, m = int(match.group(1)), int(match.group(2))
    if 0 <= h <= 23 and 0 <= m <= 59:
        return h, m
    return None


def calculate_minutes_difference(start_time: str, end_time: str) -> int:
    """محاسبه مدت زمان به دقیقه بین دو رشته ساعت"""
    st = parse_time_str(start_time)
    et = parse_time_str(end_time)
    if not st or not et:
        return 0
    start_total = st[0] * 60 + st[1]
    end_total = et[0] * 60 + et[1]
    diff = end_total - start_total
    return diff if diff > 0 else 0


def format_duration_persian(minutes: int) -> str:
    """فرمت‌بندی مدت زمان به متن فارسی (مثلاً: ۱ ساعت و ۳۰ دقیقه)"""
    if minutes <= 0:
        return "۰ دقیقه"
    hours = minutes // 60
    rem_minutes = minutes % 60

    parts = []
    if hours > 0:
        parts.append(f"{to_persian_digits(hours)} ساعت")
    if rem_minutes > 0:
        parts.append(f"{to_persian_digits(rem_minutes)} دقیقه")

    return " و ".join(parts)


def format_hhmm_persian(total_minutes: int) -> str:
    """تبدیل کل دقایق به فرمت ۲۶:۰۰ با ارقام فارسی"""
    hours = total_minutes // 60
    minutes = total_minutes % 60
    return to_persian_digits(f"{hours:02d}:{minutes:02d}")


def calculate_block_height(block: Dict[str, Any]) -> int:
    """
    تابع کمکی جهت محاسبه دقیق ارتفاع هر بلوک مطالعاتی بر حسب پیکسل
    جلوگیری از در هم رفتن متون در PDF و اطمینان از شکسته‌نشدن نادرست بین صفحات
    """
    # ارتفاع پایه جدول (پدینگ، بردر و چیپ فعالیت)
    base_h = 36
    topic_str = str(block.get("topic", "")).strip()
    # محاسبه تعداد خطوط مبحث بر اساس عرض ستون مبحث
    topic_lines = max(1, (len(topic_str) + 35) // 36)
    base_h += (topic_lines - 1) * 16

    if block.get("extra"):
        base_h += 2

    note_str = str(block.get("note", "")).strip()
    if note_str:
        note_lines = max(1, (len(note_str) + 51) // 52)
        base_h += 10 + (note_lines * 18)

    return base_h


def calculate_day_height(day: Dict[str, Any]) -> int:
    """
    تابع کمکی برای محاسبه دقیق ارتفاع کارت روز
    جهت اعمال صریح break-inside: avoid و جلوگیری از شکستن در صفحات مختلف
    """
    if day.get("is_rest"):
        return 96
    # ارتفاع هدر روز (۳۸ پیکسل) + بردر
    total = 42
    for b in day.get("blocks", []):
        total += calculate_block_height(b)
    return total



def get_logo_data_uri() -> str:
    """خواندن لوگوی زتا از مسیر فایل و تبدیل به Base64 Data URI"""
    if config.LOGO_PATH.exists():
        with open(config.LOGO_PATH, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")
            return f"data:image/png;base64,{encoded}"
    return ""


# SVG Inline definitions for WeasyPrint 100% compatibility (avoiding <use> resolver bugs in cairo)
SVG_ICONS = {
    "study": '<svg class="ic" viewBox="0 0 24 24" width="15" height="15"><path d="M12 6.5C10.5 5.3 8.2 4.8 4 5v12c4.2-.2 6.5.3 8 1.5 1.5-1.2 3.8-1.7 8-1.5V5c-4.2-.2-6.5.3-8 1.5z"/><path d="M12 6.5v12"/></svg>',
    "review": '<svg class="ic" viewBox="0 0 24 24" width="15" height="15"><path d="M20 11a8 8 0 0 0-14.5-4.2L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 14.5 4.2L20 15.5"/><path d="M20 20v-4.5h-4.5"/></svg>',
    "test": '<svg class="ic" viewBox="0 0 24 24" width="15" height="15"><rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M8 9l1.5 1.5L12 8"/><path d="M14 9.5h3"/><path d="M8 15l1.5 1.5L12 14"/><path d="M14 15.5h3"/></svg>',
    "video": '<svg class="ic" viewBox="0 0 24 24" width="15" height="15"><rect x="3" y="4.5" width="18" height="12.5" rx="3"/><path d="M10 8.5v5l4.2-2.5z"/><path d="M8 20.5h8"/></svg>',
    "exam": '<svg class="ic" viewBox="0 0 24 24" width="15" height="15"><path d="M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 20V5A1.5 1.5 0 0 1 6.5 3.5z"/><path d="M14 3.5V8h4"/><path d="M8.5 13h7M8.5 17h4"/></svg>',
    "summary": '<svg class="ic" viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/></svg>',
    "doubt": '<svg class="ic" viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.8"/><path d="M12 16.8v.1"/></svg>',
    "rest": '<svg class="ic" viewBox="0 0 24 24" width="15" height="15"><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H15.5"/><path d="M8 3.5v2M11 3.5v2"/></svg>',
}


def prepare_template_context(plan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    پردازش، اعتبارسنجی و تبدیل داده‌های خام مشاور به بافت تمیز Jinja2
    شامل محاسبه جمع ساعات هر روز، درصد نمودار میله‌ای، اعداد فارسی، و چیدمان صفحات
    """
    student_name = plan_data.get("student_name", "").strip() or "دانش‌آموز"
    student_grade = plan_data.get("student_grade", "").strip() or "دوازدهم"
    student_field = plan_data.get("student_field", "").strip() or "تجربی"
    student_target = (
        plan_data.get("student_target", "").strip() or "موفقیت در کنکور سراسری"
    )

    advisor_name = plan_data.get("advisor_name", "").strip() or "مشاور موسسه"
    week_title = plan_data.get("week_title", "").strip() or "برنامه هفتگی"
    created_date = (
        plan_data.get("created_date", "").strip()
        or jdatetime.date.today().strftime("%d %B %Y")
    )

    start_date_str = plan_data.get("start_date_str", "")
    end_date_str = plan_data.get("end_date_str", "")

    # Days list processing
    raw_days = plan_data.get("days", [])
    processed_days = []
    daily_minutes_list = []

    for day in raw_days:
        day_name = day.get("name", "")
        date_str = to_persian_digits(day.get("date_str", ""))
        is_rest = bool(day.get("is_rest", False))
        rest_text = day.get(
            "rest_text",
            "امروز برنامه درسی نداری. استراحت، پیاده‌روی و خواب کافی هم بخشی از برنامه است.",
        )

        day_total_minutes = 0
        processed_blocks = []

        if not is_rest:
            for b in day.get("blocks", []):
                b_type_key = b.get("type", "study")
                type_info = config.ACTIVITY_TYPES.get(
                    b_type_key, config.ACTIVITY_TYPES["study"]
                )

                start_t = b.get("start_time", "08:00")
                end_t = b.get("end_time", "09:30")
                diff_m = calculate_minutes_difference(start_t, end_t)
                day_total_minutes += diff_m

                time_range_fa = (
                    f"{to_persian_digits(start_t)} – {to_persian_digits(end_t)}"
                )
                duration_fa = format_duration_persian(diff_m)

                extra_fa = to_persian_digits(b.get("extra", "")).strip()
                note_text = b.get("note", "").strip()

                processed_blocks.append(
                    {
                        "type_key": b_type_key,
                        "type_title": type_info["title"],
                        "css_class": type_info["css_class"],
                        "icon_svg": SVG_ICONS.get(b_type_key, SVG_ICONS["study"]),
                        "subject": b.get("subject", ""),
                        "topic": b.get("topic", ""),
                        "time_range": time_range_fa,
                        "duration_str": duration_fa,
                        "extra": extra_fa,
                        "note": note_text,
                    }
                )

        daily_minutes_list.append(day_total_minutes)
        processed_days.append(
            {
                "name": day_name,
                "date_str": date_str,
                "is_rest": is_rest,
                "rest_text": rest_text,
                "total_minutes": day_total_minutes,
                "total_hours_str": format_hhmm_persian(day_total_minutes),
                "blocks": processed_blocks,
            }
        )

    # Weekly statistics
    weekly_total_minutes = sum(daily_minutes_list)
    active_days_count = sum(1 for m in daily_minutes_list if m > 0)
    avg_minutes = (
        (weekly_total_minutes // active_days_count) if active_days_count > 0 else 0
    )

    # Bar chart heights calculation
    max_minutes = max(daily_minutes_list) if daily_minutes_list else 0
    chart_bars = []
    for day_data in processed_days:
        m = day_data["total_minutes"]
        if max_minutes > 0 and m > 0:
            pct = max(10, int((m / max_minutes) * 100))
            val_str = day_data["total_hours_str"]
            is_zero = False
        else:
            pct = 3
            val_str = "–"
            is_zero = True

        chart_bars.append(
            {
                "day_name": day_data["name"],
                "val_str": val_str,
                "height_pct": pct,
                "is_zero": is_zero,
            }
        )

    # Goals and Recommendations
    raw_goals = plan_data.get("goals_text", "")
    if isinstance(raw_goals, list):
        goals_paragraphs = [p.strip() for p in raw_goals if p.strip()]
    elif isinstance(raw_goals, str) and raw_goals.strip():
        goals_paragraphs = [
            p.strip() for p in raw_goals.strip().split("\n") if p.strip()
        ]
    else:
        goals_paragraphs = [
            "اولویت این هفته تثبیت فصل‌های مطالعه‌شده و افزایش تمرکز در حل تست‌های محاسباتی است. قبل از شروع هر جلسه، ۵ دقیقه نکات جلسه قبل را مرور کن.",
            "خواب منظم (حداقل ۷ ساعت) و پرهیز از تلفن همراه در ساعت‌های مطالعه شرط اصلی اجرای این برنامه است. در صورت نیاز به تغییر در جلسه هفتگی با هم هماهنگ می‌کنیم.",
        ]

    # Organize days into 3 visual A4 pages exactly matching zeta-weekly-plan-preview.html:
    # Page 1: Sat, Sun
    # Page 2: Mon, Tue, Wed
    # Page 3: Thu, Fri + Goals + Tracker
    page1_days = processed_days[0:2] if len(processed_days) >= 2 else processed_days
    page2_days = (
        processed_days[2:5]
        if len(processed_days) >= 5
        else processed_days[2:] if len(processed_days) > 2 else []
    )
    page3_days = processed_days[5:7] if len(processed_days) >= 7 else []

    context = {
        "logo_base64": get_logo_data_uri(),
        "student": {
            "name": student_name,
            "grade": student_grade,
            "field": student_field,
            "grade_and_field": f"{student_grade} {student_field}",
            "target": student_target,
        },
        "advisor": {
            "name": advisor_name,
            "week_title": week_title,
            "created_date": to_persian_digits(created_date),
        },
        "week_range": {
            "start_date_str": to_persian_digits(start_date_str),
            "end_date_str": to_persian_digits(end_date_str),
        },
        "summary": {
            "total_hours_str": format_hhmm_persian(weekly_total_minutes),
            "active_days_count": to_persian_digits(active_days_count),
            "daily_avg_str": format_hhmm_persian(avg_minutes),
        },
        "chart_bars": chart_bars,
        "legend_items": [
            {
                "key": k,
                "title": v["title"],
                "css_class": v["css_class"],
                "icon_svg": SVG_ICONS[k],
            }
            for k, v in config.ACTIVITY_TYPES.items()
        ],
        "rest_icon_svg": SVG_ICONS["rest"],
        "all_days": processed_days,
        "page1_days": page1_days,
        "page2_days": page2_days,
        "page3_days": page3_days,
        "goals_paragraphs": goals_paragraphs,
        "footer": {
            "institute": config.INSTITUTE_NAME,
            "setting_date": to_persian_digits(created_date),
        },
        "total_pages": to_persian_digits(3),
    }

    return context


def render_html_template(plan_data: Dict[str, Any]) -> str:
    """رندر قالب Jinja2 با داده‌های پردازش‌شده برنامه هفتگی"""
    env = Environment(
        loader=FileSystemLoader(str(config.TEMPLATES_DIR)),
        autoescape=False,
    )
    template = env.get_template("plan.html")
    context = prepare_template_context(plan_data)
    return template.render(**context)


def build_pdf_bytes(plan_data: Dict[str, Any]) -> bytes:
    """
    ساخت فایل PDF با WeasyPrint و بازگرداندن محتوا به صورت بایت (بدون ذخیره روی دیسک)
    قابل اجرا در ترد جداگانه (asyncio.to_thread) تا بات تلگرام بلاک نشود
    """
    # Lazy import WeasyPrint to avoid load overhead when module is loaded
    import weasyprint

    html_content = render_html_template(plan_data)
    html = weasyprint.HTML(
        string=html_content,
        base_url=str(config.BASE_DIR),
    )

    pdf_bytes = html.write_pdf(
        presentational_hints=True,
    )
    return pdf_bytes


def build_pdf_file(plan_data: Dict[str, Any], output_path: str | Path) -> str:
    """ساخت PDF و ذخیره روی دیسک جهت تست و مقایسه بصری"""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    pdf_bytes = build_pdf_bytes(plan_data)
    with open(output_path, "wb") as f:
        f.write(pdf_bytes)
    return str(output_path)
