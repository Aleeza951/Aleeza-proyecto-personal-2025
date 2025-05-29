// Sample data - in a real app, this would come from your API
const explorersData = [
  {
    id: 1,
    name: "Cristóbal Colón",
    country: "España",
    country_code: "es",
    birth_year: 1451,
    death_year: 1506,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Christopher_Columbus.PNG/220px-Christopher_Columbus.PNG",
    achievements: "Descubrió América en 1492 mientras buscaba una ruta occidental a las Indias.",
    biography: "Navegante genovés al servicio de la Corona de Castilla, famoso por haber realizado el descubrimiento de América en 1492. Realizó cuatro viajes a través del Océano Atlántico que llevaron al conocimiento europeo del continente americano.",
    expeditions: [
      { year: 1492, route: "España → Bahamas → Cuba → La Española" },
      { year: 1493, route: "España → Antillas Menores → Puerto Rico → Jamaica" },
      { year: 1498, route: "España → Trinidad → Venezuela" },
      { year: 1502, route: "España → América Central" }
    ],
    routes: [
      { latlngs: [[37.38, -6.00], [28.21, -16.60], [25.06, -77.34]], color: "#3498db" },
      { latlngs: [[37.38, -6.00], [17.07, -61.80], [18.42, -77.10]], color: "#e74c3c" }
    ]
  },
  // Add more explorers following the same structure
  {
    id: 2,
    name: "Fernando de Magallanes",
    country: "Portugal",
    country_code: "pt",
    birth_year: 1480,
    death_year: 1521,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Ferdinand_Magellan.jpg/220px-Ferdinand_Magellan.jpg",
    achievements: "Organizó la primera circunnavegación de la Tierra, aunque murió durante el viaje.",
    biography: "Explorador portugués que organizó la expedición española que resultó en la primera circunnavegación de la Tierra. Murió en las Filipinas durante la expedición, que fue completada por Juan Sebastián Elcano.",
    expeditions: [
      { year: 1519, route: "España → Sudamérica → Estrecho de Magallanes → Filipinas" }
    ],
    routes: [
      { latlngs: [[37.38, -6.00], [-34.61, -58.37], [-52.40, -70.91], [10.72, 122.56]], color: "#2ecc71" }
    ]
  }
];

document.addEventListener('DOMContentLoaded', async function() {
  try {
    // In a real app, you would fetch this from your API:
    // const response = await fetch('/api/explorers');
    // const explorers = await response.json();
    
    // For this example, we'll use the sample data:
    const explorers = explorersData;
    
    // Initialize the page
    renderExplorers(explorers);
    setupCountryFilter(explorers);
    initExplorersMap(explorers);
    initTimeline(explorers);
    
    // Setup event listeners
    setupEventListeners(explorers);
    
  } catch (error) {
    console.error('Error:', error);
    showError('Error al cargar los datos de exploradores');
  }
});

function renderExplorers(explorers) {
  const container = document.getElementById('explorers-list');
  container.innerHTML = '';
  
  if (explorers.length === 0) {
    container.innerHTML = '<p class="no-results">No se encontraron exploradores con estos criterios.</p>';
    return;
  }
  
  explorers.forEach(explorer => {
    const card = document.createElement('div');
    card.className = 'explorer-card';
    card.innerHTML = `
      <div class="explorer-image-container">
        <img src="${explorer.image}" alt="${explorer.name}" class="explorer-image">
        <div class="nationality-flag fi fi-${explorer.country_code}"></div>
      </div>
      <div class="explorer-info">
        <h3>${explorer.name}</h3>
        <div class="meta-info">
          <span class="country">${explorer.country}</span>
          <span class="years">${explorer.birth_year || '?'} - ${explorer.death_year || '?'}</span>
        </div>
        <p class="achievements">${explorer.achievements}</p>
        <button class="btn-more-info" data-id="${explorer.id}">
          <i class="fas fa-info-circle"></i> Más información
        </button>
      </div>
    `;
    container.appendChild(card);
    
    // Add click event for modal
    card.querySelector('.btn-more-info').addEventListener('click', () => showExplorerDetails(explorer));
  });
}

function setupCountryFilter(explorers) {
  const filter = document.getElementById('country-filter');
  
  // Get unique countries
  const countries = [...new Set(explorers.map(e => e.country))];
  
  // Add options
  countries.sort().forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    filter.appendChild(option);
  });
}

function initExplorersMap(explorers) {
  const map = L.map('explorers-map').setView([20, 0], 2);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  // Add routes for each explorer
  explorers.forEach(explorer => {
    explorer.routes?.forEach(route => {
      L.polyline(route.latlngs, {color: route.color}).addTo(map)
        .bindPopup(`<b>${explorer.name}</b><br>${explorer.country}`);
    });
  });
}

