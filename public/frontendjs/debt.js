const $debtMessageContainer = $('#debt-message-container');
const $debtTableTbody = $('#debt-data');

//  Repayment Modal Specific Selectors 
const $repaymentModal = $('#repayment-modal');
const $repaymentForm = $('#repayment-form');
const $repaymentDebtId = $('#repayment-debt-id'); // Hidden input to store debt ID
const $repaymentCustomerName = $('#repayment-customer-name'); // Display customer name
const $repaymentOriginalAmount = $('#repayment-original-amount'); // Display original amount
const $repaymentOutstandingAmount = $('#repayment-outstanding-amount'); // Display current outstanding
const $repaymentInputAmount = $('#repayment-amount-input'); // Input for new payment
const $repaymentMessageContainer = $('#repayment-message-container'); // Message for repayment modal

//Payment History Modal Selectors ---
const $historyModal = $('#payment-history-modal');
const $historyCustomerName = $('#history-customer-name');
const $historyTableBody = $('#payment-history-data');
const $historyMessageContainer = $('#payment-history-message-container');

//selectors for clear debt modal
const $clearDebtModal = $('#clear-debt-modal');
const $clearDebtId = $('#clear-debt-id');
const $clearDebtConfirm = $('#clear-debt-confirm');
const $clearDebtCancel = $('#clear-debt-cancel');

// Helper function to display messages in the debt recprding  modal 
const displayDebtMessage = (message, type) => {
    $debtMessageContainer.removeClass('success error').text(''); // Clear previous messages and classes
    $debtMessageContainer.text(message).addClass(type); // Set new message and add type class
    $debtMessageContainer.css({ 'opacity': 1, 'transform': 'translateY(0)' }); // Make visible with animation

    // Automatically hide the message after 5 seconds
    setTimeout(() => {
        $debtMessageContainer.css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
        // Clear message text after fade out 
        setTimeout(() => {
            $debtMessageContainer.text('');
        }, 300); // Wait for transition to complete before clearing text
    }, 5000); // Message visible for 5 seconds
}

// Helper function to display messages in the repayment modal 
const displayRepaymentMessage = (message, type) => {
    $repaymentMessageContainer.removeClass('success error').text(''); // Clear previous messages and classes
    $repaymentMessageContainer.text(message).addClass(type); // Set new message and add type class
    $repaymentMessageContainer.css({ 'opacity': 1, 'transform': 'translateY(0)' }); // Make visible with animation

    setTimeout(() => {
        $repaymentMessageContainer.css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
        setTimeout(() => {
            $repaymentMessageContainer.text('');
        }, 300);
    }, 5000);
};

// Helper function to display messages in the payment history modal 
const displayHistoryMessage = (message, type) => {
    $historyMessageContainer.removeClass('success error').text('');
    $historyMessageContainer.text(message).addClass(type);
    $historyMessageContainer.css({ 'opacity': 1, 'transform': 'translateY(0)' });
    setTimeout(() => {
        $historyMessageContainer.css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
        setTimeout(() => { $historyMessageContainer.text(''); }, 300);
    }, 5000);
};

//renders the debts owed table
 function renderDebtTable(data){
const tbody = document.getElementById('debt-data');
$debtTableTbody.empty()
if (Array.isArray(data) && data.length > 0){
    data.forEach(debt => {
   $debtTableTbody.append(
    `<tr data-debt-id="${debt.id}"
                     data-customer="${debt.customer}"
                     data-original-amount="${debt.originalAmount || debt.amount}"
                     data-outstanding-amount="${debt.amount}"> 
                    <td>${(debt.customer).toUpperCase()}</td>
                    <td>${(debt.amount || 0).toFixed(2)}</td> <!-- Display current outstanding amount -->
                    <td>${debt.dateTaken || 'N/A'}</td>
                    <td>${debt.dueDate}</td>
                    <td>
                        <button class="clear-debt-btn" >Clear</button>
                        <button class="repay-debt-btn  repay-button-spacing">Repay</button>
                        <button class="view-history-btn ">History</button> 
                    </td>
                </tr>
        `
   )  
});
}
else{
    tbody.innerHTML=`<tr><td colspan="5" style="text-align:center; padding:20px;">no debt records found🥀</td></tr>`
}

}

