function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const grouped = {};
  
    favorites.forEach(fav => {
      const date = new Date(fav.date).toLocaleDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(fav.text);
    });
  
    // Limpiar contenido anterior del panel
    const favList = document.getElementById("favorites-list");
    favList.innerHTML = "";
  
    const exportBtns = document.createElement("div");
    exportBtns.innerHTML = `
      <button onclick="exportFavorites('txt')">📄 Exportar TXT</button>
      <button onclick="exportFavorites('pdf')">🖨 Exportar PDF</button>
    `;
    favList.appendChild(exportBtns);
  
    Object.entries(grouped).forEach(([date, items]) => {
      const dateHeader = document.createElement("h3");
      dateHeader.textContent = date;
      favList.appendChild(dateHeader);
  
      items.forEach(text => {
        const p = document.createElement("p");
        p.innerHTML = text;
        p.classList.add("fav-item");
  
        const del = document.createElement("button");
        del.textContent = "🗑";
        del.title = "Eliminar";
        del.onclick = () => {
          if (confirm("¿Eliminar este favorito?")) {
            const updated = favorites.filter(f => f.text !== text);
            localStorage.setItem("favorites", JSON.stringify(updated));
            p.remove();
          }
        };
        p.appendChild(del);
  
        favList.appendChild(p);
      });
    });
  }
  
  // Botón ya existente (no volvemos a crear otro)
  document.getElementById("open-panel").addEventListener("click", () => {
    document.getElementById("favorites-panel").classList.add("visible");
    loadFavorites();
  });
  
  document.getElementById("close-panel").addEventListener("click", () => {
    document.getElementById("favorites-panel").classList.remove("visible");
  });
  
  document.getElementById("search-favs").addEventListener("input", () => {
    const query = document.getElementById("search-favs").value.toLowerCase();
    const items = document.querySelectorAll("#favorites-list .fav-item");
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? '' : 'none';
    });
  });
  
  function saveMessageToFavorites(msg, date = new Date()) {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    favorites.push({ text: msg, date: date.toISOString() });
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }
      // Añadir funcionalidad de guardar automáticamente mensajes útiles
// y organizar por fecha en localStorage

  
  function exportFavorites(format) {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const text = favorites.map(f => `📌 ${f.text}`).join("\n\n");
  
    if (format === 'txt') {
      const blob = new Blob([text], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "favoritos-sql.txt";
      link.click();
    } else if (format === 'pdf') {
      const win = window.open('', '', 'width=800,height=600');
      win.document.write(`<pre>${text}</pre>`);
      win.document.close();
      win.print();
    }
  }

  















  

  
// Guardar y recuperar historial y favoritos
document.addEventListener("DOMContentLoaded", () => {
    const chat = document.getElementById("chat");
    const input = document.getElementById("messageInput");
    const feedback = document.getElementById("feedback");
  
    const FAVORITES_KEY = "chat_favorites";
    const HISTORY_KEY = "chat_history";
  
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  
    function saveToStorage(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  
    function createMsgElement(msg, className, canFavorite = false) {
      const div = document.createElement("div");
      div.className = `msg ${className}`;
      div.innerHTML = msg.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
  
      if (canFavorite) {
        const favBtn = document.createElement("button");
        favBtn.textContent = "⭐";
        favBtn.title = "Guardar en favoritos";
        favBtn.className = "fav-button";
        favBtn.onclick = () => {
          favorites.push(msg);
          saveToStorage(FAVORITES_KEY, favorites);
          alert("Guardado en favoritos ✅");
        };
        div.appendChild(favBtn);
      }
  
      return div;
    }
  







  
  // Botón dinámico junto a cada respuesta del bot// ✅ Este script corrige el error de "Error del servidor" aunque la API responda correctamente
// y añade el botón de favoritos ⭐ al mensaje del bot

function appendMessage(msg, className) {
    const div = document.createElement("div");
    div.className = `msg ${className}`;
  
    // Si es un objeto con .reply, usarlo
    if (typeof msg === "object" && msg.reply) msg = msg.reply;
  
    const links = msg.match(/https?:\/\/[^\s]+/g);
    let cleanLink = links?.[0]?.replace(/[)\]]+$/, "") || "";
  
    let formatted = msg
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/^\*\*(.*?)\*\*/gm, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
      .replace(/\n/g, "<br>");
  
    if (className === "bot-msg" && links?.length) {
      formatted += `<div class="resource-preview">
        <p><strong>📎 Recurso:</strong> <a href="${cleanLink}" target="_blank">${cleanLink}</a></p>
      </div>`;
    }
  
    div.innerHTML = formatted;
  
    // Botón ⭐ favoritos
    if (className === "bot-msg") {
        const favBtn = document.createElement("button");
        favBtn.textContent = "⭐ Guardar como favorito";
        favBtn.title = "Guardar esta respuesta en tus favoritos para consultarla después";
        favBtn.className = "save-button";
        favBtn.classList.add("favorite-action-btn");
        favBtn.onclick = () => {
          const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
          favorites.push({
            text: msg,
            date: new Date().toISOString()
          });
          localStorage.setItem("favorites", JSON.stringify(favorites));
          favBtn.textContent = "✅";
          setTimeout(() => (favBtn.textContent = "⭐"), 2000);
        };
        div.appendChild(favBtn);
    }
  
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }
  
  


// Estilo CSS adicional para botón
const style = document.createElement("style");
style.innerHTML = `
  .save-button {
    background: transparent;
    border: none;
    font-size: 1.2em;
    cursor: pointer;
    margin-left: 6px;
  }
  .favorites-panel {
    position: fixed;
    top: 80px;
    right: 20px;
    width: 300px;
    max-height: 80vh;
    overflow-y: auto;
    background: white;
    box-shadow: 0 0 12px rgba(0,0,0,0.1);
    padding: 12px;
    border-radius: 8px;
    z-index: 1001;
  }
`;
document.head.appendChild(style);

// Botón flotante para abrir favoritos
const favBtn = document.createElement("button");
favBtn.textContent = "⭐ Favoritos";
favBtn.style.position = "fixed";
favBtn.style.bottom = "20px";
favBtn.style.right = "20px";
favBtn.style.zIndex = 1000;
favBtn.onclick = loadFavorites;
//document.body.appendChild(favBtn);


  });
  


  // Función para cargar los favoritos localStorage
