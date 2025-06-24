import { useRef, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styles from './TourPage.module.css';
import VideoPlayer from '../components/VideoPlayer';


const base = '/tourism-analytics';
const apiBase = 'https://api.tourwise.shop';
const urlBase = 'https://app.tourwise.shop/tourism-analytics';

export default function TourPage() {
    const { slug } = useParams();
    const [tour, setTour] = useState(null);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState("History and Culture");
    const [tourVideos, setTourVideos] = useState([]);
    const categoryRef = useRef(null);
    const videoRef = useRef(null);
    const playerRef = useRef(null);

    useEffect(() => {
        const checkMuteStatus = () => {
            if (playerRef.current && typeof playerRef.current.isMuted === 'function') {
                const muted = playerRef.current.isMuted();
                console.log('🔇 Video isMuted:', muted);
            } else {
                console.warn('⚠️ playerRef.current or isMuted() not ready');
            }
        };

        const interval = setInterval(checkMuteStatus, 2000); // check every 2s
        return () => clearInterval(interval);
    }, []);


    useEffect(() => {
        if (playerRef.current) {
            console.log('[🎥 VideoPlayer]', 'Player is ready:', playerRef.current);
            console.log('[🎥 VideoPlayer]', 'Video ID:', videoId);
        }
    }, [videoId]);


    useEffect(() => {
        fetch(`${apiBase}/api/tours/${slug}`)
            .then(res => {
                if (!res.ok) throw new Error('Tour not found');
                return res.json();
            })
            .then(data => {
                console.log('✅ Server responded with:', data);

                setTour(data);
                setTourVideos(data.videos || []);
                document.title = `TourWise | ${data.title}`;
            })
            .catch(err => {
                console.error('❌ Failed to load tour:', err);
                setError('Tour not found or server error.');
            });
    }, [slug]);

    useEffect(() => {
        let lastScrollY = window.scrollY;
        const header = document.querySelector('.topNav');

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY) {
                header?.classList.add('hide-header'); // scrolling down
            } else {
                header?.classList.remove('hide-header'); // scrolling up
            }
            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);




    if (error) return <div className={styles.tourContainer}>{error}</div>;
    if (!tour) return <div className={styles.tourContainer}>Loading...</div>;

    const imagePath = tour.image || '';
    const imageUrl = imagePath.startsWith('/uploads/images/')
        ? `${urlBase}${imagePath.replace('/uploads', '')}`
        : `${apiBase}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;

    const categories = ["About the Tour", "What to Expect", "History and Culture"];

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setSelectedCategory(value);
        console.log('📂 Selected category:', value);

        setTimeout(() => {
            const matchingVideos = tour.videos.filter(video => video.category === value);

            if (matchingVideos.length > 0 && videoRef.current) {
                videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                const section = document.getElementById('tourContentStart');
                section?.scrollIntoView({ behavior: 'smooth' });
            }
        }, 50); // give time for the DOM to re-render
    };


    return (
        <div className={styles.tourContainer}>
            <header className={styles.browseHeader}>
                <div className={styles.logoSection}>
                    <Link to="/tour-cards">
                        <img src={imageUrl} alt="TourWise" className={styles.logoImage} />
                    </Link>
                    <Link to="/tour-cards">
                        <span className={styles.logoText}>TourWise</span>
                    </Link>
                </div>
                <h1 className={styles.browseTitleInline}>{tour.title}</h1>
                <div className={styles.tourActions}>
                    <button className={styles.actionButton} onClick={() => window.open(`${base}/tour-cards`, '_blank')}>Book Now</button>
                    <button className={styles.actionButton}>Share</button>
                    <button className={styles.actionButton}>Contact Guide</button>
                </div>
            </header>

            <div className={styles.tourHero} style={{ marginTop: '6rem' }}>
                <img src={imageUrl} alt={tour.title} className={styles.tourImage} />
                <div className={styles.tourTitle}>
                    <h1>{tour.title}</h1>
                    <p>{tour.location}</p>
                </div>
            </div>

            {/* Category Selector */}
            <div
                ref={categoryRef}
                className={`${styles.categorySelector}`}
                style={{ margin: '2rem 0' }}
            >
                {categories.map((cat, i) => (
                    <label key={i} style={{ marginRight: '1rem' }}>
                        <input
                            type="radio"
                            name="category"
                            value={cat}
                            checked={selectedCategory === cat}
                            onChange={handleCategoryChange} // ✅ GOOD: pass the function reference
                        /> {cat}
                    </label>
                ))}
            </div>

            {tourVideos.length > 0 && (
                <section ref={videoRef} className={styles.videoSection} style={{ marginTop: '3rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>🎬 Tour Videos</h2>
                    <div className={styles.videoCardContainer} >
                        {/* ✅ Filter videos by selected category and render using VideoPlayer */}
                        {tourVideos
                            .filter(video => video.category === selectedCategory)
                            .map((video, idx) => (
                                <div
                                    key={idx}
                                    className={styles.videoCard}
                                    style={{
                                        flex: '1 1 300px',
                                        // border: '1px solid #ddd',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        background: '#fff',
                                        padding: '1rem'
                                    }}
                                >
                                    {/* ✅ Embed the YouTube player using our custom component */}
                                    <VideoPlayer videoId={video.video_id} index={idx} />

                                    {/* ✅ Show caption under the video */}
                                    <h4 style={{ marginTop: '1rem' }}>{video.caption}</h4>
                                </div>
                            ))}

                    </div>
                </section>
            )}



            {tour.history_images && tour.history_images.length > 0 && (
                <div id="tourContentStart" className={styles.history}>
                    <section className={`${styles.tourSection} ${styles.historySection}`}>
                        <h2>{selectedCategory}</h2>
                        <div className={styles.historyGallery}>
                            {tour.history_images
                                .filter(item => item.image_path?.trim() && item.category === selectedCategory)
                                .slice(0, 10)
                                .map((item, index) => {
                                    const layoutClass = index % 2 === 0 ? styles.left : styles.right;
                                    const imageUrl = item.image_path.startsWith('/uploads/images/')
                                        ? `${urlBase}${item.image_path.replace('/uploads', '')}`
                                        : `${apiBase}${item.image_path.startsWith('/') ? '' : '/'}${item.image_path}`;

                                    return (
                                        <div key={index} className={`${styles.historyEntry} ${layoutClass}`}>
                                            <img
                                                src={imageUrl}
                                                alt={`History ${index + 1}`}
                                                className={styles.historyImage}
                                                onError={(e) => (e.target.style.display = 'none')}
                                            />
                                            {item.caption?.trim() && (
                                                <p className={styles.historyCaption}>{item.caption}</p>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </section>
                </div>
            )}

            <div style={{ height: '150vh' }}></div>

            <section className={styles.tourSection}>
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
