
"use strict";

// ========================================
// MOCHI WEATHER ☁️
// Real weather powered by Open-Meteo
// ========================================

// 1. HTML elements

const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");
const statusMessage = document.getElementById("statusMessage");

const currentCard = document.getElementById("currentCard");
const cityName = document.getElementById("cityName");
const currentDate = document.getElementById("currentDate");
const currentTemp = document.getElementById("currentTemp");
const currentCondition = document.getElementById("currentCondition");
const currentSticker = document.getElementById("currentSticker");
const conditionIcon = document.getElementById("conditionIcon");
const feelsLike = document.getElementById("feelsLike");
const detailFeelsLike = document.getElementById("detailFeelsLike");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const dayMessage = document.getElementById("dayMessage");

const morningCard = document.getElementById("morningCard");
const morningTime = document.getElementById("morningTime");
const morningTemp = document.getElementById("morningTemp");
const morningCondition = document.getElementById("morningCondition");
const morningCharacter = document.getElementById("morningCharacter");
const morningMessage = document.getElementById("morningMessage");

const eveningCard = document.getElementById("eveningCard");
const eveningTime = document.getElementById("eveningTime");
const eveningTemp = document.getElementById("eveningTemp");
const eveningCondition = document.getElementById("eveningCondition");
const eveningCharacter = document.getElementById("eveningCharacter");
const eveningMessage = document.getElementById("eveningMessage");


// 2. Weather descriptions and themes

function getWeatherInfo(code, isDay = true, wind = 0) {
  if (code === 0) {
    return isDay
      ? {
          condition: "Clear sky",
          theme: "sunny",
          icon: "☀️",
          character: "🌼",
          message: "A little sunshine makes everything brighter!"
        }
      : {
          condition: "Clear night",
          theme: "nightly",
          icon: "🌙",
          character: "🌙",
          message: "A peaceful little night under the stars."
        };
  }

  if (code === 1 || code === 2) {
    return {
      condition: "Partly cloudy",
      theme: "partlyCloudy",
      icon: isDay ? "🌤️" : "☁️",
      character: "🌷",
      message: "A little sun, a little cloud, lots of cozy vibes."
    };
  }

  if (code === 3) {
    return {
      condition: "Cloudy",
      theme: "cloudy",
      icon: "☁️",
      character: "🧸",
      message: "Perfect weather for a warm drink and a soft blanket."
    };
  }

  if (code === 45 || code === 48) {
    return {
      condition: "Foggy",
      theme: "foggy",
      icon: "🌫️",
      character: "🧣",
      message: "The world is wearing a little blanket of mist."
    };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return {
      condition: "Drizzle",
      theme: "rainy",
      icon: "🌦️",
      character: "☂️",
      message: "Tiny raindrops are dancing outside. Stay cozy!"
    };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return {
      condition: "Rainy",
      theme: "rainy",
      icon: "🌧️",
      character: "☔",
      message: "Grab your umbrella and enjoy the rainy-day magic."
    };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      condition: "Snowy",
      theme: "snowy",
      icon: "❄️",
      character: "⛄",
      message: "Everything feels a little more magical in the snow."
    };
  }

  if ([95, 96, 99].includes(code)) {
    return {
      condition: "Stormy",
      theme: "stormy",
      icon: "⛈️",
      character: "🐈‍⬛",
      message: "Stay safe and cozy indoors during thunderstorms."
    };
  }

  if (wind >= 30) {
    return {
      condition: "Windy",
      theme: "windy",
      icon: "🍃",
      character: "🍃",
      message: "The breeze is dancing through the trees today."
    };
  }

  return {
    condition: "Changing skies",
    theme: "cloudy",
    icon: "🌥️",
    character: "🌷",
    message: "Your sky has a little story to tell."
  };
}


// 3. Match each weather condition to its artwork.
// Keep these filenames identical to your assets folder.

function getWeatherImage(info) {
  const images = {
    sunny: "sunny.png",
    cloudy: "cloudy.png",
    rainy: "rainy.png",
    stormy: "stormy.png",
    snowy: "snowy.png",
    windy: "windy.png",
    partlyCloudy: "partlyCloudy.png",
    foggy: "foggy.png",
    hazy: "hazy.png",
    nightly: "nightly.png"
  };

  return `assets/${images[info.theme] || "cloudy.png"}`;
}


// 4. Find the city using Open-Meteo geocoding

async function findCity(city) {
  const url = new URL(
    "https://geocoding-api.open-meteo.com/v1/search"
  );

  url.search = new URLSearchParams({
    name: city,
    count: "10",
    language: "en",
    format: "json"
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("City search is temporarily unavailable.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(
      "We couldn't find that city. Check the spelling and try again."
    );
  }

  const exactMatch = data.results.find(
    place => place.name.toLowerCase() === city.trim().toLowerCase()
  );

  return exactMatch || data.results[0];
}


// 5. Fetch live weather and hourly forecasts

async function fetchWeather(latitude, longitude) {
  const url = new URL(
    "https://api.open-meteo.com/v1/forecast"
  );

  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),

    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "weather_code",
      "wind_speed_10m"
    ].join(","),

    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation_probability",
      "weather_code",
      "wind_speed_10m"
    ].join(","),

    timezone: "auto",
    forecast_days: "1",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh"
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      "Weather data couldn't be loaded. Please try again."
    );
  }

  const data = await response.json();

  if (!data.current || !data.hourly) {
    throw new Error("The weather service returned incomplete data.");
  }

  return data;
}