//  Renders the payment history table within the modal 
function renderPaymentHistoryTable(repayments) {
    $historyTableBody.empty(); 

    if (Array.isArray(repayments) && repayments.length > 0) {
        repayments.forEach(repayment => {
            $historyTableBody.append(
                `<tr>
                    <td>Ksh${(repayment.amountPaid || 0).toFixed(2)}</td>
                    <td>${repayment.paymentDate || 'N/A'}</td>
                    <td>Ksh${(repayment.balanceAfterPayment || 0).toFixed(2)}</td>
                    <td>${repayment.timestamp ? new Date(repayment.timestamp._seconds * 1000).toLocaleString() : 'N/A'}</td>
                </tr>`
            );
        });
    } else {
        $historyTableBody.append(`<tr><td colspan="4" style="text-align:center; padding:20px;">No payment history found for this debt.</td></tr>`);
    }
}

//  Fetches and displays payment history for a specific debt ---
async function fetchAndDisplayPaymentHistory(debtId, customerName) {
    $historyCustomerName.text(customerName); // Set customer name in modal header
    $historyTableBody.empty(); // Clear table before loading

    try {
        const response = await fetch(`/api/debts/${debtId}/repayments`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText || 'Unknown error'}`);
        }
        const repayments = await response.json();
        logger.log(`debt.js: Fetched repayments for debt ${debtId}:`, repayments);
        renderPaymentHistoryTable(repayments);
        displayHistoryMessage('', ''); // Clear loading message on success
        if (repayments.length === 0) {
            displayHistoryMessage('No payment history found for this debt.', 'info');
        }

    } catch (error) {
        logger.error(`debt.js: Error fetching payment history for debt ID ${debtId}:`, error);
        displayHistoryMessage(`Failed to load payment history: ${error.message}`, 'error');
    }
}

export async function fetchAndRenderDebts(){
    logger.log(`debt.js:fetching debt data from /api/debts ...`)
    try{
        const response = await fetch('/api/debts');
        if(!response.ok){
            const errorText = await response.text()
            throw new Error(`HTTP error! status: ${response.status} - ${errorText || 'Unknown error'}`)
        }

        const debts = await response.json();
        logger.log(`debt.js:fetched debts`, debts)
        logger.apiCall('GET', '/api/debts', true);
        renderDebtTable(debts);
    }
    catch(err){
        logger.error(`debt.js: error fetching debts`,err);
        logger.apiCall('GET', '/api/debts', false);
        displayDebtMessage("Failed to load debts.Please try again","error")
    }
}

// THE ADDING DEBT MODULE

$(document).ready(function () {
    const $debtModal = $('#debt-module');
    const $debtForm = $('#debt-form');

    // Open modal on button click
    $('.btn-debt').click(function () {
        $debtModal.css('display', 'flex');
        $debtForm[0].reset();
        $('#Date-taken').val(new Date().toISOString().split('T')[0]);
        $debtMessageContainer.removeClass('success error').text('').css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
    });

    // Close modal on cancel
  $('#debt-form-cancel').on('click',function(){
        logger.log('debt.js: cancel button clicked');
        $debtForm[0].reset(); 
        $debtModal.css('display','none');
         $debtMessageContainer.removeClass('success error').text('').css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
    });

    // Handle form submission
    $debtForm.on('submit', async function (e) {
        e.preventDefault();

        $debtMessageContainer.removeClass('success error').text('').css({ 'opacity': 0, 'transform': 'translateY(-10px)' });

        const debtData = {
            customer: $('#name').val().trim(),
            amount: parseFloat($('#Amount').val()),
            dueDate: $('#Due-date').val(),
            dateTaken: new Date().toISOString().split('T')[0]
        };

        if (!debtData.customer || debtData.customer === '') {
            displayDebtMessage('uumm you forgot the customer name','error')
            return;
        }
        if(isNaN(debtData.amount) || debtData.amount<0){
            displayDebtMessage("you sure about that amount","error");
            return;
        }
        if(!debtData.dueDate || debtData.dueDate === ""){
            displayDebtMessage('please provide a due date','error');
            return;
        }
        if(!debtData.dateTaken || debtData.dateTaken === ""){
            displayDebtMessage("please try entering the due date","error");
            return;
        }
         const dateDue = new Date(debtData.dueDate);
         const taken = new Date(debtData.dateTaken);

         if(dateDue < taken){
            displayDebtMessage("There seems to be a time discrepancy","error");
            return;
         }
        logger.log('debt.js: debt data prepared for submission:', debtData);

        try {
            const response = await fetch('/api/debts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(debtData)
            });

            const result = await response.json();
            if (response.ok) {
                displayDebtMessage('debt recorded successfully!', 'success');
                logger.log('debt.js: debt recorded successfully:', result);
                logger.apiCall('POST', '/api/debts', true);

           $debtForm[0].reset();
          // Close modal after a short delay to allow user to see success message
          setTimeout(async () => {
             $debtModal.css('display', 'none');
             //await fetchAndRenderDebts();
          }, 1000); 

            }
            else { // Status code is 4xx or 5xx (e.g., 400, 404, 500)
          const errorMessage = result.message || 'An unknown error occurred during debt recording.';
          displayDebtMessage(`Error: ${errorMessage}`, 'error');
          logger.error('debt.js: debt recording failed:', response.status, result);
          logger.apiCall('POST', '/api/debts', false);
      }
      fetchAndRenderDebts();
        }
        

         catch(err) {
            displayDebtMessage('Network error or unexpected response. Please try again.', 'error');
      logger.error('debt.js: Error recording the new debt:', err);
        }
    
    });

        //  Open 'Repayment' modal ---
    $('#debt-data').on('click', '.repay-debt-btn', function() {
        logger.log('debt.js: repay debt button clicked!');
        const $row = $(this).closest('tr');

        // Extract data from the row's data attributes
        const debtId = $row.data('debt-id');
        const customerName = $row.data('customer');
        const originalAmount = $row.data('original-amount');
        const outstandingAmount = $row.data('outstanding-amount');

        // Populate the repayment modal fields
        $repaymentDebtId.val(debtId); // Store the ID in a hidden field
        $repaymentCustomerName.text(customerName);
        $repaymentOriginalAmount.text(`Ksh ${parseFloat(originalAmount).toFixed(2)}`);
        $repaymentOutstandingAmount.text(`Ksh ${parseFloat(outstandingAmount).toFixed(2)}`);
        $repaymentInputAmount.val(''); // Clear previous input
        
        // Clear any previous messages
        $repaymentMessageContainer.removeClass('success error').text('').css({ 'opacity': 0, 'transform': 'translateY(-10px)' });

        // Show the repayment modal
        $repaymentModal.css('display', 'flex');
    });

        //  Close 'Repayment' modal on cancel ---
    $('#repayment-form-cancel').on('click', function() {
        logger.log('debt.js: Repayment modal cancelled');
        $repaymentForm[0].reset();
        $repaymentModal.css('display', 'none');
        $repaymentMessageContainer.removeClass('success error').text('').css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
    });

        $repaymentForm.on('submit', async function(e) {
        e.preventDefault();

        $repaymentMessageContainer.removeClass('success error').text('').css({ 'opacity': 0, 'transform': 'translateY(-10px)' });

        const debtId = $repaymentDebtId.val();
        const repaymentAmount = parseFloat($repaymentInputAmount.val());
        const paymentDate = new Date().toISOString().split('T')[0]; // Current date as payment date

        const currentOutstanding = parseFloat($repaymentOutstandingAmount.text().replace('$', '')); // Get current outstanding from display

        // Client-side validation for Repayment form
        if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
            displayRepaymentMessage('Please enter a positive repayment amount.', 'error');
            return;
        }
        if (repaymentAmount > currentOutstanding) {
            displayRepaymentMessage(`Repayment amount ($${repaymentAmount.toFixed(2)}) cannot exceed outstanding balance ($${currentOutstanding.toFixed(2)}).`, 'error');
            return;
        }
        
        logger.log(`debt.js: Submitting repayment for debt ID ${debtId}: Amount $${repaymentAmount}, Date ${paymentDate}`);

        try {
            const response = await fetch(`/api/debts/${debtId}/repayment`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repaymentAmount, paymentDate })
            });

            const result = await response.json();

            if (response.ok) {
                displayRepaymentMessage('Repayment recorded successfully! ', 'success');
                logger.log('debt.js: repayment recorded successfully:', result);
                logger.apiCall('PATCH', `/api/debts/${debtId}/repayment`, true);

                // Close modal and refresh table after a short delay
                setTimeout(async () => {
                    $repaymentModal.css('display', 'none');
                    await fetchAndRenderDebts(); // Refresh the main debt table
                }, 1000);

            } else {
                const errorMessage = result.message || 'An unknown error occurred during repayment.';
                displayRepaymentMessage(`Error: ${errorMessage}`, 'error');
                logger.error('debt.js: repayment failed:', response.status, result);
                logger.apiCall('PATCH', `/api/debts/${debtId}/repayment`, false);
            }
        } catch (err) {
            displayRepaymentMessage('Network error or unexpected response. Please try again.', 'error');
            logger.error('debt.js: Error recording repayment:', err);
        }
    });

       //  Open 'Payment History' modal 
    $('#debt-data').on('click', '.view-history-btn', function() {
        logger.log('debt.js: view history button clicked!');
        const $row = $(this).closest('tr');
        const debtId = $row.data('debt-id');
        const customerName = $row.data('customer');

        // Fetch and display history for the selected debt
        fetchAndDisplayPaymentHistory(debtId, customerName);
        
        // Clear any previous messages
        $historyMessageContainer.removeClass('success error').text('').css({ 'opacity': 0, 'transform': 'translateY(-10px)' });

        // Show the history modal
        $historyModal.css('display', 'flex');
    });

    // Close 'Payment History' modal on cancel 
    $('#payment-history-form-cancel').on('click', function() {
        logger.log('debt.js: Payment history modal cancelled');
        $historyModal.css('display', 'none');
        $historyTableBody.empty(); // Clear table content when closing
        $historyMessageContainer.removeClass('success error').text('').css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
    });

    // Show modal when "Clear" button is clicked
    $('#debt-data').on('click','.clear-debt-btn', function() {
      logger.log('button clicked')
        const $row = $(this).closest('tr');
        const debtId = $row.data('debt-id');
        logger.log(`${debtId}`)
        $clearDebtId.val(debtId);
        $clearDebtModal.css('display', 'flex');
    });

    // Hide modal on cancel
    $clearDebtCancel.on('click', function() {
        $clearDebtModal.css('display', 'none');
        $clearDebtId.val('');
    });

    // Handle confirm clear
    $clearDebtConfirm.on('click', async function() {
        const debtId = $clearDebtId.val();
        if (!debtId) return;

        try {
            const response = await fetch(`/api/debts/${debtId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                displayDebtMessage('Debt successfully cleared! ', 'success');
                logger.apiCall('DELETE', `/api/debts/${debtId}`, true);
                await fetchAndRenderDebts();
            } else {
                const errorData = await response.json();
                displayDebtMessage(`Error clearing debt: ${errorData.message || 'Unknown error'}`, 'error');
                logger.apiCall('DELETE', `/api/debts/${debtId}`, false);
            }
        } catch (err) {
            displayDebtMessage('Network error or unexpected response. Please try again.', 'error');
        } finally {
            $clearDebtModal.css('display', 'none');
            $clearDebtId.val('');
        }
    });
;// 1. Load the audio file into memory
  const clickSound = new Audio('path/to/your/click-sound.mp3');
  
  // 2. Set the volume (tactile sounds should be subtle, around 20-50%)
  clickSound.volume = 0.3; 

  // 3. Grab all the buttons you want to make tactile
  const tactileButtons = document.querySelectorAll('.tactile-btn');

  // 4. Attach the sound to the click event
  tactileButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Reset the audio to the beginning in case of rapid, repeated clicks
      clickSound.currentTime = 0; 
      clickSound.play().catch(error => {
          // Browsers sometimes block audio if the user hasn't interacted with the page yet.
          // This catch block prevents errors from showing in your console.
          console.log("Audio play prevented by browser policy.");
      });
    });
  });
})