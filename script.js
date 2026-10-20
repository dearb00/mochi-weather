"use strict";

// Mochi Weather — live weather by Open-Meteo

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
const detailFeelsLike = document.getElementById("detailFeelsLike");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const dayMessage = document.getElementById("dayMessage");

function getWeatherInfo(code, isDay = true, wind = 0) {
  if (code === 0) return isDay
    ? { condition: "Clear sky", theme: "sunny", icon: "☀️", message: "A little sunshine makes everything brighter!" }
    : { condition: "Clear night", theme: "nightly", icon: "🌙", message: "A peaceful little night under the stars." };

  if ([1, 2].includes(code)) return {
    condition: "Partly cloudy", theme: "partlyCloudy", icon: isDay ? "🌤️" : "☁️",
    message: "A little sun, a little cloud, lots of cozy vibes."
  };
  if (code === 3) return {
    condition: "Cloudy", theme: "cloudy", icon: "☁️",
    message: "Perfect weather for a warm drink and a soft blanket."
  };
  if ([45, 48].includes(code)) return {
    condition: "Foggy", theme: "foggy", icon: "🌫️",
    message: "The world is wearing a little blanket of mist."
  };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return {
    condition: "Rainy", theme: "rainy", icon: "🌧️",
    message: "Grab your umbrella and enjoy the rainy-day magic."
  };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return {
    condition: "Snowy", theme: "snowy", icon: "❄️",
    message: "Everything feels a little more magical in the snow."
  };
  if ([95, 96, 99].includes(code)) return {
    condition: "Stormy", theme: "stormy", icon: "⛈️",
    message: "Stay safe and cozy indoors during thunderstorms."
  };
  if (wind >= 30) return {
    condition: "Windy", theme: "windy", icon: "🍃",
    message: "The breeze is dancing through the trees today."
  };
  return {
    condition: "Changing skies", theme: "cloudy", icon: "🌥️",
    message: "Your sky has a little story to tell."
  };
}

// Keep these filenames in the assets folder.
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

async function findCity(city) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({
    name: city, count: "10", language: "en", format: "json"
  });
  const response = await fetch(url);
  if (!response.ok) throw new Error("City search is temporarily unavailable.");
  const data = await response.json();
  if (!data.results?.length) {
    throw new Error("We couldn't find that city. Check the spelling and try again.");
  }
  return data.results.find(place =>
    place.name.toLowerCase() === city.trim().toLowerCase()
  ) || data.results[0];
}

async function fetchWeather(latitude, longitude) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m",
    timezone: "auto",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh"
  });
  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather data couldn't be loaded. Please try again.");
  const data = await response.json();
  if (!data.current) throw new Error("The weather service returned incomplete data.");
  return data;
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function updateCurrentCard(place, weather) {
  const current = weather.current;
  const info = getWeatherInfo(
    current.weather_code, current.is_day === 1, current.wind_speed_10m
  );

  cityName.textContent = [place.name, place.admin1, place.country]
    .filter(Boolean).filter((part, index, all) => all.indexOf(part) === index)
    .join(", ");
  currentDate.textContent = formatDate(current.time.slice(0, 10));
  currentTemp.textContent = `${Math.round(current.temperature_2m)}°C`;
  currentCondition.textContent = info.condition;
  currentSticker.textContent = info.icon;
  conditionIcon.textContent = info.icon;
  detailFeelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidity.textContent = `${current.relative_humidity_2m}%`;
  windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  dayMessage.textContent = info.message;

  // Only the upper art panel receives the illustration.
  // The lavender glitter panel underneath is CSS, separate from the image.
  currentCard.style.setProperty("--weather-art", `url("${getWeatherImage(info)}")`);
  currentCard.className = `current-card weather-theme-${info.theme}`;
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

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
    const weather = await fetchWeather(place.latitude, place.longitude);
    updateCurrentCard(place, weather);
    setStatus(`Your little weather world is ready for ${place.name}! ✨`);
  } catch (error) {
    console.error("Mochi Weather error:", error);
    setStatus(error.message || "Something went wrong. Please try again.", true);
  } finally {
    searchButton.disabled = false;
  }
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  loadWeather(cityInput.value);
});

loadWeather(cityInput.value);
console.log("💕 Mochi Weather is ready!");