function initTimeline(explorers) {
  // Prepare timeline data
  const timelineData = explorers.map(explorer => ({
    x: explorer.name,
    y: [
      new Date(explorer.birth_year, 0).getTime(),
      new Date(explorer.death_year || explorer.birth_year + 70, 0).getTime()
    ],
    fillColor: getRandomColor()
  }));
  
  const options = {
    series: [{
      data: timelineData
    }],
    chart: {
      type: 'rangeBar',
      height: 350,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        formatter: function(val) {
          return new Date(val).getFullYear();
        }
      }
    },
    tooltip: {
      custom: function({ seriesIndex, dataPointIndex, w }) {
        const explorer = explorers[dataPointIndex];
        return `
          <div class="timeline-tooltip">
            <strong>${explorer.name}</strong><br>
            <span>${explorer.birth_year} - ${explorer.death_year || '?'}</span><br>
            <small>${explorer.country}</small>
          </div>
        `;
      }
    }
  };
  
  const chart = new ApexCharts(document.querySelector("#exploration-timeline"), options);
  chart.render();
}

function setupEventListeners(explorers) {
  // Search and filter
  document.getElementById('explorer-search').addEventListener('input', (e) => {
    filterExplorers(explorers);
  });
  
  document.getElementById('country-filter').addEventListener('change', () => {
    filterExplorers(explorers);
  });
  
  document.getElementById('century-filter').addEventListener('change', () => {
    filterExplorers(explorers);
  });
  
  document.getElementById('sort-explorers').addEventListener('change', () => {
    filterExplorers(explorers);
  });
  
  // Close modal
  document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('explorer-modal').style.display = 'none';
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('explorer-modal')) {
      document.getElementById('explorer-modal').style.display = 'none';
    }
  });
}

function filterExplorers(allExplorers) {
  const searchTerm = document.getElementById('explorer-search').value.toLowerCase();
  const countryFilter = document.getElementById('country-filter').value;
  const centuryFilter = document.getElementById('century-filter').value;
  const sortValue = document.getElementById('sort-explorers').value;
  
  let filtered = allExplorers.filter(explorer => {
    // Search filter
    const matchesSearch = explorer.name.toLowerCase().includes(searchTerm) || 
                         explorer.achievements.toLowerCase().includes(searchTerm);
    
    // Country filter
    const matchesCountry = countryFilter === 'all' || explorer.country === countryFilter;
    
    // Century filter
    let matchesCentury = true;
    if (centuryFilter !== 'all' && explorer.birth_year) {
      const startYear = parseInt(centuryFilter) * 100;
      matchesCentury = explorer.birth_year >= startYear && explorer.birth_year < startYear + 100;
    }
    
    return matchesSearch && matchesCountry && matchesCentury;
  });
  
  // Sorting
  const [sortField, sortDirection] = sortValue.split('-');
  
  filtered.sort((a, b) => {
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else if (sortField === 'year') {
      const yearA = a.birth_year || 0;
      const yearB = b.birth_year || 0;
      return sortDirection === 'asc' ? yearA - yearB : yearB - yearA;
    }
    return 0;
  });
  
  renderExplorers(filtered);
}

function showExplorerDetails(explorer) {
  const modal = document.getElementById('explorer-modal');
  const content = document.getElementById('modal-content');
  
  content.innerHTML = `
    <div class="modal-grid">
      <div class="modal-image">
        <img src="${explorer.image}" alt="${explorer.name}">
        <div class="modal-meta">
          <p><strong>Nacionalidad:</strong> ${explorer.country}</p>
          <p><strong>Vida:</strong> ${explorer.birth_year || '?'} - ${explorer.death_year || '?'}</p>
          <p><strong>Logros principales:</strong> ${explorer.achievements}</p>
        </div>
      </div>
      <div class="modal-bio">
        <h3>Biografía</h3>
        <p>${explorer.biography || 'Información biográfica no disponible.'}</p>
        
        <h3>Expediciones importantes</h3>
        <ul class="expeditions-list">
          ${explorer.expeditions?.map(e => `
            <li>
              <strong>${e.year}:</strong> ${e.route}
            </li>
          `).join('') || '<li>No hay información detallada de expediciones</li>'}
        </ul>
      </div>
    </div>
  `;
  
  modal.style.display = 'block';
}

function showError(message) {
  const container = document.getElementById('explorers-list');
  container.innerHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <p>${message}</p>
    </div>
  `;
}

function getRandomColor() {
  const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
  return colors[Math.floor(Math.random() * colors.length)];
}