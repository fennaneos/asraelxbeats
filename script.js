let tracks = [];
let swiper;
let currentIndex = 0;
let paypalSdkLoaded = false;
let previewEndedAlertShown = false;
const PREVIEW_MAX_TIME = 20; // 20 seconds preview limit for unfree tracks

const audio = document.getElementById("song");
const playPauseBtn = document.querySelector(".play-pause-btn");
const controlIcon = document.getElementById("controlIcon");
const progress = document.getElementById("progress");
const songTitle = document.getElementById("song-title");
const songArtist = document.getElementById("song-artist");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const priceTag = document.getElementById("price-tag");
const panelTitle = document.getElementById("panel-title");
const downloadBtn = document.getElementById("downloadBtn");
const paypalContainer = document.getElementById("paypal-button-container");
const swiperWrapper = document.getElementById("swiper-wrapper");

async function fetchTracks() {
  try {
    const res = await fetch('/tracks');
    tracks = await res.json();
    if (!tracks.length) {
      console.error("No tracks fetched.");
      return;
    }
    initPlayer();
    await loadPayPalSdk();
  } catch (error) {
    console.error("Failed to load tracks:", error);
  }
}

function initPlayer() {
  buildSwiperSlides();
  initSwiper();
  loadTrack(currentIndex);
}

function buildSwiperSlides() {
  swiperWrapper.innerHTML = '';
  tracks.forEach((track, index) => {
    const slide = document.createElement('div');
    slide.classList.add('swiper-slide');
    slide.innerHTML = `
      <div class="overlay"></div>
      <img src="./Images/${track.image || 'background.png'}" alt="${track.title}" />
    `;
    slide.addEventListener('click', () => {
      currentIndex = index;
      loadTrack(currentIndex);
      audio.play();
      controlIcon.classList.replace("fa-play", "fa-pause");
    });
    swiperWrapper.appendChild(slide);
  });
}

function initSwiper() {
  if (swiper) swiper.destroy(true, true);

  swiper = new Swiper(".swiper", {
    slidesPerView: "auto",
    spaceBetween: 20,
    centeredSlides: true,
    on: {
      slideChange: function () {
        currentIndex = swiper.realIndex;
        loadTrack(currentIndex);
      },
    },
  });
}

function loadTrack(index) {
  if (!tracks.length) {
    console.error('No tracks available.');
    return;
  }
  if (index < 0 || index >= tracks.length) {
    console.error('Invalid track index:', index);
    return;
  }

  const track = tracks[index];
  audio.src = `./Songs/${track.filename}.mp3`;
  songTitle.textContent = track.title;
  songArtist.textContent = track.artist;
  panelTitle.textContent = `${track.title} – ${track.artist}`;
  priceTag.textContent = track.free ? "FREE" : `$${track.price.toFixed(2)}`;
  downloadBtn.href = `./Songs/${track.filename}.mp3`;

  // Enable or disable download button based on track.free
  downloadBtn.style.pointerEvents = track.free ? "auto" : "none";
  downloadBtn.style.opacity = track.free ? "1" : "0.5";

  // Update active slide visual
  document.querySelectorAll(".swiper-slide").forEach((slide, i) => {
    slide.classList.toggle("active-track", i === index);
  });

  swiper.slideTo(index);

  if (paypalSdkLoaded) {
    renderPayPalButton(track);
  }

  // Reset preview alert flag when track changes
  previewEndedAlertShown = false;

  // Reset progress bar and times on track load
  progress.value = 0;
  currentTimeEl.textContent = "0:00";

  if (track.free) {
    progress.max = audio.duration || 0;
    durationEl.textContent = formatTime(audio.duration || 0);
  } else {
    progress.max = PREVIEW_MAX_TIME;
    durationEl.textContent = formatTime(PREVIEW_MAX_TIME);
  }
}

