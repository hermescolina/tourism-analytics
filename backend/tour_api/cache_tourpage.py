# bp_tourpages_tourpages.py
import os, json, hashlib
from flask import Blueprint, jsonify, request, send_file, abort, current_app
import mysql.connector
from dotenv import load_dotenv

bp_tourpages = Blueprint("tourpages", __name__)

# ---- Config ---------------------------------------------------------------
env_file = ".env.development" if os.getenv("bp_tourpages_ENV") == "development" else ".env.tours"
load_dotenv(dotenv_path=env_file)

tours_db_config = {
    "host": os.getenv("TOUR_DB_HOST"),
    "user": os.getenv("TOUR_DB_USER"),
    "password": os.getenv("TOUR_DB_PASS"),
    "database": os.getenv("TOUR_DB_NAME"),
    "port": int(os.getenv("TOUR_DB_PORT", "3306")),
}

CACHE_FILE = os.getenv("tourpages_CACHE", "/var/lib/tourwise/tourpages.json")
GROUP_CONCAT_MAX_LEN = int(os.getenv("GROUP_CONCAT_MAX_LEN", "10000000"))

# 🔎 boot diagnostics (prints once at import)
print(f"[tourpages] env_file={env_file}, APP_ENV={os.getenv('APP_ENV')}", flush=True)
print(f"[tourpages] tourpages_CACHE={CACHE_FILE}", flush=True)

# ---- File helpers ---------------------------------------------------------
def _read_file(path: str):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return None

def _write_atomic(path: str, content: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = f"{path}.tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(content)
    os.replace(tmp, path)  # atomic on POSIX

# ---- DB helpers -----------------------------------------------------------
def _fetch_tourpages_json(slug):
    conn = mysql.connector.connect(**tours_db_config)
    try:
        cur = conn.cursor()
        try:
            cur.execute(f"SET SESSION group_concat_max_len = {GROUP_CONCAT_MAX_LEN};")
            cur.execute("SELECT page_json FROM vw_tour_page_json where slug = %s;",(slug,))
            row = cur.fetchall()
        finally:
            cur.close()
        if not row or row[0] is None:
            raise RuntimeError("vw_tour_page_json returned empty payload")
        return row[0][0]
    finally:
        conn.close()

def get_tourpages_token():
    conn = mysql.connector.connect(**tours_db_config)
    """
    Generate a lightweight tourpage token for caching purposes.
    Format: <total_count>-<latest_unix_timestamp>
    """
    tables = ["items", "tours", "tour_history_images", "tour_videos", "vendors", "tour_guides"]
    cur = conn.cursor()
    try:
        total_count = 0
        latest_ts = 0

        for table in tables:
            cur.execute(f"""
                SELECT COUNT(*), UNIX_TIMESTAMP(COALESCE(MAX(updated_at), '1970-01-01'))
                FROM tourism_app.{table}
            """)
            count, ts = cur.fetchone()
            total_count += int(count or 0)
            if ts:
                latest_ts = max(latest_ts, int(ts))

        return f"{total_count}-{latest_ts}"
    finally:
        cur.close()


def get_tourpages_version():
    conn = mysql.connector.connect(**tours_db_config)
    cur = conn.cursor()
    try:
        cur.execute("SELECT v FROM tourpages_meta WHERE k='version'")
        row = cur.fetchone()
        if not row:
            return None
        (v,) = row
        return str(v) if v is not None else None
    finally:
        cur.close()

#NEED TO CHANGE REFRESH LOGIC
@bp_tourpages.route("/tours/<slug>", methods=["GET"])
def get_tourpages(slug):
    current_app.logger.info("➡️ Entered /tourpages route")
    force = request.args.get("refresh") in ("1", "true", "True") #need to change this to dynamic approach encrypte 
                                                                 #encrypted keyword = encrypted value "s8d7f6asd87f = 8s6df8sd"
    inm = request.headers.get("If-None-Match")
    current_app.logger.info(f"Query params: force={force}, If-None-Match={inm}")

    # Default: no file cache unless configured
    cached_json = None
    cached_ver = None
    if CACHE_FILE:
        current_app.logger.info(f"Using CACHE_FILE={CACHE_FILE}")
        cached_json = _read_file(CACHE_FILE)
        cached_ver_raw = _read_file(CACHE_FILE + ".ver")
        cached_ver = cached_ver_raw.strip() if cached_ver_raw else None
        current_app.logger.info(f"Loaded cache: cached_ver={cached_ver}, cached_json_len={len(cached_json) if cached_json else 0}")
    else:
        current_app.logger.info("No CACHE_FILE configured, skipping file cache")

    with mysql.connector.connect(**tours_db_config) as conn:
        ver_db = get_tourpages_version()
        token  = get_tourpages_token() 
        ver = (ver_db or token or "").strip()   # <- normalize
        current_app.logger.info(f"DB version resolved (normalized): {repr(ver)}")
        
        print("VERSION",ver,flush=True)
        print("INM",inm,flush=True)

        if not force and inm and inm == ver:
            current_app.logger.info("ETag match → returning 304 Not Modified")
            return ("", 304, {"ETag": ver})

        if not force and cached_json and cached_ver == ver:
            current_app.logger.info("Cache hit → returning cached JSON")
            return (cached_json, 200, {
                "Content-Type": "application/json; charset=utf-8",
                "ETag": ver
            })

        current_app.logger.info("Cache miss or forced refresh → fetching fresh JSON from DB")
        
        fresh_json = _fetch_tourpages_json(slug)

    if CACHE_FILE:
        current_app.logger.info(f"Writing fresh JSON + version to cache files -> {CACHE_FILE}")
        try:
            _write_atomic(CACHE_FILE, fresh_json)
            _write_atomic(CACHE_FILE + ".ver", (ver + "\n")) 
            st = os.stat(CACHE_FILE)
            current_app.logger.info(f"Wrote cache OK: size={st.st_size} path={CACHE_FILE}")
        except Exception as e:
            current_app.logger.exception(f"Failed writing cache: {e}")


    current_app.logger.info("Returning fresh JSON with ETag")
    return (fresh_json, 200, {
        "Content-Type": "application/json; charset=utf-8",
        "ETag": ver
    })


@bp_tourpages.route("/file", methods=["GET"])
def get_tourpages_file():
    if not os.path.exists(CACHE_FILE):
        abort(404, description="Cache file not found")
    return send_file(CACHE_FILE, mimetype="application/json")

@bp_tourpages.route("/raw", methods=["GET"])
def get_tourpages_raw():
    fresh = _fetch_tourpages_json()
    return fresh, 200, {"Content-Type": "application/json; charset=utf-8"}
