import { apiBaseTour } from '../config';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BookingVoucher from './BookingVoucher';

export default function BookingVoucherPage() {
    const { referenceId } = useParams();
    const [voucher, setVoucher] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${apiBaseTour}/api/voucher/${referenceId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setVoucher(data);
                }
            })
            .catch(() => setError("Failed to load voucher"));
    }, [referenceId]);

    if (error) return <p style={{ color: 'red' }}>❌ {error}</p>;
    if (!voucher) return <p>Loading voucher...</p>;

    return (
        <BookingVoucher
            referenceId={voucher.reference_id}
            bookings={voucher.bookings}
        />
    );
}
