const Search_Input = document.getElementById("searchInput");
const Results_Grid = document.getElementById("searchResultsGrid");
const Search_Stats = document.getElementById("searchStats");

let All_Products = [];

async function Init() {
    await FetchProducts();
    Search_Input.addEventListener("input", (e) => HandleSearch(e.target.value));
}

async function FetchProducts() {
    try {
        const response = await fetch('/api/products');
        All_Products = await response.json();
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

function HandleSearch(query) {
    if (!query.trim()) {
        Results_Grid.innerHTML = "";
        Search_Stats.textContent = "Type to start searching";
        return;
    }

    const filtered = All_Products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.desc.toLowerCase().includes(query.toLowerCase())
    );

    RenderResults(filtered);
    Search_Stats.textContent = `Found ${filtered.length} results for "${query}"`;
}

function RenderResults(products) {
    if (products.length === 0) {
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
