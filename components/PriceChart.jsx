'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PriceChart = ({ priceHistory, currentPrice, currency = 'USD', trackedSince }) => {
  // Start with the price history from the database (contains all price changes)
  let allPrices = [...(priceHistory || [])];

  if (priceHistory && priceHistory.length > 0) {
    // Use the existing price history
    allPrices = [...priceHistory];

    // Check if current price is already in the history (by date)
    const currentDate = new Date().toISOString().split('T')[0];
    const hasTodayPrice = priceHistory.some(
      entry => new Date(entry.checked_at || entry.recorded_at).toISOString().split('T')[0] === currentDate
    );

    // Add current price if it's not already in the history
    if (!hasTodayPrice) {
      allPrices.push({
        price: currentPrice,
        checked_at: new Date().toISOString(),
      });
    }
  } else {
    // If no price history exists, create a minimal history with tracked since date and current price
    allPrices = [
      {
        price: currentPrice,
        checked_at: trackedSince || new Date().toISOString(),
      }
    ];
  }

  // Don't create artificial data points - let Chart.js handle single data points naturally

  // Sort by date to ensure chronological order
  allPrices.sort((a, b) => new Date(a.recorded_at || a.checked_at) - new Date(b.recorded_at || b.checked_at));

  // Format dates for x-axis
  const labels = allPrices.map(entry =>
    new Date(entry.recorded_at || entry.checked_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit'
    })
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'Price',
        data: allPrices.map(entry => parseFloat(entry.price)),
        backgroundColor: allPrices.map((entry, index) =>
          index === allPrices.length - 1 ? 'rgba(59, 130, 246, 0.8)' : 'rgba(107, 142, 235, 0.6)'
        ),
        borderColor: allPrices.map((entry, index) =>
          index === allPrices.length - 1 ? 'rgba(59, 130, 246, 1)' : 'rgba(107, 142, 235, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Price History',
        font: {
          size: 14,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        // Calculate min and max with appropriate padding for narrow ranges
        suggestedMin: (() => {
          const prices = allPrices.map(entry => parseFloat(entry.price));
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const range = max - min;

          // For narrow ranges, add more proportional padding
          if (range < 1000) {
            return min - 200; // Fixed padding for small ranges
          } else if (range < 5000) {
            return min - 500; // Medium padding
          } else {
            return min * 0.95; // Percentage-based for larger ranges
          }
        })(),
        suggestedMax: (() => {
          const prices = allPrices.map(entry => parseFloat(entry.price));
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const range = max - min;

          // For narrow ranges, add more proportional padding
          if (range < 1000) {
            return max + 200; // Fixed padding for small ranges
          } else if (range < 5000) {
            return max + 500; // Medium padding
          } else {
            return max * 1.05; // Percentage-based for larger ranges
          }
        })(),
        title: {
          display: true,
          text: currency,
        },
        ticks: {
          callback: function(value) {
            return currency + ' ' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          },
          // Set step size based on the actual range
          stepSize: (() => {
            const prices = allPrices.map(entry => parseFloat(entry.price));
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            const range = max - min;

            if (range < 500) return 100;
            if (range < 1000) return 200;
            if (range < 2000) return 500;
            if (range < 5000) return 1000;
            return undefined; // Let Chart.js decide for larger ranges
          })()
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
        // Avoid overlapping labels
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      }
    },
    maintainAspectRatio: false,
    // Ensure the chart works well with a single data point
    animation: {
      duration: 300
    }
  };

  return (
    <div className="w-full h-48">
      <Bar data={data} options={options} />
    </div>
  );
};

export default PriceChart;