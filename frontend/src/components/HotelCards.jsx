import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import styles from './HotelCards.module.css';

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
    fetch('https://api2.tourwise.shop/api/hotels')
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
    <div className={styles.browseContainer}>
      <header className={styles.browseHeader}>
        <div className={styles.logoSection}>
          <Link to="/">
            <img src={`${base}/images/tourwise.png`} alt="TourWise Logo" className={styles.logoImage} />
          </Link>
          <Link to="/">
            <span className={styles.logoText}>TourWise</span>
          </Link>
        </div>
        <h1 className={styles.browseTitleInline}>Browse Hotels</h1>
        <div className={styles.searchBarWrapper}>
          <input
            type="text"
            placeholder="🔍 Search hotels"
            className={styles.searchBar}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setLocationFilter('')}
          />
        </div>
      </header>

      <div className={styles.browseWrapper}>
        <aside className={styles.filterPanel}>
          <h2 className={styles.filterTitle}>Filters</h2>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Location</label>
            <input
              type="text"
              className={styles.filterinput}
              placeholder="Enter location"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              onFocus={() => setSearchTerm('')}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Price Range</label>
            <p>No price data available</p>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Rating</label>
            <div className={styles.filterStars}>
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star}>★</span>
              ))}
            </div>
          </div>
        </aside>

        <div className={styles.browseContent}>
          <div className={styles.hotelGrid}>
            {filteredHotels.length ? (
              filteredHotels.map((hotel, index) => (
                <div
                  key={index}
                  className={styles.hotelCard}
                  onClick={() => handleCardClick(hotel)}
                >
                  <img
                    src={
                      hotel.card_image
                        ? `${base}/images/${hotel.card_image}`
                        : `${base}/images/hotel-placeholder.png`
                    }
                    alt={hotel.name}
                    className={styles.hotelCardImage}
                  />

                  <div className={styles.hotelCardDetails}>
                    <h3 className={styles.hotelTitle}>{hotel.name}</h3>
                    <p className={styles.hotelLocation}>{hotel.city}, {hotel.country}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.noResultsMessage}>No matching hotels found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
