import { apiBaseTour } from '../config';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from './TourDetailsAdmin.module.css';

export default function TourDetailsAdmin() {
    const { slug } = useParams();
    const [tour, setTour] = useState(null);
    const [message, setMessage] = useState('');


    useEffect(() => {
        if (!slug) return;
        fetch(`${apiBaseTour}/api/tour-itinerary/${slug}`)
            .then(res => res.json())
            .then(data => setTour(data))
            .catch(err => {
                console.error("❌ Error loading tour:", err);
                setMessage("Failed to load tour");
            });
    }, [slug]);

    const handleChange = (field, value) => {
        setTour(prev => ({ ...prev, [field]: value }));
    };

    const handleItineraryChange = (index, key, value) => {
        const updated = [...tour.tour_itinerary];
        updated[index][key] = key === 'stops' ? value.split(',').map(s => s.trim()) : value;
        setTour(prev => ({ ...prev, tour_itinerary: updated }));
    };

    const addItinerary = () => {
        setTour(prev => ({
            ...prev,
            tour_itinerary: [...(prev.tour_itinerary || []), { label: '', title: '', time: '', stops: [] }]
        }));
    };

    // const handleSave = () => {
    //     let combinedMessage = '';

    //     fetch(`${apiBaseTour}/api/tour-itinerary/${slug}`, {
    //         method: 'PUT',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify(tour),
    //     })
    //         .then(res => res.json())
    //         .then(data => {
    //             combinedMessage += (data.message || 'Itinerary saved!') + ' ';


    //             setMessage(combinedMessage.trim());
    //             setTimeout(() => setMessage(''), 3000);
    //         })
    //         .catch(err => {
    //             console.error('❌ Failed to save:', err);
    //             setMessage('Failed to save');
    //             setTimeout(() => setMessage(''), 3000);
    //         });
    // };

    const handleSave = () => {
        let combinedMessage = '';

        fetch(`${apiBaseTour}/api/tour-itinerary/${slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tour),
        })
            .then(res => res.json())
            .then(data => {
                combinedMessage += (data.message || 'Itinerary saved!') + ' ';
                return handleSaveTips(); // 🧠 Call tips saver after itinerary is saved
            })
            .then(tipsMessage => {
                combinedMessage += tipsMessage;
                setMessage(combinedMessage.trim());
                setTimeout(() => setMessage(''), 3000);
            })
            .catch(err => {
                console.error('❌ Failed to save:', err);
                setMessage('Failed to save');
                setTimeout(() => setMessage(''), 3000);
            });
    };


    const handleSaveTips = () => {
        fetch(`${apiBaseTour}/api/tour-tips/${slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tips: tour.tips || '' }),
        })
            .then(res => res.json())
            .then(data => {
                setMessage(data.message || 'Tips saved!');
                setTimeout(() => setMessage(''), 3000);
            })
            .catch(err => {
                console.error('❌ Failed to save tips:', err);
                setMessage('Failed to update tips');
                setTimeout(() => setMessage(''), 3000);
            });
    };



    const removeItinerary = (indexToRemove) => {
        const updated = tour.tour_itinerary.filter((_, idx) => idx !== indexToRemove);
        setTour(prev => ({ ...prev, tour_itinerary: updated }));
    };




    if (!slug) return <p>Invalid or missing tour ID</p>;
    if (!tour) return <p>Loading...</p>;

    return (
        <div className={styles.tourAdmin}>
            <h2 className={styles.heading}>Tour Admin Interface</h2>

            <label>✅ Inclusions:</label>
            <textarea
                className={styles.textarea}
                value={tour.inclusions || ''}
                onChange={(e) => handleChange('inclusions', e.target.value)}
            />

            <label>⛔ Exclusions:</label>
            <textarea
                className={styles.textarea}
                value={tour.exclusions || ''}
                onChange={(e) => handleChange('exclusions', e.target.value)}
            />

            <h3 className={styles.subheading}>🧭 Tour Itinerary</h3>
            {(tour.tour_itinerary || []).map((item, idx) => (
                <div key={idx} className={styles.itineraryBox}>
                    <input
                        className={styles.input}
                        placeholder="Label (e.g., Tour A)"
                        value={item.label}
                        onChange={(e) => handleItineraryChange(idx, 'label', e.target.value)}
                    />
                    <input
                        className={styles.input}
                        placeholder="Title (e.g., Lagoons & Beaches)"
                        value={item.title}
                        onChange={(e) => handleItineraryChange(idx, 'title', e.target.value)}
                    />
                    <input
                        className={styles.input}
                        placeholder="Time (e.g., ~9AM–4PM)"
                        value={item.time}
                        onChange={(e) => handleItineraryChange(idx, 'time', e.target.value)}
                    />
                    <textarea
                        className={styles.textarea}
                        placeholder="Stops (comma-separated)"
                        value={item.stops.join(', ')}
                        onChange={(e) => handleItineraryChange(idx, 'stops', e.target.value)}
                        rows={2}
                    />
                    <button
                        onClick={() => removeItinerary(idx)}
                        className={styles.removeBtn}
                    >
                        🗑 Remove
                    </button>
                </div>
            ))}

            <label>💡 Tips for Visitors:</label>
            <textarea
                className={styles.textarea}
                value={tour.tips || ''}
                onChange={(e) => handleChange('tips', e.target.value)}
            />


            <button onClick={addItinerary} className={styles.addBtn}>➕ Add Itinerary</button>
            <button onClick={handleSave} className={styles.saveBtn}>💾 Save All</button>



            {message && <p className={styles.success}>{message}</p>}
        </div>
    );
}
