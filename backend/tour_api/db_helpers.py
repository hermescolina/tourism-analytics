import os
import mysql.connector
from flask import abort
import json
from dotenv import load_dotenv

# Load environment variables from .env.tours only once
load_dotenv(dotenv_path=".env.tours")

# Database config
tours_db_config = {
    "host": os.getenv("TOUR_DB_HOST"),
    "user": os.getenv("TOUR_DB_USER"),
    "password": os.getenv("TOUR_DB_PASS"),
    "database": os.getenv("TOUR_DB_NAME"),
    "port": 3306,
}


def get_tour_from_db_by_slug(slug):
    conn = mysql.connector.connect(**tours_db_config)
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM vw_tour_page WHERE slug = %s", (slug,))
    result = cursor.fetchone()

    cursor.close()
    conn.close()

    if not result:
        abort(404, description="Tour not found")

    # Optional: Parse JSON itinerary field
    if result.get("tour_itinerary"):
        try:
            result["tour_itinerary"] = json.loads(result["tour_itinerary"])
        except Exception:
            result["tour_itinerary"] = []

    return result


def update_tour_in_db_by_id(item_id, data):
    conn = mysql.connector.connect(**tours_db_config)
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE tours
        SET inclusions = %s,
            exclusions = %s,
            tour_itinerary = %s
        WHERE id = %s
        """,
        (
            data.get("inclusions", ""),
            data.get("exclusions", ""),
            json.dumps(data.get("tour_itinerary", [])),
            item_id,  # ✅ Changed from slug to tour_id
        ),
    )

    conn.commit()
    cursor.close()
    conn.close()
