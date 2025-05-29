document.addEventListener('DOMContentLoaded', function() {
  // Inicializar el mapa circular en la página de inicio
  if (document.getElementById('world-map')) {
    console.log('Inicializando mapa mundial');
    
    // Inicializar el mapa centrado en [0, 0] con zoom 2
    const map = L.map('world-map', {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 6,
      zoomControl: true,
      scrollWheelZoom: true,
      worldCopyJump: true
    });
    
    // Añadir capa de mapa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Hacer que el mapa tenga forma circular con CSS
    document.getElementById('world-map').classList.add('circular-map');
    
    // Cargar los países
    loadCountries(map);
    
    // Añadir funcionalidad de búsqueda
    const searchInput = document.getElementById('country-search-input');
    const searchButton = document.getElementById('search-button');
    
    if (searchInput && searchButton) {
      console.log('Configurando eventos de búsqueda');
      
      // Evento para el botón de búsqueda
      searchButton.addEventListener('click', function() {
        console.log('Botón de búsqueda clickeado');
        const searchTerm = searchInput.value;
        
        if (searchTerm.trim()) {
          // Realizar la búsqueda
          searchCountry(searchTerm, map);
        }
      });
      
      // Evento para buscar al presionar Enter
      searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          console.log('Enter presionado en la búsqueda');
          const searchTerm = this.value;
          
          if (searchTerm.trim()) {
            // Realizar la búsqueda
            searchCountry(searchTerm, map);
          }
        }
      });
      
      // Evento para filtrar mientras se escribe
      searchInput.addEventListener('input', function() {
        console.log('Búsqueda en tiempo real:', this.value);
        
        // Filtrar países
        filterCountries(this.value, map);
      });
    } else {
      console.error('No se encontraron los elementos de búsqueda');
      console.log('searchInput:', searchInput);
      console.log('searchButton:', searchButton);
    }
  }
});

// Función para cargar los países
async function loadCountries(map) {
  try {
    const response = await fetch('/api/countries');
    if (!response.ok) {
      throw new Error('Error al cargar los países');
    }
    
    const countries = await response.json();
    
    // Verificar si hay países
    if (!countries || countries.length === 0) {
      document.getElementById('countries-list').innerHTML = '<p>No hay países disponibles.</p>';
      return;
    }
    
    console.log('Países cargados correctamente:', countries.length);
    
    // Ordenar países alfabéticamente
    countries.sort((a, b) => a.name.localeCompare(b.name));
    
    // Crear lista de países
    const countriesList = document.getElementById('countries-list');
    let listHTML = '<ul class="countries-list">';
    
    // Variable para almacenar todos los marcadores
    const markers = [];
    
    // Añadir marcadores para cada país
    countries.forEach(country => {
      if (country.latitude && country.longitude) {
        // Crear un icono personalizado para el marcador
        const customIcon = L.icon({
          iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
          shadowSize: [41, 41]
        });
        
        // Añadir marcador al mapa
        const marker = L.marker([country.latitude, country.longitude], {
          icon: customIcon,
          title: country.name
        }).addTo(map)
          .bindPopup(`
            <h3>${country.name}</h3>
            <p><strong>Capital:</strong> ${country.capital || 'No disponible'}</p>
            <a href="/atlas" onclick="sessionStorage.setItem('selectedCountry', '${country.id}'); return true;">
              Ver detalles
            </a>
          `);
        
        // Almacenar el marcador con referencia al país
        marker.countryId = country.id;
        marker.countryName = country.name;
        markers.push(marker);
        
        // Añadir país a la lista
        listHTML += `
          <li data-id="${country.id}" data-lat="${country.latitude}" data-lng="${country.longitude}">
            <i class="fas fa-map-marker-alt"></i>
            <a href="#" class="country-link">${country.name}</a>
          </li>
        `;
      }
    });
    
    listHTML += '</ul>';
    countriesList.innerHTML = listHTML;
    
    // Añadir evento de clic a los elementos de la lista
    addCountryClickEvents(map, markers);
    
    // Almacenar la referencia a los países y marcadores para la búsqueda
    window.countriesData = {
      countries: countries,
      markers: markers,
      map: map
    };
    
    console.log('Países cargados:', countries.length);
    console.log('Marcadores creados:', markers.length);
    
  } catch (error) {
    console.error('Error cargando países:', error);
    document.getElementById('countries-list').innerHTML = '<p>Error al cargar los datos. Por favor, intenta más tarde.</p>';
  }
}

// Función para añadir eventos de clic a los países
function addCountryClickEvents(map, markers) {
  document.querySelectorAll('.countries-list li').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const lat = parseFloat(this.getAttribute('data-lat'));
      const lng = parseFloat(this.getAttribute('data-lng'));
      const id = this.getAttribute('data-id');
      
      // Centrar el mapa en el país
      map.setView([lat, lng], 5);
      
      // Buscar el marcador correspondiente y abrirlo
      const marker = markers.find(m => m.countryId == id);
      if (marker) {
        marker.openPopup();
      }
      
      // Guardar el ID del país seleccionado para usarlo en la página del atlas
      sessionStorage.setItem('selectedCountry', id);
    });
  });
}

