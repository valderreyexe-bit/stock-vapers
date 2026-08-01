if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log(err));
}

let stock = JSON.parse(localStorage.getItem('vapeStock')) || [];
let salesHistory = JSON.parse(localStorage.getItem('vapeSales')) || [];
let currentFilter = 'all'; 

let isEyeOpen = localStorage.getItem('vapeEye') !== 'false';
let savedPasero = localStorage.getItem('vapePasero') || '15';
let savedUsdt = localStorage.getItem('vapeUsdt') || '1586';

const iconTrash = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF453A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>`;
const iconEdit = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const iconChevron = `<svg class="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
const iconDeleteFlavor = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF453A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>`;
const iconEyeOpen = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const iconEyeClosed = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

const stockContainer = document.getElementById('stock-container');
const searchInput = document.getElementById('search-input');
const toastContainer = document.getElementById('toast-container');
const addModal = document.getElementById('add-modal');
const copyModal = document.getElementById('copy-modal');
const editModal = document.getElementById('edit-modal');
const settingsModal = document.getElementById('settings-modal');
const historyModal = document.getElementById('history-modal');
const calculatorModal = document.getElementById('calculator-modal');

const modelInput = document.getElementById('model-input');
const costInput = document.getElementById('cost-input');
const priceInput = document.getElementById('price-input');
const flavorInput = document.getElementById('flavor-input');
const qtyInput = document.getElementById('qty-input');

document.getElementById('btn-toggle-eye').addEventListener('click', () => {
  isEyeOpen = !isEyeOpen;
  localStorage.setItem('vapeEye', isEyeOpen);
  render();
  renderHistory();
});

function saveStock() {
  localStorage.setItem('vapeStock', JSON.stringify(stock));
  render();
}

function saveHistory() {
  localStorage.setItem('vapeSales', JSON.stringify(salesHistory));
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// CALCULADORA
document.getElementById('btn-calculator').addEventListener('click', () => {
  document.getElementById('calc-pasero').value = savedPasero;
  document.getElementById('calc-usdt').value = savedUsdt;
  runCalculator();
  calculatorModal.classList.remove('hidden');
});
document.getElementById('close-calc-btn').addEventListener('click', () => calculatorModal.classList.add('hidden'));

['calc-usd', 'calc-pasero', 'calc-usdt', 'calc-qty'].forEach(id => {
  document.getElementById(id).addEventListener('input', runCalculator);
});

function runCalculator() {
  const usd = parseFloat(document.getElementById('calc-usd').value) || 0;
  const pasero = parseFloat(document.getElementById('calc-pasero').value) || 0;
  const usdt = parseFloat(document.getElementById('calc-usdt').value) || 0;
  const qty = parseInt(document.getElementById('calc-qty').value) || 1;

  localStorage.setItem('vapePasero', pasero);
  localStorage.setItem('vapeUsdt', usdt);
  savedPasero = pasero;
  savedUsdt = usdt;

  const unitCostUsdt = usd * (1 + (pasero / 100));
  const unitCostArs = unitCostUsdt * usdt;
  const totalInvesmentArs = unitCostArs * qty;

  document.getElementById('res-usd-unit').textContent = `${unitCostUsdt.toFixed(2)} USDT`;
  document.getElementById('res-ars-unit').textContent = `$${Math.round(unitCostArs).toLocaleString('es-AR')}`;
  document.getElementById('res-ars-total').textContent = `$${Math.round(totalInvesmentArs).toLocaleString('es-AR')}`;
}

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    render();
  });
});

document.getElementById('btn-settings').addEventListener('click', () => settingsModal.classList.remove('hidden'));
document.getElementById('close-settings-btn').addEventListener('click', () => settingsModal.classList.add('hidden'));

document.getElementById('export-btn').addEventListener('click', () => {
  const backupData = { stock: stock, history: salesHistory };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "StockVape_Backup_Total.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  showToast('💾 Backup completo descargado');
  settingsModal.classList.add('hidden');
});

document.getElementById('import-file').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        stock = data;
      } else if (data.stock) {
        stock = data.stock;
        salesHistory = data.history || [];
      }
      saveStock();
      saveHistory();
      showToast('📂 Backup restaurado');
      settingsModal.classList.add('hidden');
    } catch (error) {
      alert("Error al leer el archivo.");
    }
  };
  reader.readAsText(file);
});

// HISTORIAL DE VENTAS
let historyView = 'today';

document.getElementById('btn-history').addEventListener('click', () => {
  renderHistory();
  historyModal.classList.remove('hidden');
});
document.getElementById('close-history-btn').addEventListener('click', () => historyModal.classList.add('hidden'));

document.getElementById('btn-clear-history').addEventListener('click', () => {
  if (salesHistory.length === 0) return showToast('El historial ya está vacío');
  if (confirm('¿Seguro que querés borrar TODO el historial de ventas? (Tu stock actual quedará intacto)')) {
    salesHistory = [];
    saveHistory();
    renderHistory();
    showToast('🗑️ Historial borrado');
  }
});

document.getElementById('tab-today').addEventListener('click', () => {
  historyView = 'today';
  document.getElementById('tab-today').classList.add('active');
  document.getElementById('tab-all').classList.remove('active');
  renderHistory();
});
document.getElementById('tab-all').addEventListener('click', () => {
  historyView = 'all';
  document.getElementById('tab-all').classList.add('active');
  document.getElementById('tab-today').classList.remove('active');
  renderHistory();
});

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function renderHistory() {
  const historyListContainer = document.getElementById('history-list');
  const todayStr = getTodayString();
  
  let displaySales = historyView === 'today' 
    ? salesHistory.filter(s => s.dateStr === todayStr) 
    : salesHistory;
    
  displaySales = displaySales.sort((a, b) => b.timestamp - a.timestamp);

  let totalQty = 0;
  let totalMoney = 0;
  let totalCost = 0;

  historyListContainer.innerHTML = '';

  if (displaySales.length === 0) {
    historyListContainer.innerHTML = '<div class="empty-history">No hay ventas registradas.</div>';
  } else {
    displaySales.forEach(sale => {
      totalQty += 1;
      totalMoney += (sale.price || 0);
      totalCost += (sale.cost || 0);

      const dateObj = new Date(sale.timestamp);
      const timeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const dateDisplay = historyView === 'all' ? dateObj.toLocaleDateString() + ' ' + timeStr : timeStr;
      
      const priceText = isEyeOpen ? `$${(sale.price || 0).toLocaleString('es-AR')}` : '***';

      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-item-left">
          <span class="history-item-title">${sale.model}</span>
          <span class="history-item-subtitle">${sale.flavor} • ${dateDisplay}</span>
        </div>
        <div class="history-item-right">
          <span class="history-item-price private-text">${priceText}</span>
          <button class="btn-undo" onclick="undoSale(${sale.id})">Deshacer</button>
        </div>
      `;
      historyListContainer.appendChild(item);
    });
  }

  const profit = totalMoney - totalCost;

  document.getElementById('history-qty').textContent = totalQty;
  document.getElementById('history-money').textContent = isEyeOpen ? '$' + totalMoney.toLocaleString('es-AR') : '***';
  document.getElementById('history-profit').textContent = isEyeOpen ? '$' + profit.toLocaleString('es-AR') : '***';
}

