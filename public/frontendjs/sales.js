import { salesData,loadSalesTable,resetFilters,fetchAndLoadSalesData } from "./history.js";
import { fetchAndRenderDebts } from "./debt.js";

window.openTab = function(tabId, event) {
    logger.log(`sales.js: openTab called for tabId: ${tabId}`);
    if (event) {
        event.preventDefault(); 
    }

    // Hide all tab content sections
    document.querySelectorAll('.tab-contents').forEach(tab => {
        tab.classList.remove('active-tab');
        logger.log(`sales.js: Hiding tab: ${tab.id}`);
    });

    // Show the selected tab content section
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active-tab');
        logger.log(`sales.js: Showing tab: ${tabId}`);

        // NEW: Trigger data load for the specific tab
        if (tabId === 'history' && typeof loadSalesTable === 'function' && typeof fetchAndLoadSalesData === 'function') {
            logger.log('sales.js: Activating history tab, loading sales data.');
            loadSalesTable(salesData); // Make sure salesData is populated before calling this, or fetch first
            fetchAndLoadSalesData();
        } else if (tabId === 'debt' && typeof fetchAndRenderDebts === 'function') {
            logger.log('sales.js: Activating debt tab, fetching debt data.');
            fetchAndRenderDebts(); // Make sure debts is populated before calling this, or fetch first
        } else if (tabId === 'summary' && typeof fetchSalesSummary === 'function') { // Added summary activation
            logger.log('sales.js: Activating summary tab, fetching summary data.');
            fetchSalesSummary();
        }

    } else {
        logger.warn(`sales.js: Tab content with ID "${tabId}" not found.`);
    }

    // Optionally update the URL hash without reloading
    window.location.hash = tabId;

    // IMPORTANT: If the sales navigation is open on mobile, close it after a tab is clicked
    const salesNav = document.querySelector('.sales-nav');
    const salesMenuToggle = document.querySelector('.sales-menu-toggle');
    const salesMenuIcon = salesMenuToggle ? salesMenuToggle.querySelector('i') : null;

    if (salesNav && salesNav.classList.contains('open')) {
        salesNav.classList.remove('open');
        document.body.classList.remove('sales-nav-active'); // Remove body class if used
        if (salesMenuIcon) {
            salesMenuIcon.classList.remove('fa-times');
            salesMenuIcon.classList.add('fa-bars');
        }
    }
};

$(document).ready(function() {

    logger.log('sales.js: DOM ready. Checking if on /sales page for initial tab setup.');
    if (window.location.pathname === '/sales') {
        logger.log('sales.js: On /sales page. Initializing sales tabs.');
        const initialTab = window.location.hash.substring(1) || 'history'; // Get from URL hash or default to 'history'
        window.openTab(initialTab); // Call the global openTab function
    } else {
        logger.log('sales.js: Not on /sales page. Skipping initial tab setup.');
    }

    // --- NEW: Attach event listeners to sales tab navigation links ---
    const salesNavLinks = document.querySelectorAll('.sales-nav ul li a');
    salesNavLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            const tabId = this.getAttribute('href').substring(1); // Get tabId from href (e.g., #history -> history)
            window.openTab(tabId, event); // Call the global function with event
        });
    });
    logger.log('sales.js: Attached click listeners to sales navigation links.');

    const salesMenuToggle = document.querySelector('.sales-menu-toggle');
    const salesNav = document.querySelector('.sales-nav');

    // get a reference to the icon inside the toggle button for visual feedback
    const salesMenuIcon = salesMenuToggle ? salesMenuToggle.querySelector('i') : null;

    if (salesMenuToggle && salesNav) {
        logger.log('sales.js: Sales menu toggle and navigation found. Adding click listener.');

        salesMenuToggle.addEventListener('click', () => {
            // Toggle the 'open' class on the sales navigation.
            // This 'open' class will be used by CSS to show/hide the navigation.
            salesNav.classList.toggle('open');
            
            // Optionally, add a class to the body to manage overall page state
            // (e.g., to prevent background scrolling when menu is open)
            document.body.classList.toggle('sales-nav-active');

            // Logic to toggle the Font Awesome icon between 'bars' and 'times'
            if (salesMenuIcon) {
                if (salesNav.classList.contains('open')) {
                    // If the navigation is now open, change icon to 'times' (X)
                    salesMenuIcon.classList.remove('fa-bars'); // Remove hamburger icon
                    salesMenuIcon.classList.add('fa-times');   // Add close icon
                } else {
                    // If the navigation is now closed, change icon back to 'bars' (hamburger)
                    salesMenuIcon.classList.remove('fa-times'); // Remove close icon
                    salesMenuIcon.classList.add('fa-bars');    // Add hamburger icon
                }
            }
        });
    } else {
        // Log a warning if elements are not found, which can help in debugging
        logger.warn('sales.js: Could not find .sales-menu-toggle or .sales-nav elements. Toggle functionality will not be active.');
    }
    
    // filter sales table
    $('#filter').on('click', ()=>{
        applyFilters();
    })

    // cancel filter field
    $('#cancelfilters').on('click',()=>{
        resetFilters();
    })
});