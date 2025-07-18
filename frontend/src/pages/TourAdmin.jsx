import React, { useState, useEffect } from 'react';
import { apiBaseTour, frontendBase } from '../config';
import { Link } from 'react-router-dom';

import styles from './TourAdmin.module.css';


export default function TourAdmin() {
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [tours, setTours] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);


    console.log("API Base URL:", apiBaseTour);
    console.log("Frontend Base URL:", frontendBase);

    const [form, setForm] = useState({
        title: '', slug: '', location: '', price: '',
        description: '', start_date: '', end_date: '',
        available_slots: '', category_id: '', image: null, existingImage: null
    });

    useEffect(() => {
        const header = document.querySelector(`.${styles.topNav}`);

        const handleScroll = () => {
            const rect = header?.getBoundingClientRect();
            console.log('📏 Header top position:', rect?.top);
            console.log('📐 Header computed position:', getComputedStyle(header).position);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    useEffect(() => {
        fetchTours();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${apiBaseTour}/api/categories`);
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchTours = async () => {
        try {
            const res = await fetch(`${apiBaseTour}/api/landing-data`);
            const data = await res.json();
            setTours(data.topTours || []);
        } catch (err) {
            console.error('Failed to fetch tours:', err);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setForm({ ...form, image: e.target.files[0] });
    };

    const handleEdit = (tour) => {
        console.log("📝 Editing tour:", tour); // Log the full tour object

        setForm({
            title: tour.title || '',
            slug: tour.slug || '',
            location: tour.location || '',
            price: tour.price || '',
            description: tour.description || '',
            start_date: tour.start_date || '',
            end_date: tour.end_date || '',
            available_slots: tour.available_slots || '',
            category_id: tour.category_id || '',
            image: null,
            existingImage: tour.image || null
        });

        setIsEditing(true);
        setEditingId(tour.id || tour.slug);

        // Optional: Log what is being set in the form
        console.log("🧾 Form state being set:", {
            title: tour.title || '',
            slug: tour.slug || '',
            location: tour.location || '',
            price: tour.price || '',
            description: tour.description || '',
            start_date: tour.start_date || '',
            end_date: tour.end_date || '',
            available_slots: tour.available_slots || '',
            category_id: tour.category_id || '',
            image: null,
            existingImage: tour.image || null
        });
        console.log("✏️ Editing ID:", tour.id || tour.slug);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        for (const key in form) {
            if (key !== 'image' && key !== 'existingImage') {
                formData.append(key, form[key]);
            }
        }
        if (form.image instanceof File) {
            formData.append('image', form.image);
        }

        const endpoint = isEditing
            ? `${apiBaseTour}/api/tours/${editingId}`
            : `${apiBaseTour}/api/tours`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, { method, body: formData });
            if (!response.ok) {
                const error = await response.json();
                alert(`\u274C Error: ${error.error}`);
                return;
            }

            alert(isEditing ? '✅ Tour updated successfully!' : '✅ Tour added successfully!');
            setForm({ title: '', slug: '', location: '', price: '', description: '', start_date: '', end_date: '', available_slots: '', category_id: '', image: null, existingImage: null });
            setIsEditing(false);
            setEditingId(null);
            fetchTours();
        } catch (err) {
            console.error(err);
            alert('❌ Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.tourAdminContainer}>
            <div className={styles.topNav}>
                <div className={styles.logoSection}>
                    <Link to="/tour-cards">
                        <img
                            src={`${frontendBase}/images/tourwise.png`}
                            alt="TourWise"
                            className={styles.logoImage}
                        />
                    </Link>
                    <Link to="/tour-cards">
                        <div className={styles.titleBlock}>
                            <span className={styles.navTitle}>TourWise</span>
                            <span className={styles.subTitle}>Admin Panel</span>
                        </div>
                    </Link>

                </div>

            </div>



            <div className={styles.pageTitleBar}>
                <h2>{isEditing ? 'Edit Tour' : 'Add Tour'}</h2>
            </div>

            <form onSubmit={handleSubmit} className={styles.tourForm}>
                {['title', 'slug', 'location', 'price', 'description', 'start_date', 'end_date', 'available_slots'].map((field, i) => (
                    <div className={styles.formGroup} key={i}>
                        <label>{field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                        {field === 'description' ? (
                            <textarea name={field} rows="6" value={form[field]} onChange={handleChange} required />
                        ) : (
                            <input type={field.includes('date') ? 'date' : field === 'price' || field === 'available_slots' ? 'number' : 'text'} name={field} value={form[field]} onChange={handleChange} required />
                        )}
                    </div>
                ))}

                <div className={styles.formGroup}>
                    <label>Category</label>
                    <select name="category_id" value={form.category_id} onChange={handleChange} required>
                        <option value="">-- Select Category --</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Tour Image</label>
                    <input type="file" name="image" accept="image/*" onChange={handleFileChange} />

                    {form.image ? (
                        <div className={styles.imagePreview}>
                            <p>Preview:</p>
                            <img src={URL.createObjectURL(form.image)} alt="Preview" />
                        </div>
                    ) : form.existingImage ? (
                        (() => {
                            const imageSrc = form.existingImage.startsWith('/uploads')
                                ? `${apiBaseTour}${form.existingImage}`
                                : `${frontendBase}${form.existingImage}`;


                            console.log("📸 Preview image src:", imageSrc);

                            return (
                                <div className={styles.imagePreview}>
                                    <p>Current Image:</p>
                                    <img src={imageSrc} alt="Current Tour" />
                                </div>
                            );
                        })()
                    ) : null}


                </div>

                {isEditing && (
                    <div className={styles.formGroup}>
                        <button className={styles.button} type="button" onClick={() => {
                            setIsEditing(false);
                            setEditingId(null);
                            setForm({ title: '', slug: '', location: '', price: '', description: '', start_date: '', end_date: '', available_slots: '', category_id: '', image: null, existingImage: null });
                        }
                        } style={{ marginBottom: '1rem' }}>
                            Cancel Edit
                        </button>
                    </div>
                )}

                <div className={styles.formGroup}>
                    <button className={styles.button} type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Tour'}
                    </button>
                </div>
            </form>

            <table className={styles.adminTable}>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Location</th>
                        <th>Price</th>
                        <th>Actions</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {tours.map(tour => {
                        const imageSrc = tour.image.startsWith('/uploads')
                            ? `${apiBaseTour}${tour.image}`
                            : `${frontendBase}${tour.image}`;
                        console.log("Image Source:", imageSrc);
                        return (
                            <tr key={tour.slug}>
                                <td>{tour.title}</td>
                                <td>{tour.location}</td>
                                <td>₱ {Number(tour.price).toLocaleString()}</td>
                                <td>
                                    <img src={imageSrc} alt={tour.title} style={{ width: '80px', borderRadius: '6px' }} />
                                </td>
                                <td>
                                    <button onClick={() => handleEdit(tour)}>Edit</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>

            </table>
        </div>
    );
}