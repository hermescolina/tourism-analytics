import os
import mysql.connector
from flask import abort
import json
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory

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

def get_tour_tips_from_db_by_slug(slug):
    conn = mysql.connector.connect(**tours_db_config)
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT item_id, item_type FROM vw_touradmin_page WHERE slug=%s",
            (slug,),
        )
        res = cursor.fetchone()
        if not res:
            abort(404, description="Tour not found")

        item_id = res["item_id"]
        item_type = res["item_type"]

        cursor.execute(
            "SELECT tips FROM tours WHERE tour_id=%s AND item_type=%s",
            (item_id, item_type),
        )
        row = cursor.fetchone()
        if not row:
            abort(404, description="Tour not found")

        return row  # {'tips': ...}
    finally:
        cursor.close()
        conn.close()


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


def update_tour_in_db_by_id(item_id, item_type, data):
    conn = mysql.connector.connect(**tours_db_config)
    cursor = conn.cursor()
    print("DATA ====>", data,flush=True)
    cursor.execute(
        """
        UPDATE tours
        SET inclusions = %s,
            exclusions = %s,
            tour_itinerary = %s
        WHERE tour_id = %s and item_type = %s
        """,
        (
            data.get("inclusions", ""),
            data.get("exclusions", ""),
            json.dumps(data.get("tour_itinerary", [])),
            item_id,
            item_type,
        ),
    )

    conn.commit()
    cursor.close()
    conn.close()

def post_tour_tips_from_db_by_slug(slug,tips):
    # CORS preflight
    if request.method == "OPTIONS":
        return jsonify({"message": "ok"}), 200

    conn = mc.connect(**tours_db_config)
    cur = conn.cursor()

    sql = """
        SELECT item_id, item_type from vw_touradmin_page WHERE slug = %s
        """
    cur.execute(sql, slug)
    
    conn = None
    cur = None
    try:
        conn = mc.connect(**tours_db_config)
        cur = conn.cursor()

        # Update by slug via JOIN (safer: no separate SELECT needed)
        sql = """
            INSERT into tours value()  
        """
        cur.execute(sql, (tips_json, slug))
        conn.commit()

        if cur.rowcount == 0:
            return jsonify({"error": "tour not found (slug) or no change"}), 404

        return jsonify({"message": "Tips saved", "count": len(tips_norm)}), 200

    except mc.Error as e:
        # Rich error for quick diagnosis
        app.logger.exception("MySQL error saving tips (errno=%s, sqlstate=%s): %s",
                             getattr(e, "errno", None), getattr(e, "sqlstate", None), str(e))
        return jsonify({
            "error": "db_error",
            "errno": getattr(e, "errno", None),
            "sqlstate": getattr(e, "sqlstate", None),
            "msg": str(e),
        }), 500
    finally:
        try:
            if cur: cur.close()
        finally:
            if conn: conn.close()

def update_tour_tips_by_slug(slug, tips):
    """
    Update tours.tips for a given slug.
    `tips` can be a list[str] or a JSON string. Returns affected rowcount (int).
    Raises LookupError if slug not found.
    """
    # Normalize tips -> JSON string
    if isinstance(tips, str):
        try:
            tips_list = json.loads(tips)
        except Exception:
            tips_list = [tips]
    else:
        tips_list = tips

    if not isinstance(tips_list, list):
        raise ValueError("tips must be a list or JSON string")

    tips_norm = [str(x).strip() for x in tips_list if str(x).strip()]
    tips_json = json.dumps(tips_norm, ensure_ascii=False)

    conn = mysql.connector.connect(**tours_db_config)
    cur = None
    try:
        # 1) Get tour_id & item_type from the view
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT item_id, item_type FROM vw_touradmin_page WHERE slug = %s",
            (slug,),
        )
        row = cur.fetchone()
        cur.close()

        if not row:
            raise LookupError("Tour not found")

        tour_id = row["item_id"]
        item_type = row["item_type"]

        # 2) Update tips as JSON
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE tours
            SET tips = CAST(%s AS JSON)
            WHERE tour_id = %s AND item_type = %s
            """,
            (tips_json, tour_id, item_type),
        )
        conn.commit()
        affected = cur.rowcount
        cur.close()
        return affected
    except:
        conn.rollback()
        raise
    finally:
        conn.close()
