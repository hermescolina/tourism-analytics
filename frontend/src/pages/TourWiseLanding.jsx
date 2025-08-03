import { useEffect, useState } from 'react';
import { apiBaseTour, frontendBase } from '../config';
import { useNavigate } from 'react-router-dom';
import styles from './TourWiseLanding.module.css';

import '@fortawesome/fontawesome-free/css/all.min.css';


const base = `${frontendBase}/tourism-analytics`;
const baseurl = `${apiBaseTour}/uploads`;

const isValidUrl = (str) => str.startsWith('http://') || str.startsWith('https://');

const getStaticImageUrl = (path) => {
    console.log("🖼️ Image path:", path);
    if (!path) return '';
    if (isValidUrl(path)) return path;
    const cleaned = path.startsWith('/') ? path : `/${path}`;
    return cleaned.startsWith('/images/')
        ? `${base}${cleaned}`
        : `${baseurl}${cleaned}`;
};


export default function TourWiseLanding() {
    const [items, setItems] = useState(null);
    const navigate = useNavigate();
    const [language, setLanguage] = useState('');
    const [showLangBanner, setShowLangBanner] = useState(true);
    const [languagesList, setLanguagesList] = useState([]);
    const [languageFlags, setLanguageFlags] = useState({});

    const [currency, setCurrency] = useState('USD');
    const [currencyList, setCurrencyList] = useState({});


    useEffect(() => {
        const cached = localStorage.getItem('languageData');
        if (cached) {
            const { langs, flags, codeMap: timestamp } = JSON.parse(cached);
            const isFresh = Date.now() - timestamp < 24 * 60 * 60 * 1000;
            if (isFresh) {
                setLanguagesList(langs);
                setLanguageFlags(flags);
                // setLanguageCodeMap(storedCodeMap);  // ✅ renamed to storedCodeMap
                if (!language) {
                    const fallback = langs.find(l => l.includes('English')) || langs[0];
                    setLanguage(fallback);
                }
                return;
            }
        }

        // These are for fresh API load
        const langs = new Set();
        const flags = {};
        const codeMapFresh = {};  // ✅ renamed to avoid conflict

        fetch('https://restcountries.com/v3.1/all?fields=languages,flags')
            .then(res => res.json())
            .then(data => {
                data.forEach(country => {
                    if (country.languages) {
                        Object.entries(country.languages).forEach(([code, name]) => {
                            langs.add(name);
                            codeMapFresh[name] = code;
                            if (!flags[name] && country.flags?.png) {
                                flags[name] = country.flags.png;
                            }
                        });
                    }
                });

                const sortedLangs = Array.from(langs).sort();
                setLanguagesList(sortedLangs);
                setLanguageFlags(flags);
                // setLanguageCodeMap(codeMapFresh);

                localStorage.setItem('languageData', JSON.stringify({
                    langs: sortedLangs,
                    flags,
                    codeMap: codeMapFresh,  // ✅ stored with original name
                    timestamp: Date.now()
                }));

                if (!language) {
                    const fallback = sortedLangs.find(l => l.includes('English')) || sortedLangs[0];
                    setLanguage(fallback);
                }
            })
            .catch(err => console.error('❌ Error fetching languages and flags:', err));
    }, []);



    useEffect(() => {
        const cached = localStorage.getItem('currencyData');
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const isFresh = Date.now() - timestamp < 24 * 60 * 60 * 1000;
            if (isFresh) {
                setCurrencyList(data);
                return;
            }
        }

        fetch('https://api.frankfurter.dev/v1/currencies')
            .then(res => res.json())
            .then(data => {
                setCurrencyList(data);
                localStorage.setItem('currencyData', JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));
            })
            .catch(err => console.error('❌ Error fetching currencies:', err));
    }, []);


    const handleLanguageChange = async (e) => {
        const selectedLang = e.target.value;
        setLanguage(selectedLang);
        localStorage.setItem('selectedLanguage', selectedLang);
    };
    const handleCurrencyChange = (e) => {
        const curr = e.target.value;
        setCurrency(curr);
        localStorage.setItem('selectedCurrency', curr);
        console.log("💱 Currency selected:", curr);
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
                console.log("📥 API response data:", data);
                console.log("🗂 Top items to set:", data.topItems || []);
                setItems(data.topItems || []);
                // setHotels(data.hotels);
            })
            .catch(err => {
                console.error('❌ Failed to fetch from API:', err);
                setItems([]); // ✅ prevents infinite loading if API fails
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
                                <strong>items</strong>
                                <a href={`${base}/tour-cards`} target="_blank" rel="noopener noreferrer">
                                    <i className="fas fa-map-marked-alt" style={{ marginRight: '0.5rem' }}></i>
                                    View Tours
                                </a>

                                <a href={`${base}/admin/items`} target="_blank" rel="noopener noreferrer">
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


    // ✅ Show loading or empty state
    if (!items) {
        return <p>Loading data...</p>; // API still fetching
    }
    if (items.length === 0) {
        return <p>No data available.</p>; // API returned no items
    }


    return (
        <div className={styles.tourwiseLanding}>
            {showLangBanner && (
                <div className={styles.languageBanner}>
                    <span>Choose your preferred language for localized experiences</span>
                    <p>Currency: <strong>{currency}</strong></p>
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
            <div className={styles.movingGroup}>
                <section className={`${styles.hero} ${styles.heroImage1}`}>
                    <div className={styles.heroContent}>
                        <h1>Explore the World with TourWise</h1>
                        <p>Discover amazing destinations and items tailored for you.</p>
                        {/* <button className={styles.btnPrimary} onClick={() => window.open(`${base}/bookpage`, '_blank')}>Book Now</button> */}
                    </div>
                    <div className={styles.scrollIndicator}>⌄</div>
                </section>
                <section className={`${styles.hero} ${styles.heroImage2}`}>
                    <div className={styles.heroContent}>
                        <h1>Explore the World with TourWise</h1>
                        <p>Discover amazing destinations and items tailored for you.</p>
                        {/* <button className={styles.btnPrimary} onClick={() => window.open(`${base}/bookpage`, '_blank')}>Book Now</button> */}
                    </div>
                    <div className={styles.scrollIndicator}>⌄</div>
                </section>
                <section className={`${styles.hero} ${styles.heroImage3}`}>
                    <div className={styles.heroContent}>
                        <h1>Explore the World with TourWise</h1>
                        <p>Discover amazing destinations and items tailored for you.</p>
                        {/* <button className={styles.btnPrimary} onClick={() => window.open(`${base}/bookpage`, '_blank')}>Book Now</button> */}
                    </div>
                    <div className={styles.scrollIndicator}>⌄</div>
                </section>
            </div>

            <section className={styles.sectionFeatured}>
                <h2 className={styles.sectionTitle}>Top Destinations</h2>
                <div className={styles.tourCards}>
                    {items
                        .filter(item => item.type === 'tour') // ✅ Show only tours
                        .map((tour, index) => {
                            console.log("📸 Tour image URL:", getStaticImageUrl(tour.image));
                            return (
                                <div
                                    className={styles.tourCard}
                                    key={index}
                                    onClick={() => navigate(`/tour/${tour.slug}`)}
                                >
                                    {console.log("TOUR IMAGE URL:", tour.card_image)}
                                    {console.log("TOUR IMAGE URL_:", getStaticImageUrl(tour.card_image))}
                                    {tour.card_image && (
                                        <img
                                            src={getStaticImageUrl(tour.card_image)}
                                            alt={tour.title || 'No title'}
                                            className={styles.tourImage}
                                        />
                                    )}

                                    <div className={styles.tourInfo}>
                                        <h3>{tour.title}</h3>
                                        <p className={styles.description}>{tour.description || 'No description available.'}</p>
                                        {tour.location && <p className={styles.location}>{tour.location}</p>}
                                        <p className={styles.price}>
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
                    {items
                        .filter(item => item.type === 'hotel') // ✅ Show only hotels
                        .map((hotel, index) => (
                            <div
                                className={styles.tourCard}
                                key={index}
                                onClick={() => navigate(`/hotel/${hotel.slug}`)}
                            >
                                {console.log("HOTEL IMAGE URL:", hotel.card_image)}
                                {console.log("HOTEL IMAGE URL_:", getStaticImageUrl(hotel.card_image))}
                                {hotel.card_image && ( // ✅ Use correct field: card_image (from API)
                                    <img
                                        src={getStaticImageUrl(hotel.card_image)}
                                        alt={hotel.name || 'Hotel Image'}
                                        className={styles.tourImage}
                                    />
                                )}
                                <div className={styles.tourInfo}>
                                    <h3>{hotel.name}</h3>
                                    <p className={styles.description}>
                                        {hotel.description || 'No description available.'}
                                    </p>
                                    {hotel.location && <p className={styles.location}>{hotel.location}</p>}
                                    {hotel.price && (
                                        <p className={styles.price}>
                                            {Number(hotel.price).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                            })}
                                        </p>
                                    )}
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
        </div >
    );
}