import React from 'react';
import './Siargao.css';

export default function Siargao() {
  return (
    <div className="siargao-container">
      {/* Main Header */}
      <header className="browse-header">
        <div className="logo-section">
          <img src="/tourism-analytics/images/tourwise.png" alt="TourWise Logo" className="logo-image" />
          <span className="logo-text">TourWise</span>
        </div>
        <h1 className="browse-title-inline">Siargao Tour</h1>
        <div className="siargao-actions">
          <button className="action-button">Book Now</button>
          <button className="action-button">Share</button>
          <button className="action-button">Contact Guide</button>
        </div>
      </header>

      <div className="siargao-hero" style={{ marginTop: '6rem' }}>
        <img src="/tourism-analytics/images/siargao_surf_camp.jpg" alt="Siargao Tour" className="siargao-image" />
        <div className="siargao-title">
          <h1>Siargao Surf Camp</h1>
          <p>Siargao, Philippines</p>
        </div>
      </div>

      <section className="siargao-section">
        <h2>About the Tour</h2>
        <p>
          Experience the surf capital of the Philippines in Siargao, famous for Cloud 9 waves, island hopping, and a relaxed beach vibe. This tour includes a mix of adventure and local culture.
        </p>
      </section>

      <section className="siargao-section">
        <h2>History</h2>
        <p>
          Once a hidden paradise known mostly to surfers, Siargao gained international fame thanks to its consistent breaks and unspoiled beauty. Over time, it has become a top destination for both surfing and ecotourism.
        </p>
      </section>

      <section className="siargao-section">
        <h2>What to Expect</h2>
        <ul>
          <li>Ride the famous Cloud 9 waves or watch from the boardwalk</li>
          <li>Island hop to Naked Island, Daku, and Guyam</li>
          <li>Swim in the cool waters of Sugba Lagoon</li>
          <li>Explore local markets and beachside cafes</li>
          <li>Enjoy breathtaking sunrise and sunset views</li>
        </ul>
      </section>

      <section className="siargao-section">
        <h2>Tips for Visitors</h2>
        <ul>
          <li>Bring waterproof bags and reef-safe sunscreen</li>
          <li>Rent a motorbike to explore the island easily</li>
          <li>Respect surf zones and local customs</li>
          <li>Visit during dry season (March to October) for best waves</li>
        </ul>
      </section>
    </div>
  );
}
