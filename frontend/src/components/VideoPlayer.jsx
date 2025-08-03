import { useEffect, useRef } from 'react';

export default function VideoPlayer({ videoId, index = 0, autoplay = false, muted = false, loop = false, isHeader = false }) {
    const iframeRef = useRef(null);
    const playerRef = useRef(null);
    const loopParam = loop ? `&loop=1&playlist=${videoId}` : '';
    const autoplayParam = autoplay ? 1 : 0;
    const muteParam = muted ? 1 : 0;

    const src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&autoplay=${autoplayParam}&mute=${muteParam}${loopParam}`;




    // Load YT script once (safe for multiple VideoPlayer instances)
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.body.appendChild(tag);
        }
    }, []);


    // Setup player and observer
    useEffect(() => {
        const interval = setInterval(() => {
            if (window.YT && window.YT.Player && iframeRef.current) {
                clearInterval(interval);

                const _ = new window.YT.Player(iframeRef.current, {
                    events: {
                        onReady: (e) => {
                            console.log(`✅ MUTE STATUS ${muted}`);
                            playerRef.current = e.target;
                            if (muted) e.target.mute();
                            if (autoplay) e.target.playVideo();
                        },
                    },
                });

                // ✅ Only add observer if not header video
                if (!isHeader) {
                    const observer = new IntersectionObserver(([entry]) => {
                        const p = playerRef.current;

                        if (!p || typeof p.playVideo !== 'function') {
                            console.warn('⏳ Player not ready');
                            return;
                        }

                        if (entry.isIntersecting) {
                            p.playVideo();
                        } else {
                            p.pauseVideo();
                        }
                    }, { threshold: 0.6 });

                    observer.observe(iframeRef.current);

                    // ✅ Cleanup observer
                    return () => observer.disconnect();
                }
            }
        }, 100); // wait until YT is ready

        return () => clearInterval(interval);
    }, [autoplay, muted, isHeader]);


    return (
        <div style={{ marginBottom: '2rem' }}>
            {/* <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}> */}

            <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                minHeight: '300px', // ✅ forces layout space
            }}>


                <iframe
                    ref={iframeRef}
                    id={`youtube-player-${index}`}
                    src={src}
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                    }}
                ></iframe>
            </div>
        </div>
    );
}