if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log(err));
}

let stock = JSON.parse(localStorage.getItem('vapeStock')) || [];
let currentFilter = 'all'; // 'all', 'low', 'out'

const iconTrash = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF453A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>`;
const iconEdit = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const iconChevron = `<svg class="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
const iconDeleteFlavor = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF453A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>`;

const stockContainer = document.getElementById('stock-container');
const searchInput = document.getElementById('search-input');
const toastContainer = document.getElementById('toast-container');

// Modales
const addModal = document.getElementById('add-modal');
const copyModal = document.getElementById('copy-modal');
const editModal = document.getElementById('edit-modal');
const settingsModal = document.getElementById('settings-modal');

const modelInput = document.getElementById('model-input');
const priceInput = document.getElementById('price-input');
const flavorInput = document.getElementById('flavor-input');
const qtyInput = document.getElementById('qty-input');

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

// ---------------- FILTROS (CHIPS) ----------------
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    render();
  });
});

// ---------------- BACKUP (EXPORTAR E IMPORTAR) ----------------
document.getElementById('btn-settings').addEventListener('click', () => settingsModal.classList.remove('hidden'));
document.getElementById('close-settings-btn').addEventListener('click', () => settingsModal.classList.add('hidden'));

document.getElementById('export-btn').addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stock));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "StockVape_Backup.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  showToast('💾 Backup descargado con éxito');
  settingsModal.classList.add('hidden');
});

document.getElementById('import-file').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedStock = JSON.parse(e.target.result);
      if (Array.isArray(importedStock)) {
        stock = importedStock;
        saveStock();
        showToast('📂 Backup restaurado con éxito');
        settingsModal.classList.add('hidden');
      } else {
        alert("El archivo no es válido");
      }
    } catch (error) {
      alert("Error al leer el archivo. Asegurate que sea el backup correcto.");
    }
  };
  reader.readAsText(file);
});


// ---------------- LÓGICA DE MODALES RESTANTES ----------------
document.getElementById('fab-btn').addEventListener('click', () => addModal.classList.remove('hidden'));
document.getElementById('close-modal-btn').addEventListener('click', () => addModal.classList.add('hidden'));

document.getElementById('btn-open-copy').addEventListener('click', () => {
  if (stock.filter(i => i.qty > 0).length === 0) return showToast('❌ No hay stock');
  copyModal.classList.remove('hidden');
});
document.getElementById('close-copy-btn').addEventListener('click', () => copyModal.classList.add('hidden'));
document.getElementById('close-edit-btn').addEventListener('click', () => editModal.classList.add('hidden'));

document.getElementById('save-btn').addEventListener('click', () => {
  const model = modelInput.value.trim().toUpperCase();
  const price = parseInt(priceInput.value) || 0;
  const flavorsRaw = flavorInput.value.trim();
  const baseQty = parseInt(qtyInput.value) || 1;

  if (!model || !flavorsRaw) return alert('Completá modelo y sabores');

  const flavors = flavorsRaw.split(/[\n,]+/).map(f => f.trim()).filter(f => f.length > 0 && !f.toLowerCase().includes('sabores dispo'));
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
        if(price > 0) existing.price = price;
      } else {
        stock.push({ id: Date.now() + Math.random(), model, price, flavor: cleanFlavor, qty: parsedQty });
      }
      addedCount++;
    }
  });

  saveStock();
  showToast(`✅ ${addedCount} guardados`);
  flavorInput.value = ''; 
  qtyInput.value = '1';
  flavorInput.focus();
});

window.openEditModal = function(event, oldName) {
  event.stopPropagation();
  const currentItems = stock.filter(i => i.model === oldName);
  const currentPrice = currentItems.length > 0 ? (currentItems[0].price || 0) : 0;
  
  document.getElementById('edit-old-name').value = oldName;
  document.getElementById('edit-model-name').value = oldName;
  document.getElementById('edit-model-price').value = currentPrice;
  editModal.classList.remove('hidden');
};

document.getElementById('save-edit-btn').addEventListener('click', () => {
  const oldName = document.getElementById('edit-old-name').value;
  const newName = document.getElementById('edit-model-name').value.trim().toUpperCase();
  const newPrice = parseInt(document.getElementById('edit-model-price').value) || 0;

  if(newName) {
    stock.forEach(item => {
      if (item.model === oldName) {
        item.model = newName;
        item.price = newPrice;
      }
    });
    saveStock();
    showToast('✅ Modelo actualizado');
    editModal.classList.add('hidden');
  }
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
  if (confirm('¿Seguro que querés eliminar este sabor?')) {
    stock = stock.filter(i => i.id !== id);
    saveStock();
    showToast('🗑️ Sabor eliminado');
  }
};

window.deleteModel = function(event, modelName) {
  event.stopPropagation(); 
  if (confirm(`¿Seguro que querés eliminar el modelo "${modelName}" entero?`)) {
    stock = stock.filter(i => i.model !== modelName);
    saveStock();
    showToast('🗑️ Modelo eliminado');
  }
};

window.toggleModel = function(element) {
  const flavorsContainer = element.nextElementSibling;
  const arrow = element.querySelector('.arrow');
  flavorsContainer.classList.toggle('hidden');
  arrow.classList.toggle('collapsed');
};

function executeCopy(withPrice) {
  const available = stock.filter(i => i.qty > 0);
  let text = "🔥 *STOCK DISPONIBLE* 🔥\n\n";
  const grouped = {};

  available.forEach(i => {
    if (!grouped[i.model]) grouped[i.model] = [];
    grouped[i.model].push(i);
  });

  for (const model in grouped) {
    const modelPrice = Math.max(...grouped[model].map(i => i.price || 0));
    const priceStr = (withPrice && modelPrice > 0) ? ` ($${modelPrice.toLocaleString('es-AR')})` : '';
    
    text += `📌 *${model}*${priceStr}\n`;
    grouped[model].forEach(f => text += `  • ${f.flavor}: ${f.qty} u.\n`);
    text += "\n";
  }

  navigator.clipboard.writeText(text).then(() => {
    showToast('✅ Copiado al portapapeles');
    copyModal.classList.add('hidden');
  }).catch(() => alert("Error al copiar"));
}

document.getElementById('copy-simple-btn').addEventListener('click', () => executeCopy(false));
document.getElementById('copy-price-btn').addEventListener('click', () => executeCopy(true));

// ---------------- RENDER PRINCIPAL ----------------
function render() {
  const query = searchInput.value.toLowerCase();
  
  // El acordeón se abre si buscás ALGO o si hay un filtro aplicado
  const isSearchingOrFiltering = query.length > 0 || currentFilter !== 'all';

  let totalQty = 0;
  let totalMoney = 0;
  stock.forEach(i => {
    if (i.qty > 0) {
      totalQty += i.qty;
      totalMoney += (i.qty * (i.price || 0));
    }
  });
  document.getElementById('total-qty').textContent = totalQty + ' u.';
  document.getElementById('total-money').textContent = '$' + totalMoney.toLocaleString('es-AR');

  const openModels = new Set();
  document.querySelectorAll('.model-card').forEach(card => {
    const titleSpan = card.querySelector('.model-title-text');
    if (titleSpan) {
        const title = titleSpan.textContent;
        const flavors = card.querySelector('.model-flavors');
        if (!flavors.classList.contains('hidden')) openModels.add(title);
    }
  });

  stockContainer.innerHTML = '';

  // 1. Filtrado por Búsqueda y por CHIPS
  const filtered = stock.filter(i => {
    const matchesSearch = i.model.toLowerCase().includes(query) || i.flavor.toLowerCase().includes(query);
    let matchesChip = true;
    
    if (currentFilter === 'low') {
      matchesChip = i.qty > 0 && i.qty <= 2;
    } else if (currentFilter === 'out') {
      matchesChip = i.qty === 0;
    }

    return matchesSearch && matchesChip;
  });

  const grouped = {};
  filtered.forEach(item => {
    if (!grouped[item.model]) grouped[item.model] = [];
    grouped[item.model].push(item);
  });

  for (const model in grouped) {
    const card = document.createElement('div');
    card.className = 'model-card';

    const shouldBeOpen = isSearchingOrFiltering || openModels.has(model);
    const collapsedClass = shouldBeOpen ? '' : 'hidden';
    const arrowClass = shouldBeOpen ? '' : 'collapsed';
    const safeModelName = model.replace(/'/g, "\\'"); 
    const modelPrice = Math.max(...grouped[model].map(i => i.price || 0));

    card.innerHTML = `
      <div class="model-title" onclick="toggleModel(this)">
        <div class="model-title-left">
          <span class="model-title-text">${model}</span>
          ${modelPrice > 0 ? `<span class="model-price-badge">$ ${modelPrice.toLocaleString('es-AR')}</span>` : ''}
        </div>
        <div class="model-title-right">
          <button class="icon-btn" onclick="openEditModal(event, '${safeModelName}')">${iconEdit}</button>
          <button class="icon-btn danger" onclick="deleteModel(event, '${safeModelName}')">${iconTrash}</button>
          ${iconChevron}
        </div>
      </div>
      <div class="model-flavors ${collapsedClass}"></div>
    `;

    const flavorsContainer = card.querySelector('.model-flavors');

    grouped[model].forEach(item => {
      const row = document.createElement('div');
      row.className = `flavor-row ${item.qty === 0 ? 'out-of-stock' : ''}`;
      
      let badgeHtml = '';
      if (item.qty === 0) badgeHtml = '<span class="badge badge-danger">Agotado</span>';
      else if (item.qty <= 2) badgeHtml = '<span class="badge badge-warning">Quedan ' + item.qty + '</span>';

      row.innerHTML = `
        <div class="flavor-header">
          <button class="icon-btn-small" onclick="deleteFlavor(${item.id})">${iconDeleteFlavor}</button>
          <div class="flavor-info">
            <span class="flavor-name">${item.flavor}</span>
            ${badgeHtml}
          </div>
        </div>
        <div class="controls">
          <button class="btn-qty" onclick="updateQty(${item.id}, -1)">-</button>
          <span class="qty-number">${item.qty}</span>
          <button class="btn-qty" onclick="updateQty(${item.id}, 1)">+</button>
        </div>
      `;
      flavorsContainer.appendChild(row);
    });

    stockContainer.appendChild(card);
  }
}

searchInput.addEventListener('input', render);
render();
