if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log(err));
}

let stock = JSON.parse(localStorage.getItem('vapeStock')) || [];

// SVG Icons
const ICON_TRASH = `<svg class="icon-btn danger" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const ICON_EDIT = `<svg class="icon-btn" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

const stockContainer = document.getElementById('stock-container');
const searchInput = document.getElementById('search-input');
const copyBtn = document.getElementById('copy-btn');
const copyModal = document.getElementById('copy-modal');
const closeCopyModalBtn = document.getElementById('close-copy-modal-btn');
const copyWithPriceBtn = document.getElementById('copy-with-price-btn');
const copyWithoutPriceBtn = document.getElementById('copy-without-price-btn');

const fabBtn = document.getElementById('fab-btn');
const addModal = document.getElementById('add-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveBtn = document.getElementById('save-btn');
const modelInput = document.getElementById('model-input');
const priceInput = document.getElementById('price-input');
const flavorInput = document.getElementById('flavor-input');
const qtyInput = document.getElementById('qty-input');
const toastContainer = document.getElementById('toast-container');

const dashQty = document.getElementById('dash-qty');
const dashVal = document.getElementById('dash-val');

function saveStock() {
  localStorage.setItem('vapeStock', JSON.stringify(stock));
  render();
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

fabBtn.addEventListener('click', () => { addModal.classList.remove('hidden'); });
closeModalBtn.addEventListener('click', () => { addModal.classList.add('hidden'); });

copyBtn.addEventListener('click', () => { copyModal.classList.remove('hidden'); });
closeCopyModalBtn.addEventListener('click', () => { copyModal.classList.add('hidden'); });

saveBtn.addEventListener('click', () => {
  const model = modelInput.value.trim().toUpperCase();
  const price = parseFloat(priceInput.value) || 0;
  const flavorsRaw = flavorInput.value.trim();
  const baseQty = parseInt(qtyInput.value) || 1;

  if (!model || !flavorsRaw) return alert('Completá modelo y sabores');

  const flavors = flavorsRaw.split(/[\n,]+/)
    .map(f => f.trim())
    .filter(f => f.length > 0 && !f.toLowerCase().includes('sabores dispo'));
  
  let addedCount = 0;

  flavors.forEach(flavorStr => {
    let parsedQty = baseQty;
    let cleanFlavor = flavorStr;

    const qtyMatch = flavorStr.match(/(?:[-=:]|\s)\s*(\d+)\s*[uU]?\.?\s*$/);
    if (qtyMatch) {
       parsedQty = parseInt(qtyMatch[1]);
       cleanFlavor = flavorStr.replace(qtyMatch[0], '').trim();
    }
    cleanFlavor = cleanFlavor.replace(/^[-•*]\s*/, '').trim();

    if (cleanFlavor) {
      const existing = stock.find(i => i.model === model && i.flavor.toLowerCase() === cleanFlavor.toLowerCase());
      if (existing) {
        existing.qty += parsedQty;
        if (price > 0) existing.price = price;
      } else {
        stock.push({ id: Date.now() + Math.random(), model, flavor: cleanFlavor, qty: parsedQty, price: price });
      }
      addedCount++;
    }
  });

  saveStock();
  showToast(`✅ ${addedCount} sabor(es) guardado(s)`);
  
  flavorInput.value = ''; 
  qtyInput.value = '1';
  flavorInput.focus();
});

window.updateQty = function(id, change) {
  const item = stock.find(i => i.id === id);
  if (item) {
    if (item.qty === 0 && change < 0) return; 
    item.qty += change;
    saveStock();
  }
};

window.deleteFlavor = function(id) {
  if (confirm('¿Seguro que querés eliminar este sabor del catálogo?')) {
    stock = stock.filter(i => i.id !== id);
    saveStock();
    showToast('🗑️ Sabor eliminado');
  }
};

window.deleteModel = function(event, modelName) {
  event.stopPropagation(); 
  if (confirm(`¿Seguro que querés eliminar el modelo "${modelName}" y todos sus sabores?`)) {
    stock = stock.filter(i => i.model !== modelName);
    saveStock();
    showToast('🗑️ Modelo eliminado');
  }
};

window.editModel = function(event, oldModelName) {
  event.stopPropagation();
  const currentPrice = stock.find(i => i.model === oldModelName)?.price || 0;
  
  const newModelName = prompt('✏️ Editar nombre del modelo:', oldModelName);
  if (newModelName === null) return;
  
  const newPriceStr = prompt('💵 Editar precio de venta ($):', currentPrice);
  const newPrice = parseFloat(newPriceStr) || 0;

  const cleanName = newModelName.trim().toUpperCase() || oldModelName;
  
  stock.forEach(item => {
    if (item.model === oldModelName) {
      item.model = cleanName;
      item.price = newPrice;
    }
  });
  
  saveStock();
  showToast('✅ Modelo actualizado');
};

window.toggleModel = function(element) {
  const flavorsContainer = element.nextElementSibling;
  const arrow = element.querySelector('.arrow');
  flavorsContainer.classList.toggle('hidden');
  arrow.classList.toggle('collapsed');
};

function executeCopy(includePrice) {
  const available = stock.filter(i => i.qty > 0);
  if (available.length === 0) {
    copyModal.classList.add('hidden');
    return showToast('❌ No hay stock para copiar');
  }

  let text = "🔥 *STOCK DISPONIBLE* 🔥\n\n";
  const grouped = {};

  available.forEach(i => {
    if (!grouped[i.model]) grouped[i.model] = { price: i.price || 0, items: [] };
    grouped[i.model].items.push(`  • ${i.flavor}: ${i.qty} u.`);
  });

  for (const model in grouped) {
    const priceTxt = includePrice && grouped[model].price > 0 ? ` - $${grouped[model].price.toLocaleString('es-AR')}` : '';
    text += `📌 *${model}*${priceTxt}\n`;
    grouped[model].items.forEach(f => text += `${f}\n`);
    text += "\n";
  }

  navigator.clipboard.writeText(text).then(() => {
    copyModal.classList.add('hidden');
    showToast('✅ Lista copiada al portapapeles');
  }).catch(() => alert("Error al copiar"));
}

copyWithPriceBtn.addEventListener('click', () => executeCopy(true));
copyWithoutPriceBtn.addEventListener('click', () => executeCopy(false));

function render() {
  const query = searchInput.value.toLowerCase();
  const isSearching = query.length > 0;

  // Actualizar Métricas Top Bar
  const totalQty = stock.reduce((acc, curr) => acc + curr.qty, 0);
  const totalVal = stock.reduce((acc, curr) => acc + (curr.qty * (curr.price || 0)), 0);

  dashQty.textContent = `${totalQty} u.`;
  dashVal.textContent = `$ ${totalVal.toLocaleString('es-AR')}`;

  const openModels = new Set();
  document.querySelectorAll('.model-card').forEach(card => {
    const titleSpan = card.querySelector('.model-title-text');
    if (titleSpan) {
        const title = titleSpan.textContent;
        const flavors = card.querySelector('.model-flavors');
        if (!flavors.classList.contains('hidden')) {
          openModels.add(title);
        }
    }
  });

  stockContainer.innerHTML = '';

  const filtered = stock.filter(i => 
    i.model.toLowerCase().includes(query) || 
    i.flavor.toLowerCase().includes(query)
  );
  
  const grouped = {};
  filtered.forEach(item => {
    if (!grouped[item.model]) grouped[item.model] = { price: item.price || 0, items: [] };
    grouped[item.model].items.push(item);
  });

  for (const model in grouped) {
    const card = document.createElement('div');
    card.className = 'model-card';

    const shouldBeOpen = isSearching || openModels.has(model);
    const collapsedClass = shouldBeOpen ? '' : 'hidden';
    const arrowClass = shouldBeOpen ? '' : 'collapsed';
    const safeModelName = model.replace(/'/g, "\\'"); 
    const priceDisplay = grouped[model].price > 0 ? `<span class="price-badge">$ ${grouped[model].price.toLocaleString('es-AR')}</span>` : '';

    card.innerHTML = `
      <div class="model-title" onclick="toggleModel(this)">
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="icon-btn danger" onclick="deleteModel(event, '${safeModelName}')">${ICON_TRASH}</button>
          <button class="icon-btn" onclick="editModel(event, '${safeModelName}')">${ICON_EDIT}</button>
          <span class="model-title-text">${model}</span>
          ${priceDisplay}
        </div>
        <span class="arrow ${arrowClass}">▼</span>
      </div>
      <div class="model-flavors ${collapsedClass}"></div>
    `;

    const flavorsContainer = card.querySelector('.model-flavors');

    grouped[model].items.forEach(item => {
      const row = document.createElement('div');
      let statusClass = item.qty === 0 ? 'out-of-stock' : '';
      row.className = `flavor-row ${statusClass}`;
      
      row.innerHTML = `
        <div class="flavor-info">
          <button class="icon-btn danger" onclick="deleteFlavor(${item.id})">${ICON_TRASH}</button>
          <span class="flavor-name">${item.flavor}</span>
        </div>
        <div class="controls">
          <button class="btn-qty btn-minus" onclick="updateQty(${item.id}, -1)">-</button>
          <span class="qty-number">${item.qty}</span>
          <button class="btn-qty btn-plus" onclick="updateQty(${item.id}, 1)">+</button>
        </div>
      `;
      flavorsContainer.appendChild(row);
    });

    stockContainer.appendChild(card);
  }
}

searchInput.addEventListener('input', render);
render();
