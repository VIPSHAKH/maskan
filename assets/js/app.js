document.addEventListener('DOMContentLoaded', () => {
    const mapTrigger = document.getElementById('map-trigger');
    const categories = document.querySelectorAll('.category');
    const mapContainer = document.getElementById('map');
    let map = null;
    let userMarker = null;
    let userLat, userLng;

    // Function to initialize the map
    function initMap(lat, lng, categoryFilter = null) {
        if (map) map.remove(); // Clean up existing map instance
        map = L.map('map').setView([lat, lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add user marker
        userMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup('Siz shu yerdasiz (You are here)').openPopup();

        // Fetch nearby places based on category
        fetchNearbyPlaces(lat, lng, categoryFilter);
    }

    // Function to fetch nearby places using Overpass API
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
                    const popup = L.popup().setContent(popupContent);

                    // Hover functionality
                    marker.on('mouseover', () => popup.openOn(map));
                    marker.on('mouseout', () => popup.remove());

                    // Click functionality to keep popup open
                    marker.on('click', (e) => {
                        e.originalEvent.stopPropagation();
                        popup.openOn(map);
                    });
                });
            })
            .catch(error => console.error('Ma\'lumotlarni olishda xatolik:', error));
    }

    // Function to calculate distance (Haversine formula)
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in meters
    }

    // Handle map trigger from navigation
    mapTrigger.addEventListener('click', () => {
        toggleMapVisibility(true);
        fetchUserLocation(null); // No category filter for "Xarita"
    });

    // Handle category clicks
    categories.forEach(category => {
        category.addEventListener('click', () => {
            const categoryType = category.getAttribute('data-category');
            toggleMapVisibility(true);
            fetchUserLocation(categoryType);
        });
    });

    // Function to toggle map visibility
    function toggleMapVisibility(show) {
        if (show) {
            document.body.style.overflow = 'hidden';
            document.querySelector('header').style.display = 'none';
            document.querySelector('.search-bar').style.display = 'none';
            document.querySelector('.banner').style.display = 'none';
            document.querySelector('.categories').style.display = 'none';
            document.querySelector('.featured').style.display = 'none';
            // Removed: document.querySelector('.navigation').style.display = 'none';
            mapContainer.style.display = 'block';
        } else {
            if (map) map.remove();
            mapContainer.style.display = 'none';
            document.body.style.overflow = 'auto';
            document.querySelector('header').style.display = 'block';
            document.querySelector('.search-bar').style.display = 'block';
            document.querySelector('.banner').style.display = 'block';
            document.querySelector('.categories').style.display = 'block';
            document.querySelector('.featured').style.display = 'block';
            // Removed: document.querySelector('.navigation').style.display = 'flex';
        }
    }

    // Function to fetch user location and initialize map
    function fetchUserLocation(categoryFilter) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    userLat = position.coords.latitude;
                    userLng = position.coords.longitude;
                    initMap(userLat, userLng, categoryFilter);
                },
                error => {
                    alert('Joylashuvingizni aniqlash mumkin emas. Standart koordinatalar ishlatiladi. (Unable to retrieve your location. Using default coordinates.)');
                    userLat = 41.5586;
                    userLng = 60.6071; // Default to Urganch, Uzbekistan
                    initMap(userLat, userLng, categoryFilter);
                }
            );
        } else {
            alert('Brauzeringiz geolokatsiyani qo\'llab-quvvatlamaydi. Standart koordinatalar ishlatiladi. (Geolocation is not supported by this browser. Using default coordinates.)');
            userLat = 41.5586;
            userLng = 60.6071; // Default to Urganch, Uzbekistan
            initMap(userLat, userLng, categoryFilter);
        }
    }

    // Close map only when clicking outside markers/popups
    mapContainer.addEventListener('click', (e) => {
        if (e.target.id === 'map' && !e.target.closest('.leaflet-marker-icon') && !e.target.closest('.leaflet-popup')) {
            toggleMapVisibility(false);
        }
    });
});

document.querySelectorAll('.nav-item').forEach(item => {
    if (item !== mapTrigger) {
        item.addEventListener('click', () => {
            toggleMapVisibility(false);
        });
    }
});