
"use strict";

// ==========================================
// MOCHI WEATHER ☁️
// Real weather powered by Open-Meteo
// ==========================================

// 1. Get HTML elements
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
const feelsLike = document.getElementById("feelsLike");
const detailFeelsLike = document.getElementById("detailFeelsLike");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const dayMessage = document.getElementById("dayMessage");
const mainCharacter = document.getElementById("mainCharacter");
const characterCaption = document.getElementById("characterCaption");

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


// 2. Weather-code descriptions
// These codes come from the WMO weather classification.

function getWeatherInfo(code, isDay = true, wind = 0) {
  if (code === 0) {
    if (!isDay) {
      return {
        condition: "Clear night",
        theme: "night",
        icon: "🌙",
        character: "🌙",
        caption: "your sleepy sky friend ♡",
        message: "A peaceful little night under the stars."
      };
    }

    return {
      condition: "Sunny",
      theme: "sunny",
      icon: "☀️",
      character: "🌼",
      caption: "your sunshine friend ♡",
      message: "A little sunshine makes everything brighter!"
    };
  }

  if (code === 1 || code === 2) {
    return {
      condition: "Partly cloudy",
      theme: "cloudy",
      icon: isDay ? "🌤️" : "☁️",
      character: "🌷",
      caption: "your cloud-watching friend ♡",
      message: "A little sun, a little cloud, lots of cozy vibes."
    };
  }

  if (code === 3) {
    return {
      condition: "Cloudy",
      theme: "cloudy",
      icon: "☁️",
      character: "🧸",
      caption: "your cozy cloud friend ♡",
      message: "Perfect weather for a warm drink and a soft blanket."
    };
  }

  if (code === 45 || code === 48) {
    return {
      condition: "Foggy",
      theme: "cloudy",
      icon: "🌫️",
      character: "🧣",
      caption: "your misty morning friend ♡",
      message: "The world is wearing a little blanket of mist."
    };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return {
      condition: "Drizzle",
      theme: "rainy",
      icon: "🌦️",
      character: "☂️",
      caption: "your tiny umbrella friend ♡",
      message: "Tiny raindrops are dancing outside. Stay cozy!"
    };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return {
      condition: "Rainy",
      theme: "rainy",
      icon: "🌧️",
      character: "☔",
      caption: "your rainy-day friend ♡",
      message: "Grab your umbrella and enjoy the rainy-day magic."
    };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      condition: "Snowy",
      theme: "snowy",
      icon: "❄️",
      character: "⛄",
      caption: "your little snow friend ♡",
      message: "Everything feels a little more magical in the snow."
    };
  }

  if ([95, 96, 99].includes(code)) {
    return {
      condition: "Stormy",
      theme: "stormy",
      icon: "⛈️",
      character: "🐈‍⬛",
      caption: "your brave storm friend ♡",
      message: "Thunderstorms may occur. Stay safely indoors."
    };
  }

  // Wind is a supplementary condition:
  // it can change the theme for otherwise clear or cloudy weather.
  if (wind >= 30) {
    return {
      condition: "Windy",
      theme: "windy",
      icon: "🍃",
      character: "🍃",
      caption: "your breezy little friend ♡",
      message: "The breeze is dancing through the trees today."
    };
  }

  return {
    condition: "Changing skies",
    theme: "cloudy",
    icon: "🌥️",
    character: "🌷",
    caption: "your little sky friend ♡",
    message: "Your sky has a little story to tell."
  };
}


// 3. Show a friendly status message

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}


// 4. Search for a city using Open-Meteo's geocoding API

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
      "We couldn't find that city. Please check the spelling and try again."
    );
  }

  // Prefer an exact city-name match when available.
  const exactMatch = data.results.find(
    place => place.name.toLowerCase() === city.trim().toLowerCase()
  );

  return exactMatch || data.results[0];
}


// 5. Fetch current weather and hourly forecast

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
      "precipitation",
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


// 6. Format dates and times in the city's local timezone

