import React, { useState } from 'react';
import './BrowseTours.css';

const tours = [
  {
    title: "El Nido Island Hopping",
    location: "Palawan",
    price: 2500,
    image: "/images/el_nido.jpg",
    description: "Island adventure in Palawan"
  },
  {
    title: "Vigan Heritage Walk",
    location: "Ilocos Sur",
    image: "/images/vigan_heritage_tour.png",
    description: "Cultural experience in Vigan"
  },
  {
    title: "Bohol Countryside Tour",
    location: "Bohol",
    price: 2100,
    image: "/images/chocolate_hills.jpg",
    description: "Explore nature in Bohol"
  },
  {
    title: "Siargao Surf Camp",
    location: "Siargao",
    price: 3000,
    image: "/images/siargao_surf_camp.jpg",
    description: "Catch waves in the surfing capital of the Philippines"
  }
];

export default function BrowseTours() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTours = tours.filter(tour =>
    tour.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tour.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="browse-container">
      {/* Fixed Header */}
      <header className="browse-header">
        <div className="logo-section">
          <img src="/images/tourwise.png" alt="TourWise Logo" className="logo-image" />
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
          />
        </div>
      </header>

      <div className="browse-wrapper">
        <div className="browse-content">
          {/* Fixed Sidebar */}
          <aside className="filter-panel">
            <h2 className="filter-title">Filters</h2>

            <div className="filter-group">
              <label className="filter-label">Location</label>
              <input type="text" className="filter-input" placeholder="Enter location" />
            </div>

            <div className="filter-group">
              <label className="filter-label">Price Range</label>
              <input type="range" min="1000" max="5000" className="filter-range" />
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

          {/* Tour Grid */}
          <div className="tour-grid">
            {filteredTours.map((tour, index) => {
              const linkMap = {
                "El Nido Island Hopping": "/el-nido",
                "Vigan Heritage Walk": "/vigan",
                "Bohol Countryside Tour": "/chocolatehills"
              };

              const tourLink = linkMap[tour.title];

              if (tourLink) {
                return (
                  <a
                    key={index}
                    href={tourLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tour-card"
                  >
                    <div className="tour-card-image-wrapper">
                      <img
                        src={tour.image}
                        alt={tour.title}
                        className="tour-card-image"
                      />
                    </div>
                    <div className="tour-card-content">
                      <h3 className="tour-title">{tour.title}</h3>
                      <p className="tour-description">{tour.description}</p>
                      <p className="tour-price">₱ {tour.price?.toLocaleString() ?? ''}</p>
                    </div>
                  </a>
                );
              }

              // Default card for other tours
              return (
                <div
                  key={index}
                  className="tour-card"
                  onClick={() => alert(`You clicked: ${tour.title}`)}
                >
                  <div className="tour-card-image-wrapper">
                    <img
                      src={tour.image}
                      alt={tour.title}
                      className="tour-card-image"
                    />
                  </div>
                  <div className="tour-card-content">
                    <h3 className="tour-title">{tour.title}</h3>
                    <p className="tour-description">{tour.description}</p>
                    <p className="tour-price">₱ {tour.price?.toLocaleString() ?? ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
