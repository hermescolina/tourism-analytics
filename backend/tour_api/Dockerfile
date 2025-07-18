FROM python:3.10-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the source code
COPY . .

# Start with gunicorn (or switch to flask run for dev)
# CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:3001", "tours_app:app"]
CMD ["flask", "run", "--host=0.0.0.0", "--port=3001"]


