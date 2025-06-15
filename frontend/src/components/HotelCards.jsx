import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './HotelCards.css';

const base = '/tourism-analytics';


export default function BrowseHotels() {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [minPrice, setMinPrice] = useState(1000);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const safeMinPrice = Number(minPrice) || 0;
  const safeMaxPrice = Number(maxPrice) || Number.MAX_SAFE_INTEGER;

  useEffect(() => {
    fetch('http://localhost:5000/api/hotels')
      .then(async res => {
        const text = await res.text();
        console.log("📦 Raw response text from API:", text);

        try {
          const data = JSON.parse(text);
          console.log("✅ Parsed JSON response:", data);
          setHotels(Array.isArray(data) ? data : []);
        } catch (jsonErr) {
          console.error("❌ JSON parse error:", jsonErr);
        }
      })
      .catch(err => {
        console.error("❌ Fetch failed:", err);
      });
  }, []);

  const handleCardClick = (hotel) => {
    if (hotel.slug) {
      navigate(`/hotel/${hotel.slug}`);
      console.log(`🟢 Navigating to /hotel/${hotel.slug}`);
    } else {
      console.warn('⚠️ Missing slug for hotel:', hotel);
    }
  };

  const normalize = (str) => str.toLowerCase().replace(/\s+/g, '');

  const filteredHotels = hotels;

  return (
    <div className="browse-container">
      <header className="browse-header">
        <div className="logo-section">
          <Link to="/">
            <img src={`${base}/images/tourwise.png`} alt="TourWise Logo" className="logo-image" />
          </Link>
          <Link to="/">
            <span className="logo-text">TourWise</span>
          </Link>
        </div>
        <h1 className="browse-title-inline">Browse Hotels</h1>
        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="🔍 Search hotels"
            className="search-bar"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
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
              onChange={e => setLocationFilter(e.target.value)}
              onFocus={() => setSearchTerm('')}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">Price Range</label>
            <p>No price data available</p>
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
          <div className="hotel-grid">
            {filteredHotels.length ? (
              filteredHotels.map((hotel, index) => (
                <div
                  key={index}
                  className="hotel-card"
                  onClick={() => handleCardClick(hotel)}
                >
                  <img
                    src={
                      hotel.card_image
                        ? `${base}/images/${hotel.card_image}`
                        : `${base}/images/hotel-placeholder.png`
                    }
                    alt={hotel.name}
                    className="hotel-card-image"
                  />

                  <div className="hotel-card-details">
                    <h3 className="hotel-title">{hotel.name}</h3>
                    <p className="hotel-location">{hotel.city}, {hotel.country}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-results-message">No matching hotels found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
