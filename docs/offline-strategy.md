## 🧠 Offline-First + Bandwidth-Optimized Architecture (TourWise)

TourWise is designed to minimize bandwidth usage and provide a fast, semi-offline experience for users with poor or unstable connections.

### 🎯 Objective
Reduce unnecessary network traffic by caching all static content (tour data and images) on first visit, and sending only essential POST requests for dynamic actions like bookings.

---

### 📦 What Gets Cached

| Content Type      | Cache Location   | Trigger                     |
|-------------------|------------------|-----------------------------|
| Tour Data (JSON)  | `localStorage`   | Fetched on first load       |
| Tour Images       | `IndexedDB`      | Loaded per tour card/page   |
| Page Assets       | GitHub Pages     | Prebuilt by Vite (static)   |

---

### 🔁 Caching Behavior

- On first visit:
  - Tour data is fetched via API and stored in `localStorage`.
  - Each tour image is fetched once and cached using `IndexedDB` as a binary Blob.
- On repeat visits:
  - Tour data and images are loaded locally.
  - No API or image requests are made unless cache is cleared or versioned.
- Offline mode:
  - Tour cards and individual pages work without internet (after first use).
- Booking actions:
  - Only dynamic network traffic happens during booking (`POST /api/book`).
  - Payload is lightweight (typically < 1KB).

---

### 🚀 Technical Stack Used for Caching

- **Tour Data**: Cached with `localStorage` (JSON stringified).
- **Images**: Cached with `IndexedDB` (as Blob), rendered via `URL.createObjectURL()`.
- **Fallback Strategy**: Cache-first on all reads, with optional background sync trigger.

---

### 🛠 Optional Enhancements

- Service Worker to enable full offline support (optional).
- Version key in cached JSON to trigger updates.
- Image preloading strategy for popular tours.

---

### 📉 Resulting Bandwidth Usage

| Action             | Bandwidth Used |
|--------------------|----------------|
| Landing page view  | ✅ Cached       |
| Tour detail view   | ✅ Cached       |
| Image loads        | ✅ Cached       |
| Booking request    | ✅ ~1KB POST    |
| Total usage (after first load) | ✅ Minimal |

