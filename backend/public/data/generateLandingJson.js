const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function generateLandingData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Asdf1234!',
    database: 'tourism_app'
  });

  const [topTours] = await connection.execute(`
    SELECT title, location, image, price, views, rating 
    FROM tours 
    ORDER BY views DESC 
    LIMIT 5
  `);

  const [topHotels] = await connection.execute(`
    SELECT hotel_booked AS name, COUNT(*) AS bookings
    FROM bookings
    WHERE hotel_booked IS NOT NULL
    GROUP BY hotel_booked
    ORDER BY bookings DESC
    LIMIT 5
  `);

  const [topCars] = await connection.execute(`
    SELECT car_rented AS brand, COUNT(*) AS rented
    FROM bookings
    WHERE car_rented IS NOT NULL
    GROUP BY car_rented
    ORDER BY rented DESC
    LIMIT 5
  `);

  const [topInsights] = await connection.execute(`
    SELECT location, COUNT(*) AS count 
    FROM users 
    WHERE location IS NOT NULL
    GROUP BY location 
    ORDER BY count DESC 
    LIMIT 3
  `);

  const landingData = {
    lastUpdated: new Date().toISOString(),
    topTours,
    topHotels,
    topCars,
    topInsights: topInsights.map(i => ({
      type: "Popular Location",
      content: `${i.location} has ${i.count} active users.`
    }))
  };

  //const outputPath = path.join(__dirname, '../frontend/public/data/landing.json');
  const outputPath = path.join(__dirname, '../../../frontend/public/data/landing.json');

  fs.writeFileSync(outputPath, JSON.stringify(landingData, null, 2));
  console.log('✅ landing.json generated at:', outputPath);

  await connection.end();
}

generateLandingData().catch(err => console.error('❌ Error:', err));
