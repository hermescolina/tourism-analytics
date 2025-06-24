import os
import requests
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv


load_dotenv(dotenv_path=".env.tours")

fb_bp = Blueprint('facebook', __name__)

FB_PAGE_ID = os.getenv('FB_PAGE_ID')
FB_ACCESS_TOKEN = os.getenv('FB_PAGE_ACCESS_TOKEN')

print("🧪 FB_TOKEN_LOADED:", FB_ACCESS_TOKEN)

def post_tour_to_facebook_internal(payload):
    title = payload.get('title')
    description = payload.get('description')
    location = payload.get('location')
    price = payload.get('price')
    image_url = payload.get('image_url')
    slug = payload.get('slug')

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
    response = requests.post(image_post_url, data={
        'url': image_url,
        'caption': message,
        'access_token': FB_ACCESS_TOKEN
    })

    if response.status_code != 200:
        raise Exception(f"Facebook Error: {response.text}")


@fb_bp.route('/post-tour', methods=['POST'])
def post_tour_to_facebook():
    print("🟢 post_tour_to_facebook() function STARTED")

    try:
        data = request.json
        print("📥 Incoming JSON:", data)

        title = data.get('title')
        description = data.get('description')
        location = data.get('location')
        price = data.get('price')
        image_url = data.get('image_url')
        slug = data.get('slug')

        if not all([title, description, location, price, slug]):
            print("⚠️ Missing required fields")
            return jsonify({ "error": "Missing required fields" }), 400

        message = (
            f"\U0001f4cd {title}\n\n"
            f"{description}\n\n"
            f"Location: {location}\n"
            f"Price: ₱{price}\n"
            f"Book now: https://app.tourwise.shop/tourism-analytics/tour/{slug}"
        )

        print("📤 FB Message:", message)

        image_post_url = f"https://graph.facebook.com/{FB_PAGE_ID}/photos"
        payload = {
            'url': image_url,
            'caption': message,
            'access_token': FB_ACCESS_TOKEN
        }

        print("📡 Sending POST to Facebook API...")
        fb_response = requests.post(image_post_url, data=payload)

        print(f"📬 Facebook Status Code: {fb_response.status_code}")
        print(f"📬 Facebook Raw Response: {fb_response.text}")

        try:
            fb_data = fb_response.json()
        except Exception as parse_err:
            print("❌ Failed to parse JSON from Facebook:", parse_err)
            return jsonify({ "error": "Invalid JSON in Facebook response", "raw": fb_response.text }), 500

        if fb_response.status_code != 200:
            print("❌ Facebook returned an error")
            return jsonify({ "error": "Failed to post to Facebook", "fb_response": fb_data }), 500

        return jsonify({ "success": True, "fb_response": fb_data })

    except Exception as e:
        print("❌ Exception during processing:", str(e))
        return jsonify({ "error": "Internal server error", "details": str(e) }), 500

