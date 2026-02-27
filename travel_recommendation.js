// Obtener referencias a los elementos del DOM
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");
const resultsContainer = document.createElement("div");

// Configurar el contenedor de resultados
resultsContainer.className = "results-container";
document.querySelector(".hero-section").appendChild(resultsContainer);

// Función para obtener datos del archivo JSON
async function fetchTravelData() {
  try {
    console.log("Intentando cargar travel_recommendation_api.json...");
    const response = await fetch("travel_recommendation_api.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Datos cargados exitosamente:", data);
    return data;
  } catch (error) {
    console.error("Error fetching travel data:", error);
    return null;
  }
}

// Función para normalizar texto (convertir a minúsculas y eliminar espacios extras)
function normalizeText(text) {
  return text.toLowerCase().trim();
}

// Función para obtener la zona horaria basada en el país o ciudad
function getTimeZone(country, city) {
  const timeZones = {
    // Países
    "Australia": "Australia/Sydney",
    "Japan": "Asia/Tokyo",
    "Brazil": "America/Sao_Paulo",
    "Cambodia": "Asia/Phnom_Penh",
    "India": "Asia/Kolkata",
    "French Polynesia": "Pacific/Tahiti",
    
    // Ciudades específicas
    "Sydney": "Australia/Sydney",
    "Melbourne": "Australia/Melbourne",
    "Tokyo": "Asia/Tokyo",
    "Kyoto": "Asia/Tokyo",
    "Rio de Janeiro": "America/Sao_Paulo",
    "São Paulo": "America/Sao_Paulo",
    "Angkor Wat": "Asia/Phnom_Penh",
    "Taj Mahal": "Asia/Kolkata",
    "Bora Bora": "Pacific/Tahiti",
    "Copacabana Beach": "America/Sao_Paulo"
  };
  
  // Buscar primero por ciudad, luego por país
  return timeZones[city] || timeZones[country] || "UTC";
}

// Función para obtener la hora actual en una zona horaria específica
function getLocalTime(timeZone) {
  try {
    const options = {
      timeZone: timeZone,
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    
    const timeString = new Date().toLocaleTimeString('en-US', options);
    return timeString;
  } catch (error) {
    console.error(`Error getting time for ${timeZone}:`, error);
    return "Time not available";
  }
}

// Función para buscar coincidencias basadas en palabras clave
function searchRecommendations(data, keyword) {
  const normalizedKeyword = normalizeText(keyword);
  const results = [];

  // Palabras clave relacionadas
  const beachKeywords = ["beach", "beaches", "playa", "playas"];
  const templeKeywords = ["temple", "temples", "templo", "templos"];
  const countryKeywords = ["country", "countries", "pais", "países"];

  // Determinar qué categorías buscar basado en la palabra clave
  if (beachKeywords.some((k) => normalizedKeyword.includes(k))) {
    // Buscar en playas
    if (data.beaches) {
      results.push(...data.beaches);
    }
  } else if (templeKeywords.some((k) => normalizedKeyword.includes(k))) {
    // Buscar en templos
    if (data.temples) {
      results.push(...data.temples);
    }
  } else if (
    countryKeywords.some((k) => normalizedKeyword.includes(k)) ||
    data.countries.some((country) =>
      normalizeText(country.name).includes(normalizedKeyword),
    )
  ) {
    // Buscar en países (mostrar ciudades)
    data.countries.forEach((country) => {
      if (normalizeText(country.name).includes(normalizedKeyword)) {
        country.cities.forEach((city) => {
          results.push({
            name: city.name,
            imageUrl: city.imageUrl,
            description: city.description,
            country: country.name,
          });
        });
      } else {
        // Buscar en ciudades específicas
        country.cities.forEach((city) => {
          if (normalizeText(city.name).includes(normalizedKeyword)) {
            results.push({
              name: city.name,
              imageUrl: city.imageUrl,
              description: city.description,
              country: country.name,
            });
          }
        });
      }
    });
  } else {
    // Búsqueda general en todas las categorías
    // Buscar en playas
    if (data.beaches) {
      data.beaches.forEach((item) => {
        if (
          normalizeText(item.name).includes(normalizedKeyword) ||
          normalizeText(item.description).includes(normalizedKeyword)
        ) {
          results.push(item);
        }
      });
    }

    // Buscar en templos
    if (data.temples) {
      data.temples.forEach((item) => {
        if (
          normalizeText(item.name).includes(normalizedKeyword) ||
          normalizeText(item.description).includes(normalizedKeyword)
        ) {
          results.push(item);
        }
      });
    }

    // Buscar en ciudades
    data.countries.forEach((country) => {
      country.cities.forEach((city) => {
        if (
          normalizeText(city.name).includes(normalizedKeyword) ||
          normalizeText(city.description).includes(normalizedKeyword)
        ) {
          results.push({
            name: city.name,
            imageUrl: city.imageUrl,
            description: city.description,
            country: country.name,
          });
        }
      });
    });
  }

  return results;
}

// Función para truncar texto si es muy largo
function truncateText(text, maxLength = 100) {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
}

// Función para extraer ciudad y país del nombre
function extractLocationInfo(name) {
  const parts = name.split(',');
  if (parts.length > 1) {
    return {
      city: parts[0].trim(),
      country: parts[1].trim()
    };
  }
  return {
    city: name,
    country: ""
  };
}

// Función para mostrar resultados
function displayResults(results) {
  resultsContainer.innerHTML = "";

  if (results.length === 0) {
    resultsContainer.innerHTML =
      '<p class="no-results">No recommendations found. Try different keywords!</p>';
    return;
  }

  results.forEach((item) => {
    const resultCard = document.createElement("div");
    resultCard.className = "result-card";

    // Extraer información de ubicación
    const locationInfo = extractLocationInfo(item.name);
    const timeZone = getTimeZone(locationInfo.country, locationInfo.city);
    const localTime = getLocalTime(timeZone);

    resultCard.innerHTML = `
      <img src="${item.imageUrl}" alt="${item.name}" onerror="this.src='images/placeholder.jpg'">
      <div class="result-info">
        <h3 title="${item.name}">${item.name} ${item.country ? `- ${item.country}` : ''}</h3>
        <p class="result-description" title="${item.description}">${truncateText(item.description, 100)}</p>
        <div class="time-info">
          <span class="time-label">Local Time:</span>
          <span class="time-value">${localTime}</span>
        </div>
      </div>
    `;

    resultsContainer.appendChild(resultCard);
  });
}

// Función para manejar la búsqueda
async function handleSearch() {
  const keyword = searchInput.value.trim();

  if (!keyword) {
    alert("Please enter a search keyword");
    return;
  }

  const data = await fetchTravelData();
  if (data) {
    const results = searchRecommendations(data, keyword);
    displayResults(results);
  }
}

// Función para resetear la búsqueda
function handleReset() {
  searchInput.value = "";
  resultsContainer.innerHTML = "";
}

// Event listeners
searchBtn.addEventListener("click", handleSearch);
resetBtn.addEventListener("click", handleReset);

// Permitir búsqueda con Enter
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleSearch();
  }
});