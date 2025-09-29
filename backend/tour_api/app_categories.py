# bp_categories_categories.py
import os, json, hashlib
from flask import Blueprint, jsonify, request, send_file, abort, current_app
import mysql.connector
from dotenv import load_dotenv

bp_categories = Blueprint("categories", __name__)

# ---- Config ---------------------------------------------------------------
env_file = ".env.development" if os.getenv("bp_categories_ENV") == "development" else ".env.tours"
load_dotenv(dotenv_path=env_file)

tours_db_config = {
    "host": os.getenv("TOUR_DB_HOST"),
    "user": os.getenv("TOUR_DB_USER"),
    "password": os.getenv("TOUR_DB_PASS"),
    "database": os.getenv("TOUR_DB_NAME"),
    "port": int(os.getenv("TOUR_DB_PORT", "3306")),
}

CACHE_FILE = os.getenv("CATEGORIES_CACHE", "/var/lib/tourwise/categories.json")
GROUP_CONCAT_MAX_LEN = int(os.getenv("GROUP_CONCAT_MAX_LEN", "10000000"))

# 🔎 boot diagnostics (prints once at import)
print(f"[categories] env_file={env_file}, APP_ENV={os.getenv('APP_ENV')}", flush=True)
print(f"[categories] CATEGORIES_CACHE={CACHE_FILE}", flush=True)

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
def _fetch_categories_json():
    conn = mysql.connector.connect(**tours_db_config)
    try:
        cur = conn.cursor()
        try:
            cur.execute(f"SET SESSION group_concat_max_len = {GROUP_CONCAT_MAX_LEN};")
            cur.execute("SELECT categories_json FROM vw_categories_json;")
            row = cur.fetchone()
        finally:
            cur.close()
        if not row or row[0] is None:
            raise RuntimeError("vw_categories_json returned empty payload")
        return row[0]
    finally:
        conn.close()

def _get_categories_token(conn):
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT UNIX_TIMESTAMP(COALESCE(MAX(updated_at), '1970-01-01')) AS ts,
                   COUNT(*) AS n
            FROM accommodation_category
        """)
        ts, n = cur.fetchone()
        ts = int(ts or 0)
        n = int(n or 0)
        return f"{n}-{ts}"
    finally:
        cur.close()

def _get_categories_version(conn):
    cur = conn.cursor()
    try:
        cur.execute("SELECT v FROM categories_meta WHERE k='version'")
        row = cur.fetchone()
        if not row:
            return None
        (v,) = row
        return str(v) if v is not None else None
    finally:
        cur.close()

@bp_categories.route("/categories", methods=["GET"])
def get_categories():
    current_app.logger.info("➡️ Entered /categories route")
    force = request.args.get("refresh") in ("1", "true", "True")
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

    # with mysql.connector.connect(**tours_db_config) as conn:
    #     ver = _get_categories_version(conn) or _get_categories_token(conn)
    #     current_app.logger.info(f"DB version resolved: {ver}")

    with mysql.connector.connect(**tours_db_config) as conn:
        ver_db = _get_categories_version(conn)  # may contain '\n'
        token  = _get_categories_token(conn)    # fallback
        ver = (ver_db or token or "").strip()   # <- normalize
        current_app.logger.info(f"DB version resolved (normalized): {repr(ver)}")

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
        fresh_json = _fetch_categories_json()

    # if CACHE_FILE:
    #     current_app.logger.info("Writing fresh JSON + version to cache files")
    #     _write_atomic(CACHE_FILE, fresh_json)
    #     _write_atomic(CACHE_FILE + ".ver", ver)

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


@bp_categories.route("/file", methods=["GET"])
def get_categories_file():
    if not os.path.exists(CACHE_FILE):
        abort(404, description="Cache file not found")
    return send_file(CACHE_FILE, mimetype="application/json")

@bp_categories.route("/raw", methods=["GET"])
def get_categories_raw():
    fresh = _fetch_categories_json()
    return fresh, 200, {"Content-Type": "application/json; charset=utf-8"}
