import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './TourCards.css';

const base = '/tourism-analytics';



export default function BrowseTours() {
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [minPrice, setMinPrice] = useState(1000);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const safeMinPrice = Number(minPrice) || 0;
  const safeMaxPrice = Number(maxPrice) || 999999;


  useEffect(() => {
    fetch('http://localhost:3001/api/landing-data')
      .then(async res => {
        const text = await res.text();
        console.log("📦 Raw response text from API:", text);

        try {
          const data = JSON.parse(text);
          console.log("✅ Parsed JSON response:", data);
          setTours(data.topTours || []);
        } catch (jsonErr) {
          console.error("❌ JSON parse error:", jsonErr);
        }
      })
      .catch(err => {
        console.error("❌ Fetch failed:", err);
      });
  }, []);




  const handleCardClick = (tour) => {
    navigate(tour.link); // assuming tour.link = "/el-nido"
    console.log(`🟢 Navigating to tour title: ${tour.link}`);
  };

  const normalize = str => str.toLowerCase().replace(/\s+/g, '');

  const filteredTours = tours.filter(tour => {
    const searchNormalized = normalize(searchTerm);
    const locationFilterNormalized = normalize(locationFilter);
    const titleNormalized = normalize(tour.title || '');
    const descNormalized = normalize(tour.description || '');
    const locationNormalized = normalize(tour.location || '');
    const priceValue = Number(tour.price);

    console.log({
      title: tour.title,
      location: tour.location,
      price: tour.price,
      normalized: {
        titleNormalized,
        locationNormalized,
        searchNormalized,
        locationFilterNormalized,
      }
    });

    const matchesSearch = titleNormalized.startsWith(searchNormalized);
    const matchesLocation = locationNormalized.startsWith(locationFilterNormalized);
    const matchesPrice = priceValue >= safeMinPrice && priceValue <= safeMaxPrice;

    return matchesSearch && matchesLocation && matchesPrice;
  });

  return (
    <div className="browse-container">
      <header className="browse-header">
        <div className="logo-section">
          <img src={`${base} / images / tourwise.png`} alt="TourWise Logo" className="logo-image" />
          <span className="logo-text">TourWise</span>
        </div>
        <h1 className="browse-title-inline">Browse Tours</h1>
        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="🔍 Search tours"
            className="search-bar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setLocationFilter('')}
          />
        </div>
      </header>

      <div className="browse-wrapper">
        <aside className="filter-panel">
          <h2 className="filter-title">Filters</h2>

          <div className="filter-group">
            <label className="filter-label">Location</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Enter location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              onFocus={() => setSearchTerm('')}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Price Range</label>
            <div className="price-range-inputs">
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="price-input"
                placeholder="Min"
              />
              <span>to</span>
              <input
                type="number"
                min={minPrice}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="price-input"
                placeholder="Max"
              />
            </div>
            <input
              type="range"
              min={minPrice}
              max="100000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="filter-range"
            />
            <p className="price-display">
              ₱ {minPrice.toLocaleString()} – ₱ {maxPrice.toLocaleString()}
            </p>
          </div>

          <div className="filter-group">
            <label className="filter-label">Rating</label>
            <div className="filter-stars">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star}>★</span>
              ))}
            </div>
          </div>
        </aside>

        <div className="browse-content">
          <div className="tour-grid">
            {filteredTours.map((tour, index) => (
              <div
                key={index}
                className="tour-card"
                onClick={() => handleCardClick(tour)}
              >
                <img
                  src={`${base}${tour.image}`}
                  alt={tour.title}
                  className="tour-card-image"
                />
                <div className="tour-card-details">
                  <h3 className="tour-title">{tour.title}</h3>
                  <p className="tour-description">{tour.description}</p>
                  <p className="tour-price">₱ {Number(tour.price).toLocaleString()}</p>
                </div>
              </div>
            ))}

            {filteredTours.length === 0 && (
              <p className="no-results-message">No matching tours found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
