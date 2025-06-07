# 🗓️ TourWise Weekly Progress Summary  
**Week Ending: June 7, 2025**

---

## ✅ Infrastructure & Hosting
- Activated frontend domain via **z.com**
- Connected frontend to **Render-hosted backend API**
- Set up conditional fetching of `tourdata.json` using timestamps + `localStorage` for caching

---

## ✅ Backend Development
- Backend now serves **dynamic `tourdata.json`**
- Verified API fetch pattern from frontend is functional
- Successfully tested `/api/tours/:slug` route for detailed tour info
- Backend connected to **SmarterASP-hosted MySQL database**

---

## ✅ Frontend Enhancements
- Updated `TourPage.jsx` with:
  - History section and image preview
  - Category filtering UI
  - Dynamic sections: "About the Tour", "What to Expect", etc.
- Integrated gallery support for images and videos
- Implemented media upload form with preview, caption, and category

---

## ✅ Storage & Optimization Strategy
- Chose **Google Drive (15GB)** for early-stage backups and JSON/media storage
- Created plan to **cache JSON responses** on the frontend using `localStorage`
- Discussed automating backups of `tourdata.json` to Drive for performance and reliability

---

## ✅ Authentication & Security Planning
- Compared multiple providers: AWS Cognito, Supabase Auth, Firebase/Auth0
- Selected **Supabase Auth** as preferred identity provider
- Agreed on best practice:
  - Store auth data in Supabase
  - Store business logic + user data in **MySQL**
- Supabase Auth deemed secure enough for **donation-based model**

---

## ✅ Scalability & Future-Proofing
- Confirmed 15GB Google Drive is sufficient for backups at current stage
- Developed mindset of:
  > "Free now, structured always, scalable later"
- Planned clean data logging to support:
  - Future analytics
  - Dashboard insights
  - Smooth migration to AWS/S3/PostgreSQL when needed

---

## 📌 Pending (Deferred for Later)
- Automate Drive upload for JSON backups
- Setup Supabase Auth + JWT-based backend protection
- Build donation tracker module (backend + frontend)
- Start logging basic analytics (tour views, bookings)
- Add cron or rotation script for old backup cleanup

---

