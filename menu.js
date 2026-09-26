document.addEventListener('DOMContentLoaded', function() {
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const topNav = document.querySelector('.top-nav');

  if (hamburgerBtn && topNav) {
    hamburgerBtn.addEventListener('click', function() {
      topNav.classList.toggle('active');
      hamburgerBtn.classList.toggle('active');
    });

    // Fermer le menu quand on clique sur un lien
    const navLinks = topNav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        topNav.classList.remove('active');
        hamburgerBtn.classList.remove('active');
      });
    });

    // Fermer le menu quand on clique en dehors
    document.addEventListener('click', function(event) {
      const isClickInsideNav = topNav.contains(event.target);
      const isClickOnHamburger = hamburgerBtn.contains(event.target);
      
      if (!isClickInsideNav && !isClickOnHamburger && topNav.classList.contains('active')) {
        topNav.classList.remove('active');
        hamburgerBtn.classList.remove('active');
      }
    });
  }
});
