const Search_Input = document.getElementById("searchInput");
const Results_Grid = document.getElementById("searchResultsGrid");
const Search_Stats = document.getElementById("searchStats");

let searchTimeout;

async function Init() {
    Search_Input.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => HandleSearch(e.target.value), 300);
    });
}

async function HandleSearch(query) {
    if (!query.trim()) {
        Results_Grid.innerHTML = "";
        Search_Stats.textContent = "Type to start searching";
        return;
    }

    try {
        Search_Stats.textContent = "Searching...";
        // Fetch up to 100 results for search
        const response = await fetch(`/api/products?q=${encodeURIComponent(query)}&per_page=100`);
        const data = await response.json();
        
        RenderResults(data.items);
        Search_Stats.textContent = `Found ${data.total} results for "${query}"`;
    } catch (error) {
        console.error("Error searching products:", error);
        Search_Stats.textContent = "Error fetching results";
    }
}

function RenderResults(products) {
    if (!products || products.length === 0) {
        Results_Grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-neutral-400);">No results found matching your search.</div>`;
        return;
    }

    Results_Grid.innerHTML = products.map(product => `
        <div class="product-card" onclick="window.location.href='/product/${product.id}'" style="cursor: pointer;">
            <div class="product-card__image-wrapper">
                <img src="${product.img1}" alt="${product.name}" class="product-card__image">
            </div>
            <div class="product-card__details">
                <p class="product-card__category">${product.category}</p>
                <h3 class="product-card__title">${product.name}</h3>
                <p class="product-card__price">${product.price}</p>
            </div>
        </div>
    `).join("");
}

Init();
