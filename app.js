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

// 🔔 FUNCIÓN DE NOTIFICACIÓN VISUAL
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  
  // Se borra solo después de 2.5 segundos
  setTimeout(() => toast.remove(), 2500);
}

fabBtn.addEventListener('click', () => { 
  addModal.classList.remove('hidden'); 
});

closeModalBtn.addEventListener('click', () => { 
  addModal.classList.add('hidden'); 
});

// 🚀 LÓGICA DE GUARDADO Y FEEDBACK
saveBtn.addEventListener('click', () => {
  const model = modelInput.value.trim().toUpperCase();
  const flavor = flavorInput.value.trim();
  const qty = parseInt(qtyInput.value) || 0;

  if (!model || !flavor) return alert('Completá modelo y sabor');

  const existing = stock.find(i => i.model === model && i.flavor.toLowerCase() === flavor.toLowerCase());

  if (existing) {
    existing.qty += qty;
  } else {
    stock.push({ id: Date.now(), model, flavor, qty });
  }

  saveStock();
  
  // TE AVISA CON UN CARTEL DESDE ARRIBA QUE SE GUARDÓ
  showToast(`✅ ${flavor} guardado (${qty} u.)`);
  
  // TE LIMPIA EL CAMPO SABOR PARA QUE SIGAS CARGANDO SIN CERRAR EL MENÚ
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
    card.innerHTML = `<div class="model-title">${model}</div>`;

    grouped[model].forEach(item => {
      const row = document.createElement('div');
      let statusClass = item.qty === 0 ? 'out-of-stock' : '';
      row.className = `flavor-row ${statusClass}`;
      
      row.innerHTML = `
        <span class="flavor-name">${item.flavor}</span>
        <div class="controls">
          <button class="btn-qty btn-minus" onclick="updateQty(${item.id}, -1)">-</button>
          <span class="qty-number">${item.qty}</span>
          <button class="btn-qty btn-plus" onclick="updateQty(${item.id}, 1)">+</button>
        </div>
      `;
      card.appendChild(row);
    });

    stockContainer.appendChild(card);
  }
}

searchInput.addEventListener('input', render);
render();
