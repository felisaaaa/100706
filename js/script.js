/* ================================================================
   PAGE-TO-PAGE BLUR TRANSITION
   Jalan otomatis di SEMUA halaman. Halaman mulai dalam kondisi
   blur pas load, lalu perlahan jadi jelas (fade+unblur in).
   Pas klik link ke halaman lain (index/gallery/letter), halaman
   blur keluar dulu sebentar baru pindah — biar transisinya
   kerasa smooth & slow, bukan langsung "cetak".
================================================================= */
(function(){
  // body sudah mulai dengan class "blur-in-start" langsung dari HTML
  // (biar gak sempat kelihatan jelas sebelum blur diterapkan).
  // Di sini kita tunggu 2 frame lalu lepas class-nya supaya transisi
  // CSS (opacity + filter) langsung jalan dengan mulus.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.remove('blur-in-start');
    });
  });
})();

document.body.addEventListener('click', function(e){
  const link = e.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href');
  // skip anchors, external links, or empty hrefs — only intercept
  // internal page navigation (index.html / gallery.html / letter.html)
  if (!href || href.startsWith('#') || href.startsWith('http')) return;

  e.preventDefault();
  document.body.classList.add('blur-out');
  // simpan posisi & status lagu sebelum pindah halaman, biar pas
  // halaman baru kebuka, lagunya nyambung dari titik yang sama
  if (typeof saveMusicState === 'function') saveMusicState();
  setTimeout(() => { window.location.href = href; }, 550);
});

/* ================================================================
   HER LITTLE NOTE — tombol catatan kecil yang bisa diedit
   -----------------------------------------------------------
   Jalan di SEMUA halaman. Pas diklik, muncul kertas catatan kecil
   yang isinya bisa diketik/diedit bebas — buat pacar kamu nulis
   apa yang mau dia sampaikan, atau wishlist kalian ke depannya.

   Isinya disimpan pakai localStorage (BUKAN sessionStorage), jadi
   beneran nggak hilang walau tab/browser-nya ditutup total atau
   di-refresh. Cuma hilang kalau teksnya memang dihapus manual.
================================================================= */
const NOTE_STORAGE_KEY = 'gfNoteContent';

// Bikin tombol catatan kalau belum ada di halaman ini
let noteBtn = document.getElementById('noteBtn');
if (!noteBtn){
  noteBtn = document.createElement('button');
  noteBtn.id = 'noteBtn';
  noteBtn.className = 'note-btn';
  noteBtn.setAttribute('aria-label', 'write a little note');
  noteBtn.title = 'tulis catatan kecil';
  noteBtn.innerHTML = '<span class="note-icon">📝</span>';
  document.body.appendChild(noteBtn);
}

// Bikin overlay + kertas catatannya kalau belum ada
let noteOverlay = document.getElementById('noteOverlay');
if (!noteOverlay){
  noteOverlay = document.createElement('div');
  noteOverlay.id = 'noteOverlay';
  noteOverlay.className = 'note-overlay';
  noteOverlay.innerHTML = `
    <div class="note-paper" id="notePaper">
      <button class="note-close" id="noteClose" aria-label="close note">✕</button>
      <h3 class="note-title">just for you to fill in 💌</h3>
      <p class="note-hint">tulis apa aja yang mau kamu sampaikan, atau wishlist kita ke depannya~</p>
      <textarea id="noteTextarea" class="note-textarea" placeholder="c'mon... jangan malu-malu >.<"></textarea>
      <span class="note-saved" id="noteSaved">saved ✓</span>
    </div>
  `;
  document.body.appendChild(noteOverlay);
}

const noteTextarea = document.getElementById('noteTextarea');
const noteClose    = document.getElementById('noteClose');
const notePaper    = document.getElementById('notePaper');
const noteSavedTag = document.getElementById('noteSaved');

// muat catatan yang sudah tersimpan sebelumnya (kalau ada)
noteTextarea.value = localStorage.getItem(NOTE_STORAGE_KEY) || '';

function openNote(){
  noteOverlay.classList.add('open');
  setTimeout(() => noteTextarea.focus(), 200);
}

function closeNote(){
  noteOverlay.classList.remove('open');
}

noteBtn.addEventListener('click', openNote);
noteClose.addEventListener('click', closeNote);

// klik area gelap di luar kertas buat nutup, tapi klik di dalam
// kertas sendiri nggak ikut nutup overlay-nya
noteOverlay.addEventListener('click', (e) => {
  if (e.target === noteOverlay) closeNote();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && noteOverlay.classList.contains('open')) closeNote();
});

