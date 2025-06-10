// === Track List ===
const trackFilenames = [
  { name: "Layla", price: 7.99 },
  { name: "Moon Over Damascus", price: 4.99 },
  { name: "violon808", price: 4.99 },
  { name: "Temple of Bass", price: 7.99 },
  { name: "Tears of the Minaret", price: 7.99 },
  { name: "Desert Mirage", price: 4.99 },
  { name: "Sandstep", price: 4.99 },
  { name: "Sand Spirit", price: 4.99 },
];

const tracks = trackFilenames.map(({ name, price }) => ({
  id: name.toLowerCase(),
  title: formatTitle(name),
  artist: "Asraelx Beats",
  mp3: `public-previews/${name}.mp3`,
  filename: name,
  image: `assets/${name}.jpeg`,
  price: price,   // <-- Add price here
}));


tracks.forEach(track => {
  track.gumroadSlug = track.title.toLowerCase().replace(/\s+/g, '');
});

function formatTitle(filename) {
  return filename
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// === DOM Elements ===
const audio = document.getElementById("song");
const playPauseBtn = document.querySelector(".play-pause-btn");
const controlIcon = document.getElementById("controlIcon");
const progress = document.getElementById("progress");
const songTitle = document.getElementById("song-title");
const songArtist = document.getElementById("song-artist");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const panelTitle = document.getElementById("panel-title");
const downloadBtn = document.getElementById("downloadBtn");
const swiperWrapper = document.getElementById("swiper-wrapper");

let swiper;
let currentIndex = 0;

// === Initialize ===
document.addEventListener("DOMContentLoaded", () => {
  buildSwiperSlides();
  initSwiper();
  loadTrack(currentIndex, false);
});

function buildSwiperSlides() {
  swiperWrapper.innerHTML = '';
  tracks.forEach((track, index) => {
    const slide = document.createElement('div');
    slide.classList.add('swiper-slide');
    slide.innerHTML = `
      <div class="overlay"></div>
      <img src="./${track.image}" alt="${track.title}" />
    `;
    slide.addEventListener('click', () => {
      currentIndex = index;
      loadTrack(currentIndex, true);
    });
    swiperWrapper.appendChild(slide);
  });
}

function initSwiper() {
  if (swiper) swiper.destroy(true, true);
  swiper = new Swiper(".swiper", {
    slidesPerView:3,
    spaceBetween: 20,
    centeredSlides: false,
    loop: false,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });
}

const priceTag = document.getElementById("price-tag"); // assuming this element exists

function loadTrack(index, autoplay = false) {
  if (index < 0 || index >= tracks.length) return;
  const track = tracks[index];

  songTitle.textContent = track.title;
  songArtist.textContent = track.artist;
  panelTitle.textContent = `${track.title} – ${track.artist}`;


  priceTag.textContent = `$${track.price.toFixed(2)}`;

  downloadBtn.href = track.mp3;

  document.querySelectorAll(".swiper-slide").forEach((slide, i) => {
    slide.classList.toggle("active-track", i === index);
  });

  // Update the Gumroad URL in a data attribute instead of href:
  const gumroadBtn = document.querySelector('.gumroad-button');
  gumroadBtn.dataset.gumroad = `https://asraelx.gumroad.com/l/${track.gumroadSlug}`;

  audio.src = track.mp3;
  audio.load();

  progress.value = 0;
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";

  if (autoplay) {
    audio.addEventListener("canplay", () => {
      audio.play();
      controlIcon.classList.replace("fa-play", "fa-pause");
    }, { once: true });
  } else {
    controlIcon.classList.replace("fa-pause", "fa-play");
  }
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
  loadTrack(currentIndex, true);

  // Try triggering next button click instead
  const nextBtn = document.querySelector('.swiper-button-next');
  if (nextBtn) nextBtn.click();
}

function backwardTrack() {
  currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
  loadTrack(currentIndex, true);

  const prevBtn = document.querySelector('.swiper-button-prev');
  if (prevBtn) prevBtn.click();
}

audio.addEventListener("loadedmetadata", () => {
  progress.max = audio.duration;
  durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  progress.value = audio.currentTime;
  currentTimeEl.textContent = formatTime(audio.currentTime);
});

progress.addEventListener("input", () => {
  audio.currentTime = parseFloat(progress.value);
});

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

// === Controls ===
playPauseBtn.addEventListener("click", togglePlayPause);
document.querySelector(".forward").addEventListener("click", forwardTrack);
document.querySelector(".backward").addEventListener("click", backwardTrack);

// === Gumroad button click handler ===
const gumroadBtn = document.querySelector('.gumroad-button');

// Set href="#" to prevent default navigation. (Ensure your HTML has href="#" for this button)
gumroadBtn.href = '#';

gumroadBtn.addEventListener('click', (e) => {
  e.preventDefault(); // Prevent default anchor navigation
  const gumroadURL = gumroadBtn.dataset.gumroad || 'https://asraelx.gumroad.com/l/layla'; // fallback
  window.open(gumroadURL + '?t=' + Date.now(), '_blank');
});

// -------------------------------------

const licenseModal = document.getElementById("licenseModal");
const licenseBtn = document.getElementById("licenseInfoBtn");
const closeModal = document.getElementById("closeModal");

// Show modal on button click
licenseBtn.addEventListener("click", () => {
  licenseModal.style.display = "block";
});

// Hide modal on close click
closeModal.addEventListener("click", () => {
  licenseModal.style.display = "none";
});

// Also hide modal when clicking outside modal content
window.addEventListener("click", (event) => {
  if (event.target === licenseModal) {
    licenseModal.style.display = "none";
  }
});
