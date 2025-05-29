
// Variables globales
let map;
let countriesLayer;

// Inicializar el mapa cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM cargado, inicializando mapa...");
  
  // Crear el mapa centrado en el mundo
  map = L.map('map').setView([20, 0], 2);
  
  // Añadir capa de mapa base
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  // Cargar datos GeoJSON de países
  fetch('/static/data/countries.geojson')
    .then(response => response.json())
    .then(data => {
      console.log("Datos GeoJSON cargados");
      
      // Asignar continentes a los países
      data.features.forEach(feature => {
        // Asignar continente basado en el código de país (simplificado)
        const code = feature.properties.iso_a2;
        
        // Asignación simplificada basada en códigos de país
        if (['DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG', 'CD', 'DJ', 'EG', 'GQ', 'ER', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'CI', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'].includes(code)) {
          feature.properties.continent = 'africa';
        } else if (['AF', 'AM', 'AZ', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'CY', 'GE', 'IN', 'ID', 'IR', 'IQ', 'IL', 'JP', 'JO', 'KZ', 'KW', 'KG', 'LA', 'LB', 'MY', 'MV', 'MN', 'MM', 'NP', 'KP', 'OM', 'PK', 'PS', 'PH', 'QA', 'SA', 'SG', 'KR', 'LK', 'SY', 'TW', 'TJ', 'TH', 'TL', 'TR', 'TM', 'AE', 'UZ', 'VN', 'YE'].includes(code)) {
          feature.properties.continent = 'asia';
        } else if (['AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'MD', 'MC', 'ME', 'NL', 'MK', 'NO', 'PL', 'PT', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES', 'SE', 'CH', 'UA', 'GB', 'VA'].includes(code)) {
          feature.properties.continent = 'europe';
        } else if (['AG', 'BS', 'BB', 'BZ', 'CA', 'CR', 'CU', 'DM', 'DO', 'SV', 'GD', 'GT', 'HT', 'HN', 'JM', 'MX', 'NI', 'PA', 'KN', 'LC', 'VC', 'TT', 'US'].includes(code)) {
          feature.properties.continent = 'north_america';
        } else if (['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE'].includes(code)) {
          feature.properties.continent = 'south_america';
        } else if (['AU', 'FJ', 'KI', 'MH', 'FM', 'NR', 'NZ', 'PW', 'PG', 'WS', 'SB', 'TO', 'TV', 'VU'].includes(code)) {
          feature.properties.continent = 'oceania';
        } else if (['AQ'].includes(code)) {
          feature.properties.continent = 'antarctica';
        } else {
          feature.properties.continent = 'unknown';
        }
      });
      
      // Crear capa de países
      countriesLayer = L.geoJSON(data, {
        style: function(feature) {
          return {
            fillColor: '#3388ff',
            weight: 1,
            opacity: 1,
            color: '#ffffff',
            fillOpacity: 0.7
          };
        },
        onEachFeature: function(feature, layer) {
          // Popup con información del país
          layer.bindPopup(`
            <div class="country-popup">
              <h3>${feature.properties.name}</h3>
              <p><strong>Capital:</strong> ${feature.properties.capital || 'No disponible'}</p>
              <p><strong>Población:</strong> ${feature.properties.population ? feature.properties.population.toLocaleString() : 'No disponible'}</p>
              <a href="/country/${feature.properties.iso_a2}" class="btn">Ver detalles</a>
            </div>
          `);
          
          // Eventos de hover
          layer.on({
            mouseover: function(e) {
              const layer = e.target;
              layer.setStyle({
                weight: 2,
                fillOpacity: 0.9
              });
            },
            mouseout: function(e) {
              countriesLayer.resetStyle(e.target);
            }
          });
        }
      }).addTo(map);
      
      // Añadir evento al filtro de continentes
      const continentFilter = document.getElementById('continent-filter');
      
      if (continentFilter) {
        continentFilter.addEventListener('change', filterByContinent);
      } else {
        console.error("No se encontró el elemento del filtro de continentes");
        // Intenta añadir el evento después de un retraso
        setTimeout(function() {
          const retryFilter = document.getElementById('continent-filter');
          if (retryFilter) {
            retryFilter.addEventListener('change', filterByContinent);
            console.log("Evento añadido al filtro después de retraso");
          }
        }, 1000);
      }
    })
    .catch(error => {
      console.error("Error al cargar los datos GeoJSON:", error);
    });
});

// Función para filtrar por continente
function filterByContinent() {
  console.log("Función filterByContinent ejecutada");
  const selectedContinent = this.value;
  console.log("Continente seleccionado:", selectedContinent);
  
  if (!countriesLayer) {
    console.error("La capa de países no está disponible");
    return;
  }
  
  countriesLayer.eachLayer(function(layer) {
    const countryContinent = layer.feature.properties.continent;
    
    if (selectedContinent === 'all' || countryContinent === selectedContinent) {
      // Mostrar países del continente seleccionado
      layer.setStyle({
        fillColor: '#3388ff',
        fillOpacity: 0.7,
        weight: 1
      });
    } else {
      // Atenuar países de otros continentes
      layer.setStyle({
        fillColor: '#cccccc',
        fillOpacity: 0.3,
        weight: 0.5
      });
    }
  });
}

// Añadir evento al filtro después de que la página esté completamente cargada
window.onload = function() {
  console.log("Ventana cargada, intentando añadir evento al filtro");
  const continentFilter = document.getElementById('continent-filter');
  
  if (continentFilter) {
    continentFilter.addEventListener('change', filterByContinent);
    console.log("Evento añadido al filtro en window.onload");
  } else {
    console.error("No se encontró el elemento del filtro en window.onload");
  }
};
