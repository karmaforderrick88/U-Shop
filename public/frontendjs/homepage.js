$(document).ready(function () {
    // Mobile menu toggle functionality 
    $('#menu-toggle').on('click', function () {
        $('body').toggleClass('menu-open');
        $('#nav-menu').toggleClass('active');
    });
    const $totalSales = $('#total-sales');
    const $saleModal = $('#sale-modal'); // Modal element
    const $saleForm = $('#sale-form');   // Form inside the modal
    const $dropdown = $('#sale-item');   // Dropdown for selecting items
    const $saleQtyInput = $('#sale-qty'); // Quantity input
    const $salePriceInput = $('#sale-price'); // Price input (This is the unitPrice for the sale)
    const $saleDateInput = $('#sale-date'); // Date input
    const $paymentModeSelect = $('#payment-mode'); // Payment Mode select

    // Selector for Sale Modal Message Container
    const $saleMessageContainer = $('#sale-message-container');

    // Helper function to display messages in the sale modal
    function displaySaleMessage(message, type) {
        $saleMessageContainer.removeClass('success error').text(''); // Clear previous messages and classes
        $saleMessageContainer.text(message).addClass(type); // Set new message and add type class
        $saleMessageContainer.css({ 'opacity': 1, 'transform': 'translateY(0)' }); // Make visible with animation

        // Automatically hide the message after 5 seconds
        setTimeout(() => {
            $saleMessageContainer.css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
            // Clear message text after fade out to ensure it's truly gone
            setTimeout(() => {
                $saleMessageContainer.text('');
            }, 300); // Wait for transition to complete before clearing text
        }, 5000); // Message visible for 5 seconds
    }
    
    async function fetchAndDisplayTotalSales(){
        try{
            //  endpoint that returns only today's total
            const response = await fetch('/api/sales/today-total');
            if(!response.ok){
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const { total } = await response.json();
            $totalSales.text(`Total Sales: Ksh ${total.toFixed(2)}`);
            logger.log('homepage.js: successfully fetched and displayed today\'s total sales');
            logger.apiCall('GET', '/api/sales/today-total', true);
        } catch(err){
            logger.error('homepage.js: error fetching and displaying total sales!!', err);
            logger.apiCall('GET', '/api/sales/today-total', false);
            $totalSales.text('Total Sales: --');
            displaySaleMessage('Error fetching total sales. Please try again.', 'error');
        }   
    }
    fetchAndDisplayTotalSales();

    async function populateItemDropDown(){
        logger.log('homepage.js: fetching items for dropdown');
        try {
            const response = await fetch('/api/stocks');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText || 'Unknown error'}`);
            }
            const stockItems = await response.json();
            logger.log('homepage.js: Received stockItems data:', stockItems);

            // Ensure stockItems is an array
            if (!Array.isArray(stockItems)) {
                logger.error('homepage.js: Expected stockItems to be an array, but received:', stockItems);
                throw new TypeError('Received data for dropdown is not an array.');
            }

            $dropdown.empty();
            $dropdown.append(`<option value="">Select an item</option>`); // default option

            stockItems.forEach(item => {
                // Display recommended price in dropdown option text, but value remains item.name
                $dropdown.append(`<option value="${item.id}" data-recommended-price="${item.price}">${item.name}</option>`);
            });
            
            logger.log('homepage.js: successfully populated item dropdown');
            logger.apiCall('GET', '/api/stocks', true);
        } catch(err) {
            logger.error('homepage.js: error populating item dropdown!!', err);
            logger.apiCall('GET', '/api/stocks', false);
            displaySaleMessage('Error loading items for dropdown.', 'error');
        }
    }

    //  Event Listener for Dropdown Change to Populate Sale Price Input 
    $dropdown.on('change', function() {
        const selectedOption = $(this).find('option:selected');
        const recommendedPrice = selectedOption.data('recommended-price');
        if (typeof recommendedPrice === 'number') {
            $salePriceInput.val(recommendedPrice.toFixed(2));
        } else {
            $salePriceInput.val(''); 
        }
    });

    // event listener for opening the add sale form & populating it too
    $('#add-sale-btn').on('click',function(){
        logger.log('homepage.js: add sale button clicked!!');
        $saleForm[0].reset(); 
        $saleDateInput.val(new Date().toISOString().split('T')[0]); 
        populateItemDropDown();
        $saleModal.css('display','flex');
        $saleMessageContainer.removeClass('success error').text('').css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
    });

    // closing the add sale modal
    $('#add-sale-homepage').on('click',function(){
        logger.log('homepage.js: cancel button clicked');
        $saleForm[0].reset(); 
        $saleModal.css('display','none');
        $saleMessageContainer.removeClass('success error').text('').css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
    });

    // form submission
    $saleForm.on('submit', async function(e){ 
        e.preventDefault(); 
        logger.log('homepage.js: Sale form submission initiated.');

        $saleMessageContainer.removeClass('success error').text('').css({ 'opacity': 0, 'transform': 'translateY(-10px)' });

        //Retrieve the actual unitPrice from the input field 
        const saleData = {
            saleDate: $saleDateInput.val(), // Changed 'date' to 'saleDate' for consistency with backend
            productId: $dropdown.val(),
            productName: $dropdown.find('option:selected').text(), // Changed 'items' to 'productName' for consistency with backend
            quantity: parseInt($saleQtyInput.val()),
            unitPrice: parseFloat($salePriceInput.val()), // Captured actual unit price from input
            paymentMode: $paymentModeSelect.val() // Changed 'PaymentMode' to 'paymentMode' for consistency
        }

        // --- Client-side validation ---
        if (!saleData.saleDate || saleData.saleDate === '') {
            displaySaleMessage('Sale date is required.', 'error');
            return;
        }
        if (!saleData.productName || saleData.productName === '') {
            displaySaleMessage('Please select a product item.', 'error');
            return;
        }
        if (isNaN(saleData.quantity) || saleData.quantity <= 0) {
            displaySaleMessage('Quantity must be a positive number.', 'error');
            return;
        }
        if (isNaN(saleData.unitPrice) || saleData.unitPrice < 0) {
            displaySaleMessage('Unit price must be a non-negative number.', 'error');
            return;
        }
        if (!saleData.paymentMode || saleData.paymentMode === '') {
            displaySaleMessage('Payment mode is required.', 'error');
            return;
        }

        logger.log('homepage.js: Sale data prepared for submission:', saleData);

        try {
            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData)
            });

            const result = await response.json(); 

            if (response.ok) { // Status code is 2xx
                displaySaleMessage('Sale recorded successfully! 🎉', 'success');
                logger.log('homepage.js: Sale recorded successfully:', result);
                logger.apiCall('POST', '/api/sales', true);

                fetchAndDisplayTotalSales();

                $saleForm[0].reset();
                // Close modal after a short delay to allow user to see success message
                setTimeout(() => {
                    $saleModal.css('display', 'none');
                }, 1000); 

            } else { // Status code is 4xx or 5xx
                const errorMessage = result.message || 'An unknown error occurred during sale recording.';
                displaySaleMessage(`Error: ${errorMessage}`, 'error');
                logger.error('homepage.js: Sale recording failed:', response.status, result);
                logger.apiCall('POST', '/api/sales', false);
            }
        } catch(err) { // Network errors or issues parsing JSON
            displaySaleMessage('Network error or unexpected response. Please try again.', 'error');
            logger.error('homepage.js: Error recording the new sale:', err); 
        }
    });
});