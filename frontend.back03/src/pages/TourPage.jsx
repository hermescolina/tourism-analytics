import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './TourPage.css';

const base = '/tourism-analytics';
//const apiBase = 'http://localhost:3001';
const apiBase = 'https://tourism-analytics.onrender.com';


export default function TourPage() {
    const { slug } = useParams();
    const [tour, setTour] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`${apiBase}/api/tours/${slug}`)
            .then(res => {
                if (!res.ok) throw new Error('Tour not found');
                return res.json();
            })
            .then(data => {
                setTour(data);
                document.title = `TourWise | ${data.title}`;
            })
            .catch(err => {
                console.error('❌ Failed to load tour:', err);
                setError('Tour not found or server error.');
            });
    }, [slug]);

    if (error) return <div className="tour-container">{error}</div>;
    if (!tour) return <div className="tour-container">Loading...</div>;

    return (
        <div className="tour-container">
            <header className="browse-header">
                <div className="logo-section">
                    <img src={`${base}/images/tourwise.png`} alt="TourWise Logo" className="logo-image" />
                    <span className="logo-text">TourWise</span>
                </div>
                <h1 className="browse-title-inline">{tour.title}</h1>
                <div className="tour-actions">
                    <button className="action-button" onClick={() => window.open(`${base}/tour-cards`, '_blank')}>Book Now</button>
                    <button className="action-button">Share</button>
                    <button className="action-button">Contact Guide</button>
                </div>
            </header>

            <div className="tour-hero" style={{ marginTop: '6rem' }}>
                <img src={`${base}${tour.image}`} alt={tour.title} className="tour-image" />
                <div className="tour-title">
                    <h1>{tour.title}</h1>
                    <p>{tour.location}</p>
                </div>
            </div>

            <section className="tour-section">
                <h2>About the Tour</h2>
                <p>{tour.description}</p>
            </section>

            <section className="tour-section">
                <h2>What to Expect</h2>
                <ul>
                    {(tour.expectations || '').split(';').map((item, idx) => (
                        <li key={idx}>{item.trim()}</li>
                    ))}
                </ul>
            </section>

            <section className="tour-section">
                <h2>Tips for Visitors</h2>
                <ul>
                    {(tour.tips || '').split(';').map((item, idx) => (
                        <li key={idx}>{item.trim()}</li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
