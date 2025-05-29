import React, { useState } from 'react';
import './BrowseTours.css';

const base = '/tourism-analytics';

const tours = [
    {
        title: "El Nido Island Hopping",
        location: "Palawan",
        price: 2500,
        image: `${base}/images/el_nido.jpg`,
        description: "Island adventure in Palawan",
        link: `${base}/el-nido`,
    },
    {
        title: "Vigan Heritage Walk",
        location: "Ilocos Sur",
        price: 1800,
        image: `${base}/images/vigan_heritage_tour.png`,
        description: "Cultural experience in Vigan",
        link: `${base}/vigan`,
    },
    {
        title: "Chocolate Hills Tour",
        location: "Bohol",
        price: 2100,
        image: `${base}/images/chocolate_hills.jpg`,
        description: "Explore nature in Bohol",
        link: `${base}/chocolatehills`,
    },
    {
        title: "Siargao Surf Camp",
        location: "Siargao",
        price: 3000,
        image: `${base}/images/siargao_surf_camp.jpg`,
        description: "Catch waves in the surfing capital of the Philippines",
        link: `${base}/siargao`,
    }
];

export default function BrowseTours() {
    const [minPrice, setMinPrice] = useState(1000);
    const [maxPrice, setMaxPrice] = useState(100000);
    const safeMinPrice = Number(minPrice) || 0;     // Default to 0 if empty or invalid
    const safeMaxPrice = Number(maxPrice) || 999999; // Very high default if empty

    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');

    const normalize = str => str.toLowerCase().replace(/\s+/g, '');

    const filteredTours = tours.filter(tour => {
        const searchNormalized = normalize(searchTerm);

        const locationFilterNormalized = normalize(locationFilter);

        const titleNormalized = normalize(tour.title);
        const descNormalized = normalize(tour.description);
        const locationNormalized = normalize(tour.location);

        const matchesSearch = titleNormalized.startsWith(searchNormalized);
        console.log({
            locationNormalized: locationNormalized,
            locationFilterNormalized: locationFilterNormalized
        })

        if (safeMaxPrice < safeMinPrice) return false;


        const matchesLocation = locationNormalized.startsWith(locationFilterNormalized);

        const matchesPrice = tour.price >= safeMinPrice && tour.price <= safeMaxPrice;

        const result = matchesSearch && matchesLocation && matchesPrice;
        console.log({
            title: tour.title,
            titleNormalized,
            descNormalized,
            locationNormalized,
            searchTerm,
            searchNormalized,
            locationFilter,
            locationFilterNormalized,
            matchesSearch,
            matchesLocation,
            matchesPrice,
            result
        });

        return result;
    });

    return (
        <div className="browse-container">
            <header className="browse-header">
                <div className="logo-section">
                    <img src={`${base}/images/tourwise.png`} alt="TourWise Logo" className="logo-image" />
                    <span className="logo-text">TourWise</span>
                </div>
                <h1 className="browse-title-inline">Browse Tours</h1>
                <div className="search-bar-wrapper">
                    <input
                        type="text"
                        placeholder="🔍 Search tours"
                        className="search-bar"
                        value={searchTerm}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setSearchTerm(newValue);
                            console.log("Search term:", newValue);
                        }}
                        onFocus={() => {
                            setLocationFilter(''); // 👈 clear location filter when search is clicked
                        }}
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
                            onChange={(e) => {
                                const newValue = e.target.value;
                                setLocationFilter(newValue);
                                console.log("Location filter value:", newValue);
                            }}
                            onFocus={() => {
                                setSearchTerm(''); // 👈 clear location filter when search is clicked
                            }}

                        />
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Price Range</label>

                        {/* Text Inputs for Min and Max */}
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

                        {/* Optional Slider to adjust Max */}
                        <input
                            type="range"
                            min={minPrice}
                            max="100000"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(Number(e.target.value))}
                            className="filter-range"
                        />
                        <p className="price-display">₱ {minPrice.toLocaleString()} – ₱ {maxPrice.toLocaleString()}</p>

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
                            <a
                                key={index}
                                className="tour-card"
                                href={tour.link}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img
                                    src={tour.image}
                                    alt={tour.title}
                                    className="tour-card-image"
                                />
                                <div className="tour-card-details">
                                    <h3 className="tour-title">{tour.title}</h3>
                                    <p className="tour-description">{tour.description}</p>
                                    <p className="tour-price">₱ {tour.price?.toLocaleString()}</p>
                                </div>
                            </a>
                        ))}

                        {/* ✅ INSERT THIS RIGHT HERE */}
                        {filteredTours.length === 0 && (
                            <p className="no-results-message">No matching tours found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}