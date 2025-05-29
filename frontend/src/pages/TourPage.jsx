import React from 'react';
import { useParams } from 'react-router-dom';

export default function TourPage() {
    const { slug } = useParams(); // 🔁 Get the slug from the URL

    return (
        <div>
            <h1>Tour Details</h1>
            <p>You're viewing: <strong>{slug}</strong></p>
            {/* You can fetch tour data using the slug here */}
        </div>
    );
}