const openBtn = document.getElementById('open-panel');
const closeBtn = document.getElementById('close-panel');
const panel = document.getElementById('favorites-panel');
const favList = document.getElementById('favorites-list');
const searchInput = document.getElementById('search-favs');

openBtn.addEventListener('click', () => {
  panel.classList.add('visible');
  loadFavorites();
});

closeBtn.addEventListener('click', () => {
  panel.classList.remove('visible');
});

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  const items = favList.querySelectorAll('.fav-item');
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(query) ? '' : 'none';
  });
});



const FAVORITOS_KEY = "chat_favoritos";

// Guarda un mensaje favorito
function guardarFavorito(texto) {
  const favoritos = obtenerFavoritos();
  const fecha = new Date().toLocaleDateString();
  favoritos.push({ texto, fecha });
  localStorage.setItem(FAVORITOS_KEY, JSON.stringify(favoritos));
}

// Obtiene todos los favoritos
function obtenerFavoritos() {
  return JSON.parse(localStorage.getItem(FAVORITOS_KEY)) || [];
}

// Elimina un favorito por índice
function eliminarFavorito(index) {
  const favoritos = obtenerFavoritos();
  favoritos.splice(index, 1);
  localStorage.setItem(FAVORITOS_KEY, JSON.stringify(favoritos));
  mostrarFavoritos();
}

// Exporta los favoritos como TXT
function exportarFavoritosTXT() {
  const favoritos = obtenerFavoritos();
  const contenido = favoritos.map(f => `- ${f.fecha}:\n${f.texto}`).join("\n\n");
  const blob = new Blob([contenido], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "favoritos_chat.txt";
  link.click();
}






// Filtro de favoritos por texto
function buscarFavoritos(query) {
  const favoritos = obtenerFavoritos();
  return favoritos.filter(f => f.texto.toLowerCase().includes(query.toLowerCase()));
}

// Renderiza la lista de favoritos
function mostrarFavoritos(filtrados = null) {
  const lista = document.getElementById("lista-favoritos");
  const favoritos = filtrados || obtenerFavoritos();
  lista.innerHTML = "";

  if (favoritos.length === 0) {
    lista.innerHTML = "<p>No hay favoritos guardados.</p>";
    return;
  }

  favoritos.forEach((fav, index) => {
    const item = document.createElement("div");
    item.className = "favorito-item";
    item.innerHTML = `
      <div class="fecha">📅 ${fav.fecha}</div>
      <div class="texto">${fav.texto}</div>
      <button onclick="eliminarFavorito(${index})">🗑️ Eliminar</button>
    `;
    lista.appendChild(item);
  });
}

// Añade botón "⭐ Guardar" a cada mensaje del bot
function añadirBotonFavorito(msgDiv) {
  const btn = document.createElement("button");
  btn.className = "btn-fav";
  btn.title = "Guardar como favorito";
  btn.innerText = "⭐ Guardar";
  btn.onclick = () => {
    const texto = msgDiv.innerText;
    guardarFavorito(texto);
    alert("✅ Guardado en favoritos");
  };
  msgDiv.appendChild(btn);
}

// Lógica para búsqueda en el panel de favoritos
const buscador = document.getElementById("buscar-favoritos");
if (buscador) {
  buscador.addEventListener("input", () => {
    const texto = buscador.value;
    const resultados = buscarFavoritos(texto);
    mostrarFavoritos(resultados);
  });
}