window.undoSale = function(saleId) {
  const saleIndex = salesHistory.findIndex(s => s.id === saleId);
  if (saleIndex > -1) {
    const sale = salesHistory[saleIndex];
    const stockItem = stock.find(i => i.model === sale.model && i.flavor === sale.flavor);
    if (stockItem) {
      stockItem.qty += 1;
    } else {
      stock.push({ id: Date.now(), model: sale.model, flavor: sale.flavor, price: sale.price, cost: sale.cost, qty: 1 });
    }
    
    salesHistory.splice(saleIndex, 1);
    saveStock();
    saveHistory();
    renderHistory();
    showToast('↩️ Venta deshecha (+1 al stock)');
  }
};

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
  let cost = parseInt(costInput.value) || 0;
  let price = parseInt(priceInput.value) || 0;
  const flavorsRaw = flavorInput.value.trim();
  const baseQty = parseInt(qtyInput.value) || 1;

  if (!model || !flavorsRaw) return alert('Completá modelo y sabores');

  const existingModelItems = stock.filter(i => i.model === model);
  if (existingModelItems.length > 0) {
    if (cost === 0) cost = existingModelItems[0].cost || 0;
    if (price === 0) price = existingModelItems[0].price || 0;
  }

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
        if(cost > 0) existing.cost = cost;
      } else {
        stock.push({ id: Date.now() + Math.random(), model, cost, price, flavor: cleanFlavor, qty: parsedQty });
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
  const currentCost = currentItems.length > 0 ? (currentItems[0].cost || 0) : 0;
  const currentPrice = currentItems.length > 0 ? (currentItems[0].price || 0) : 0;
  
  document.getElementById('edit-old-name').value = oldName;
  document.getElementById('edit-model-name').value = oldName;
  document.getElementById('edit-model-cost').value = currentCost || '';
  document.getElementById('edit-model-price').value = currentPrice || '';
  editModal.classList.remove('hidden');
};