// Función para filtrar países según el término de búsqueda
function filterCountries(searchTerm, map) {
  console.log('Filtrando países con término:', searchTerm);
  
  // Verificar si tenemos datos de países
  if (!window.countriesData) {
    console.error('No hay datos de países disponibles');
    return;
  }
  
  const { countries, markers } = window.countriesData;
  
  // Si el término de búsqueda está vacío, mostrar todos los países
  if (!searchTerm.trim()) {
    console.log('Término vacío, mostrando todos los países');
    
    // Restaurar la lista completa de países
    const countriesList = document.getElementById('countries-list');
    let listHTML = '<ul class="countries-list">';
    
    countries.forEach(country => {
      if (country.latitude && country.longitude) {
        listHTML += `
          <li data-id="${country.id}" data-lat="${country.latitude}" data-lng="${country.longitude}">
            <i class="fas fa-map-marker-alt"></i>
            <a href="#" class="country-link">${country.name}</a>
          </li>
        `;
      }
    });
    
    listHTML += '</ul>';
    countriesList.innerHTML = listHTML;
    
    // Volver a añadir los eventos de clic
    addCountryClickEvents(map, markers);
    
    // Restaurar la vista del mapa
    map.setView([20, 0], 2);
    
    // Mostrar todos los marcadores
    markers.forEach(marker => {
      if (!map.hasLayer(marker)) {
        marker.addTo(map);
      }
    });
    
    return;
  }
  
  searchTerm = searchTerm.toLowerCase();
  console.log('Buscando países que contengan:', searchTerm);
  
  // Filtrar países que coincidan con el término de búsqueda (incluso parcialmente)
  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(searchTerm)
  );
  
  console.log('Países filtrados:', filteredCountries.length);
  
  // Actualizar la lista de países
  const countriesList = document.getElementById('countries-list');
  
  if (filteredCountries.length === 0) {
    countriesList.innerHTML = '<p>No se encontraron países que coincidan con la búsqueda.</p>';
    return;
  }
  
  let listHTML = '<ul class="countries-list">';
  
  filteredCountries.forEach(country => {
    if (country.latitude && country.longitude) {
      listHTML += `
        <li data-id="${country.id}" data-lat="${country.latitude}" data-lng="${country.longitude}" class="highlighted">
          <i class="fas fa-map-marker-alt"></i>
          <a href="#" class="country-link">${country.name}</a>
        </li>
      `;
    }
  });
  
  listHTML += '</ul>';
  countriesList.innerHTML = listHTML;
  
  // Volver a añadir los eventos de clic
  addCountryClickEvents(map, markers);
  
  // Primero, ocultar todos los marcadores
  markers.forEach(marker => {
    map.removeLayer(marker);
  });
  
  // Luego, mostrar solo los marcadores de los países filtrados
  const filteredMarkers = markers.filter(marker => 
    filteredCountries.some(country => country.id == marker.countryId)
  );
  
  filteredMarkers.forEach(marker => {
    marker.addTo(map);
  });
  
  console.log('Marcadores filtrados:', filteredMarkers.length);
}

// Función para buscar un país específico
function searchCountry(searchTerm, map) {
  console.log('Buscando país:', searchTerm);
  
  if (!window.countriesData) {
    console.error('No hay datos de países disponibles');
    return;
  }
  
  const { countries, markers } = window.countriesData;
  
  // Convertir a minúsculas para comparación
  searchTerm = searchTerm.toLowerCase();
  
  // Buscar países que coincidan con el término de búsqueda
  const matchedCountries = countries.filter(country => 
    country.name.toLowerCase().includes(searchTerm)
  );
  
  console.log('Países encontrados:', matchedCountries.length);
  
  if (matchedCountries.length === 0) {
    alert('No se encontraron países que coincidan con la búsqueda.');
    return;
  }
  
  // Filtrar la lista de países
  filterCountries(searchTerm, map);
  
  // Si solo hay un resultado, centrar el mapa en ese país y mostrar un punto destacado
  if (matchedCountries.length === 1) {
    const country = matchedCountries[0];
    
    // Centrar el mapa en el país
    map.setView([country.latitude, country.longitude], 5);
    
    // Buscar el marcador correspondiente y abrirlo
    const marker = markers.find(m => m.countryId == country.id);
    if (marker) {
      // Destacar el marcador
      marker.addTo(map);
      marker.openPopup();
    }
  } 
  // Si hay múltiples resultados, ajustar la vista para mostrarlos todos
  else {
    // Crear un grupo de marcadores para los países encontrados
    const points = matchedCountries
      .filter(country => country.latitude && country.longitude)
      .map(country => [country.latitude, country.longitude]);
    
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }
}
