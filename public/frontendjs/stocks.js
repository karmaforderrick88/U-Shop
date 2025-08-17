let itemIdToDelete = null;

$(document).ready(function() {
    logger.log('stocks.js: Document is ready. Script is running!');

    // --- Selectors ---
    const $stockTableBody = $("#stock-table tbody");
    const $totalItemsSpan = $('#total-items');
    const $lowStockCountSpan = $('#low-stock-count');
    const $searchInput = $('#search-stock');
    const $addStockBtn = $('#add-stock-btn');
    const $itemModal = $('#add-item-modal');
    const $cancelBtns =$('#stock-cancel');
    const $itemForm = $('#add-item-form');
    const $itemIdInput = $('#new-item-id'); 
    const $itemNameInput = $('#new-item-name');
    const $itemQtyInput = $('#new-item-qty');
    const $itemPriceInput = $('#new-item-price');
    const $modalTitle = $itemModal.find('h2');
    const $itemCostInput = $('#new-item-cost');
    const $stockMessageContainer = $('#stock-message-container');
    const $accessDeniedModal = $('#access-denied-modal');
    const $accessDeniedMessage = $('#access-denied-message');
    

    let currentEditItemId = null; // Stores the Firestore string ID when editing

    // --- renderTable Function ---
    window.renderTable = function(data) {
        $stockTableBody.empty();
        if (data && data.length > 0) {
            data.forEach(item => {
                logger.log(`stocks.js: Rendering item with Firestore ID: ${item.id}, Name: ${item.name}`);
                $stockTableBody.append(`
                    <tr data-item-id="${item.id}">
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${item.price.toFixed(2)}</td>
                        <td>${item.costPrice ? item.costPrice.toFixed(2) : 'N/A'}</td> <!-- Handle undefined costPrice -->
                        <td>
                            <button class="edit-item-btn edit-button">Edit</button>
                            <button class="delete-item-btn delete-button">Delete</button>

                        </td>
                    </tr>
                `);
            });
        } else {
            $stockTableBody.append('<tr><td colspan="5" class="text-center">No stock items found.</td></tr>');
        }
        $totalItemsSpan.text(data.length);
        $lowStockCountSpan.text(data.filter(item => item.quantity < 5).length);
        logger.log('stocks.js: Table rendered with:', data);
    };

    const displayStockMessage = (message, type) => {
        $stockMessageContainer.removeClass('success error').text(''); // Clear previous messages and classes
        $stockMessageContainer.text(message).addClass(type); 
        $stockMessageContainer.css({ 'opacity': 1, 'transform': 'translateY(0)' }); 
    
        // Automatically hide the message after 5 seconds
        setTimeout(() => {
            $stockMessageContainer.css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
           
            setTimeout(() => {
                $stockMessageContainer.text('');
            }, 300);
        }, 5000); 
    };

    const showAccessDeniedModal = (message) => {
        $accessDeniedMessage.text(message || 'You do not have permission to perform this action.');
        $accessDeniedModal.css('display', 'flex');
    };

    const hideAccessDeniedModal = () => {
        $accessDeniedModal.css('display', 'none');
    };

    // --- fetchAndRenderStocks Function ---
    window.fetchAndRenderStocks = async function() {
        logger.log('stocks.js: Fetching stock data from /api/stocks...');
        try {
            const response = await fetch('/api/stocks');
            if (!response.ok) {
                const errorText = await response.text();
                //  Handle 403 specifically  for GET requests to stocks
                if (response.status === 403) {
                    showAccessDeniedModal(errorText || 'Access Denied: You do not have permission to view stocks😒.');
                    $stockTableBody.empty(); 
                    $stockTableBody.append('<tr><td colspan="5" class="text-center text-red-500">Access Denied: Cannot load stock data.</td></tr>');
                    $totalItemsSpan.text('N/A');
                    $lowStockCountSpan.text('N/A');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status} - ${errorText || 'Unknown error'}`);
            }
            const stocks = [];
            const stocksData = await response.json();
            stocksData.forEach(
                item =>{
                 stocks.push({
                    id:item.id,
                    name:item.name,
                    quantity:item.quantity,
                    price:item.price,
                    costPrice:item.costPrice 
                 })   
                }
            )
            logger.log('stocks.js: Fetched stocks:', stocks);
            logger.apiCall('GET', '/api/stocks', true);
            window.renderTable(stocks);
        } catch (error) {
            logger.error('stocks.js: Error fetching stock data:', error);
            logger.apiCall('GET', '/api/stocks', false);
            $stockTableBody.empty();
            $stockTableBody.append('<tr><td colspan="5" class="text-center text-red-500">Failed to load stock. Please try again.</td></tr>');
            $totalItemsSpan.text('N/A');
            $lowStockCountSpan.text('N/A');
        }
    };

    // --- Add New Item Modal Open ---
    $addStockBtn.on('click', async function() {
        logger.log('stocks.js: Add Stock Button Clicked (new item mode)!');
        currentEditItemId = null;
        $modalTitle.text('Add New Stock Item');
        $itemForm[0].reset();
        $itemIdInput.val('Auto-Generated ID').prop('readonly', true); 
        $itemModal.css('display', 'flex');
      
        $stockMessageContainer.removeClass('success error').text('').css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
    });

    // --- Edit Button Click Handler ---
    $stockTableBody.on('click', '.edit-item-btn', async function() {
        logger.log('stocks.js: Edit button clicked!');
        const $row = $(this).closest('tr');

        if ($row.length === 0) {
            logger.error('stocks.js: ERROR: $(this).closest(\'tr\') did NOT find a TR element.');
            return;
        }

        const itemId = $row.data('item-id'); 
        logger.log('stocks.js: Retrieved data-item-id from row:', itemId);

        if (itemId && typeof itemId === 'string') { 
            const stocks = await fetch('/api/stocks').then(res => res.json());
            const itemToEdit = stocks.find(item => item.id === itemId);

            if (itemToEdit) {
                logger.log('stocks.js: Found item to edit:', itemToEdit);
                currentEditItemId = itemId; // Store the Firestore string ID for editing
                $modalTitle.text('Edit Stock Item');

                // Populate the form fields
                logger.log('stocks.js: Populating ID field with:', itemToEdit.id);
                $itemNameInput.val(itemToEdit.name);
                $itemQtyInput.val(itemToEdit.quantity);
                $itemCostInput.val(itemToEdit.costPrice || 0); 
                $itemPriceInput.val(itemToEdit.price);

                $itemModal.css('display', 'flex');
                
                $stockMessageContainer.removeClass('success error').text('').css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
            } else {
                logger.error('stocks.js: Item not found in fetched data for ID:', itemId);
            }
        } else {
            logger.error('stocks.js: Invalid or missing item ID from row data-item-id. Value:', itemId, 'Type:', typeof itemId);
            
        }
    });

    
  
        // --- delete Button Click Handler ---
        $stockTableBody.on('click', '.delete-item-btn', function() {
            const itemId = $(this).closest('tr').data('item-id');
            itemIdToDelete = itemId;
            $('#delete-confirm-modal').show();
        });
        $('#confirm-delete-btn').on('click', function() {
            if (itemIdToDelete) {
                deleteStockItem(itemIdToDelete);
            }
            $('#delete-confirm-modal').hide();
            itemIdToDelete = null;
        });
        
        $('#cancel-delete-btn').on('click', function() {
            $('#delete-confirm-modal').hide();
            itemIdToDelete = null;
        });

        // Access Denied Modal Event Handlers
        $('#close-access-denied, #access-denied-ok').on('click', function() {
            hideAccessDeniedModal();
        });

        // Close modal when clicking outside
        $accessDeniedModal.on('click', function(e) {
            if (e.target === this) {
                hideAccessDeniedModal();
            }
        });


        async function deleteStockItem(itemId) {
            const $row = $(`#stock-table tbody tr[data-item-id='${itemId}']`);
            if ($row.length === 0) {
                logger.error('stocks.js: ERROR: Could not find table row for item ID:', itemId);
                return;
            }
            try {
                logger.log(`stock.js:Sending delete request for item ID ${itemId}`);
                const response = await fetch(`/api/stocks/${itemId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });
        
                if (response.ok) {
                    logger.log(`Stock.js:Successfully deleted item with id: ${itemId}`);
                    logger.apiCall('DELETE', `/api/stocks/${itemId}`, true);
                    $row.remove();
                    await window.fetchAndRenderStocks();
                    displayStockMessage('Item deleted successfully!', 'success');
                } else {
                    // NEW: Separate handling for 403 regardless of JSON parsing success
                    if (response.status === 403) {
                        let accessDeniedMsg = 'Access Denied: You do not have permission to delete stock items.';
                        try {
                            const errorData = await response.json();
                            accessDeniedMsg = errorData.message || accessDeniedMsg;
                        } catch (parseError) {
                            logger.warn('stocks.js: Could not parse 403 error response as JSON, using default message.');
                        }
                        showAccessDeniedModal(accessDeniedMsg);
                        return; // Stop execution after showing modal
                    }

                    // Original error handling for other non-2xx statuses
                    let errorMessage = 'Failed to delete item. Please try again.';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (parseError) {
                        logger.error('stocks.js: Could not parse error response as JSON:', parseError);
                        errorMessage = `Server error: ${response.status} ${response.statusText}`;
                    }
                    logger.apiCall('DELETE', `/api/stocks/${itemId}`, false);
                    displayStockMessage(errorMessage, 'error');
                }
            } catch (err) {
                logger.error('stocks.js: Error during delete fetch operation:', err);
                displayStockMessage('Network error. Please try again.', 'error');
            }
        }

   

    // --- Cancel Button Click Handler ---
    $cancelBtns.on('click', function() {
        logger.log('stocks.js: Cancel button Clicked!');
        $itemModal.css('display', 'none');
        $itemForm[0].reset(); // Ensure form resets
        currentEditItemId = null;
        $itemIdInput.prop('readonly', false); // Reset readonly for future Add operations
        // Clear message container when closing modal
        $stockMessageContainer.removeClass('success error').text('').css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
    });

    // --- Form Submission Handler (Add/Edit) ---
    $itemForm.submit(async function(e) {
        e.preventDefault();
        logger.log('stocks.js: Form submit event fired. Default prevented.');

        const itemData = {
            name: $itemNameInput.val().trim(),
            quantity: parseInt($itemQtyInput.val()) || 0,
            price: parseFloat($itemPriceInput.val()) || 0,
            costPrice: parseFloat($itemCostInput.val()) || 0 // Ensure costPrice is sent
        };

        // Client-side validation
        if (!itemData.name) {
            displayStockMessage('Please enter an item name.', 'error');
            return;
        }
        if (isNaN(itemData.quantity) || itemData.quantity < 0) {
            displayStockMessage('Quantity must be a non-negative number.', 'error');
            return;
        }
        if (isNaN(itemData.price) || itemData.price < 0) {
            displayStockMessage('Price must be a non-negative number.', 'error');
            return;
        }
        if (isNaN(itemData.costPrice) || itemData.costPrice < 0) {
            displayStockMessage('Cost Price must be a non-negative number.', 'error');
            return;
        }


        let apiMethod = 'POST';
        let apiUrl = '/api/stocks';
        let successMessage = 'Item added successfully!';

        if (currentEditItemId !== null) { // If we have an ID stored, it's an edit
            apiMethod = 'PUT';
            apiUrl = `/api/stocks/${currentEditItemId}`; // currentEditItemId should be the Firestore string ID
            successMessage = 'Item updated successfully!';
            logger.log('stocks.js: Edit mode detected. API URL:', apiUrl);
        } else {
            logger.log('stocks.js: Add mode detected. API URL:', apiUrl);
        }

        logger.log(`stocks.js: Submitting item data via ${apiMethod} to ${apiUrl}. Payload:`, itemData);

        try {
            const response = await fetch(apiUrl, {
                method: apiMethod,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            });

            if (!response.ok) {
                // NEW: Separate handling for 403 regardless of JSON parsing success
                if (response.status === 403) {
                    let accessDeniedMsg = 'Access Denied: You do not have permission to add/edit stock items.';
                    try {
                        const errorData = await response.json();
                        accessDeniedMsg = errorData.message || accessDeniedMsg;
                    } catch (parseError) {
                        logger.warn('stocks.js: Could not parse 403 error response as JSON, using default message.');
                    }
                    showAccessDeniedModal(accessDeniedMsg);
                    return; // Stop execution after showing modal
                }

                // Original error handling for other non-2xx statuses
                let errorMessage = 'Failed to save item. Please try again.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    logger.error('stocks.js: Could not parse error response as JSON:', parseError);
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                logger.apiCall(apiMethod, apiUrl, false);
                displayStockMessage(errorMessage, 'error');
                return;
            }

            const result = await response.json();
            logger.log(`stocks.js: ${successMessage}:`, result);
            logger.apiCall(apiMethod, apiUrl, true);
            displayStockMessage(successMessage, 'success');

            await fetchAndRenderStocks();

            setTimeout(() => {
                $itemModal.css('display', 'none');
            }, 2000);
            
            $itemForm[0].reset();
            currentEditItemId = null;
            $itemIdInput.prop('readonly', false); // Reset readonly for future Add operations
        } catch (error) {
            logger.error('stocks.js: Error submitting item:', error);
            displayStockMessage('Network error. Please try again.', 'error');
        }
    });

    // --- Search Functionality ---
    $searchInput.on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('#stock-table tbody tr').each(function() {
            //search by item name
            const itemName = $(this).find('td:nth-child(1)').text().toLowerCase(); 
            $(this).toggle(itemName.includes(searchTerm));
        });
    });

    // Initial load
    fetchAndRenderStocks();

    logger.log('stocks.js: All functionality initialized.');
});