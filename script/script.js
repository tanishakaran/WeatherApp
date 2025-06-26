const apiKey = "583e2e81f346294b9045d00964967cc2";

const cityInput = document.querySelector("#cityInput");
const searchBtn = document.querySelector("#searchBtn");
const locationBtn = document.querySelector("#locationBtn");
const voiceBtn = document.querySelector("#voiceBtn");
const weatherInfo = document.querySelector(".weather-info");
const errorBox = document.querySelector(".error");
const quoteBox = document.querySelector(".quote");
const logBox = document.querySelector(".log");
const ctx = document.getElementById('forecastChart');

let latestForecastData;

const quotes = {
  Clear: "It's a bright day! Stay positive ✨",
  Clouds: "Bit cloudy, still perfect to shine ☁️",
  Rain: "Don't forget your umbrella ☔",
  Snow: "Time to build a snowman! ☃️",
  Thunderstorm: "Stay safe, it's stormy outside ⚡",
  Drizzle: "A little rain never hurt anyone 🌦️",
  Mist: "Drive safe, it's misty 🌫️"
};

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) getWeather(city);
});

locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      getWeatherByCoords(latitude, longitude);
    });
  } else {
    showError("Geolocation not supported.");
  }
});

voiceBtn.addEventListener("click", () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.onresult = (event) => {
    const city = event.results[0][0].transcript;
    cityInput.value = city;
    getWeather(city);
  };
  recognition.start();
});

function showError(msg) {
  errorBox.textContent = msg;
}

function getWeather(city) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      if (data.cod === "404") {
        showError("City not found.");
        return;
      }
      showCurrentWeather(data);
      saveToLog(city);
      getForecast(city);
    });
}

function getWeatherByCoords(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      showCurrentWeather(data);
      saveToLog(data.name);
      getForecast(data.name);
    });
}

function showCurrentWeather(data) {
  const { name, main, weather, wind } = data;
  const condition = weather[0].main;
  weatherInfo.innerHTML = `
    <h2>${name}</h2>
    <p>${weather[0].description}</p>
    <p>Temperature: ${main.temp}°C</p>
    <p>Feels like: ${main.feels_like}°C</p>
    <p>Humidity: ${main.humidity}%</p>
    <p>Wind: ${wind.speed} m/s</p>
  `;
  quoteBox.textContent = quotes[condition] || "Enjoy your day!";
}

function getForecast(city) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      latestForecastData = data;
      drawChart(data);
    });
}

function drawChart(data) {
  const labels = [];
  const temps = [];
  for (let i = 0; i < data.list.length; i += 8) {
    labels.push(data.list[i].dt_txt.split(" ")[0]);
    temps.push(data.list[i].main.temp);
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '5-Day Temp Forecast (°C)',
        data: temps,
        borderColor: document.body.classList.contains("night-theme") ? '#fff' : '#333',
        backgroundColor: 'rgba(255,255,255,0.2)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            color: document.body.classList.contains("night-theme") ? "#fff" : "#333"
          }
        },
        x: {
          ticks: {
            color: document.body.classList.contains("night-theme") ? "#fff" : "#333"
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: document.body.classList.contains("night-theme") ? "#fff" : "#333"
          }
        }
      }
    }
  });
}

function saveToLog(city) {
  let logs = JSON.parse(localStorage.getItem("weatherLogs")) || [];
  if (!logs.includes(city)) {
    logs.push(city);
    localStorage.setItem("weatherLogs", JSON.stringify(logs));
  }
  showLogs();
}

function showLogs() {
  let logs = JSON.parse(localStorage.getItem("weatherLogs")) || [];
  logBox.innerHTML = "<h4>Recent Searches:</h4><ul>" + logs.slice(-5).reverse().map(c => `<li>${c}</li>`).join("") + "</ul>";
}

showLogs();