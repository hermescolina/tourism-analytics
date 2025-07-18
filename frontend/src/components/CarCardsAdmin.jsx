import { apiBaseCar, frontendBase } from '../config';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './CarCards.css'; // Use the same styling as the regular car card display

const base = '/tourism-analytics';

export default function BrowseCarCardsAdmin() {
  const [cars, setCars] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  useEffect(() => {
    fetch(`${apiBaseCar}/api/cars`)
      .then(async res => {
        const text = await res.text();
        console.log("📦 Raw response text from API:", text);

        try {
          const data = JSON.parse(text);
          console.log("✅ Parsed JSON response:", data);
          setCars(Array.isArray(data) ? data : []);
        } catch (jsonErr) {
          console.error("❌ JSON parse error:", jsonErr);
        }
      })
      .catch(err => {
        console.error("❌ Fetch failed:", err);
      });
  }, []);

  const handleCardClick = (car) => {
    if (car.slug) {
      window.location.href = `${frontendBase}/tourism-analytics/admin/car/${car.slug}`;
    } else {
      console.warn('⚠️ Missing slug for car:', car);
    }
  };

  const filteredCars = cars.filter((car) => {
    const matchesBrand = brandFilter
      ? car.brand?.toLowerCase().includes(brandFilter.toLowerCase())
      : true;

    const matchesSearch = searchTerm
      ? (car.brand + ' ' + car.model).toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return matchesBrand && matchesSearch;
  });

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
        <h1 className="browse-title-inline">Car Admin Panel</h1>
        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="🔍 Search cars"
            className="search-bar"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setBrandFilter('')}
          />
        </div>
      </header>

      <div className="browse-wrapper">
        <aside className="filter-panel">
          <h2 className="filter-title">Filters</h2>
          <div className="filter-group">
            <label className="filter-label">Brand</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Enter brand"
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
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
          <div className="car-grid">
            {filteredCars.length ? (
              filteredCars.map((car, index) => (
                <div
                  key={index}
                  className="car-card"
                  onClick={() => handleCardClick(car)}
                >
                  <img
                    src={
                      car.card_image
                        ? `${base}/images/${car.card_image}`
                        : `${base}/images/car-placeholder.png`
                    }
                    alt={car.name}
                    className="car-card-image"
                  />
                  <div className="car-card-details">
                    <h3 className="car-title">{car.brand} {car.model}</h3>
                    <p className="car-description">{car.year} • {car.fuel_type} • {car.transmission}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-results-message">No matching cars found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
