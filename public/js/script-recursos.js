// js/recursos.js

document.addEventListener("DOMContentLoaded", () => {
  // ✅ Tooltip accesibles (no usado actualmente pero listo para uso futuro)
  const links = document.querySelectorAll("[data-tooltip]");
  links.forEach(link => {
    link.addEventListener("mouseenter", () => {
      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.textContent = link.dataset.tooltip;
      document.body.appendChild(tooltip);
      const rect = link.getBoundingClientRect();
      tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
      tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
      link._tooltip = tooltip;
    });

    link.addEventListener("mouseleave", () => {
      if (link._tooltip) {
        document.body.removeChild(link._tooltip);
        link._tooltip = null;
      }
    });
  });

  // ✅ Carrusel scroll automático si hay más de un logo
  const carousel = document.querySelector(".carousel");
  if (carousel && carousel.scrollWidth > carousel.clientWidth) {
    setInterval(() => {
      carousel.scrollBy({ left: 1, behavior: "smooth" });
    }, 40);
  }

  // ✅ Menú hamburguesa funcional
  const toggleBtn = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener("click", () => {
      navLinks.classList.toggle("show");
      toggleBtn.innerHTML = navLinks.classList.contains("show")
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-bars"></i>';
    });
  }
});
