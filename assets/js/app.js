document.addEventListener('DOMContentLoaded', () => {
    const sections = {
        'main-section': document.getElementById('main-section'),
        'categories-section': document.getElementById('categories-section'),
        'map-section': document.getElementById('map-section'),
        'favorites-section': document.getElementById('favorites-section'),
        'profile-section': document.getElementById('profile-section')
    };

    const navItems = document.querySelectorAll('.nav-item');
    let map = null;

    function showSection(sectionId) {
        Object.values(sections).forEach(section => {
            section.style.display = section.id === sectionId ? 'block' : 'none';
        });

        navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
        });

        const header = document.getElementById('header');
        const searchBar = document.getElementById('search-bar');
        if (sectionId === 'main-section') {
            header.style.display = 'block';
            searchBar.style.display = 'flex';
        } else {
            header.style.display = 'none';
            searchBar.style.display = 'none';
        }

        if (sectionId === 'map-section' && !map) {
            initializeMap();
        }
    }

    function initializeMap() {
        map = L.map('map').setView([41.5586, 60.6071], 13); // Default: Urganch
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    map.setView([latitude, longitude], 13);
                    L.marker([latitude, longitude]).addTo(map)
                        .bindPopup('You are here').openPopup();
                },
                () => {
                    console.log('Geolocation not available, using default location.');
                }
            );
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    showSection('main-section');
});