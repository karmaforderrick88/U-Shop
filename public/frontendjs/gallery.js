document.addEventListener('DOMContentLoaded', async () => {
    const businessId = document.body.dataset.businessId;
    
    //  Back Button Logic ---
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // Check if there is actual history in this specific tab
            if (window.history.length > 1) {
                window.history.back();
            } else {
                // If no history, try to close the tab (works if opened via script)
                window.close();
                
                // Fallback: If browser blocks window.close(), route them to the root dashboard
                setTimeout(() => {
                    window.location.href = '/'; 
                }, 300);
            }
        });
    }
    
    if (!businessId) {
        console.error("Critical Error: Business ID not found in HTML dataset.");
        return;
    }

    const grid = document.getElementById('product-grid');
    const loader = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const controlsContainer = document.getElementById('gallery-controls');
    const searchInput = document.getElementById('search-input');
    const priceFilter = document.getElementById('price-filter');

    // Master list of all products
    let allProducts = [];

    // --- 1. The Rendering Function ---
    function renderProducts(products) {
        grid.innerHTML = ''; // Clear existing

        if (products.length === 0) {
            grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">No items match your search.</div>';
            return;
        }

        products.forEach(product => {
            // Determine what to show for the image
            const imageContent = product.imageUrl 
                ? `<img src="${product.imageUrl}" alt="${product.name}" class="gallery-img" style="width: 100%; height: 200px; object-fit: cover; display: block; border-bottom: 1px solid #eaeaea;">`
                : `<div class="gallery-img placeholder" style="width: 100%; height: 200px; background: #f0f2f5; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #eaeaea;">
                     <span style="color: #999; font-size: 0.9rem;">No Image Available</span>
                   </div>`;

            // Inject it into your card HTML
            const cardHtml = `
                <div class="product-card">
                    <div class="card-image-container">
                        ${imageContent}
                    </div>
                    <div class="card-details">
                        <h3>${product.name}</h3>
                        <p class="price">Ksh ${product.price.toFixed(2)}</p>
                        <p class="stock ${product.quantity > 0 ? 'in-stock' : 'out-of-stock'}">
                            ${product.quantity > 0 ? `${product.quantity} in stock` : 'Out of Stock'}
                        </p>
                    </div>
                </div>
            `;
            
            grid.insertAdjacentHTML('beforeend', cardHtml);
        });
    }

    // --- 2. The Filter Middleman ---
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const priceCategory = priceFilter.value;

        const filteredProducts = allProducts.filter(product => {
            // Check text match
            const matchesSearch = product.name.toLowerCase().includes(searchTerm);
            
            // Check price match
            let matchesPrice = true;
            if (priceCategory === 'under500') matchesPrice = product.price < 500;
            else if (priceCategory === '500to2000') matchesPrice = product.price >= 500 && product.price <= 2000;
            else if (priceCategory === 'over2000') matchesPrice = product.price > 2000;

            return matchesSearch && matchesPrice;
        });

        // Pass the properly filtered array to the renderer
        renderProducts(filteredProducts);
    }

    // --- 3. The Initial Fetch Logic ---
    try {
        const response = await fetch(`/api/public/stocks/${businessId}`);
        
        if (!response.ok) throw new Error('Network response was not ok');

        allProducts = await response.json();
        
        // Hide loader, show grid AND controls
        loader.style.display = 'none';
        controlsContainer.style.display = 'flex';
        grid.style.display = 'grid';

        if (allProducts.length === 0) {
            controlsContainer.style.display = 'none'; 
            grid.innerHTML = '<div class="empty-state" style="text-align: center;">No items are currently available. Please check back later!</div>';
            grid.style.display = 'block';
            return;
        }

        // Run the initial render using our middleman
        applyFilters();

        // Wire up the event listeners to the middleman, not the renderer
        searchInput.addEventListener('input', applyFilters);
        priceFilter.addEventListener('change', applyFilters);

    } catch (error) {
        console.error('Error fetching gallery:', error);
        loader.style.display = 'none';
        errorState.style.display = 'block';
    }
});