async function loadPayPalSdk() {
  try {
    const response = await fetch("/paypal-client-id");
    const data = await response.json();
    const clientId = data.clientId;

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&components=buttons&enable-funding=card`;
      script.onload = () => {
        paypalSdkLoaded = true;
        renderPayPalButton(tracks[currentIndex]);
        resolve();
      };
      script.onerror = () => {
        console.error("PayPal SDK failed to load");
        reject();
      };
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error("Error loading PayPal SDK:", error);
  }
}

function renderPayPalButton(track) {
  paypalContainer.innerHTML = "";

  if (track.free) {
    paypalContainer.style.display = "none";
    return;
  } else {
    paypalContainer.style.display = "block";
  }

  paypal.Buttons({
    style: {
      layout: 'horizontal',
      color: 'blue',
      shape: 'pill',
      label: 'paypal'
    },
    createOrder: (data, actions) => {
      return actions.order.create({
        purchase_units: [{
          amount: { value: track.price.toFixed(2) },
          description: `${track.title} by ${track.artist}`
        }]
      });
    },
    onApprove: (data, actions) => {
      return actions.order.capture().then(details => {
        return fetch("/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderID: data.orderID })
        })
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              alert("Payment verified! Your download will start.");
              window.location.href = result.download_url;
            } else {
              alert("Payment failed or not verified.");
            }
          });
      });
    },
    onError: err => {
      console.error("PayPal error:", err);
      alert("Payment error occurred. Please try again.");
    }
  }).render("#paypal-button-container");
}

function togglePlayPause() {
  if (audio.paused) {
    audio.play();
    controlIcon.classList.replace("fa-play", "fa-pause");
  } else {
    audio.pause();
    controlIcon.classList.replace("fa-pause", "fa-play");
  }
}

function forwardTrack() {
  currentIndex = (currentIndex + 1) % tracks.length;
  loadTrack(currentIndex);
  audio.play();
  controlIcon.classList.replace("fa-play", "fa-pause");
}

function backwardTrack() {
  currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
  loadTrack(currentIndex);
  audio.play();
  controlIcon.classList.replace("fa-play", "fa-pause");
}

// Audio progress & timing
audio.addEventListener("loadedmetadata", () => {
  const track = tracks[currentIndex];
  if (track && track.free) {
    progress.max = audio.duration;
    durationEl.textContent = formatTime(audio.duration);
  } else {
    progress.max = PREVIEW_MAX_TIME;
    durationEl.textContent = formatTime(PREVIEW_MAX_TIME);
  }
});

audio.addEventListener("timeupdate", () => {
  const track = tracks[currentIndex];
  let currentTime = audio.currentTime;

  if (track && !track.free && currentTime > PREVIEW_MAX_TIME) {
    audio.pause();
    currentTime = PREVIEW_MAX_TIME;
    progress.value = currentTime;
    currentTimeEl.textContent = formatTime(currentTime);
    controlIcon.classList.replace("fa-pause", "fa-play");

    if (!previewEndedAlertShown) {
      previewEndedAlertShown = true;
      showPreviewEndedNotification();
    }
  } else {
    progress.value = currentTime;
    currentTimeEl.textContent = formatTime(currentTime);

    if (track && currentTime < PREVIEW_MAX_TIME) {
      previewEndedAlertShown = false; // Reset flag if user seeks back
    }
  }
});

progress.addEventListener("input", () => {
  const track = tracks[currentIndex];
  let seekTime = parseFloat(progress.value);

  if (track && !track.free && seekTime > PREVIEW_MAX_TIME) {
    seekTime = PREVIEW_MAX_TIME;
  }

  audio.currentTime = seekTime;
});

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

// Show modern toast notification for preview end
function showPreviewEndedNotification() {
  const notification = document.getElementById("preview-notification");
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
  }, 4000); // Hide after 4 seconds
}

// Event listeners for controls
playPauseBtn.addEventListener("click", togglePlayPause);
document.querySelector(".forward").addEventListener("click", forwardTrack);
document.querySelector(".backward").addEventListener("click", backwardTrack);

// Kickoff on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  fetchTracks();
});




/** */
