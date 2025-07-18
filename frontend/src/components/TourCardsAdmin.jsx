import { frontendBase } from '../config';
import { useState, useEffect } from 'react';
import './TourCardsAdmin.css';

const base = '/tourism-analytics';
const apiBase = '`${apiBaseTour}';

export default function BrowseTours() {
  const [tours, setTours] = useState([]);

  useEffect(() => {
    fetch(`${apiBase}/api/landing-data`)
      .then(async res => {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          console.log('📦 Loaded topTours:', data.topTours);
          setTours(data.topTours || []);
        } catch (jsonErr) {
          console.error('❌ JSON parse error:', jsonErr);
        }
      })
      .catch(err => {
        console.error('❌ Fetch failed:', err);
      });
  }, []);

  const handleCardClick = (tour) => {
    if (tour.slug) {
      window.location.href = `${frontendBase} /tourism-analytics/upload - history / ${tour.slug} `;
    }
  };

  const getImageUrl = (imagePath, title) => {
    let finalUrl = '';

    if (!imagePath) {
      finalUrl = `${base} /images/default.jpg`;
    } else if (imagePath.startsWith('http')) {
      finalUrl = imagePath;
    } else if (imagePath.includes('uploads')) {
      finalUrl = `${apiBase}${imagePath.startsWith('/') ? '' : '/'}${imagePath} `;
    } else {
      finalUrl = `${base}${imagePath.startsWith('/') ? '' : '/'}${imagePath} `;
    }

    // 🔍 Log the final URL to the browser console
    console.log(`🖼️ ${title} → ${finalUrl} `);
    return finalUrl;
  };

  return (
    <div className="browse-container">
      <h2 className="browse-title">Tour Cards</h2>
      <div className="tour-grid">
        {tours.map((tour, index) => (
          <div
            key={index}
            className="tour-card"
            onClick={() => handleCardClick(tour)}
          >
            <img
              src={getImageUrl(tour.image, tour.title)}
              alt={tour.title}
              className="tour-card-image"
            />
            <div className="tour-card-details">
              <h3 className="tour-title">{tour.title}</h3>
              <p className="tour-description">{tour.description}</p>
              <p className="tour-price">
                ₱ {Number(tour.price).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        {tours.length === 0 && (
          <p className="no-results-message">No tours to display.</p>
        )}
      </div>
    </div>
  );
}
