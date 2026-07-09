/* ================================================================
   INTERACTIVE PHOTO SLIDESHOW — gallery.html only
   -----------------------------------------------------------
   EDIT DI SINI: ganti "src" dan "caption" tiap foto di array
   `photos` di bawah ini. Tambah/kurangi foto tinggal
   tambah/hapus objek di dalam array (jangan lupa update juga
   titik-titik dot di gallery.html kalau jumlah foto berubah).
================================================================= */
const photos = [
  {
    src: "photos/photo1.jpg",
    caption: "Thank you for being a part of my life... every day with you feels like a gift."
  },
  {
    src: "photos/photo2.jpg",
    caption: "I hope that on this special day, you are surrounded by happiness and love."
  },
  {
    src: "photos/photo3.jpg",
    caption: "Every laugh, every hug, every little moment with you means the world to me."
  },
  {
    src: "photos/photo4.jpg",
    caption: "Here’s to creating many more birthdays, adventures, and memories together in the days to come, jagi. Please wait for me, ya?"
  }
];

const photoEl    = document.getElementById('currentPhoto');
const captionEl  = document.getElementById('currentCaption');
const counterEl  = document.getElementById('counter');
const polaroidEl = document.getElementById('polaroid');
const dotsWrap   = document.getElementById('dots');
const prevBtn    = document.getElementById('prevBtn');
const nextBtn    = document.getElementById('nextBtn');
const photoStage = document.getElementById('photoStage');

let currentIndex = 0;
let isAnimating  = false;

// slight random-ish tilt per photo, just for a cute polaroid feel
const tilts = ['-3deg', '2deg', '-1.5deg', '3deg'];

function renderSlide(newIndex, direction){
  if (isAnimating || newIndex === currentIndex) return;
  isAnimating = true;

  // start the slow blur-out transition
  photoEl.classList.add('is-transitioning');
  captionEl.classList.add('is-transitioning');

  setTimeout(() => {
    currentIndex = newIndex;
    const data = photos[currentIndex];

    photoEl.src = data.src;
    photoEl.alt = "memory " + (currentIndex + 1);
    captionEl.textContent = data.caption;
    counterEl.textContent = `photo ${currentIndex + 1} of ${photos.length}`;
    polaroidEl.style.setProperty('--tilt', tilts[currentIndex % tilts.length]);

    // update active dot
    dotsWrap.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });

    // blur back in (slow, sweet fade)
    requestAnimationFrame(() => {
      photoEl.classList.remove('is-transitioning');
      captionEl.classList.remove('is-transitioning');
      isAnimating = false;
    });
  }, 400);
}

function goNext(){
  const next = (currentIndex + 1) % photos.length;
  renderSlide(next, 'next');
}

function goPrev(){
  const prev = (currentIndex - 1 + photos.length) % photos.length;
  renderSlide(prev, 'prev');
}

nextBtn.addEventListener('click', goNext);
prevBtn.addEventListener('click', goPrev);

dotsWrap.querySelectorAll('.dot').forEach((dot) => {
  dot.addEventListener('click', () => {
    const idx = parseInt(dot.dataset.index, 10);
    renderSlide(idx);
  });
});

/* ---------------- keyboard arrow support ---------------- */
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') goNext();
  if (e.key === 'ArrowLeft')  goPrev();
});

/* ---------------- swipe support (mobile) ---------------- */
let touchStartX = 0;
photoStage.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

photoStage.addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].screenX;
  const delta = touchEndX - touchStartX;
  if (Math.abs(delta) > 40){
    if (delta < 0) goNext();
    else goPrev();
  }
}, { passive: true });

/* ---------------------------------------------------------------
   CUTE EXTRA: tap the photo to pop a little heart 💕
   Just a sweet, playful touch of interactivity on the photo itself.
--------------------------------------------------------------- */
polaroidEl.addEventListener('click', (e) => {
  const rect = polaroidEl.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const heart = document.createElement('span');
  heart.className = 'mini-heart';
  heart.textContent = ['💖','💕','✨','🩷'][Math.floor(Math.random() * 4)];
  heart.style.left = x + 'px';
  heart.style.top  = y + 'px';
  polaroidEl.appendChild(heart);

  setTimeout(() => heart.remove(), 1000);
});

// set initial tilt + counter on load
polaroidEl.style.setProperty('--tilt', tilts[0]);
