import React, { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import './Hotel.css';


const base = '/tourism-analytics';

export default function Hotel() {
    const { slug } = useParams(); // get the slug from the URL
    const [scrolled, setScrolled] = useState(false);
    const [hotelData, setHotelData] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (!slug) return;

        fetch(`http://localhost:5000/api/hotel/${slug}`) // dynamic slug
            .then(res => {
                if (!res.ok) throw new Error('Hotel not found');
                return res.json();
            })
            .then(data => setHotelData(data))
            .catch(err => {
                console.error('❌ Failed to fetch hotel data:', err);
                setError(true);
            });
    }, [slug]);

    if (!slug) return <Navigate to="/tourism-analytics" />;
    if (error) return <div className="error">Hotel not found.</div>;
    if (!hotelData) return <div className="loading">Loading hotel information...</div>;

    const { hotel, images } = hotelData;
    const backgroundImageUrl = hotel?.background_image
        ? `/tourism-analytics/images/${hotel.background_image}`
        : '/tourism-analytics/images/default.png';

    return (
        <>
            <header
                className={`hotel-header ${scrolled ? 'scrolled' : ''}`}
                style={{
                    backgroundImage: `url(${backgroundImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >

                <div className="logo-section">
                    <Link to="/hotel-cards">
                        <img src={`${base}/images/tourwise.png`} alt="TourWise Logo" className="logo-image" />
                    </Link>
                    <Link to="/hotel-cards">
                        <span className="logo-text">TourWise</span>
                    </Link>
                </div>

                <div className="header-content">
                    <div className="menu-bar">
                        <span className="menu-icon">≡</span>
                        <span className="menu-label">MENU</span>
                    </div>

                    <div className="action-bar">
                        <a href={`mailto:${hotel?.email || 'info@example.com'}`}>CONTACT US</a>
                        <span className="divider">|</span>
                        <span className="globe-icon" role="img" aria-label="globe">🌐</span>
                        <span>ENGLISH</span>
                        <button className="reserve-btn">RESERVE</button>
                    </div>
                </div>

                <div className="tagline">
                    Truly Authentically Filipino, Quintessentially Peninsula
                </div>
            </header>

            <div style={{ height: '20vh' }}></div>

            <main>
                {images && images.length > 0 ? (
                    images
                        .filter(img => img.filename && img.category !== 'background')
                        .map((img, idx) => (
                            <section key={`${img.filename}-${idx}`} className={`hotel-description section-${idx}`}>
                                <img
                                    src={`/tourism-analytics/images/${img.filename}`}
                                    alt={img.description || img.category || 'Hotel image'}
                                    loading="lazy"
                                />
                                <p>{img.description || 'No description available.'}</p>
                            </section>
                        ))
                ) : (
                    <p className="no-images">No hotel images available.</p>
                )}
            </main>
        </>
    );
}
