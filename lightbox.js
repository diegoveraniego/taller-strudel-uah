// lightbox.js — expandir imágenes al hacer click
document.addEventListener('DOMContentLoaded', function () {
  // Crear el overlay
  var lb = document.createElement('div');
  lb.id = 'lightbox';
  var lbImg = document.createElement('img');
  lb.appendChild(lbImg);
  document.body.appendChild(lb);

  // Aplicar a todas las imágenes del contenido
  function initImages() {
    document.querySelectorAll('#content img').forEach(function(img) {
      // Saltar imágenes inline dentro de párrafos o encabezados
      if (img.closest('p, h1, h2, h3, nav')) return;
      // Evitar doble binding
      if (img.dataset.lightbox) return;
      img.dataset.lightbox = '1';
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function() {
        lbImg.src = img.src;
        lbImg.alt = img.alt || '';
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });
  }

  initImages();

  // Cerrar al clickear el backdrop
  lb.addEventListener('click', close);

  // Cerrar con Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') close();
  });

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }
});
