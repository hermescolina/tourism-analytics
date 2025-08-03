import { apiBaseTour, frontendBase } from '../config';
import { useEffect, useState } from 'react';
import './TourCardsAdmin.css'; // Assuming your styles are here

export default function BrowseTours() {
  const [tours, setTours] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    fetch(`${apiBaseTour}/api/tour-data`)
      .then(res => res.json())
      .then(data => setTours(data.topTours || []))
      .catch(err => console.error('❌ Failed to load tours:', err));
  }, []);

  const handleOptionChange = (slug, option) => {
    setSelectedOptions(prev => ({
      ...prev,
      [slug]: option,
    }));
  };

  const handleCardClick = (tour) => {
    const slug = tour.slug;
    const selectedOption = selectedOptions[slug] || 'itinerary';
    const path = {
      itinerary: 'upload-itinerary',
      history: 'upload-history',
      culture: 'upload-culture',
    }[selectedOption] || 'upload-itinerary';

    window.location.href = `/tourism-analytics/${path}/${slug}`;
  };

  const getImageUrl = (imagePath, title) => {
    if (!imagePath) return '/default.jpg';
    console.log('Image Path:', imagePath);
    return imagePath.startsWith('/images/')
      ? `${frontendBase}/tourism-analytics${imagePath}`
      : `${apiBaseTour}/uploads/${imagePath}`;

  };

  return (
    <div className="browse-container">
      <h2 className="browse-title">Tour Cards</h2>
      <div className="tour-grid">
        {tours.map((tour, index) => (
          <div key={index} className="tour-card">
            {console.log('Tour image URL:', getImageUrl(tour.image, tour.title))}
            <img
              src={getImageUrl(tour.card_image, tour.title)}
              alt={tour.title}
              className="tour-card-image"
            />
            <div className="tour-card-details">
              <h3 className="tour-title">{tour.title}</h3>
              <p className="tour-description">{tour.description}</p>
              <p className="tour-price">
                ₱ {Number(tour.price).toLocaleString()}
              </p>

              {/* ✅ Category Buttons */}
              <div className="tour-category-buttons" style={{ marginTop: '0.5rem' }}>
                {['itinerary', 'history', 'Inclusion'].map(option => (
                  <button
                    key={option}
                    onClick={() => handleOptionChange(tour.slug, option)}
                    style={{
                      marginRight: '0.5rem',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: selectedOptions[tour.slug] === option ? '#007bff' : '#e0e0e0',
                      color: selectedOptions[tour.slug] === option ? '#fff' : '#000',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>

              {/* ✅ Go Button */}
              <button
                onClick={() => handleCardClick(tour)}
                style={{
                  marginTop: '0.8rem',
                  padding: '6px 14px',
                  backgroundColor: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Go
              </button>
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
