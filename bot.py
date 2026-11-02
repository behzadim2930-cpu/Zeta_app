"""
Zeta Telegram Bot - Main Application Entrypoint
وب‌سرور ناهمگام (Async Aiohttp) با وب‌هوک تلگرام و اندپوینت /health برای UptimeRobot روی سرور Render
"""

import argparse
import asyncio
import logging
import sys
from aiohttp import web
from telegram import Update
from telegram.ext import (
    Application,
    ApplicationBuilder,
    CallbackQueryHandler,
    CommandHandler,
)

import config
from handlers import plan_conversation, start

# تنظیمات لاگینگ
logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO if not config.DEBUG else logging.DEBUG,
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("zeta_bot")


def create_bot_application() -> Application:
    """ساخت و مقداردهی اولیه شیء Application در python-telegram-bot v20+"""
    if not config.BOT_TOKEN:
        logger.error(
            "توکن ربات تلگرام تنظیم نشده است! لطفاً متغیر محیطی BOT_TOKEN را مقداردهی فرمایید."
        )

    builder = ApplicationBuilder().token(config.BOT_TOKEN)
    app = builder.build()

    # ثبت هندلرها
    conv_handler = plan_conversation.get_plan_conversation_handler()
    app.add_handler(conv_handler)

    app.add_handler(CommandHandler("start", start.start_command))
    app.add_handler(CallbackQueryHandler(start.start_command, pattern="^btn_start$"))
    app.add_handler(CommandHandler("help", start.help_command))
    app.add_handler(CallbackQueryHandler(start.help_command, pattern="^btn_help$"))
    app.add_handler(CommandHandler("cancel", start.cancel_command))
    app.add_handler(CallbackQueryHandler(start.cancel_command, pattern="^btn_cancel$"))

    # پشتیبانی از دکمه ثبت برنامه مجدد پس از صدور PDF
    app.add_handler(
        CallbackQueryHandler(
            plan_conversation.start_new_plan, pattern="^btn_new_plan$"
        )
    )
    app.add_handler(
        CallbackQueryHandler(
            plan_conversation.show_final_preview, pattern="^btn_reedit_plan$"
        )
    )

    # پاسخ به سایر دکمه‌های شیشه‌ای منقضی‌شده
    app.add_handler(CallbackQueryHandler(start.session_expired_handler))

    return app


async def health_check_handler(request: web.Request) -> web.Response:
    """اندپوینت سلامت برای مانیتورینگ UptimeRobot و زنده نگه‌داشتن پلن رایگان رندر"""
    return web.json_response(
        {
            "status": "healthy",
            "service": "Zeta Telegram Bot",
            "uptime_robot": "ok",
            "mode": "webhook" if config.WEBHOOK_URL else "polling",
        }
    )


async def telegram_webhook_handler(request: web.Request) -> web.Response:
    """دریافت آپدیت‌های ناهمگام ارسالی از سرورهای تلگرام به وب‌هوک"""
    bot_app: Application = request.app["bot_app"]

    try:
        data = await request.json()
        update = Update.de_json(data, bot_app.bot)
        if update:
            await bot_app.update_queue.put(update)
    except Exception as e:
        logger.error(f"خطا در پردازش وب‌هوک تلگرام: {e}", exc_info=True)
        return web.Response(status=400)

    return web.Response(text="OK")


async def on_startup(app: web.Application) -> None:
    """راه‌اندازی بات و تنظیم آدرس وب‌هوک در تلگرام"""
    bot_app: Application = app["bot_app"]
    logger.info("در حال آغاز به کار ربات تلگرام زتا...")
    await bot_app.initialize()
    await bot_app.start()

    if config.WEBHOOK_URL:
        webhook_path = f"/webhook/{config.BOT_TOKEN}" if config.BOT_TOKEN else "/webhook"
        full_webhook_url = f"{config.WEBHOOK_URL}{webhook_path}"
        logger.info(f"در حال تنظیم وب‌هوک تلگرام روی: {full_webhook_url}")
        await bot_app.bot.set_webhook(
            url=full_webhook_url,
            allowed_updates=Update.ALL_TYPES,
            drop_pending_updates=True,
        )
        info = await bot_app.bot.get_webhook_info()
        logger.info(f"وضعیت وب‌هوک تلگرام: {info.url} (پندینگ: {info.pending_update_count})")
    else:
        logger.warning(
            "متغیر WEBHOOK_URL تعریف نشده است. لطفاً برای حالت پروداکشن در Render آن را تنظیم فرمایید."
        )


async def on_shutdown(app: web.Application) -> None:
    """خاتمه امن وب‌سرور و توقف تسک‌های ربات"""
    bot_app: Application = app["bot_app"]
    logger.info("در حال متوقف‌سازی ربات...")
    try:
        if config.WEBHOOK_URL:
            await bot_app.bot.delete_webhook()
    except Exception as e:
        logger.warning(f"عدم موفقیت در حذف وب‌هوک: {e}")

    await bot_app.stop()
    await bot_app.shutdown()
    logger.info("ربات با موفقیت متوقف شد.")


def run_webhook_server() -> None:
    """اجرای وب‌سرور Aiohttp روی پورت اختصاصی Render"""
    bot_app = create_bot_application()

    aiohttp_app = web.Application()
    aiohttp_app["bot_app"] = bot_app

    # مسیرهای وب‌سرور
    aiohttp_app.router.add_get("/", health_check_handler)
    aiohttp_app.router.add_get("/health", health_check_handler)

    webhook_path = f"/webhook/{config.BOT_TOKEN}" if config.BOT_TOKEN else "/webhook"
    aiohttp_app.router.add_post("/webhook", telegram_webhook_handler)
    if config.BOT_TOKEN:
        aiohttp_app.router.add_post(webhook_path, telegram_webhook_handler)

    aiohttp_app.on_startup.append(on_startup)
    aiohttp_app.on_shutdown.append(on_shutdown)

    logger.info(f"وب‌سرور رندر در حال اجرا روی پورت {config.PORT}...")
    web.run_app(aiohttp_app, host="0.0.0.0", port=config.PORT)


def run_polling_mode() -> None:
    """اجرای ربات در حالت Polling برای تست لوکال بدون نیاز به وب‌هوک و تانل"""
    logger.info("در حال اجرای ربات در حالت Polling (تست محلی)...")
    bot_app = create_bot_application()
    bot_app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Zeta Telegram Bot Runner")
    parser.add_argument(
        "--polling",
        action="store_true",
        help="اجرا در حالت Polling برای توسعه و تست لوکال",
    )
    args = parser.parse_args()

    if args.polling or (not config.WEBHOOK_URL and not os.getenv("RENDER")):
        run_polling_mode()
    else:
        run_webhook_server()