// 6. Format local dates and times

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatTime(timeString) {
  const hour = Number(timeString.slice(11, 13));
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12}:00 ${period}`;
}


// 7. Get a forecast for the requested hour

function getForecastForHour(hourly, targetHour) {
  const targetIndex = hourly.time.findIndex(
    time => Number(time.slice(11, 13)) === targetHour
  );

  if (targetIndex === -1) {
    return null;
  }

  return {
    time: hourly.time[targetIndex],
    temperature: hourly.temperature_2m[targetIndex],
    feelsLike: hourly.apparent_temperature[targetIndex],
    humidity: hourly.relative_humidity_2m[targetIndex],
    precipitationProbability:
      hourly.precipitation_probability?.[targetIndex],
    weatherCode: hourly.weather_code[targetIndex],
    windSpeed: hourly.wind_speed_10m[targetIndex]
  };
}


// 8. Update the main illustrated weather card

function updateCurrentCard(city, weather) {
  const current = weather.current;

  const info = getWeatherInfo(
    current.weather_code,
    current.is_day === 1,
    current.wind_speed_10m
  );

  cityName.textContent = city;
  currentDate.textContent = formatDate(current.time.slice(0, 10));

  currentTemp.textContent =
    `${Math.round(current.temperature_2m)}°C`;

  currentCondition.textContent = info.condition;
  currentSticker.textContent = info.icon;
  conditionIcon.textContent = info.icon;

  feelsLike.textContent =
    `Feels like ${Math.round(current.apparent_temperature)}°C`;

  detailFeelsLike.textContent =
    `${Math.round(current.apparent_temperature)}°C`;

  humidity.textContent = `${current.relative_humidity_2m}%`;

  windSpeed.textContent =
    `${Math.round(current.wind_speed_10m)} km/h`;

  dayMessage.textContent = info.message;

  // CSS uses this image as the card's background.
  // HTML text and detail circles stay separate and readable.
  currentCard.style.setProperty(
    "--weather-art",
    `url("${getWeatherImage(info)}")`
  );

  currentCard.className =
    `current-card weather-theme-${info.theme}`;
}


// 9. Update the morning or evening forecast

function updateForecastCard(forecast, type) {
  const isMorning = type === "morning";

  const elements = isMorning
    ? {
        card: morningCard,
        time: morningTime,
        temp: morningTemp,
        condition: morningCondition,
        character: morningCharacter,
        message: morningMessage
      }
    : {
        card: eveningCard,
        time: eveningTime,
        temp: eveningTemp,
        condition: eveningCondition,
        character: eveningCharacter,
        message: eveningMessage
      };

  if (!forecast) {
    elements.temp.textContent = "--°C";
    elements.condition.textContent = "Unavailable";
    elements.message.textContent =
      "This hourly forecast isn't available.";
    return;
  }

  const info = getWeatherInfo(
    forecast.weatherCode,
    isMorning,
    forecast.windSpeed ?? 0
  );

  elements.time.textContent = formatTime(forecast.time);

  elements.temp.textContent =
    `${Math.round(forecast.temperature)}°C`;

  elements.condition.textContent = info.condition;
  elements.character.textContent = info.character;

  const rainChance = forecast.precipitationProbability;

  elements.message.textContent =
    rainChance == null
      ? info.message
      : `${info.message} Rain chance: ${rainChance}%.`;

  elements.card.style.borderColor =
    getComputedStyle(currentCard)
      .getPropertyValue("--card-accent")
      .trim();
}


// 10. Display status and errors

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}


// 11. Load a city's weather

async function loadWeather(city) {
  const cleanedCity = city.trim();

  if (!cleanedCity) {
    setStatus("Please enter a city name first. 🌷", true);
    return;
  }

  searchButton.disabled = true;
  setStatus(`Finding the weather for ${cleanedCity}... ☁️`);

  try {
    const place = await findCity(cleanedCity);

    const weather = await fetchWeather(
      place.latitude,
      place.longitude
    );

    const locationParts = [
      place.name,
      place.admin1,
      place.country
    ].filter(Boolean);

    const displayCity = [...new Set(locationParts)].join(", ");

    updateCurrentCard(displayCity, weather);

    const morningForecast = getForecastForHour(
      weather.hourly,
      8
    );

    const eveningForecast = getForecastForHour(
      weather.hourly,
      18
    );

    updateForecastCard(morningForecast, "morning");
    updateForecastCard(eveningForecast, "evening");

    setStatus(
      `Your little weather world is ready for ${place.name}! ✨`
    );
  } catch (error) {
    console.error("Mochi Weather error:", error);

    setStatus(
      error.message ||
      "Something went wrong. Please try again.",
      true
    );
  } finally {
    searchButton.disabled = false;
  }
}


// 12. Search when the form is submitted

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  loadWeather(cityInput.value);
});


// 13. Load Gujrat when the page opens

loadWeather(cityInput.value);

console.log("💕 Mochi Weather is ready!");
