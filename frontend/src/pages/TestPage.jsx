import { useRef, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../pages/TourPage.css';
import styles from '../pages/TourPage.module.css';
import VideoPlayer from '../components/VideoPlayer';


const base = '/tourism-analytics';
const apiBase = 'https://api.tourwise.shop';
const urlBase = 'https://app.tourwise.shop/tourism-analytics';


export default function TourPage() {
    const [activeIndex, setActiveIndex] = useState(0);
    const { slug } = useParams();
    const [tour, setTour] = useState(null);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState("Tour Videos");
    const [tourVideos, setTourVideos] = useState([]);


    const categoryRef = useRef(null);
    const videoRef = useRef(null);

    useEffect(() => {
        fetch(`${apiBase}/api/tours/el-nido-island-hopping`)
            .then(res => {
                if (!res.ok) throw new Error('Tour not found');
                return res.json();
            })
            .then(data => {
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
                header?.classList.add('hide-header');
            } else {
                header?.classList.remove('hide-header');
            }
            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const backgroundVideos = tourVideos.filter(v => v.category === 'Tour Videos' && v.video_id).slice(0, 3);

    useEffect(() => {
        if (backgroundVideos.length <= 1) return;

        const interval = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % backgroundVideos.length);
        }, 15000);

        return () => clearInterval(interval);
    }, [backgroundVideos.length]);

    function TourHero({ headerVideo, title, location }) {
        if (!headerVideo) return null;

        return (
            <div className="tourHero" style={{ marginTop: '0rem' }}>
                <iframe
                    key={headerVideo.video_id}
                    width="100%"
                    height="150"
                    src={`https://www.youtube.com/embed/${headerVideo.video_id}?autoplay=1&mute=1&loop=1&playlist=${headerVideo.video_id}`}
                    title="Background Video"
                    frameBorder="0"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                ></iframe>
                <div className="tourTitle">
                    <h1>{title}</h1>
                    <p>{location}</p>
                </div>
            </div>
        );
    }

    if (error) return <div className="tourContainer">{error}</div>;
    if (!tour) return <div className="tourContainer">Loading...</div>;

    const imagePath = tour.image || '';
    const imageUrl = imagePath.startsWith('/uploads/images/')
        ? `${urlBase}${imagePath.replace('/uploads', '')}`
        : `${apiBase}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;

    const categories = ["What's Included", "About the Tour", "What to Expect", "History and Culture", "Tour Videos"];

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setSelectedCategory(value);

        setTimeout(() => {
            if (value === 'Tour Videos') {
                videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                const matchingVideos = tour.videos.filter(video => video.category === value);
                if (matchingVideos.length > 0 && videoRef.current) {
                    videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    document.getElementById('tourContentStart')?.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }, 50);
    };

    return (
        <>
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
                    <h1 className={styles.browseTitleInline}>{tour?.title}</h1>
                    <div className={styles.tourActions}>
                        <button className={styles.actionButton} onClick={() => window.open(`${base}/bookpage`, '_blank')}>Book Now</button>
                        <button className={styles.actionButton}>Share</button>
                        <button className={styles.actionButton}>Contact Guide</button>
                    </div>
                </header>

                {tourVideos.map((video, index) => (
                    <div
                        key={video.video_id}
                        className={`videoLayer ${index === activeIndex ? 'active' : ''}`}
                    // className={`${styles_.videoLayer} ${index === activeIndex ? styles_.active : ''}`}

                    >
                        <iframe
                            src={`https://www.youtube.com/embed/${video.video_id}?autoplay=1&mute=1&loop=1&playlist=${video.video_id}`}
                            title=""
                            frameBorder="0"
                            allow="autoplay; fullscreen"
                            allowFullScreen
                        />
                    </div>
                ))}
                <div style={{ height: '520px', position: 'relative', zIndex: -1 }}></div>

                <div ref={categoryRef} className="categorySelector">
                    {categories.map((cat, i) => (
                        <label key={i} style={{ marginRight: '1rem' }}>
                            <input
                                type="radio"
                                name="category"
                                value={cat}
                                checked={selectedCategory === cat}
                                onChange={handleCategoryChange}
                            /> {cat}
                        </label>
                    ))}
                </div>

                <div ref={videoRef}>
                    {tourVideos
                        .filter(video => video.category === selectedCategory)
                        .map((video, idx) => (
                            <div key={idx} className="videoCard">
                                <VideoPlayer videoId={video.video_id} index={idx} />
                            </div>
                        )
                        )
                    }
                </div>


                {/* <div ref={videoRef}>
                    {tourVideos
                        .filter(video => video.category === selectedCategory)
                        .map((video, idx) => (
                            <div key={idx} className="videoCard">
                                <VideoPlayer videoId={video.video_id} index={idx} />

                                <div style={{ marginTop: '1rem' }}>
                                    <h4 style={{ marginBottom: '0.5rem' }}>{video.caption}</h4>

                                    <div className="reactionBar">
                                        <button onClick={() => handleReaction(video.video_id, 'like')}>👍 Like</button>
                                        <button onClick={() => handleReaction(video.video_id, 'love')}>❤️ Love</button>
                                        <button onClick={() => handleReaction(video.video_id, 'laugh')}>😂 Laugh</button>
                                        <Link to="/tour-cards" className="reactionBar">
                                            <button>🔙 Back</button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                        )
                    }
                </div> */}

            </div>
        </>
    )
}