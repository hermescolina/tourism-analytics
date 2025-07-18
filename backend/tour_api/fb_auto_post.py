import os
import requests
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.tours")

fb_bp = Blueprint("facebook", __name__)

FB_PAGE_ID = os.getenv("FB_PAGE_ID")
FB_ACCESS_TOKEN = os.getenv("FB_PAGE_ACCESS_TOKEN")

print(
    "🧪 FB_TOKEN_LOADED:",
    FB_ACCESS_TOKEN[:8] + "..." if FB_ACCESS_TOKEN else "❌ Not Found",
)
print("🧪 FB_PAGE_ID_LOADED:", FB_PAGE_ID or "❌ Not Found")


# ✅ Reusable internal posting function
def post_tour_to_facebook_internal(payload):
    title = payload.get("title")
    description = payload.get("description")
    location = payload.get("location")
    price = payload.get("price")
    image_url = payload.get("image_url")
    slug = payload.get("slug")

    if not all([title, description, location, price, slug]):
        raise ValueError("Missing fields for Facebook post")

    message = (
        f"\U0001f4cd {title}\n\n"
        f"{description}\n\n"
        f"Location: {location}\n"
        f"Price: ₱{price}\n"
        f"Book now: https://app.tourwise.shop/tourism-analytics/tour/{slug}"
    )

    image_post_url = f"https://graph.facebook.com/{FB_PAGE_ID}/photos"
    print("📡 [INTERNAL] Posting to:", image_post_url)
    print("🖼️ [INTERNAL] Image URL:", image_url)
    print("✉️ [INTERNAL] Message:", message)

    response = requests.post(
        image_post_url,
        data={"url": image_url, "caption": message, "access_token": FB_ACCESS_TOKEN},
    )

    print("📬 [INTERNAL] Facebook response code:", response.status_code)
    print("📬 [INTERNAL] Facebook response body:", response.text)

    if response.status_code != 200:
        raise Exception(f"Facebook Error: {response.text}")


# ✅ API route: /api/fb/post-tour
@fb_bp.route("/post-tour", methods=["POST"])
def post_tour_to_facebook():
    print("🟢 post_tour_to_facebook() function STARTED")

    try:
        data = request.json
        print("📥 Incoming JSON:", data)

        # Call the reusable function
        post_tour_to_facebook_internal(data)

        return jsonify({"success": True})

    except Exception as e:
        print("❌ Exception during processing:", str(e))
        return jsonify({"error": "Internal server error", "details": str(e)}), 500
