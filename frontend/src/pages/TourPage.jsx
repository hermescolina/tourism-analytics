import { apiBaseTour, frontendBase } from '../config';
import { useRef, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styles from './TourPage.module.css';
import VideoPlayer from '../components/VideoPlayer';
import TourItinerary from '../components/TourItinerary';
import WhatsIncluded from '../components/WhatsIncluded';

const base = '/tourism-analytics';
const apiBase = apiBaseTour;
const urlBase = `${frontendBase}${base}`;

const handleReaction = (videoId, type) => {
    console.log(`User reacted with ${type} on video ${videoId}`);
};

export default function TourPage() {
    const [activeIndex, setActiveIndex] = useState(0);
    const { slug } = useParams();
    const [tour, setTour] = useState(null);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState("Tour Videos");
    const [tourVideos, setTourVideos] = useState([]);
    const [showOverlay, setShowOverlay] = useState(false);



    const categoryRef = useRef(null);
    const videoRef = useRef(null);

    console.log('API BASE', apiBase);

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
        const handleScroll = () => {
            setShowOverlay(window.scrollY > 100);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    useEffect(() => {
        let lastScrollY = window.scrollY;


        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const scrollingDown = currentScrollY > lastScrollY;
            const videoLayers = document.querySelectorAll('[data-index]');

            if (scrollingDown && currentScrollY > 100) {
                videoLayers.forEach(el => {
                    el.classList.remove('videoLayer', 'active');
                    el.style.display = 'none';
                    el.style.opacity = '';
                });

            } else if (!scrollingDown && currentScrollY <= 100) {
                videoLayers.forEach((el, idx) => {
                    if (!el.classList.contains('videoLayer')) {
                        el.classList.add('videoLayer');
                    }
                    el.style.display = 'block';
                    el.classList.toggle('active', idx === 0);

                    // 🩹 Fix opacity if first video
                    if (idx === 0) {
                        el.style.opacity = '1';
                    } else {
                        el.style.opacity = '';
                    }
                });

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



    if (error) return <div className={styles.tourContainer}>{error}</div>;
    if (!tour) return <div className={styles.tourContainer}>Loading...</div>;

    const imagePath = tour.image || '';
    const imageUrl = imagePath.startsWith('/uploads/images/')
        ? `${urlBase}${imagePath.replace('/uploads', '')}`
        : `${apiBase}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;

    const categories = ["Tips for Visitors", "Tour Itinerary", "About the Tour", "What to Expect", "History and Culture", "Tour Videos"];


    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setSelectedCategory(value);

        // 🪄 History section on top just in case
        const historySection = document.querySelector('.historySection');
        if (historySection) {
            historySection.style.zIndex = '999';
            historySection.style.position = 'relative';
        }

        const videoLayers = document.querySelectorAll('[data-index]');
        if (value === 'Tour Videos') {
            // ✅ Restore .videoLayer section
            videoLayers.forEach((el, idx) => {
                el.classList.add('videoLayer');
                el.style.display = 'block';                  // show wrapper
                el.classList.toggle('active', idx === 0);    // only first active

                const iframe = el.querySelector('iframe');
                if (iframe) iframe.style.display = 'block';  // show iframe
            });

        } else {
            // ✅ Restore iframes for other categories
            const matchingIframes = document.querySelectorAll(`[data-category="${value}"] iframe`);
            matchingIframes.forEach(iframe => {
                iframe.style.display = 'block';
            });

            const matchingVideos = tour.videos.filter(video => video.category === value);
            if (matchingVideos.length > 0 && videoRef.current) {
                videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                document.getElementById('tourContentStart')?.scrollIntoView({ behavior: 'smooth' });
            }
        }

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
                    <button className={styles.actionButton} onClick={() => window.open(`${base}/bookpage`, '_blank')}>Book Now</button>
                    <button className={styles.actionButton}>Share</button>
                    <button className={styles.actionButton}>Contact Guide</button>
                </div>
            </header>


            {tourVideos.map((video, index) => (
                <div
                    key={video.video_id}
                    className={`videoLayer ${index === activeIndex ? 'active' : ''}`}
                    data-index={index}
                >
                    <iframe
                        src={`https://www.youtube.com/embed/${video.video_id}?autoplay=1&mute=1&loop=1&playlist=${video.video_id}&controls=0&disablekb=1&modestbranding=1&playsinline=1`}
                        title={`Tour Video ${index + 1}`}
                        frameBorder="0"
                        allow="autoplay; fullscreen"
                        allowFullScreen
                        width="100%"
                        height="100%"
                    />
                    <div className={styles.tourTitle}>
                        <h1>{tour.tour_title}</h1>
                        <p>{tour.tour_location}</p>
                    </div>
                </div>
            ))}



            <div ref={categoryRef} className={styles.categorySelector}>
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

            <div style={{ height: '200px', position: 'relative', zIndex: -1 }}></div>

            <div ref={videoRef} style={{ height: '1px' }}></div>
            < div >
                {tourVideos
                    .filter(video => video.category === selectedCategory)
                    .reverse()
                    .map((video, idx) => (
                        <div key={idx} className={styles.videoCard}>
                            <div className={`${styles.dayOverlay} ${showOverlay ? styles.visible : styles.hidden}`}>
                                Day {idx + 1}
                            </div>
                            <VideoPlayer videoId={video.video_id} index={idx} />

                            <div style={{ marginTop: '1rem' }}>
                                <h4 style={{ marginBottom: '0.5rem' }}>{video.caption}</h4>

                                {/* Reaction Buttons */}
                                <div className={styles.reactionBar}>
                                    <button onClick={() => handleReaction(video.video_id, 'like')}>👍 Like</button>
                                    <button onClick={() => handleReaction(video.video_id, 'love')}>❤️ Love</button>
                                    <button onClick={() => handleReaction(video.video_id, 'laugh')}>😂 Laugh</button>
                                    {/* <button onClick={() => toggleCommentBox(video.video_id)}>💬 Comment</button> */}
                                    <Link to="/tour-cards" className={styles.reactionBar}>
                                        <button>🔙 Back</button>
                                    </Link>

                                </div>


                                <div style={{ marginTop: '0.5rem' }}>
                                    {categories.map((cat, i) => (
                                        <label key={i} style={{ marginRight: '1rem' }}>
                                            <input
                                                type="radio"
                                                name={`category-${idx}`}
                                                value={cat}
                                                checked={selectedCategory === cat}
                                                onChange={handleCategoryChange}
                                            />{' '}
                                            {cat}
                                        </label>
                                    ))}
                                </div>


                            </div>
                        </div>
                    ))}
            </div>



            {
                tour.history_images && tour.history_images.length > 0 && (
                    <div id="tourContentStart" className={styles.history}>
                        <section className={`${styles.tourSection} ${styles.historySection}`}>
                            <h2>{selectedCategory}</h2>

                            <div style={{ margin: '1rem 0' }}>
                                {categories.map((cat, i) => (
                                    <label key={i} style={{ marginRight: '1rem' }}>
                                        <input
                                            type="radio"
                                            name="category-history"
                                            value={cat}
                                            checked={selectedCategory === cat}
                                            onChange={handleCategoryChange}
                                        />{' '}
                                        {cat}
                                    </label>
                                ))}
                            </div>

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
                                                <div style={{ marginTop: '1rem' }}>
                                                    {categories.map((cat, i) => (
                                                        <label key={i} style={{ marginRight: '1rem' }}>
                                                            <input
                                                                type="radio"
                                                                name={`category-${index}`}
                                                                value={cat}
                                                                checked={selectedCategory === cat}
                                                                onChange={handleCategoryChange}
                                                            />{' '}
                                                            {cat}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </section>
                    </div>
                )
            }


            {tour.inclusions && tour.inclusions.length > 0 && (
                <section className={styles.tourSection}>
                    <h2>What’s Included</h2>
                    <WhatsIncluded
                        inclusions={tour.inclusions.split(';')}
                        exclusions={tour.exclusions?.split(';') || []}
                    />
                </section>
            )}



            {tour.tour_itinerary && tour.tour_itinerary.length > 0 && (
                <section className={styles.tourSection}>
                    <h2>Tour Itinerary</h2>
                    <TourItinerary itineraries={JSON.parse(tour.tour_itinerary || '[]')} />
                </section>
            )}



            <div style={{ height: '300px' }}></div>

            {selectedCategory === 'Tips for Visitors' &&
                <section className={styles.tourSection}>
                    <h2>Tips for Visitors</h2>
                    <ul>
                        {(tour.tips || '').split(';').map((item, idx) => (
                            <li key={idx}>{item.trim()}</li>
                        ))}
                    </ul>
                </section>
            }

        </div >
    );
}