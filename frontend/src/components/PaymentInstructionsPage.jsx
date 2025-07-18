// pages/PaymentInstructionsPage.jsx
import { apiBaseTour } from '../config';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const PaymentInstructionsPage = () => {
    const { reference_id } = useParams();
    const [instructions, setInstructions] = useState(null);

    useEffect(() => {
        fetch(`${apiBaseTour}/api/payment-instructions/${reference_id}`)
            .then(res => res.json())
            .then(data => setInstructions(data.payment_instructions))
            .catch(err => console.error("Error loading payment instructions", err));
    }, [reference_id]);

    if (!instructions) return <p>Loading payment instructions...</p>;

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Payment Instructions</h2>
            {instructions.gcash_name && (
                <>
                    <h4>GCash</h4>
                    <p><strong>Name:</strong> {instructions.gcash_name}</p>
                    <p><strong>Number:</strong> {instructions.gcash_number}</p>
                </>
            )}
            {instructions.bank_name && (
                <>
                    <h4>Bank Transfer</h4>
                    <p><strong>Bank:</strong> {instructions.bank_name}</p>
                    <p><strong>Account Name:</strong> {instructions.bank_account_name}</p>
                    <p><strong>Account Number:</strong> {instructions.bank_account_number}</p>
                </>
            )}
            {instructions.paypal_email && (
                <>
                    <h4>PayPal</h4>
                    <p>Email: {instructions.paypal_email}</p>
                </>
            )}
            {instructions.custom_message && (
                <>
                    <h4>Notes from Vendor</h4>
                    <p>{instructions.custom_message}</p>
                </>
            )}
        </div>
    );
};

export default PaymentInstructionsPage;
