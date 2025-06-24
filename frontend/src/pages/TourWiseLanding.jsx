import React, { useEffect, useState } from 'react';
import { apiBaseTour, apiBaseHotel, apiBaseCar, frontendBase } from '../config';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import styles from './TourWiseLanding.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


const base = '/tourism-analytics';

const isValidUrl = (str) => str.startsWith('http://') || str.startsWith('https://');

const getStaticImageUrl = (path) => {
    if (!path) return '';
    if (isValidUrl(path)) return path;
    const cleaned = path.startsWith('/') ? path : `/${path}`;
    return cleaned.startsWith('/uploads/')
        ? `${apiBaseTour}${cleaned}`
        : `${base}${cleaned}`;
};

console.log("apiBaseTour URL:", apiBaseTour);

console.log("Base URL:", base);

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
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);


    const currencySymbols = {
        USD: '$',
        EUR: '€',
        PHP: '₱',
        JPY: '¥',
        GBP: '£',
        AUD: 'A$',
        CAD: 'C$'
    };

    // ===============================Language and Currency Fetching================================
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


    // ===============================API Data Fetching================================
    useEffect(() => {
        fetch(`${apiBaseTour}/api/landing-data`)

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


    const Navbar = () => {
        const [menuOpen, setMenuOpen] = useState(false);
        const base = '/tourism-analytics'; // Adjust if needed

        return (
            <header className={styles.navbar}>
                <div className={styles.navbarLogo} onClick={() => window.location.href = '/'}>
                    TourWise
                </div>

                <div className={styles.dropdown}>
                    <button
                        className={styles.menuToggle}
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle Menu"
                    >
                        ☰
                    </button>

                    {menuOpen && (
                        <div className={styles.dropdownMenu}>
                            <div className={styles.menuGroup}>
                                <strong>Tours</strong>
                                <a href={`${base}/tour-cards`} target="_blank" rel="noopener noreferrer">
                                    <i className="fas fa-map-marked-alt" style={{ marginRight: '0.5rem' }}></i>
                                    View Tours
                                </a>

                                <a href={`${base}/admin/tours`} target="_blank" rel="noopener noreferrer">
                                    <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
                                    Add New Tours
                                </a>

                                <a href={`${base}/admin/tour-cards`} target="_blank" rel="noopener noreferrer">
                                    <i className="fas fa-photo-video" style={{ marginRight: '0.5rem' }}></i>
                                    Update Tours Media
                                </a>



                            </div>

                            <div className={styles.menuGroup}>
                                <strong>Hotels</strong>
                                <a href={`${base}/hotel-cards`} target="_blank" rel="noopener noreferrer">
                                    <i className="fas fa-hotel" style={{ marginRight: '0.5rem' }}></i>
                                    View Hotels
                                </a>

                                <a href={`${base}/admin/hotel`} target="_blank" rel="noopener noreferrer">
                                    <i className="fas fa-plus-square" style={{ marginRight: '0.5rem' }}></i>
                                    Add New Hotel
                                </a>

                            </div>

                            <div className={styles.menuGroup}>
                                <strong>Cars</strong>
                                <a href={`${base}/car-cards`} target="_blank" rel="noopener noreferrer">View Cars</a>
                                <a href={`${base}/admin/car-cards`} target="_blank" rel="noopener noreferrer">Update Car Listings</a>
                            </div>
                        </div>
                    )}
                </div>
            </header >
        );
    };


    if (!tours.length && !hotels.length) {
        return <p>Loading data or none available...</p>;
    }


    return (
        <div className={styles.tourwiseLanding}>
            {showLangBanner && (
                <div className={styles.languageBanner}>
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

            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1>Explore the World with TourWise</h1>
                    <p>Discover amazing destinations and tours tailored for you.</p>
                    <button className={styles.btnPrimary} onClick={() => window.open(`${base}/bookpage`, '_blank')}>Book Now</button>
                </div>
                <div className={styles.scrollIndicator}>⌄</div>
            </section>


            <section className={styles.sectionFeatured}>
                <h2 className={styles.sectionTitle}>Top Destinations</h2>
                <div className={styles.tourCards}>
                    {tours.map((tour, index) => {
                        console.log("📸 Tour image URL:", getStaticImageUrl(tour.image));
                        return (
                            <div
                                className={styles.tourCard}
                                key={index}
                                onClick={() => navigate(`/tour/${tour.slug}`)}
                            >
                                <img
                                    src={getStaticImageUrl(tour.image)}
                                    alt={tour.title}
                                    className={styles.tourImage}
                                />
                                <div className={styles.tourInfo}>
                                    <h3>{tour.title}</h3>
                                    <p className={styles.description}>{tour.description || 'No description available.'}</p>
                                    {tour.location && <p className={styles.location}>{tour.location}</p>}
                                    <p className={styles.price}>
                                        {currencySymbols[currency] || ''}
                                        {Number(tour.price).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>


            <section className={styles.sectionFeatured}>
                <h2 className={styles.sectionTitle}>Top Hotels</h2>
                <div className={styles.tourCards}>
                    {hotels.map((hotel, index) => (
                        <div
                            className={styles.tourCard}
                            key={index}
                            onClick={() => navigate(`/hotel/${hotel.slug}`)}
                        >
                            <img
                                src={getStaticImageUrl(hotel.image)}
                                alt={hotel.name}
                                className={styles.tourImage}
                            />
                            <div className={styles.tourInfo}>
                                <h3>{hotel.name}</h3>
                                <p className={styles.description}>{hotel.description || 'No description available.'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className={styles.sectionTips}>
                <h2 className={styles.sectionTitle}>Travel Tips</h2>
                <div className={styles.tipsGrid}>
                    <p>Enjoy seamless travel planning with expert guidance every step of the way.</p>
                    <p>Experience unforgettable destinations with personalized recommendations.</p>
                    <p>Explore the world in comfort — your perfect trip starts here.</p>
                </div>
            </section>
        </div>
    );
}