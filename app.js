if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log(err));
}

let stock = JSON.parse(localStorage.getItem('vapeStock')) || [];

const stockContainer = document.getElementById('stock-container');
const searchInput = document.getElementById('search-input');
const copyBtn = document.getElementById('copy-btn');
const fabBtn = document.getElementById('fab-btn');
const addModal = document.getElementById('add-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveBtn = document.getElementById('save-btn');
const modelInput = document.getElementById('model-input');
const flavorInput = document.getElementById('flavor-input');
const qtyInput = document.getElementById('qty-input');
const toastContainer = document.getElementById('toast-container');

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

fabBtn.addEventListener('click', () => { 
  addModal.classList.remove('hidden'); 
});

closeModalBtn.addEventListener('click', () => { 
  addModal.classList.add('hidden'); 
});

saveBtn.addEventListener('click', () => {
  const model = modelInput.value.trim().toUpperCase();
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
      } else {
        stock.push({ id: Date.now() + Math.random(), model, flavor: cleanFlavor, qty: parsedQty });
      }
      addedCount++;
    }
  });

  saveStock();
  
  if(addedCount === 1) {
    showToast(`✅ Sabor guardado`);
  } else if (addedCount > 1) {
    showToast(`✅ ${addedCount} sabores guardados`);
  }
  
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

window.toggleModel = function(element) {
  const flavorsContainer = element.nextElementSibling;
  const arrow = element.querySelector('.arrow');
  flavorsContainer.classList.toggle('hidden');
  arrow.classList.toggle('collapsed');
};

copyBtn.addEventListener('click', () => {
  const available = stock.filter(i => i.qty > 0);
  if (available.length === 0) return showToast('❌ No hay stock para copiar');

  let text = "🔥 *STOCK DISPONIBLE* 🔥\n\n";
  const grouped = {};

  available.forEach(i => {
    if (!grouped[i.model]) grouped[i.model] = [];
    grouped[i.model].push(`  • ${i.flavor}: ${i.qty} u.`);
  });

  for (const model in grouped) {
    text += `📌 *${model}*\n`;
    grouped[model].forEach(f => text += `${f}\n`);
    text += "\n";
  }

  navigator.clipboard.writeText(text).then(() => {
    showToast('✅ Lista copiada al portapapeles');
  }).catch(() => alert("Error al copiar"));
});

function render() {
  const query = searchInput.value.toLowerCase();
  const isSearching = query.length > 0;

  // 🧠 LA MAGIA: Guardamos qué modelos están abiertos antes de borrar la pantalla
  const openModels = new Set();
  document.querySelectorAll('.model-card').forEach(card => {
    const title = card.querySelector('.model-title span').textContent;
    const flavors = card.querySelector('.model-flavors');
    if (!flavors.classList.contains('hidden')) {
      openModels.add(title);
    }
  });

  stockContainer.innerHTML = '';

  const filtered = stock.filter(i => 
    i.model.toLowerCase().includes(query) || 
    i.flavor.toLowerCase().includes(query)
  );
  
  const grouped = {};
  filtered.forEach(item => {
    if (!grouped[item.model]) grouped[item.model] = [];
    grouped[item.model].push(item);
  });

  for (const model in grouped) {
    const card = document.createElement('div');
    card.className = 'model-card';

    // 🧠 LA MAGIA PARTE 2: Si estaba abierto o estás buscando, lo dejamos abierto
    const shouldBeOpen = isSearching || openModels.has(model);
    const collapsedClass = shouldBeOpen ? '' : 'hidden';
    const arrowClass = shouldBeOpen ? '' : 'collapsed';

    card.innerHTML = `
      <div class="model-title" onclick="toggleModel(this)">
        <span>${model}</span>
        <span class="arrow ${arrowClass}">▼</span>
      </div>
      <div class="model-flavors ${collapsedClass}"></div>
    `;

    const flavorsContainer = card.querySelector('.model-flavors');

    grouped[model].forEach(item => {
      const row = document.createElement('div');
      let statusClass = item.qty === 0 ? 'out-of-stock' : '';
      row.className = `flavor-row ${statusClass}`;
      
      row.innerHTML = `
        <div class="flavor-info">
          <button class="btn-delete" onclick="deleteFlavor(${item.id})">🗑️</button>
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
