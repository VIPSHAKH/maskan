document.addEventListener('DOMContentLoaded', () => {
    const sections = {
        'main-section': document.getElementById('main-section'),
        'catalog-section': document.getElementById('catalog-section'),
        'map-section': document.getElementById('map-section'),
        'favorites-section': document.getElementById('favorites-section'),
        'profile-section': document.getElementById('profile-section')
    };
    const navItems = document.querySelectorAll('.nav-item');
    const categories = document.querySelectorAll('.category');
    let map = null;
    let userLat, userLng;

    function showSection(sectionId, categoryFilter = null) {
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

        if (sectionId === 'map-section') {
            fetchUserLocation(categoryFilter);
        } else if (map) {
            map.remove();
            map = null;
        }
    }

    function fetchUserLocation(categoryFilter) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    userLat = position.coords.latitude;
                    userLng = position.coords.longitude;
                    initMap(userLat, userLng, categoryFilter);
                },
                error => {
                    alert('Joylashuvingizni aniqlash mumkin emas. Standart koordinatalar ishlatiladi.');
                    userLat = 41.5586;
                    userLng = 60.6071; // Default to Urganch, Uzbekistan
                    initMap(userLat, userLng, categoryFilter);
                }
            );
        } else {
            alert('Brauzeringiz geolokatsiyani qo\'llab-quvvatlamaydi. Standart koordinatalar ishlatiladi.');
            userLat = 41.5586;
            userLng = 60.6071; // Default to Urganch, Uzbekistan
            initMap(userLat, userLng, categoryFilter);
        }
    }

    function initMap(lat, lng, categoryFilter) {
        if (map) map.remove();
        map = L.map('map').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        L.marker([lat, lng]).addTo(map)
            .bindPopup('Siz shu yerdasiz (You are here)').openPopup();

        fetchNearbyPlaces(lat, lng, categoryFilter);
    }

    function fetchNearbyPlaces(lat, lng, categoryFilter) {
        let query;
        if (categoryFilter === 'restoranlar') {
            query = `node["amenity"="restaurant"](around:1000,${lat},${lng});`;
        } else if (categoryFilter === 'fastfood') {
            query = `node["amenity"="fast_food"](around:1000,${lat},${lng});`;
        } else if (categoryFilter === 'oromgoh') {
            query = `node["amenity"="cafe"](around:1000,${lat},${lng});`;
        } else if (categoryFilter === 'shifoxona') {
            query = `node["amenity"="hospital"](around:1000,${lat},${lng});`;
        } else {
            query = `node["amenity"~"restaurant|fast_food|cafe|hospital"](around:1000,${lat},${lng});`;
        }

        const url = `https://overpass-api.de/api/interpreter?data=[out:json];${query}out;`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.elements.length === 0) {
                    alert('No nearby places found for this category.');
                    return;
                }
                data.elements.forEach(element => {
                    const { lat, lon, tags } = element;
                    const name = tags.name || 'Noma\'lum joy';
                    const type = tags.amenity || 'Noma\'lum';

                    const marker = L.marker([lat, lon]).addTo(map);
                    const popupContent = `
                        <strong>${name}</strong><br>
                        Type: ${type}<br>
                        Distance: ${Math.round(calculateDistance(lat, lon, userLat, userLng))} m
                    `;
                    marker.bindPopup(popupContent);
                });
            })
            .catch(error => console.error('Error fetching places:', error));
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    categories.forEach(category => {
        category.addEventListener('click', () => {
            const categoryType = category.getAttribute('data-category');
            showSection('map-section', categoryType);
        });
    });

    showSection('main-section');
});