import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './TourWiseLanding.css';

const base = '/tourism-analytics';
const imageBase = 'http://localhost:3001';

const isValidUrl = (str) => str.startsWith('http://') || str.startsWith('https://');

const getStaticImageUrl = (path) => {
    if (!path) return '';
    if (isValidUrl(path)) return path;
    const cleaned = path.startsWith('/') ? path : `/${path}`;
    return cleaned.startsWith('/uploads/')
        ? `${imageBase}${cleaned}`
        : `${base}${cleaned}`;
};

export default function TourWiseLanding() {
    const [tours, setTours] = useState([]);
    const [hotels, setHotels] = useState([]);
    const navigate = useNavigate();
    const [language, setLanguage] = useState('');
    const [showLangBanner, setShowLangBanner] = useState(true);
    const [languagesList, setLanguagesList] = useState([]);
    const [languageFlags, setLanguageFlags] = useState({});
    const [currency, setCurrency] = useState('USD');
    const [currencyList, setCurrencyList] = useState({});

    const currencySymbols = {
        USD: '$',
        EUR: '€',
        PHP: '₱',
        JPY: '¥',
        GBP: '£',
        AUD: 'A$',
        CAD: 'C$'
    };

    useEffect(() => {
        fetch('https://restcountries.com/v3.1/all?fields=languages,flags')
            .then(res => res.json())
            .then(data => {
                const langs = new Set();
                const flags = {};

                data.forEach(country => {
                    if (country.languages) {
                        Object.values(country.languages).forEach(lang => {
                            langs.add(lang);
                            if (!flags[lang] && country.flags?.png) {
                                flags[lang] = country.flags.png;
                            }
                        });
                    }
                });

                const sortedLangs = Array.from(langs).sort();
                setLanguagesList(sortedLangs);
                setLanguageFlags(flags);

                if (!language) {
                    const fallback = sortedLangs.find(l => l.includes('English')) || sortedLangs[0];
                    setLanguage(fallback);
                }
            })
            .catch(err => console.error('❌ Error fetching languages and flags:', err));
    }, []);

    useEffect(() => {
        fetch('https://api.frankfurter.dev/v1/currencies')
            .then(res => res.json())
            .then(data => {
                setCurrencyList(data);
            })
            .catch(err => console.error('❌ Error fetching currencies:', err));
    }, []);

    useEffect(() => {
        fetch('http://localhost:3001/api/landing-data')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                console.log("✅ Fetched API data:", data);
                setTours(data.topTours);
                setHotels(data.hotels);
            })
            .catch(err => {
                console.error('❌ Failed to fetch from API:', err);
            });
    }, []);

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
    };

    const handleCurrencyChange = (e) => {
        const selected = e.target.value;
        setCurrency(selected);
        console.log("💱 Currency selected:", selected);
    };

    const handleLanguageConfirm = () => {
        setShowLangBanner(false);
        console.log("🌐 Language selected:", language);
    };

    const Navbar = () => (
        <header className="navbar">
            <div className="navbar-logo" onClick={() => window.location.href = '/'}>
                TourWise
            </div>
            <nav>
                <a href={`${base}/tour-cards`} target="_blank" rel="noopener noreferrer">Tours</a>
                <a href={`${base}/hotel-cards`} target="_blank" rel="noopener noreferrer">Hotels</a>
                <a href={`${base}/car-cards`} target="_blank" rel="noopener noreferrer">Cars</a>
                <a href={`${base}/admin/tours`} target="_blank" rel="noopener noreferrer">Add Tour</a>
                <a href={`${base}/admin/tour-cards`} target="_blank" rel="noopener noreferrer">Update Tour Images</a>
            </nav>
        </header>
    );

    if (!tours.length && !hotels.length) {
        return <p>Loading data or none available...</p>;
    }

    return (
        <div className="tourwise-landing">
            {showLangBanner && (
                <div className="language-banner">
                    <span>Choose your preferred language for localized experiences</span>
                    <select value={language} onChange={handleLanguageChange}>
                        {languagesList.map((lang, idx) => (
                            <option key={idx} value={lang}>
                                {languageFlags[lang] ? `🌐 ${lang}` : lang}
                            </option>
                        ))}
                    </select>

                    {languageFlags[language] && (
                        <div style={{ margin: '0.5rem 0' }}>
                            <img src={languageFlags[language]} alt="flag" style={{ height: '20px', marginRight: '0.5rem' }} />
                            <strong>{language}</strong>
                        </div>
                    )}

                    <div style={{ marginTop: '0.5rem' }}>
                        <label style={{ marginRight: '0.5rem' }}>Currency:</label>
                        <select value={currency} onChange={handleCurrencyChange}>
                            {Object.entries(currencyList).map(([code, name]) => (
                                <option key={code} value={code}>{code} - {name}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={handleLanguageConfirm}>Go</button>
                    <button onClick={() => setShowLangBanner(false)}>✕</button>
                </div>
            )}

            <Navbar />

            <section className="hero">
                <div className="hero-content">
                    <h1>Explore the World with TourWise</h1>
                    <p>Discover amazing destinations and tours tailored for you.</p>
                    <button className="btn-primary" onClick={() => window.open(`${base}/tour-cards`, '_blank')}>Book Now</button>
                </div>
                <div className="scroll-indicator">⌄</div>
            </section>

            <section className="section-featured">
                <h2 className="section-title">Top Destinations</h2>
                <div className="tour-cards">
                    {tours.map((tour, index) => (
                        <div
                            className="tour-card"
                            key={index}
                            onClick={() => navigate(`/tour/${tour.slug}`)}
                        >
                            <img
                                src={getStaticImageUrl(tour.image)}
                                alt={tour.title}
                                className="tour-image"
                            />
                            <div className="tour-info">
                                <h3>{tour.title}</h3>
                                <p className="description">{tour.description || 'No description available.'}</p>
                                {tour.location && <p className="location">{tour.location}</p>}
                                <p className="price">{currencySymbols[currency] || ''}{Number(tour.price).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                })}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="section-featured">
                <h2 className="section-title">Top Hotels</h2>
                <div className="tour-cards">
                    {hotels.map((hotel, index) => (
                        <div
                            className="tour-card"
                            key={index}
                            onClick={() => navigate(`/hotel/${hotel.slug}`)}
                        >
                            <img
                                src={getStaticImageUrl(hotel.image)}
                                alt={hotel.name}
                                className="tour-image"
                            />
                            <div className="tour-info">
                                <h3>{hotel.name}</h3>
                                <p className="description">{hotel.description || 'No description available.'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

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