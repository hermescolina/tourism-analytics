import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import './TourWiseLanding.css';

const base = '/tourism-analytics';
const imageBase = 'http://localhost:3001';

// 🔹 Resolve static vs uploaded image paths
const getStaticImageUrl = (path) => {
    if (!path) return '';
    let cleaned = path.startsWith('/') ? path : `/${path}`;
    return cleaned.startsWith('/uploads/')
        ? `${imageBase}${cleaned}`
        : `${base}${cleaned}`;
};

export default function TourWiseLanding() {
    const [tours, setTours] = useState([]);
    const [hotels, setHotels] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:3001/api/landing-data')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                console.log("✅ Fetched API data:", data);
                setTours(data.topTours);
                setHotels(data.hotels); // ✅ Add hotel data
            })
            .catch(err => {
                console.error('❌ Failed to fetch from API:', err);
            });
    }, []);

    if (!tours.length && !hotels.length) {
        return <p>Loading data or none available...</p>;
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
                    {tours.map((tour, index) => {
                        const imageUrl = getStaticImageUrl(tour.image);
                        return (
                            <div
                                className="tour-card"
                                key={index}
                                onClick={() => navigate(`/tour/${tour.slug}`)}
                            >
                                <img
                                    src={imageUrl}
                                    alt={tour.title}
                                    className="tour-image"
                                />
                                <div className="tour-info">
                                    <h3>{tour.title}</h3>
                                    <p className="description">{tour.description || 'No description available.'}</p>
                                    {tour.location && <p className="location">{tour.location}</p>}
                                    <p className="price">₱{Number(tour.price).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                    })}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Featured Hotels Section */}
            <section className="section-featured">
                <h2 className="section-title">Top Hotels</h2>
                <div className="tour-cards">
                    {hotels.map((hotel, index) => {
                        const imageUrl = getStaticImageUrl(hotel.image);
                        return (
                            <div
                                className="tour-card"
                                key={index}
                                onClick={() => navigate(`/hotel/${hotel.slug}`)}
                            >
                                <img
                                    src={imageUrl}
                                    alt={hotel.name}
                                    className="tour-image"
                                />
                                <div className="tour-info">
                                    <h3>{hotel.name}</h3>
                                    <p className="description">{hotel.description || 'No description available.'}</p>
                                </div>
                            </div>
                        );
                    })}
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