function formatDate(dateString) {
  // Use a date-only string safely without shifting the calendar day.
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatTime(timeString) {
  const hour = Number(timeString.slice(11, 13));

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12}:00 ${period}`;
}


// 7. Find the closest hourly forecast to a target hour

function getForecastForHour(hourly, targetHour) {
  const targetIndex = hourly.time.findIndex(time =>
    Number(time.slice(11, 13)) === targetHour
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


// 8. Change the current card to match the weather

function updateCurrentCard(city, weather) {
  const current = weather.current;

  const info = getWeatherInfo(
    current.weather_code,
    current.is_day === 1,
    current.wind_speed_10m
  );

  cityName.textContent = city;
  currentDate.textContent = formatDate(current.time.slice(0, 10));

  currentTemp.textContent = Math.round(current.temperature_2m);
  currentCondition.textContent = info.condition;
  currentSticker.textContent = info.icon;

  feelsLike.textContent =
    `Feels like ${Math.round(current.apparent_temperature)}°C`;

  detailFeelsLike.textContent =
    `${Math.round(current.apparent_temperature)}°C`;

  humidity.textContent =
    `${current.relative_humidity_2m}%`;

  windSpeed.textContent =
    `${Math.round(current.wind_speed_10m)} km/h`;

  dayMessage.textContent = info.message;
  mainCharacter.textContent = info.character;
  characterCaption.textContent = info.caption;

  // Remove the previous theme before applying the new one.
  currentCard.className = `current-card weather-theme-${info.theme}`;
}


// 9. Update one of the small forecast cards

function updateForecastCard(forecast, type) {
  if (!forecast) {
    const tempElement =
      type === "morning" ? morningTemp : eveningTemp;

    const conditionElement =
      type === "morning" ? morningCondition : eveningCondition;

    tempElement.textContent = "--°C";
    conditionElement.textContent = "Unavailable";
    return;
  }

  const info = getWeatherInfo(
    forecast.weatherCode,
    type === "morning",
    forecast.windSpeed ?? 0
  );

  if (type === "morning") {
    morningTime.textContent = formatTime(forecast.time);
    morningTemp.textContent =
      `${Math.round(forecast.temperature)}°C`;

    morningCondition.textContent = info.condition;
    morningCharacter.textContent = info.character;

    morningMessage.textContent =
      forecast.precipitationProbability == null
        ? info.message
        : `${info.message} Rain chance: ${forecast.precipitationProbability}%.`;

    morningCard.style.borderColor =
      getComputedStyle(currentCard).getPropertyValue("--card-accent");
  } else {
    eveningTime.textContent = formatTime(forecast.time);
    eveningTemp.textContent =
      `${Math.round(forecast.temperature)}°C`;

    eveningCondition.textContent = info.condition;
    eveningCharacter.textContent = info.character;

    eveningMessage.textContent =
      forecast.precipitationProbability == null
        ? info.message
        : `${info.message} Rain chance: ${forecast.precipitationProbability}%.`;

    eveningCard.style.borderColor =
      getComputedStyle(currentCard).getPropertyValue("--card-accent");
  }
}


// 10. Search and display the requested city's weather

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

    // Include region/country to distinguish cities with similar names.
    const locationParts = [
      place.name,
      place.admin1,
      place.country
    ].filter(Boolean);

    // Remove duplicate labels.
    const uniqueLocationParts = [...new Set(locationParts)];

    const displayCity = uniqueLocationParts.join(", ");

    updateCurrentCard(displayCity, weather);

    // Morning = closest available hourly value at 8 AM.
    // Evening = closest available hourly value at 6 PM.
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

    setStatus(`Your little weather world is ready for ${place.name}! ✨`);
  } catch (error) {
    console.error("Mochi Weather error:", error);

    setStatus(
      error.message ||
      "Something went wrong. Please try again in a moment.",
      true
    );
  } finally {
    searchButton.disabled = false;
  }
}


// 11. Listen for the search form submission

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  loadWeather(cityInput.value);
});


// 12. Load the default city when the page opens

loadWeather(cityInput.value);
