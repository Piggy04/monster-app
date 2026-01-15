function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const body = document.body;

  const isOpen = sidebar.classList.contains('open');

  if (isOpen) {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    body.classList.remove('sidebar-open');
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    body.classList.add('sidebar-open');
  }
}
