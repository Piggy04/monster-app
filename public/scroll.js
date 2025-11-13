// Mostra/nascondi pulsante scroll
window.addEventListener('scroll', () => {
  const scrollBtn = document.getElementById('scrollToTop');
  if (window.scrollY > 300) {
    scrollBtn.classList.add('visible');
  } else {
    scrollBtn.classList.remove('visible');
  }
});

// Scroll smooth to top
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}
