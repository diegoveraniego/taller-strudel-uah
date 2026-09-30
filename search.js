// search.js - Búsqueda simple cliente-lado para el Taller de Strudel
document.addEventListener('DOMContentLoaded', function () {
  // 1. Inyectar Modal de Búsqueda
  const modalHTML = `
    <div id="search-modal" style="display:none; position:fixed; inset:0; z-index:3000; background:rgba(0,0,0,0.8); align-items:flex-start; justify-content:center; padding-top:10vh;">
      <div style="background:var(--bg); width:90%; max-width:600px; padding:2rem; border:2px solid var(--border); max-height:80vh; display:flex; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
          <input type="text" id="search-input" placeholder="Buscar concepto (ej: lpf, acordes)..." style="width:100%; padding:0.5rem; font-size:1.2rem; border:2px solid var(--border); background:var(--bg-2); color:var(--text); font-family:inherit;">
          <button id="search-close" style="margin-left:1rem; padding:0.5rem 1rem; cursor:pointer; background:var(--text); color:var(--bg); border:none; font-weight:bold;">X</button>
        </div>
        <div id="search-results" style="overflow-y:auto; flex-grow:1;">
          <p style="color:var(--text-muted); font-size:0.9rem;">Empieza a escribir para buscar en todo el taller.</p>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('search-modal');
  const input = document.getElementById('search-input');
  const resultsDiv = document.getElementById('search-results');
  const trigger = document.getElementById('search-trigger');

  if (trigger) {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      modal.style.display = 'flex';
      input.focus();
      if (Object.keys(searchIndex).length === 0) {
        buildIndex();
      }
    });
  }

  document.getElementById('search-close').addEventListener('click', closeSearch);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeSearch();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.style.display === 'flex') closeSearch();
  });

  function closeSearch() {
    modal.style.display = 'none';
  }

  // 2. Construir Índice (se carga al abrir por primera vez)
  const pages = [
    { url: 'clase-1.html', title: 'Clase 1' },
    { url: 'clase-2.html', title: 'Clase 2' },
    { url: 'clase-2-5.html', title: 'Clase 2.5' },
    { url: 'clase-3.html', title: 'Clase 3' }
  ];
  let searchIndex = {}; // url -> { title, textBlocks }

  async function buildIndex() {
    resultsDiv.innerHTML = '<p>Cargando índice...</p>';
    for (const page of pages) {
      try {
        const resp = await fetch(page.url);
        if (!resp.ok) continue;
        const text = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        
        const blocks = [];
        // Buscar en párrafos, títulos y celdas de tabla
        const elements = doc.querySelectorAll('p, h2, h3, li, td');
        elements.forEach(el => {
          if (el.textContent.trim().length > 5) {
            blocks.push({
              text: el.textContent.trim(),
              html: el.innerHTML
            });
          }
        });
        searchIndex[page.url] = { title: page.title, blocks: blocks };
      } catch(e) {
        console.error("Error loading " + page.url, e);
      }
    }
    resultsDiv.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">Índice listo. Escribe para buscar.</p>';
    if (input.value) performSearch(input.value);
  }

  // 3. Ejecutar búsqueda
  let debounce;
  input.addEventListener('input', function() {
    clearTimeout(debounce);
    debounce = setTimeout(() => performSearch(input.value), 300);
  });

  function performSearch(query) {
    query = query.toLowerCase().trim();
    if (query.length < 2) {
      resultsDiv.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">Escribe al menos 2 letras...</p>';
      return;
    }
    if (Object.keys(searchIndex).length === 0) return;

    let html = '';
    let count = 0;

    for (const url in searchIndex) {
      const page = searchIndex[url];
      const matches = page.blocks.filter(b => b.text.toLowerCase().includes(query));
      
      if (matches.length > 0) {
        html += `<h3 style="margin-top:1.5rem; margin-bottom:0.5rem; color:var(--accent);">${page.title}</h3>`;
        // Mostrar máximo 5 resultados por página
        matches.slice(0, 5).forEach(m => {
          // Resaltar query (simple text replace)
          const regex = new RegExp(`(${query})`, 'gi');
          const highlighted = m.text.replace(regex, '<span style="background:var(--accent); color:var(--bg); font-weight:bold;">$1</span>');
          html += `<a href="${url}" style="display:block; text-decoration:none; color:var(--text); padding:0.5rem; border-left:3px solid var(--border); margin-bottom:0.5rem; font-size:0.9rem;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">${highlighted}</a>`;
          count++;
        });
      }
    }

    if (count === 0) {
      resultsDiv.innerHTML = `<p>No se encontraron resultados para "<b>${query}</b>".</p>`;
    } else {
      resultsDiv.innerHTML = html;
    }
  }
});
