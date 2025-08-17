export let salesData = [] 

export function loadSalesTable(data) { 
  const tbody = document.getElementById('salesBody');
  if (!tbody) { 
      logger.warn('history.js: Element with ID "salesBody" not found. Cannot render sales table.');
      return;
  }
  tbody.innerHTML = ''; // Clear current rows
  if(data && data.length > 0){
  data.forEach(sale => {
      const row = document.createElement('tr'); // creation of a new row
      const paymentClass = sale.paymentMode === 'Cash' ? 'cash' : 'mobile';
      row.classList.add(paymentClass);

      row.innerHTML =
       `
       <td>${sale.saleDate}</td> 
       <td>${sale.productName}</td>  
       <td>${sale.quantity}</td>  
       <td>${sale.unitPrice}</td> 
       <td>${sale.total}</td>
       `;    
      tbody.appendChild(row);
     });
     logger.log('history.js: Sales table rendered with:', data);
}
else {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No sales records found.</td></tr>'; 
  }
};

export  const fetchAndLoadSalesData = async function() {
  logger.log('history.js: Fetching and loading sales history from /api/sales...');
    try {
        const response = await fetch('/api/sales'); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fetchedSales = await response.json(); // Get the actual sales data
        logger.log('history.js: Fetched sales data:', fetchedSales);
        logger.apiCall('GET', '/api/sales', true);
        salesData = fetchedSales;
        loadSalesTable(salesData);
        
}
catch(err){
  logger.error('history.js:error fetching and loading sales data',err);
  logger.apiCall('GET', '/api/sales', false);
}
}

 function applyFilters () {
  logger.log('history.js: Applying filters...');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const itemFilterInput = document.getElementById('itemFilter');

  const startDate = startDateInput ? startDateInput.value : '';
  const endDate = endDateInput ? endDateInput.value : '';
  const itemFilter = itemFilterInput ? itemFilterInput.value.toLowerCase() : '';

  const filtered = salesData.filter(sale => {
    // Defensive: ensure saleDate and productName exist
    if (!sale.saleDate || !sale.productName) return false;

    const saleDate = new Date(sale.saleDate);

    // If startDate is set, saleDate must be >= startDate
    const isAfterStart = !startDate || saleDate >= new Date(startDate);

    // If endDate is set, saleDate must be <= endDate
    const isBeforeEnd = !endDate || saleDate <= new Date(endDate);

    // If itemFilter is set, productName must include it (case-insensitive)
    const itemMatch = !itemFilter || sale.productName.toLowerCase().includes(itemFilter);

    return isAfterStart && isBeforeEnd && itemMatch;
  });

  loadSalesTable(filtered); 
}
window.applyFilters = applyFilters;

export function resetFilters () {
  logger.log('history.js: Resetting filters...');
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  document.getElementById('itemFilter').value = '';
 loadSalesTable(salesData); 
}