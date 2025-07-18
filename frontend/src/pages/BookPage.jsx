import { frontendBase, apiBaseTour } from '../config';
import { useEffect, useState } from 'react';

import styles from './BookPage.module.css';

export default function BookPage() {
    const [sortedTours, setSortedTours] = useState([]);
    const [tourOptions, setTourOptions] = useState([]);
    const [sortAscending, setSortAscending] = useState(true);

    // const sortByPrice = () => {
    //     const sorted = [...tourOptions]
    //         .filter(tour => !tour.title.toLowerCase().includes('test'))
    //         .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    //     setSortedTours(sorted);
    // };

    const toggleSortByPrice = () => {
        const sorted = [...tourOptions]
            .filter(tour => !tour.title.toLowerCase().includes('test'))
            .sort((a, b) => {
                const priceA = parseFloat(a.price);
                const priceB = parseFloat(b.price);
                return sortAscending ? priceA - priceB : priceB - priceA;
            });

        setSortedTours(sorted);
        setSortAscending(!sortAscending);
    };


    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        whatsapp: '',
        tour: '',
        date: ''
    });


    useEffect(() => {
        fetch(`${apiBaseTour}/api/tour-titles`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch tours');
                return res.json();
            })
            .then(data => setTourOptions(data))
            .catch(err => console.error('Error loading tour options:', err));
    }, []);



    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log(`📝 ${name} changed to:`, value);  // <--- log every input change
        setFormData({ ...formData, [name]: value });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate essential fields
        if (!formData.name || !formData.email || !formData.phone || !formData.tour_id || !formData.date) {
            alert("Please fill out all required fields.");
            return;
        }

        const payload = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            whatsapp: formData.whatsapp || '',
            tour_id: formData.tour_id,
            hotel_id: formData.hotel_id || null,
            car_id: formData.car_id || null,
            date: formData.date,
            num_guests: formData.num_guests || 1
        };

        try {
            const response = await fetch(`${apiBaseTour}/api/book-tour`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Booking successful:', result);
            alert(`Booking confirmed for ${formData.name}!`);
        } catch (error) {
            console.error('❌ Booking failed:', error);
            alert('Booking failed. Please try again later.');
        }
    };


    return (
        <div className={styles.bookingPage}>
            <h1>Book Your Tour</h1>
            <form onSubmit={handleSubmit} className={styles.bookingForm}>
                <input
                    type="text"
                    name="name"
                    placeholder="Your Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                />

                <input
                    type="tel"
                    name="whatsapp"
                    placeholder="WhatsApp (optional)"
                    value={formData.whatsapp}
                    onChange={handleChange}
                />

                <select
                    name="tour_id"
                    value={formData.tour_id}
                    onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedTour = tourOptions.find(t => String(t.id) === selectedId);
                        setFormData(prev => ({
                            ...prev,
                            tour_id: selectedId,
                            tour_slug: selectedTour?.slug || ''
                        }));
                    }}
                    required
                    className={styles.tourDropdown}
                >
                    <option value="">Select a Tour</option>
                    {
                        (sortedTours.length ? sortedTours : tourOptions)
                            .filter(tour => !tour.title.toLowerCase().includes('test'))
                            .map((tour, idx) => (
                                <option key={idx} value={tour.id}>
                                    {tour.title} - ₱{parseFloat(tour.price).toFixed(2)}
                                </option>
                            ))
                    }
                </select>

                <button type="button" onClick={toggleSortByPrice} className={styles.sortButton}>
                    Sort by Price: {sortAscending ? 'Low to High 🔼' : 'High to Low 🔽'}
                </button>

                {formData.tour_slug && (
                    <a
                        href={`${frontendBase}/tourism-analytics/tour/${formData.tour_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.viewTourButton}
                    >
                        View
                    </a>
                )}

                <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                />

                <button type="submit">Submit Booking</button>
            </form>
        </div>

    );
}
