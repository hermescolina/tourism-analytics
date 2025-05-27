import React from 'react';
import BookingChart from '../components/BookingChart';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="p-4 bg-white shadow mb-6">
        <h1 className="text-2xl font-bold text-center">TourWise Dashboard</h1>
      </header>
      <BookingChart />
    </div>
  );
}

