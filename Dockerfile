# ============================================================
# Dockerfile for Zeta Telegram Bot & Weekly Plan PDF Generator
# Optimized for Render (Free Plan) with Python 3.11 & WeasyPrint
# ============================================================

FROM python:3.11-slim-bookworm

# Avoid interactive prompts during apt install
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=10000

# Install WeasyPrint system dependencies (Pango, Cairo, GDK-Pixbuf, LibFFI, Fontconfig)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    fontconfig \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first for efficient layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy bundled Vazirmatn fonts and register with system fontconfig
COPY fonts/ /app/fonts/
RUN mkdir -p /usr/share/fonts/truetype/vazirmatn && \
    cp /app/fonts/*.ttf /usr/share/fonts/truetype/vazirmatn/ 2>/dev/null || true && \
    fc-cache -f -v

# Copy application source code and assets
COPY assets/ /app/assets/
COPY templates/ /app/templates/
COPY handlers/ /app/handlers/
COPY config.py /app/config.py
COPY pdf_builder.py /app/pdf_builder.py
COPY test_pdf.py /app/test_pdf.py
COPY bot.py /app/bot.py

# Expose Webhook/Healthcheck Port for Render
EXPOSE 10000

# Healthcheck for container status
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:' + str(__import__('os').getenv('PORT', 10000)) + '/health')" || exit 1

# Start the Webhook Webserver
CMD ["python", "bot.py"]
