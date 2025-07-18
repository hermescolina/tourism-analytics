import { apiBaseHotel } from '../config';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function HotelAdminDashboard() {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [newHotel, setNewHotel] = useState({
        name: '', slug: '', address: '', city: '', region: '', country: '',
        phone: '', email: '', website: '', opening_date: '',
        operator: '', owner: '', number_of_rooms: '', number_of_suites: '', floors: '',
        description: ''
    });

    // ✅ Header background image upload state
    const [headerUpload, setHeaderUpload] = useState({
        image: null,
        preview: null,
        status: ''
    });

    const handleNewHotelChange = (e) => {
        const { name, value } = e.target;
        setNewHotel(prev => ({ ...prev, [name]: value }));
    };

    const handleAddHotel = () => {
        if (!newHotel.name || !newHotel.slug) {
            setStatus("❌ Hotel name and slug are required.");
            return;
        }

        fetch(`${apiBaseHotel}/api/hotel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newHotel)
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setStatus(`❌ ${data.error}`);
                } else {
                    setStatus(`✅ Hotel "${data.name}" added!`);
                    setNewHotel({
                        name: '', slug: '', address: '', city: '', region: '', country: '',
                        phone: '', email: '', website: '', opening_date: '',
                        operator: '', owner: '', number_of_rooms: '', number_of_suites: '', floors: '',
                        description: ''
                    });
                    fetchHotels();
                }
            })
            .catch(() => setStatus("❌ Server error while adding hotel"));
    };

    const fetchHotels = () => {
        fetch(`${apiBaseHotel}/api/hotels`)
            .then(res => res.json())
            .then(data => {
                setHotels(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('❌ Failed to fetch hotels:', err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchHotels();
    }, []);

    useEffect(() => {
        if (status) {
            const timeout = setTimeout(() => setStatus(''), 3000);
            return () => clearTimeout(timeout);
        }
    }, [status]);

    const handleHeaderImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setHeaderUpload({
                image: file,
                preview: URL.createObjectURL(file),
                status: ''
            });
        }
    };

    const handleHeaderImageUpload = () => {
        if (!headerUpload.image) {
            setHeaderUpload(prev => ({ ...prev, status: '❌ No image selected.' }));
            return;
        }

        const formData = new FormData();
        formData.append('image', headerUpload.image);
        formData.append('category', 'header-background');

        fetch('http://localhost:5000/api/hotel/image', {
            method: 'POST',
            body: formData,
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setHeaderUpload(prev => ({ ...prev, status: `❌ ${data.error}` }));
                } else {
                    setHeaderUpload({
                        image: null,
                        preview: null,
                        status: `✅ Header image "${data.filename}" uploaded.`
                    });
                }
            })
            .catch(() => {
                setHeaderUpload(prev => ({ ...prev, status: '❌ Upload failed.' }));
            });
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1>🏨 Hotel Admin Dashboard</h1>

            {status && (
                <p style={{ color: status.includes('❌') ? 'red' : 'green' }}>
                    {status}
                </p>
            )}

            {loading ? (
                <p>Loading hotels...</p>
            ) : hotels.length === 0 ? (
                <p>No hotels found in the database.</p>
            ) : (
                <ul>
                    {hotels.map((hotel) => (
                        <li key={hotel.slug}>
                            <Link to={`/admin/hotel/${hotel.slug}`}>
                                {hotel.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <hr style={{ margin: '2rem 0' }} />

            <section>
                <h2>➕ Add New Hotel</h2>
                <input name="name" placeholder="Hotel Name" value={newHotel.name} onChange={handleNewHotelChange} />
                <input name="slug" placeholder="Slug" value={newHotel.slug} onChange={handleNewHotelChange} />
                <input name="address" placeholder="Address" value={newHotel.address} onChange={handleNewHotelChange} />
                <input name="city" placeholder="City" value={newHotel.city} onChange={handleNewHotelChange} />
                <input name="region" placeholder="Region" value={newHotel.region} onChange={handleNewHotelChange} />
                <input name="country" placeholder="Country" value={newHotel.country} onChange={handleNewHotelChange} />
                <input name="phone" placeholder="Phone" value={newHotel.phone} onChange={handleNewHotelChange} />
                <input name="email" placeholder="Email" value={newHotel.email} onChange={handleNewHotelChange} />
                <input name="website" placeholder="Website" value={newHotel.website} onChange={handleNewHotelChange} />
                <input name="opening_date" type="date" value={newHotel.opening_date} onChange={handleNewHotelChange} />
                <input name="operator" placeholder="Operator" value={newHotel.operator} onChange={handleNewHotelChange} />
                <input name="owner" placeholder="Owner" value={newHotel.owner} onChange={handleNewHotelChange} />
                <input name="number_of_rooms" type="number" placeholder="Rooms" value={newHotel.number_of_rooms} onChange={handleNewHotelChange} />
                <input name="number_of_suites" type="number" placeholder="Suites" value={newHotel.number_of_suites} onChange={handleNewHotelChange} />
                <input name="floors" type="number" placeholder="Floors" value={newHotel.floors} onChange={handleNewHotelChange} />
                <textarea name="description" placeholder="Description" value={newHotel.description} onChange={handleNewHotelChange} />
                <button onClick={handleAddHotel}>➕ Add Hotel</button>
            </section>

            {/* ✅ New: Header Background Image Upload */}
            <hr style={{ margin: '3rem 0' }} />
            <section>
                <h2>🖼️ Upload Header Background Image</h2>

                {headerUpload.preview && (
                    <img
                        src={headerUpload.preview}
                        alt="Header Preview"
                        style={{
                            width: '300px',
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    />
                )}

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeaderImageChange}
                />
                <button onClick={handleHeaderImageUpload}>⬆️ Upload Header Image</button>

                {headerUpload.status && (
                    <p style={{ marginTop: '1rem', color: headerUpload.status.includes('❌') ? 'red' : 'green' }}>
                        {headerUpload.status}
                    </p>
                )}
            </section>
        </div>
    );
}