document.getElementById('save-edit-btn').addEventListener('click', () => {
  const oldName = document.getElementById('edit-old-name').value;
  const newName = document.getElementById('edit-model-name').value.trim().toUpperCase();
  const newCost = parseInt(document.getElementById('edit-model-cost').value) || 0;
  const newPrice = parseInt(document.getElementById('edit-model-price').value) || 0;

  if(newName) {
    stock.forEach(item => {
      if (item.model === oldName) {
        item.model = newName;
        item.cost = newCost;
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
    
    if (change === -1) {
      const now = new Date();
      salesHistory.push({
        id: Date.now(),
        timestamp: now.getTime(),
        dateStr: getTodayString(),
        model: item.model,
        flavor: item.flavor,
        cost: item.cost || 0,
        price: item.price || 0
      });
      saveHistory();
    }

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

document.getElementById('copy-order-btn').addEventListener('click', () => {
  const targetStock = 10; 
  const lowStockItems = stock.filter(i => i.qty <= 2);
  
  if (lowStockItems.length === 0) {
    showToast('✅ ¡Tenés buen stock de todo!');
    copyModal.classList.add('hidden');
    return;
  }

  let text = "📦 *PEDIDO DE REPOSICIÓN* 📦\n\nHola, necesito reponer lo siguiente:\n\n";
  const grouped = {};

  lowStockItems.forEach(i => {
    if (!grouped[i.model]) grouped[i.model] = [];
    grouped[i.model].push(i);
  });

  for (const model in grouped) {
    text += `📌 *${model}*\n`;
    grouped[model].forEach(f => {
      const toOrder = targetStock - f.qty; 
      text += `  • ${f.flavor} (x${toOrder} u.)\n`;
    });
    text += "\n";
  }

  navigator.clipboard.writeText(text).then(() => {
    showToast('✅ Pedido copiado (¡Pegalo en WhatsApp!)');
    copyModal.classList.add('hidden');
  }).catch(() => alert("Error al copiar el pedido"));
});

// ---------------- RENDER PRINCIPAL ----------------
function render() {
  document.getElementById('btn-toggle-eye').innerHTML = isEyeOpen ? iconEyeOpen : iconEyeClosed;

  const query = searchInput.value.toLowerCase();
  const isSearchingOrFiltering = query.length > 0 || currentFilter !== 'all';

  let totalQty = 0;
  let totalMoney = 0;
  let totalCost = 0;
  
  stock.forEach(i => {
    if (i.qty > 0) {
      totalQty += i.qty;
      totalMoney += (i.qty * (i.price || 0));
      totalCost += (i.qty * (i.cost || 0));
    }
  });
  
  const totalProfit = totalMoney - totalCost;

  document.getElementById('total-qty').textContent = totalQty + ' u.';
  document.getElementById('total-money').textContent = isEyeOpen ? '$' + totalMoney.toLocaleString('es-AR') : '***';
  document.getElementById('total-profit').textContent = isEyeOpen ? '$' + totalProfit.toLocaleString('es-AR') : '***';

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
    const modelCost = Math.max(...grouped[model].map(i => i.cost || 0));
    const modelProfit = modelPrice - modelCost;

    // 💥 ACÁ SE INYECTA LA NUEVA ETIQUETA DE GANANCIA POR UNIDAD
    let badgesHtml = '';
    if (isEyeOpen && modelPrice > 0) {
      badgesHtml += `<div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">`;
      badgesHtml += `<span class="model-price-badge">Venta $${modelPrice.toLocaleString('es-AR')}</span>`;
      if (modelCost > 0 && modelProfit > 0) {
        badgesHtml += `<span class="model-profit-badge">Limpio $${modelProfit.toLocaleString('es-AR')}</span>`;
      }
      badgesHtml += `</div>`;
    }

    card.innerHTML = `
      <div class="model-title" onclick="toggleModel(this)">
        <div class="model-title-left">
          <span class="model-title-text">${model}</span>
          ${badgesHtml}
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
