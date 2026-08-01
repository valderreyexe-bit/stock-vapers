// 1. Registro del Service Worker (Magia de la App Instalable)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Error:', err));
}

// 2. Base de Datos Local
let stock = JSON.parse(localStorage.getItem('vapeStock')) || [];

// Elementos de la interfaz
const stockContainer = document.getElementById('stock-container');
const searchInput = document.getElementById('search-input');
const copyBtn = document.getElementById('copy-btn');
const fabBtn = document.getElementById('fab-btn');
const addModal = document.getElementById('add-modal');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const modelInput = document.getElementById('model-input');
const flavorInput = document.getElementById('flavor-input');
const qtyInput = document.getElementById('qty-input');

function saveStock() {
  localStorage.setItem('vapeStock', JSON.stringify(stock));
  render();
}

// 3. Lógica del Modal (Ingreso rápido)
fabBtn.addEventListener('click', () => { 
  addModal.classList.remove('hidden'); 
  setTimeout(() => modelInput.focus(), 100);
});

cancelBtn.addEventListener('click', () => { 
  addModal.classList.add('hidden'); 
});

saveBtn.addEventListener('click', () => {
  const model = modelInput.value.trim().toUpperCase();
  const flavor = flavorInput.value.trim();
  const qty = parseInt(qtyInput.value) || 0;

  if (!model || !flavor) return alert('Che, completá modelo y sabor');

  // Busca si ya existe
  const existing = stock.find(i => i.model === model && i.flavor.toLowerCase() === flavor.toLowerCase());

  if (existing) {
    existing.qty += qty;
  } else {
    stock.push({ id: Date.now(), model, flavor, qty });
  }

  flavorInput.value = ''; // Borramos solo el sabor para cargar otro rápido
  flavorInput.focus();
  saveStock();
  
  // Pequeño aviso visual
  saveBtn.textContent = '¡Guardado!';
  setTimeout(() => saveBtn.textContent = 'Guardar', 1000);
});

// Cierra modal al tocar el fondo oscuro
addModal.addEventListener('click', (e) => {
  if (e.target === addModal) addModal.classList.add('hidden');
});

// 4. Lógica de Venta (Restar/Sumar)
window.updateQty = function(id, change) {
  const item = stock.find(i => i.id === id);
  if (item) {
    if (item.qty === 0 && change < 0) return; // No puede bajar de 0
    item.qty += change;
    saveStock();
  }
};

// 5. Copiador Inteligente para WhatsApp
copyBtn.addEventListener('click', () => {
  const available = stock.filter(i => i.qty > 0);
  if (available.length === 0) return alert('No tenés stock de nada para copiar');

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
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '✅ ¡Copiado!';
    setTimeout(() => copyBtn.innerHTML = originalText, 2000);
  }).catch(err => {
    alert("Error al copiar, fijate si le diste permiso al navegador.");
  });
});

// 6. Renderizado de la lista (Zero-Latency Search)
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
      
      // Lógica de colores (Stock 0 es out-of-stock, Stock <= 2 es low-stock)
      let statusClass = '';
      if (item.qty === 0) statusClass = 'out-of-stock';
      else if (item.qty <= 2) statusClass = 'low-stock';

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

// Búsqueda en vivo
searchInput.addEventListener('input', render);

// Render inicial
render();
