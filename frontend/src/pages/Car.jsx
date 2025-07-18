import { apiBaseCar } from '../config';
import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';

import './Car.css';

const base = '/tourism-analytics';

export default function Car() {
    const { slug } = useParams();
    const [scrolled, setScrolled] = useState(false);
    const [carData, setCarData] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (!slug) return;

        fetch(`${apiBaseCar}/api/car/${slug}`) // dynamic slug for car
            .then(res => {
                if (!res.ok) throw new Error('Car not found');
                return res.json();
            })
            .then(data => setCarData(data))
            .catch(err => {
                console.error('❌ Failed to fetch car data:', err);
                setError(true);
            });
    }, [slug]);

    if (!slug) return <Navigate to="/tourism-analytics" />;
    if (error) return <div className="error">Car not found.</div>;
    if (!carData) return <div className="loading">Loading car information...</div>;

    const { car, images } = carData;
    const backgroundImageUrl = car?.background_image
        ? `/tourism-analytics/images/${car.background_image}`
        : '/tourism-analytics/images/default.png';

    return (
        <>
            <header
                className={`car-header ${scrolled ? 'scrolled' : ''}`}
                style={{
                    backgroundImage: `url(${backgroundImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <div className="logo-section">
                    <Link to="/car-cards">
                        <img src={`${base}/images/tourwise.png`} alt="TourWise Logo" className="logo-image" />
                    </Link>
                    <Link to="/car-cards">
                        <span className="logo-text">TourWise</span>
                    </Link>
                </div>

                <div className="header-content">
                    <div className="menu-bar">
                        <span className="menu-icon">≡</span>
                        <span className="menu-label">MENU</span>
                    </div>

                    <div className="action-bar">
                        <a href={`mailto:${car?.email || 'info@example.com'}`}>INQUIRE</a>
                        <span className="divider">|</span>
                        <span className="globe-icon" role="img" aria-label="globe">🌐</span>
                        <span>ENGLISH</span>
                        <button className="reserve-btn">BOOK NOW</button>
                    </div>
                </div>

                <div className="tagline">
                    Travel Smart. Ride TourWise Cars.
                </div>
            </header>

            <div style={{ height: '20vh' }}></div>

            <main>
                {images && images.length > 0 ? (
                    images
                        .filter(img => img.filename && img.category !== 'background')
                        .map((img, idx) => (
                            <section key={`${img.filename}-${idx}`} className={`car-description section-${idx}`}>
                                <img
                                    src={`/tourism-analytics/images/${img.filename}`}
                                    alt={img.description || img.category || 'Car image'}
                                    loading="lazy"
                                />
                                <p>{img.description || 'No description available.'}</p>
                            </section>
                        ))
                ) : (
                    <p className="no-images">No car images available.</p>
                )}
            </main>
        </>
    );
}
