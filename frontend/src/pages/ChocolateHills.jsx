import React from 'react';
import './ChocolateHills.css';

const base = '/tourism-analytics';

export default function ChocolateHills() {
  return (
    <div className="chocolatehills-container">
      {/* Main Header */}
      <header className="browse-header">
        <div className="logo-section">
          <img src={`${base}/images/tourwise.png`} alt="TourWise Logo" className="logo-image" />
          <span className="logo-text">TourWise</span>
        </div>
        <h1 className="browse-title-inline">Chocolate Hills Tour</h1>
        <div className="chocolatehills-actions">
          <button className="action-button">Book Now</button>
          <button className="action-button">Share</button>
          <button className="action-button">Contact Guide</button>
        </div>
      </header>

      <div className="chocolatehills-hero" style={{ marginTop: '6rem' }}>
        <img src={`${base}/images/chocolate_hills.jpg`} alt="Chocolate Hills Tour" className="chocolatehills-image" />
        <div className="chocolatehills-title">
          <h1>Chocolate Hills Adventure</h1>
          <p>Bohol, Philippines</p>
        </div>
      </div>

      <section className="chocolatehills-section">
        <h2>About the Tour</h2>
        <p>
          Explore the breathtaking landscape of over 1,200 cone-shaped hills in Bohol known as the Chocolate Hills. This countryside tour offers nature lovers and adventurers a chance to see one of the Philippines' most iconic natural wonders.
        </p>
      </section>

      <section className="chocolatehills-section">
        <h2>History</h2>
        <p>
          The Chocolate Hills are a geological formation created by uplifted coral deposits and rainwater erosion. During the dry season, the green grass covering the hills turns brown — hence the name "Chocolate Hills".
        </p>
      </section>

      <section className="chocolatehills-section">
        <h2>What to Expect</h2>
        <ul>
          <li>Visit the Chocolate Hills viewing deck</li>
          <li>Ride an ATV around the hills</li>
          <li>Enjoy scenic countryside landscapes</li>
          <li>Discover local folklore and legends</li>
          <li>Combine with visits to tarsier sanctuaries and river cruises</li>
        </ul>
      </section>

      <section className="chocolatehills-section">
        <h2>Tips for Visitors</h2>
        <ul>
          <li>Bring water and sun protection</li>
          <li>Wear comfortable clothes for hiking or ATV riding</li>
          <li>Best visited during the dry season (Nov–May)</li>
          <li>Combine your tour with nearby attractions for a full-day trip</li>
        </ul>
      </section>
    </div>
  );
}
