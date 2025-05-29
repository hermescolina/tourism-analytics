import React, { useEffect, useState } from 'react';
import './TourWiseLanding.css';

const base = '/tourism-analytics';

// ✅ Move this OUTSIDE the JSX
const sanitizeImagePath = (path) => {
    if (!path) return '';
    return path.startsWith('/') ? path : `/${path}`;
};

export default function TourWiseLanding() {
    const [tours, setTours] = useState([]);
    useEffect(() => {
        fetch(`${base}/data/landing.json`)
            .then(res => res.text())
            .then(text => {
                console.log('🚨 Raw landing.json:', text);
                const json = JSON.parse(text);
                console.log('✅ Parsed topTours:', json.topTours);
                setTours(json.topTours || []);
            })
            .catch(err => console.error('❌ Failed to load landing.json:', err));
    }, []);

    // useEffect(() => {
    //     document.title = 'TourWise | Explore the World';

    //     fetch(`${base}/data/landing.json`)
    //         .then(res => res.json())
    //         .then(data => {
    //             console.log('✅ Loaded topTours from landing.json:', data.topTours);
    //             setTours(data.topTours || []);
    //         })
    //         .catch(err => console.error('❌ Failed to load landing.json:', err));
    // }, []);

    if (!tours.length) {
        return <p>Loading tours or no tours available...</p>;
    }

    const handleBookNow = () => {
        window.open(`${base}/tour-cards`, '_blank');
    };

    return (
        <div className="tourwise-landing">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1>Explore the World with TourWise</h1>
                    <p>Discover amazing destinations and tours tailored for you.</p>
                    <button className="btn-primary" onClick={handleBookNow}>Book Now</button>
                </div>
            </section>

            {/* Featured Tours Section */}
            <section className="section-featured">
                <h2 className="section-title">Top Destinations</h2>

                <div className="tour-cards">
                    {tours.map((tour, index) => (
                        <a href={tour.link} className="tour-card" key={index}>
                            <img
                                src={`${base}${sanitizeImagePath(tour.image)}`}
                                alt={tour.title}
                                className="tour-image"
                            />
                            <div className="tour-info">
                                <h3>{tour.title}</h3>

                                {tour.location && <p className="location">{tour.location}</p>}
                                {tour.description && <p className="description">{tour.description}</p>}

                                <p className="price">₱{tour.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                        </a>
                    ))}
                </div>

            </section>

            {/* Travel Tips Section */}
            <section className="section-tips">
                <h2 className="section-title">Travel Tips</h2>
                <div className="tips-grid">
                    <p>Enjoy seamless travel planning with expert guidance every step of the way.</p>
                    <p>Experience unforgettable destinations with personalized recommendations.</p>
                    <p>Explore the world in comfort — your perfect trip starts here.</p>
                </div>
            </section>
        </div>
    );
}
