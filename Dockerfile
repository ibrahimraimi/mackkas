FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV FLASK_APP app.py
ENV FLASK_ENV production
ENV DEBIAN_FRONTEND noninteractive

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install Python dependencies
# We do this as root first to ensure permissions are set correctly in /usr/local
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create a non-root user for security
RUN useradd -m mackkas && chown -R mackkas:mackkas /app
USER mackkas

# Copy the rest of the application code
COPY --chown=mackkas:mackkas . .

# Expose the port the app runs on
EXPOSE 5000

# Run the application with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--threads", "2", "app:app"]
