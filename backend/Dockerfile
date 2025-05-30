FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your application code
COPY . .

# Expose port (Render uses this automatically)
EXPOSE 8000

# Use Gunicorn to serve the app
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
