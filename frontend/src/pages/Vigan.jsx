import React, { useEffect } from 'react'; // ✅ FIX: Added useEffect import
import './Vigan.css';

const base = '/tourism-analytics';

export default function Vigan() {
  useEffect(() => {
    document.title = 'TourWise | Vigan Heritage Walk'; // ✅ FIX: Corrected title
  }, []);

  const handleBookNow = () => {
    window.open(`${base}/tour-cards`, '_blank'); // ✅ FIX: Opens TourCards in new tab
  };

  return (
    <div className="vigan-container">
      {/* Main Header */}
      <header className="browse-header">
        <div className="logo-section">
          <img src={`${base}/images/tourwise.png`} alt="TourWise Logo" className="logo-image" />
          <span className="logo-text">TourWise</span>
        </div>
        <h1 className="browse-title-inline">Vigan Tour</h1>
        <div className="vigan-actions">
          {/* ✅ FIX: Connected button to handler */}
          <button className="action-button" onClick={handleBookNow}>Book Now</button>
          <button className="action-button">Share</button>
          <button className="action-button">Contact Guide</button>
        </div>
      </header>

      <div className="vigan-hero" style={{ marginTop: '6rem' }}>
        <img src={`${base}/images/vigan_heritage_tour.png`} alt="Vigan Tour" className="vigan-image" />
        <div className="vigan-title">
          <h1>Vigan Heritage Walk</h1>
          <p>Ilocos Sur, Philippines</p>
        </div>
      </div>

      <section className="vigan-section">
        <h2>About the Tour</h2>
        <p>
          Discover the charm of Spanish colonial architecture and cobblestone streets in Vigan — a UNESCO World Heritage City.
          This walking tour takes you through Calle Crisologo, ancestral houses, and cultural landmarks where history and tradition come alive.
        </p>
      </section>

      <section className="vigan-section">
        <h2>History</h2>
        <p>
          Vigan was established in the 16th century by Spanish colonizers and remains one of the best-preserved examples of a planned Spanish colonial town in Asia.
          Its unique fusion of Asian and European architecture reflects its rich trading history.
        </p>
      </section>

      <section className="vigan-section">
        <h2>What to Expect</h2>
        <ul>
          <li>Walk through the historic Calle Crisologo</li>
          <li>Visit centuries-old ancestral homes and museums</li>
          <li>Ride a traditional horse-drawn carriage (kalesa)</li>
          <li>Enjoy local cuisine like empanada and longganisa</li>
          <li>Experience traditional pottery and weaving</li>
        </ul>
      </section>

      <section className="vigan-section">
        <h2>Tips for Visitors</h2>
        <ul>
          <li>Wear comfortable walking shoes</li>
          <li>Bring a hat or umbrella for shade</li>
          <li>Visit early morning or late afternoon to avoid the heat</li>
          <li>Try local delicacies sold along the street</li>
        </ul>
      </section>
    </div>
  );
}
