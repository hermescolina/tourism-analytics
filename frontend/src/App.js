import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

console.log("App component mounted");


function App() {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/data');
        const data = await res.json();

        setChartData({
          labels: data.labels,
          datasets: [
            {
              label: 'Live Data',
              data: data.values,
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.3
            }
          ]
        });
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData(); // fetch initially
    const interval = setInterval(fetchData, 5000); // auto-refresh every 5 sec
    return () => clearInterval(interval);
  }, []);


  return (
    <div style={{ width: '600px', margin: '50px auto', border: '1px solid red' }}>
      <h2>📈 Live Chart Dashboard</h2>
      <Line data={chartData} />
    </div>
  );

}

export default App;

