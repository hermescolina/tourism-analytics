import { Link, useNavigate } from 'react-router-dom';
import { apiBaseTour } from '../config';
import { useState, useEffect } from 'react';
import styles from './TourCards.module.css';
import { useCart } from '../components/CartContext'; // adjust the path if needed

const base = '/tourism-analytics';

export default function BrowseTours() {
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [minPrice, setMinPrice] = useState(1000);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const { cartItems, addToCart, loadCart } = useCart();
  const [quantity, setQuantity] = useState({});



  const safeMinPrice = Number(minPrice) || 0;
  const safeMaxPrice = Number(maxPrice) || 999999;


  useEffect(() => {
    fetch(`${apiBaseTour}/api/landing-data`)
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


  function CartIcon() {
    const { cartItems } = useCart();

    return (
      <div style={{ position: 'relative', marginLeft: 'auto' }}>
        <Link to="/cart" style={{ fontSize: '2.2rem', textDecoration: 'none' }}>
          🛒
        </Link>

        {cartItems.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '-0.3rem',
            right: '-0.6rem',
            backgroundColor: 'red',
            color: 'white',
            borderRadius: '50%',
            padding: '0.2rem 0.5rem',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            lineHeight: '1',
            minWidth: '1.5rem',
            textAlign: 'center'
          }}>
            {cartItems.length}
          </span>
        )}
      </div>
    );
  }


  const handleCardClick = (tour) => {
    if (tour.slug) {
      console.log(`🟢 Navigating to /tour/${tour.slug} (ID: ${tour.tour_id})`);

      navigate(`/tour/${tour.slug}`);
    } else {
      console.warn('⚠️ Missing slug for tour:', tour);
    }
  };


  const normalize = str => str.toLowerCase().replace(/\s+/g, '');

  const filteredTours = tours.filter(tour => {
    const searchNormalized = normalize(searchTerm);
    const locationFilterNormalized = normalize(locationFilter);
    const titleNormalized = normalize(tour.title || '');
    const locationNormalized = normalize(tour.location || '');
    const priceValue = Number(tour.price);

    const matchesSearch = titleNormalized.startsWith(searchNormalized);
    const matchesLocation = locationNormalized.startsWith(locationFilterNormalized);
    const matchesPrice = priceValue >= safeMinPrice && priceValue <= safeMaxPrice;

    return matchesSearch && matchesLocation && matchesPrice;
  });

  console.log("🖼️ image path:", `${base}/images/tourwise.png`);


  useEffect(() => {
    fetch(`${apiBaseTour}/api/landing-data`)
      .then(res => res.json())
      .then(data => {
        setTours(data.topTours || []);
        console.log("🎯 Tour Dates Check:", data.topTours.map(t => [t.title, t.start_date, t.end_date]));
      });
  }, []);

  useEffect(() => {
    const userId = 1; // Replace with dynamic ID if available
    loadCart(userId);
  }, []);


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
        <div>    </div>
        {/* <h1 className={styles.browseTitleInline}>Browse Tours</h1> */}
        <div className={styles.searchBarWrapper}>
          <input
            type="text"
            placeholder="🔍 Search tours"
            className={styles.searchBar}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setLocationFilter('')}
          />
          <CartIcon />

        </div>
      </header>

      <div className={styles.browseWrapper}>
        <aside className={styles.filterPanel}>
          <h2 className={styles.filterTitle}>Filters</h2>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Location</label>
            <input
              type="text"
              className={styles.filterInput}
              placeholder="Enter location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              onFocus={() => setSearchTerm('')}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Price Range</label>
            <div className={styles.priceRangeInputs}>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className={styles.priceInput}
                placeholder="Min"
              />
              <span>to</span>
              <input
                type="number"
                min={minPrice}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className={styles.priceInput}
                placeholder="Max"
              />
            </div>
            <input
              type="range"
              min={minPrice}
              max="100000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className={styles.filterRange}
            />
            <p className={styles.priceDisplay}>
              ₱ {minPrice.toLocaleString()} – ₱ {maxPrice.toLocaleString()}
            </p>
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
          <div className={styles.tourGrid}>

            {filteredTours.map((tour, index) => {
              const isInCart = cartItems.some(item => item.id === tour.id);
              console.log('Checking if tour is in cart:', {
                cartItems,
                currentTourId: tour.id
              });

              return (
                <div
                  key={index}
                  className={styles.tourCard}
                  onClick={() => handleCardClick(tour)}
                >
                  <img
                    src={tour.image.includes('uploads')
                      ? `${apiBaseTour}/${tour.image}`
                      : `${base}${tour.image}`}
                    alt={tour.title}
                    className={styles.tourCardImage}
                  />

                  <div className={styles.tourCardDetails}>
                    <h3 className={styles.tourTitle}>{tour.title}</h3>
                    <p className={styles.tourDescription}>{tour.description}</p>
                    <p className={styles.tourPrice}>₱ {Number(tour.price).toLocaleString()}</p>
                    <p className={styles.tourSlots}>🎟️ {tour.available_slots} slots available</p>
                    <p className={styles.tourDates}>
                      📅 {tour.start_date && tour.end_date ? (
                        <>
                          {new Date(tour.start_date).toLocaleDateString('en-PH', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })} –{' '}
                          {new Date(tour.end_date).toLocaleDateString('en-PH', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </>
                      ) : 'Date not set'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="number"
                        min="1"
                        value={quantity[tour.id] || 1}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const qty = Math.max(1, parseInt(e.target.value) || 1);
                          setQuantity(prev => ({ ...prev, [tour.id]: qty }));
                        }}
                        style={{
                          width: '60px',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          border: '1px solid #ccc'
                        }}
                      />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isInCart)
                            addToCart({
                              ...tour,
                              quantity: quantity[tour.id] || 1,
                              type: 'tour'
                            });
                        }}
                        style={{
                          padding: '0.3rem 0.75rem',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {isInCart ? '✅ Added' : '➕ Add to Cart'}
                      </button>
                    </div>

                    {/* ✅ Show computed price (price × quantity) */}
                    <p style={{ marginTop: '0.25rem', fontWeight: 'bold' }}>
                      🧮 Total: ₱{(parseFloat(tour.price) * (quantity[tour.id] || 1)).toFixed(2)}
                    </p>


                  </div>
                </div>
              );
            })}

            {filteredTours.length === 0 && (
              <p className={styles.noResultsMessage}>No matching tours found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