// auto-save setiap kali dia ngetik, dengan sedikit jeda (debounce)
// biar nggak nulis ke localStorage tiap huruf
let noteSaveTimeout = null;
noteTextarea.addEventListener('input', () => {
  clearTimeout(noteSaveTimeout);
  noteSavedTag.classList.remove('show');
  noteSaveTimeout = setTimeout(() => {
    localStorage.setItem(NOTE_STORAGE_KEY, noteTextarea.value);
    noteSavedTag.classList.add('show');
    setTimeout(() => noteSavedTag.classList.remove('show'), 1400);
  }, 500);
});

/* ================================================================
   PERSISTENT BACKGROUND MUSIC — jalan di SEMUA halaman
   -----------------------------------------------------------
   Musiknya dibuat & dikontrol dari sini (bukan cuma di index.html)
   supaya statusnya (lagi play atau nggak, & posisi detik keberapa)
   bisa "dibawa" pas pindah dari index.html -> gallery.html ->
   letter.html, jadi lagunya nggak keputus tiap ganti halaman.

   EDIT DI SINI kalau mau ganti file lagu: cukup timpa file
   assets/music.mp3 dengan lagu asli kamu (nama file sama persis),
   nggak perlu ubah kode apapun di bawah ini.
================================================================= */
const MUSIC_STORAGE_KEY = 'bgMusicState';

// Bikin elemen <audio> kalau belum ada di halaman ini
let bgMusic = document.getElementById('bgMusic');
if (!bgMusic){
  bgMusic = document.createElement('audio');
  bgMusic.id = 'bgMusic';
  bgMusic.loop = true;
  bgMusic.preload = 'auto';
  const source = document.createElement('source');
  source.src = 'assets/music.mp3';
  source.type = 'audio/mpeg';
  bgMusic.appendChild(source);
  document.body.appendChild(bgMusic);
}

// Bikin tombol musik kalau belum ada di halaman ini
let musicBtn = document.getElementById('musicBtn');
if (!musicBtn){
  musicBtn = document.createElement('button');
  musicBtn.id = 'musicBtn';
  musicBtn.className = 'music-btn';
  musicBtn.setAttribute('aria-label', 'play music');
  musicBtn.title = 'play our song';
  musicBtn.innerHTML = '<span class="music-icon">🎵</span>';
  document.body.appendChild(musicBtn);
}

const musicIcon = musicBtn.querySelector('.music-icon');
let noteInterval = null;

function spawnMusicNote(){
  const notes = ['🎵', '🎶', '💫'];
  const note = document.createElement('span');
  note.className = 'music-note';
  note.textContent = notes[Math.floor(Math.random() * notes.length)];
  note.style.setProperty('--drift', (Math.random() * 40 - 20) + 'px');
  musicBtn.appendChild(note);
  setTimeout(() => note.remove(), 1400);
}

function setMusicUI(isPlaying){
  musicBtn.classList.toggle('playing', isPlaying);
  musicIcon.textContent = isPlaying ? '🎶' : '🎵';
  clearInterval(noteInterval);
  if (isPlaying) noteInterval = setInterval(spawnMusicNote, 500);
}

// simpan status (playing + posisi detik) supaya bisa disambung lagi
// di halaman berikutnya
function saveMusicState(){
  sessionStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify({
    playing: !bgMusic.paused,
    time: bgMusic.currentTime || 0
  }));
}

// coba lanjutkan lagu dari halaman sebelumnya (kalau ada)
const savedMusicState = JSON.parse(sessionStorage.getItem(MUSIC_STORAGE_KEY) || 'null');

function resumeMusic(){
  if (!savedMusicState || !savedMusicState.playing) return;
  bgMusic.currentTime = savedMusicState.time || 0;
  bgMusic.play().then(() => {
    setMusicUI(true);
  }).catch(() => {
    // sebagian browser blokir autoplay walau sebelumnya sempat diputar —
    // biarkan tombol dalam kondisi "paused", tinggal tap sekali lagi
    setMusicUI(false);
  });
}

if (savedMusicState){
  if (bgMusic.readyState >= 1){
    resumeMusic();
  } else {
    bgMusic.addEventListener('loadedmetadata', resumeMusic, { once: true });
  }
}

