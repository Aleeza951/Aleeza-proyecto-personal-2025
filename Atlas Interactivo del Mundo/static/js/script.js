document.addEventListener('DOMContentLoaded', function() {
  // Inicializar el mapa si estamos en la página del atlas
  if (document.getElementById('map')) {
    // Inicializar el mapa
    const map = L.map('map').setView([20, 0], 2);
    let markers = []; // Array para almacenar todos los marcadores
    let countries = []; // Array para almacenar datos de países
    
    // Añadir capa de mapa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Función para cargar los países desde la API
    async function loadCountries() {
      try {
        const response = await fetch('/api/countries');
        countries = await response.json();
        
        // Añadir marcadores para cada país
        countries.forEach(country => {
          if (country.latitude && country.longitude) {
            const marker = L.marker([country.latitude, country.longitude])
              .addTo(map)
              .bindPopup(`
                <h3>${country.name}</h3>
                <p><strong>Capital:</strong> ${country.capital}</p>
                <p><strong>Población:</strong> ${country.population?.toLocaleString()}</p>
                <button onclick="showCountryDetails(${country.id})">Ver detalles</button>
              `);
            
            // Añadir título al marcador para la búsqueda
            marker.options.title = country.name;
            marker.options.countryId = country.id;
            markers.push(marker);
          }
        });
      } catch (error) {
        console.error('Error cargando países:', error);
        document.getElementById('info').innerHTML = '<p>Error al cargar los datos. Por favor, intenta más tarde.</p>';
      }
    }
    
    // Cargar los países al iniciar
    loadCountries();
    
    // Configurar la búsqueda
    const searchInput = document.getElementById('search');
    const searchButton = document.getElementById('search-button');
    
    if (searchButton) {
      searchButton.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (searchTerm) {
          searchCountry(searchTerm);
        }
      });
    }
    
    if (searchInput) {
      searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          const searchTerm = this.value.trim().toLowerCase();
          if (searchTerm) {
            searchCountry(searchTerm);
          }
        }
      });
    }
    
    // Función para buscar un país
    function searchCountry(searchTerm) {
      console.log('Buscando país:', searchTerm);
      
      // Buscar países que coincidan
      const matchedCountries = countries.filter(country => 
        country.name.toLowerCase().includes(searchTerm)
      );
      
      if (matchedCountries.length === 0) {
        alert('No se encontraron países que coincidan con la búsqueda.');
        return;
      }
      
      // Si solo hay un resultado, centrar el mapa en ese país
      if (matchedCountries.length === 1) {
        const country = matchedCountries[0];
        
        // Centrar el mapa en el país
        map.setView([country.latitude, country.longitude], 5);
        
        // Buscar el marcador correspondiente y abrirlo
        const marker = markers.find(m => m.options.countryId == country.id);
        if (marker) {
          marker.openPopup();
        }
        
        // Mostrar detalles del país
        showCountryDetails(country.id);
      } 
      // Si hay múltiples resultados, ajustar la vista para mostrarlos todos
      else {
        const points = matchedCountries
          .filter(country => country.latitude && country.longitude)
          .map(country => [country.latitude, country.longitude]);
        
        if (points.length > 0) {
          const bounds = L.latLngBounds(points);
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }
});

// Función para mostrar detalles del país
function showCountryDetails(countryId) {
  const infoDiv = document.getElementById('info');
  infoDiv.innerHTML = '<p>Cargando información...</p>';
  
  fetch(`/api/countries/${countryId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('No se pudo obtener la información del país');
      }
      return response.json();
    })
    .then(country => {
      // Mostrar información básica del país
      let infoHTML = `
        <h3>${country.name}</h3>
        <p><strong>Capital:</strong> ${country.capital}</p>
        <p><strong>Población:</strong> ${country.population?.toLocaleString()}</p>
        <p><strong>Área:</strong> ${country.area?.toLocaleString()} km²</p>
        <p><strong>Idioma:</strong> ${country.language}</p>
        <p><strong>Moneda:</strong> ${country.currency}</p>
        <h4>Historia</h4>
        <p>${country.history || 'No hay información disponible'}</p>
      `;
      
      // Cargar lugares famosos del país
      fetch(`/api/countries/${countryId}/landmarks`)
        .then(response => response.json())
        .then(landmarks => {
          if (landmarks && landmarks.length > 0) {
            infoHTML += '<h4>Lugares Famosos</h4><ul>';
            landmarks.forEach(landmark => {
              infoHTML += `<li>
                <strong>${landmark.name}</strong>
                ${landmark.description ? `<p>${landmark.description}</p>` : ''}
                ${landmark.latitude && landmark.longitude ? 
                  `<button onclick="showLandmarkOnMap(${landmark.latitude}, ${landmark.longitude}, '${landmark.name}')">
                    Ver en el mapa
                  </button>` : ''}
              </li>`;
            });
            infoHTML += '</ul>';
          }
          infoDiv.innerHTML = infoHTML;
        })
        .catch(error => {
          console.error('Error cargando lugares famosos:', error);
          infoDiv.innerHTML = infoHTML; // Mostrar al menos la información básica
        });
    })
    .catch(error => {
      console.error('Error:', error);
      infoDiv.innerHTML = '<p>Error al cargar los detalles. Por favor, intenta más tarde.</p>';
    });
}

// Función para mostrar un lugar famoso en el mapa
function showLandmarkOnMap(lat, lng, name) {
  map.setView([lat, lng], 12);
  
  // Crear un marcador temporal para el lugar famoso
  const landmarkMarker = L.marker([lat, lng])
    .addTo(map)
    .bindPopup(`<h4>${name}</h4>`)
    .openPopup();
  
  // Opcional: eliminar el marcador después de un tiempo
  setTimeout(() => {
    map.removeLayer(landmarkMarker);
  }, 10000); // 10 segundos
}
// Theme functionality
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  
  if (currentTheme === 'dark') {
    html.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  } else {
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }
}

function checkSavedTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
  checkSavedTheme();
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
});

// Your existing wonders functionality
const wonders = [
  // ... (your existing wonders array)
];

// ... (all your existing wonder-related functions)