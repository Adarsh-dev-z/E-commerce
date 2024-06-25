// Sample data for orders by month (replace with your actual data)
const currentYearOrders = ordersPerMonth; // This should now be defined
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Chart.js configuration
const ctx = document.getElementById('chart1').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: months,
        datasets: [
            {
                label: 'Current Year',
                data: currentYearOrders,
                borderColor: 'rgba(255, 255, 255, 1)',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                fill: true,
                tension: 0.4
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#ffffff'
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                ticks: {
                    color: '#ffffff'
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#ffffff'
                }
            }
        }
    }
});

function changeTheme(theme) {
    const cardBody = document.querySelector('.card-body');
    if (theme === 'dark') {
        cardBody.style.backgroundColor = '#2a3f54';
        myChart.data.datasets[0].borderColor = 'rgba(255, 255, 255, 1)';
        myChart.data.datasets[0].backgroundColor = 'rgba(255, 255, 255, 0.2)';
        myChart.options.plugins.legend.labels.color = '#ffffff';
        myChart.options.scales.x.ticks.color = '#ffffff';
        myChart.options.scales.y.ticks.color = '#ffffff';
    } else {
        cardBody.style.backgroundColor = '#ffffff';
        myChart.data.datasets[0].borderColor = 'rgba(42, 63, 84, 1)';
        myChart.data.datasets[0].backgroundColor = 'rgba(42, 63, 84, 0.2)';
        myChart.options.plugins.legend.labels.color = '#000000';
        myChart.options.scales.x.ticks.color = '#000000';
        myChart.options.scales.y.ticks.color = '#000000';
    }
    myChart.update();
}

// Example of theme change
// changeTheme('light'); // Uncomment to switch to light theme
