## TourWise – Dynamic Sub-Webpage Setup and Progress Log (May 29, 2025)

### ✅ Objective

Build a scalable system where the main website dynamically opens reusable subpages in new tabs depending on the user's interaction.

---

### ✅ Strategy

Create **one template component per purpose/function**, and pass dynamic data via **query string** or **URL params**.

#### 📄 Template Components

| Purpose             | Template File         | Example URL                        |
| ------------------- | --------------------- | ---------------------------------- |
| Tour Detail         | `TourDetail.jsx`      | `/tour?title=Boracay Beach Escape` |
| Vendor Profile      | `VendorProfile.jsx`   | `/vendor?name=El Nido Tours`       |
| Booking Page        | `BookingPage.jsx`     | `/booking?tourId=123`              |
| Analytics Dashboard | `VendorAnalytics.jsx` | `/analytics?vendorId=001`          |

---

### 🧱 TourDetail.jsx Sample (Core Logic)

```jsx
import { useLocation } from 'react-router-dom';

const tours = [
  {
    title: "Boracay Beach Escape",
    description: "Relaxing getaway in Boracay",
    image: "/images/boracay.jpg",
    price: 3200,
    location: "Boracay"
  },
  // add more tours...
];

export default function TourDetail() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const title = params.get('title');

  const tour = tours.find(t => t.title === title);

  if (!tour) return <p>Tour not found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">{tour.title}</h1>
      <img src={tour.image} alt={tour.title} className="w-full rounded-lg my-4" />
      <p><strong>Location:</strong> {tour.location}</p>
      <p><strong>Price:</strong> ₱{tour.price}</p>
      <p className="mt-4">{tour.description}</p>
    </div>
  );
}
```

#### 📤 Open from Button

```jsx
<button onClick={() => window.open(`/tour?title=${encodeURIComponent(tour.title)}`, '_blank')}>
  View Details
</button>
```

---

### 🧭 Today's Progress

* ✅ Defined goal for dynamic subpages
* ✅ Chose strategy using query string and reusable components
* ✅ Confirmed use of `react-router-dom`
* ✅ Built working example for `TourDetail.jsx`
* ✅ Confirmed open-in-new-tab logic works
* ✅ Finalized that each function (tour, vendor, booking) will have its own single-template file

---

### 🧠 Notes

* This setup keeps the app scalable and avoids cluttered routes
* SEO-friendly structure can be adopted later using `slug`-based routing if needed
* Data source will eventually connect to MySQL or external JSON

---

### 📌 Next Steps

* [ ] Create and connect `VendorProfile.jsx`
* [ ] Add actual tour data from backend or JSON
* [ ] Style the templates using Tailwind or existing CSS
* [ ] Optionally switch to slug-based routing later (for SEO)

