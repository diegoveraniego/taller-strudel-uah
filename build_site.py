import re
import os
import urllib.parse

# 1. Leer el export de Emacs
org_html_path = "/home/diego/org/roam/20260906220043-taller_de_codificacion_con_strudel.html"
with open(org_html_path, "r", encoding="utf-8") as f:
    raw_html = f.read()

# Pre-cargar imágenes disponibles en images/
images_dir = "/home/diego/strudel-taller-web/images"
existing_files = os.listdir(images_dir)
existing_lower = {f.lower(): f for f in existing_files}

# Mapeo manual de alias si fuera necesario
filename_aliases = {
    "sawtooth.png": "SawtoothWave.png",
    "sawtooth.jpg": "SawtoothWave.png",
    "square.jpg": "square.svg",
    "square.png": "square.svg",
    "triangle.jpg": "triangle.svg",
    "triangle.png": "triangle.svg",
    "acid_eq.png": "Captura de pantalla_20260907_141929.png",
    "obra_en_proceso.jpg": "Captura de pantalla_20260906_221624.png",
}

def fix_content_images(content):
    def replace_src(match):
        full_tag = match.group(0)
        src = match.group(1)
        
        # Ignorar URLs externas (http/https)
        if src.startswith("http://") or src.startswith("https://"):
            return full_tag
            
        unquoted = urllib.parse.unquote(src)
        filename = os.path.basename(unquoted).strip()
        
        # Aplicar alias
        target_name = filename_aliases.get(filename, filename)
        
        # Buscar coincidencia exacta o insensible a mayúsculas
        if target_name in existing_files:
            real_name = target_name
        elif target_name.lower() in existing_lower:
            real_name = existing_lower[target_name.lower()]
        else:
            real_name = target_name
            
        new_src = f"images/{real_name}"
        return full_tag.replace(f'src="{src}"', f'src="{new_src}"').replace(f"src='{src}'", f"src='{new_src}'")
        
    return re.sub(r'<img\s+[^>]*src=["\']([^"\']+)["\']', replace_src, content)

# 2. Extraer secciones de clases (outline-2)
classes = []
matches = list(re.finditer(r'<div id="outline-container-[a-z0-9]+" class="outline-2">', raw_html))
for i in range(len(matches)):
    start = matches[i].start()
    end = matches[i+1].start() if i + 1 < len(matches) else raw_html.find('<div id="postamble"')
    if end == -1: end = raw_html.find("</body>")
    
    content = raw_html[start:end]
    # Extract title text
    title_match = re.search(r'<h2[^>]*>(?:<span class="section-number-2">[^<]+</span>\s*)?(.*?)\s*</h2>', content)
    title = title_match.group(1) if title_match else f"Clase {i+1}"
    
    # Strip section numbers for h2 and h3
    content = re.sub(r'<h2[^>]*><span class="section-number-2">[^<]+</span>\s*(.*?)</h2>', r'<h2>\1</h2>', content)
    content = re.sub(r'<h3[^>]*><span class="section-number-3">[^<]+</span>\s*(.*?)</h3>', r'<h3>\1</h3>', content)
    
    # Corregir rutas de imágenes en el contenido de la clase
    content = fix_content_images(content)
    
    classes.append({
        "id": i + 1,
        "title": title,
        "content": content
    })

# 3. Leer la plantilla de clase-1.html
with open("clase-1.html", "r", encoding="utf-8") as f:
    template_html = f.read()

# Dividir la plantilla
header_end = template_html.find('<div id="outline-container-')
header = template_html[:header_end]
header = re.sub(r'<h1 class="title">.*?</h1>\n?', '', header) # Remove old h1 title

footer_start = template_html.find('<div class="class-nav-footer">')
footer = template_html[footer_start:]

# 4. Generar cada clase
for i, cls in enumerate(classes):
    class_num = cls["id"]
    filename = f"clase-{class_num}.html"
    
    # Generate Navbar with Strudel button (link right-aligned with Strudel icon on right)
    nav_html = '<nav id="clase-nav"><a href="index.html">꩜ Inicio</a>'
    for j in range(1, len(classes) + 1):
        active_cls = ' class="nav-active"' if j == class_num else ''
        nav_html += f'<a href="clase-{j}.html"{active_cls}>Clase {j}</a>'
    nav_html += '<a href="https://warm.strudel.cc/" target="_blank" rel="noopener" class="nav-strudel-btn" style="margin-left: auto;">Ir a Strudel ꩜</a>'
    nav_html += '<a href="#" id="search-trigger" style="text-decoration: none;" title="Buscar en el taller"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></a></nav>'
    
    # Replace navbar in header
    cur_header = re.sub(r'<nav id="clase-nav">.*?</nav>', nav_html, header, flags=re.DOTALL)
    
    # Update title
    cur_header = re.sub(r'<title>.*?</title>', f'<title>꩜ Clase {class_num} — Taller de Strudel</title>', cur_header)
    
    # Generate Footer
    cur_footer = '<div class="class-nav-footer">\n'
    if class_num > 1:
        cur_footer += f'  <a href="clase-{class_num-1}.html" class="nav-btn prev">\n    <span class="nav-label">Anterior</span>\n    <span class="nav-title">Clase {class_num-1}</span>\n  </a>\n'
    else:
        cur_footer += '  <div></div>\n'
        
    if class_num < len(classes):
        cur_footer += f'  <a href="clase-{class_num+1}.html" class="nav-btn next">\n    <span class="nav-label">Siguiente</span>\n    <span class="nav-title">Clase {class_num+1}</span>\n  </a>\n'
    else:
        cur_footer += '  <a href="#" class="nav-btn next" style="opacity:0.5; pointer-events:none; border-style:dashed;">\n    <span class="nav-label">Próximamente</span>\n    <span class="nav-title">Clase {class_num+1}</span>\n  </a>\n'
    cur_footer += '</div>'
    
    # Append the rest of the original footer scripts
    script_start = footer.find('<a id="back-to-top"')
    cur_footer += '\n' + footer[script_start:]
    
    # H1 Title
    h1_title = f'<h1 class="title">{cls["title"]}</h1>\n'
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write(cur_header + h1_title + cls["content"] + cur_footer)

print(f"Sitio generado con éxito! ({len(classes)} clases)")
