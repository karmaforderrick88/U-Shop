// Chart.js chart instance for monthly sales
let monthlySalesChart = null;

// Function to fetch sales data and render the monthly sales chart
async function fetchAndRenderMonthlySalesChart(timePeriod = 'last_6_months') {
    try {
        // Fetch sales data from the backend API
        const response = await fetch('/api/sales');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const sales = await response.json();

        // Get the current date
        const now = new Date();
        let filterStartDate = null; // This will be used to filter sales by date

        // Determine the start date for filtering sales based on the selected time period
        // The switch statement checks the value of 'timePeriod' and sets filterStartDate accordingly
        switch (timePeriod) {
            case 'all_time':
                // For 'all_time', we want all sales, so filterStartDate remains null
                break;
            case 'this_year':
                // For 'this_year', set filterStartDate to January 1st of the current year
                filterStartDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'last_12_months':
                // For 'last_12_months', set filterStartDate to the first day of the month, 11 months ago
                filterStartDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
                break;
            case 'last_6_months':
            default:
                // For 'last_6_months' (or any other value), set filterStartDate to the first day of the month, 5 months ago
                filterStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                break;
        }

        // Filter the sales data based on the filterStartDate
        // If filterStartDate is set, only include sales on or after that date
        // If filterStartDate is null (all_time), include all sales
        const filteredSales = sales.filter(sale => {
            if (!sale.saleDate || typeof sale.saleDate !== 'string') {
                return false;
            }
            const saleDate = new Date(sale.saleDate);
            return filterStartDate ? saleDate >= filterStartDate : true;
        });

        // Aggregate sales totals by month (e.g., '2024-05')
        const monthlySales = {};
        filteredSales.forEach(sale => {
            if (sale.saleDate && typeof sale.saleDate === 'string') {
                const date = new Date(sale.saleDate);
                const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                if (!monthlySales[yearMonth]) {
                    monthlySales[yearMonth] = 0;
                }
                monthlySales[yearMonth] += sale.total || 0;
            }
        });

        // Prepare a list of all months in the selected period, even if there were no sales in some months
        const allMonthsInPeriod = [];
        let currentDate;
        if (filterStartDate) {
            // If filtering, start from the filterStartDate
            currentDate = new Date(filterStartDate);
        } else if (Object.keys(monthlySales).length > 0) {
            // For 'all_time', start from the earliest sale month
            const earliestKey = Object.keys(monthlySales).sort()[0];
            const [earliestYear, earliestMonth] = earliestKey.split('-');
            currentDate = new Date(parseInt(earliestYear), parseInt(earliestMonth) - 1, 1);
        } else {
            // If no sales, just use the current month
            currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // If there are no filtered sales, show a message in the chart and return
        if (filteredSales.length === 0) {
            const ctx = document.getElementById('monthlySalesChart').getContext('2d');
            if (monthlySalesChart) { monthlySalesChart.destroy(); }
            monthlySalesChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['No Sales Data'],
                    datasets: [{
                        label: 'Monthly Sales (Ksh)',
                        data: [0],
                        backgroundColor: 'rgba(67, 97, 238, 0.2)',
                        borderColor: 'rgba(67, 97, 238, 0.5)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true }, x: {} },
                    plugins: { legend: { display: false }, title: { display: true, text: 'No Sales Data Available for Selected Period' } }
                }
            });
            return;
        }

        // Determine the last month to include in the chart
        let loopEndDate = new Date(now.getFullYear(), now.getMonth(), 1);
        if (timePeriod === 'all_time' && sales.length > 0) {
            // For 'all_time', end at the latest sale month
            const latestKey = Object.keys(monthlySales).sort().reverse()[0];
            const [latestYear, latestMonth] = latestKey.split('-');
            loopEndDate = new Date(parseInt(latestYear), parseInt(latestMonth) - 1, 1);
        }

        // Build a list of all months between currentDate and loopEndDate
        while (currentDate <= loopEndDate) {
            const ym = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
            allMonthsInPeriod.push(ym);
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        allMonthsInPeriod.sort();

        // Prepare labels for the chart (e.g., 'May 2024')
        const chartLabels = allMonthsInPeriod.map(ym => {
            const [year, month] = ym.split('-');
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
        });

        // Prepare the data for the chart (sales totals for each month)
        const chartData = allMonthsInPeriod.map(ym => monthlySales[ym] || 0);

        // Get the canvas context for Chart.js
        const ctx = document.getElementById('monthlySalesChart').getContext('2d');

        // If a chart already exists, destroy it before creating a new one
        if (monthlySalesChart) {
            monthlySalesChart.destroy();
        }

        // Create the bar chart using Chart.js
        monthlySalesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Monthly Sales (Ksh)',
                    data: chartData,
                    backgroundColor: 'rgba(67, 97, 238, 0.7)',
                    borderColor: 'rgba(67, 97, 238, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Sales Amount (Ksh)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        },
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Monthly Sales Overview'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KSh' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        // If any error occurs, log it and show an error message in the chart area
        logger.error('summary.js: Error rendering monthly sales chart:', error);
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = '<p style="text-align: center; color: #dc3545; padding: 20px;">Failed to load sales chart. Please try again.</p>';
        }
    }
}

async function fetchAndDisplaySummary() {
    try {
        const res = await fetch('/api/sales/summary');
        if (!res.ok) throw new Error('Failed to fetch summary');
        const data = await res.json();
        logger.apiCall('GET', '/api/sales/summary', true);

        document.getElementById('best-product').textContent = `Best-selling Product: ${data.bestSellingProduct ?? '--'}`;
        document.getElementById('monthly-income').textContent = `Monthly Income: KSh ${data.monthlyIncome?.toLocaleString() ?? '--'}`;
        document.getElementById('total-debts').textContent = `Total Debts: KSh ${data.totalDebts?.toLocaleString() ?? '--'}`;
    } catch (err) {
        logger.error('Error fetching summary:', err);
        logger.apiCall('GET', '/api/sales/summary', false);
        document.getElementById('best-product').textContent = 'Best-selling Product: Error';
        document.getElementById('monthly-income').textContent = 'Monthly Income: Error';
        document.getElementById('total-debts').textContent = 'Total Debts: Error';
    }
}

// --- DOM Ready / Event Listeners ---
$(document).ready(function() {
    const summary_card = document.getElementById('summary')
    if(!summary_card){
        logger.log('summary.js: cannot get the summary card,skipping loading text content')
        return;
    }
    fetchAndDisplaySummary();
    const chartElement = document.getElementById('monthlySalesChart');
    if (!chartElement) {
        logger.log('summary.js: Not on summary page, skipping chart initialization');
        return;
    }
    
    // When the page loads, render the chart for the last 6 months by default
    fetchAndRenderMonthlySalesChart('last_6_months');

    // When the user changes the time period in the dropdown, re-render the chart
    $('#chart-time-period-selector').on('change', function() {
        const selectedPeriod = $(this).val();
        fetchAndRenderMonthlySalesChart(selectedPeriod);
    });

    $('#refresh-btn').on('click',()=>{
        fetchAndDisplaySummary();
        fetchAndRenderMonthlySalesChart('last_6_months')
    })
});