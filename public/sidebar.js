// Toggle sidebar
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle = document.getElementById('sidebarToggle');
  
  sidebar.classList.toggle('active');
  sidebar.classList.toggle('collapsed');
  overlay.classList.toggle('active');
  toggle.classList.toggle('active');
}

// Chiudi sidebar cliccando link su mobile
document.querySelectorAll('.sidebar nav a').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      toggleSidebar();
    }
  });
});