musicBtn.addEventListener('click', () => {
  if (bgMusic.paused){
    bgMusic.play().catch(() => {});
    setMusicUI(true);
  } else {
    bgMusic.pause();
    setMusicUI(false);
  }
  saveMusicState();
});

// terus simpan progres lagu selagi diputar, biar posisinya akurat
// pas nanti pindah halaman
bgMusic.addEventListener('timeupdate', () => {
  if (!bgMusic.paused) saveMusicState();
});

// jaga-jaga: simpan juga pas tab/halaman ditutup atau di-refresh
window.addEventListener('beforeunload', saveMusicState);

/* ================================================================
   FLOATING HEARTS & STARS BACKGROUND
   Jalan otomatis di SEMUA halaman (index, gallery, letter)
   selama ada <div id="floating-bg"></div> di HTML-nya.
================================================================= */
const floatingBg = document.getElementById('floating-bg');
const floatEmojis = ['💖', '✨', '🩷', '💫', '💙', '💜'];

if (floatingBg){
  function spawnFloaty(){
    const el = document.createElement('div');
    el.className = 'floaty';
    el.textContent = floatEmojis[Math.floor(Math.random() * floatEmojis.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.fontSize = (16 + Math.random() * 18) + 'px';
    const duration = 8 + Math.random() * 8;
    el.style.animationDuration = duration + 's';
    floatingBg.appendChild(el);
    setTimeout(() => el.remove(), duration * 1000);
  }
  setInterval(spawnFloaty, 700);
}

/* ================================================================
   TYPEWRITER EFFECT — hanya jalan di letter.html
   -----------------------------------------------------------
   EDIT DI SINI: ganti isi teks di bawah (letterMessage) untuk
   menulis surat ulang tahunmu sendiri. Pakai \n\n untuk ganti
   paragraf baru.
================================================================= */
const letterMessage =
`My love, wiji lestari,

Happy birthday to the most wonderful person I know. I don't think words can fully capture how grateful I am to have you in my life, but I'm going to try anyway.

You make every ordinary day feel special just by being in it. Your smile, your laugh, the way you care about everyone around you... it all makes me fall for you more every single day.

I hope this year brings you every single thing you've been hoping for, and so much more. I promise to be right beside you for all of it — the big moments and the tiny, quiet ones too.

Thank you for being exactly who you are. I love you more than words can say. I miss you so much, i can't wait to see you again and celebrate this with you soon. Until then, know that you're always in my heart.

Selamat ulang tahun, sayang. Here's to you. 🎂`;

const letterEl = document.getElementById('letter-text');
let typeIndex = 0;

function typeWriter(){
  if (!letterEl) return;
  if (typeIndex < letterMessage.length){
    const chunk = letterMessage.slice(0, typeIndex + 1).replace(/\n/g, '<br>');
    letterEl.innerHTML = chunk + '<span class="cursor">&nbsp;</span>';
    typeIndex++;
    setTimeout(typeWriter, 22);
  } else {
    letterEl.innerHTML = letterMessage.replace(/\n/g, '<br>');
  }
}

/* ================================================================
   CONFETTI EXPLOSION — hanya jalan di letter.html
   Meledak begitu halaman letter.html dibuka.
================================================================= */
const canvas = document.getElementById('confetti-canvas');

if (canvas){
  const ctx = canvas.getContext('2d');
  let confettiPieces = [];
  const confettiColors = ['#ffd6e8', '#ff9fc7', '#d6ecff', '#a8d8ff', '#e6d9ff', '#c7a9ff', '#ffffff'];

  function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function createConfetti(){
    confettiPieces = [];
    const count = 140;
    for (let i = 0; i < count; i++){
      confettiPieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        size: 6 + Math.random() * 6,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        speedY: 2 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        shape: Math.random() > 0.5 ? 'circle' : 'rect'
      });
    }
  }

  let confettiActive = false;
  let confettiFrames = 0;
  const maxConfettiFrames = 260;

  function animateConfetti(){
    if (!confettiActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    confettiPieces.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle'){
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
      }
      ctx.restore();
    });

    confettiFrames++;
    if (confettiFrames < maxConfettiFrames){
      requestAnimationFrame(animateConfetti);
    } else {
      confettiActive = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function fireConfetti(){
    createConfetti();
    confettiActive = true;
    confettiFrames = 0;
    animateConfetti();
  }

  // Jalankan begitu halaman letter.html dibuka
  window.addEventListener('load', () => {
    typeWriter();
    fireConfetti();
  });
}
