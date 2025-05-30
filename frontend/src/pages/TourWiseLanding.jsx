import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import './TourWiseLanding.css';

const base = '/tourism-analytics';
const apiUrl = 'http://localhost:3001/api/landing-data';

const sanitizeImagePath = (path) => {
    if (!path) return '';
    return path.startsWith('/') ? path : `/${path}`;
};

export default function TourWiseLanding() {
    const [tours, setTours] = useState([]);
    const navigate = useNavigate(); // ✅ this must be inside the component

    useEffect(() => {
        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                setTours(data.topTours || []);
            })
            .catch(err => console.error('❌ Failed to fetch from API:', err));
    }, []);



    if (!tours.length) {
        return <p>Loading tours or no tours available...</p>;
    }

    const handleBookNow = () => {
        console.log('🟢 Book Now button clicked');
        window.open(`${base}/tour-cards`, '_blank');
    };

    const handleCardClick = (title) => {
        console.log(`🟢 Tour card clicked: ${title}`);
        const slug = title.toLowerCase().replace(/\s+/g, '-'); // convert title to URL-friendly slug
        navigate(`/tour/${slug}`); // ✅ navigate to a dynamic route like /tour/el-nido-island-hopping
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
                        <a
                            href={tour.link}
                            className="tour-card"
                            key={index}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleCardClick(tour.title)}
                        >
                            <img
                                src={`${base}${sanitizeImagePath(tour.image)}`}
                                alt={tour.title}
                                className="tour-image"
                            />
                            <div className="tour-info">
                                <h3>{tour.title}</h3>
                                <p className="description">
                                    {tour.description || 'No description available.'}
                                </p>
                                {tour.location && (
                                    <p className="location">{tour.location}</p>
                                )}
                                <p className="price">
                                    ₱{Number(tour.price).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                    })}
                                </p>
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
