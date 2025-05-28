// === Track List ===
const trackFilenames = [
  "Layla",
  "Moon Over Damascus",
  "violon808",
  "Temple of Bass",
  "Tears of the Minaret",
  "Desert Mirage",
  "Sandstep",
  "Sand Spirit",
];

const tracks = trackFilenames.map((name) => ({
  id: name.toLowerCase(),
  title: formatTitle(name),
  artist: "Asraelx Beats",
  mp3: `public-previews/${name}.mp3`,
  filename: name,
  image: `assets/${name}.jpeg`,
}));

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


function loadTrack(index, autoplay = false) {
  if (index < 0 || index >= tracks.length) return;
  const track = tracks[index];

  songTitle.textContent = track.title;
  songArtist.textContent = track.artist;
  panelTitle.textContent = `${track.title} – ${track.artist}`;
  downloadBtn.href = track.mp3;

  document.querySelectorAll(".swiper-slide").forEach((slide, i) => {
    slide.classList.toggle("active-track", i === index);
  });

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
  if (swiper) swiper.slideTo(currentIndex); // Sync swiper position
}

function backwardTrack() {
  currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
  loadTrack(currentIndex, true);
  if (swiper) swiper.slideTo(currentIndex); // Sync swiper position
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
