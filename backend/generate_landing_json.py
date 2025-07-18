# This script generates a JSON file for the landing page with the top booked tours.
import json
import mysql.connector
from decimal import Decimal
from dotenv import load_dotenv
import os


# ✅ Load variables from .env
# load_dotenv()
load_dotenv(dotenv_path=".env.tours")

# ✅ Get values securely from environment
db_host = os.getenv("DB_HOST")
db_user = os.getenv("DB_USER")
db_pass = os.getenv("DB_PASS")
db_name = os.getenv("DB_NAME")

# Connect to MySQL
conn = mysql.connector.connect(
    host=db_host, user=db_user, password=db_pass, database=db_name
)

cursor = conn.cursor(dictionary=True)

# Query top booked tours
query = """
SELECT t.title, t.location, t.image, t.price, t.rating, t.views, t.slug
FROM tours t
JOIN (
  SELECT tour_id, COUNT(*) AS bookings
  FROM bookings
  WHERE status = 'confirmed'
  GROUP BY tour_id
) AS stats ON t.id = stats.tour_id
ORDER BY stats.bookings DESC
LIMIT 6;
"""

cursor.execute(query)
tours = cursor.fetchall()

# Convert Decimal to float recursively


def convert_decimal(obj):
    if isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj)
    return obj


# Output to JSON
output = {"topTours": convert_decimal(tours)}
with open("../frontend/public/data/landing.json", "w") as f:
    json.dump(output, f, indent=2)

print("✅ landing.json generated successfully.")

cursor.close()
conn.close()
