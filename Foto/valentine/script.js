let modal = document.getElementById('modal');
let openBtn = document.getElementById('openMessage');
let closeBtn = document.getElementById('close');
let heartInterval = null;
let audioInput = document.getElementById('audioInput');
let imageInput = document.getElementById('imageInput');
let toggleMusicBtn = document.getElementById('toggleMusic');
let printBtn = document.getElementById('printBtn');
let shareBtn = document.getElementById('shareBtn');
let portrait = document.getElementById('portrait');
let photoFrame = document.getElementById('photoFrame');
let confettiRoot = document.getElementById('confetti-root');
let audioPlayer = null;
let audioContext = null;
let synthTimer = null;
let synthPlaying = false;
let youtubeIframe = null;
let youtubePlaying = false;
// default YouTube video ID (provided by user)
let defaultYouTubeId = 'grp6FCnioMM';

// helper to create object URL safely
function createObjectURL(file){
  try{ return URL.createObjectURL(file); }catch(e){ return null; }
}

function showModal(){
  modal.setAttribute('aria-hidden','false');
  spawnHearts();
  triggerConfetti();
}

function hideModal(){
  modal.setAttribute('aria-hidden','true');
  stopHearts();
}

openBtn.addEventListener('click', ()=>{
  showModal();
});
closeBtn.addEventListener('click', ()=>{
  hideModal();
});

modal.addEventListener('click', (e)=>{
  if(e.target === modal) hideModal();
});

function spawnHearts(){
  if(heartInterval) return;
  heartInterval = setInterval(()=>{
    createHeart();
  }, 300);
}

function stopHearts(){
  clearInterval(heartInterval);
  heartInterval = null;
}

function createHeart(){
  const heart = document.createElement('div');
  heart.className = 'heart';
  heart.style.left = (10 + Math.random()*80) + '%';
  heart.style.width = (18 + Math.random()*36)+'px';
  heart.style.height = heart.style.width;
  heart.style.animationDuration = (3 + Math.random()*2) + 's';
  document.body.appendChild(heart);
  setTimeout(()=>{ heart.remove(); }, 4500);
}

// --- music handling ---
toggleMusicBtn.addEventListener('click', ()=>{
  if(!audioPlayer){
    // First try to load bundled music file `music.mp3` in the same folder.
    fetch('music.mp3', {method:'HEAD'}).then(r=>{
      if(r.ok){
        audioPlayer = new Audio('music.mp3');
        audioPlayer.loop = true;
        audioPlayer.volume = 0.6;
        audioPlayer.play();
        toggleMusicBtn.textContent = 'Pause Musik';
      }else{
        // If a default YouTube ID is supplied, play it directly.
        if(defaultYouTubeId){
          playYouTubeById(defaultYouTubeId);
          return;
        }
        // Ask user to provide a YouTube URL, otherwise fall back to synth
        const want = confirm('Putar "Nadhif Basalamah - Kota Ini Tak Sama Tanpamu" dari YouTube?\nKlik OK untuk menempel URL video, Cancel untuk musik sintetis.');
        if(want){
          const url = prompt('Tempel URL YouTube video (Official Lyric Video):','https://www.youtube.com/');
          if(url){
            const idMatch = url.match(/[?&]v=([\w-]{11})/) || url.match(/youtu\.be\/([\w-]{11})/) || url.match(/youtube\.com\/embed\/([\w-]{11})/);
            const id = idMatch ? idMatch[1] : null;
            if(id){
              playYouTubeById(id);
              return;
            }else{ alert('ID video tidak ditemukan. Memutar musik sintetis sebagai gantinya.'); }
          }
        }
        startSynthMusic();
      }
    }).catch(()=>{
      // network error or file missing -> try default YouTube, else ask or synth
      if(defaultYouTubeId){ playYouTubeById(defaultYouTubeId); return; }
      const url = prompt('Tidak dapat memuat music.mp3. Tempel URL YouTube untuk "Nadhif Basalamah - Kota Ini Tak Sama Tanpamu" (atau kosong untuk musik sintetis):','https://www.youtube.com/');
      if(url){
        const idMatch = url.match(/[?&]v=([\w-]{11})/) || url.match(/youtu\.be\/([\w-]{11})/) || url.match(/youtube\.com\/embed\/([\w-]{11})/);
        const id = idMatch ? idMatch[1] : null;
        if(id){ playYouTubeById(id); return; }
      }
      startSynthMusic();
    });
    return;
  }
  if(audioPlayer.paused){ audioPlayer.play(); toggleMusicBtn.textContent='Pause Musik'; }
  else{ audioPlayer.pause(); toggleMusicBtn.textContent='Play Musik'; }
});

audioInput.addEventListener('change', (e)=>{
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  // stop synth if it's playing
  if(synthPlaying) stopSynthMusic();
  // stop youtube if playing
  if(youtubePlaying) stopYouTube();
  if(audioPlayer){ audioPlayer.pause(); audioPlayer.remove(); audioPlayer=null; }
  audioPlayer = new Audio(createObjectURL(file));
  audioPlayer.loop = true;
  audioPlayer.volume = 0.6;
  audioPlayer.play();
  toggleMusicBtn.textContent = 'Pause Musik';
});

// --- image upload ---
photoFrame.addEventListener('click', ()=> imageInput.click());
imageInput.addEventListener('change', (e)=>{
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  const url = createObjectURL(f);
  portrait.src = url;
  portrait.onload = ()=>{
    photoFrame.classList.add('has-photo');
  }
});

// --- print / save ---
printBtn.addEventListener('click', ()=>{
  window.print();
});

// --- share ---
shareBtn.addEventListener('click', async ()=>{
  if(navigator.share){
    try{
      await navigator.share({title:'Untuk Widya Maharani',text:'Kartu Valentine untuk Widya',url:location.href});
    }catch(e){/* cancelled */}
  }else{
    try{ await navigator.clipboard.writeText(location.href); alert('Tautan disalin ke clipboard'); }catch(e){ alert('Tidak dapat berbagi — silakan salin URL secara manual.'); }
  }
});

// --- confetti (simple) ---
function triggerConfetti(){
  const count = 40;
  const colors = ['#ff6b97','#ffc0cb','#ff8fa3','#ffd6e0','#ff4d7e'];
  for(let i=0;i<count;i++){
    let el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.background = colors[Math.floor(Math.random()*colors.length)];
    el.style.left = Math.random()*100 + '%';
    el.style.top = (-5 - Math.random()*10) + 'vh';
    el.style.width = (6 + Math.random()*12) + 'px';
    el.style.height = (8 + Math.random()*16) + 'px';
    el.style.borderRadius = (Math.random()>0.5? '2px':'50%');
    const dur = 2000 + Math.random()*1800;
    el.style.animation = `confettiFall ${dur}ms linear forwards`;
    el.style.transform = `rotate(${Math.random()*360}deg)`;
    confettiRoot.appendChild(el);
    setTimeout(()=> el.remove(), dur+200);
  }
}

// --- built-in synth music using WebAudio ---
function playNote(freq, when, dur){
  if(!audioContext) return;
  const o = audioContext.createOscillator();
  const g = audioContext.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.value = 0;
  o.connect(g);
  g.connect(audioContext.destination);
  o.start(when);
  g.gain.linearRampToValueAtTime(0.12, when + 0.02);
  g.gain.linearRampToValueAtTime(0, when + dur);
  o.stop(when + dur + 0.05);
}

function startSynthMusic(){
  if(synthPlaying) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const seq = [440, 550, 660, 550, 440, 330];
  let idx = 0;
  function schedule(){
    const now = audioContext.currentTime + 0.02;
    const freq = seq[idx % seq.length] * (1 + (Math.random()-0.5)*0.06);
    playNote(freq, now, 0.6);
    idx++;
    synthTimer = setTimeout(schedule, 450 + Math.random()*180);
  }
  schedule();
  synthPlaying = true;
  toggleMusicBtn.textContent = 'Pause Musik';
}

function stopSynthMusic(){
  if(!synthPlaying) return;
  clearTimeout(synthTimer);
  synthTimer = null;
  try{ if(audioContext && audioContext.state !== 'closed') audioContext.close(); }catch(e){}
  audioContext = null;
  synthPlaying = false;
  toggleMusicBtn.textContent = 'Play Musik';
}

function playYouTubeById(id){
  // create a hidden iframe to play the YouTube video audio
  stopSynthMusic();
  if(youtubeIframe){ youtubeIframe.remove(); youtubeIframe = null; }
  youtubeIframe = document.createElement('iframe');
  youtubeIframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&controls=0&rel=0&modestbranding=1`;
  youtubeIframe.allow = 'autoplay; encrypted-media';
  youtubeIframe.style.position = 'absolute';
  youtubeIframe.style.left = '-9999px';
  youtubeIframe.style.width = '1px';
  youtubeIframe.style.height = '1px';
  document.body.appendChild(youtubeIframe);
  youtubePlaying = true;
  toggleMusicBtn.textContent = 'Pause Musik';
}

function stopYouTube(){
  if(!youtubePlaying) return;
  if(youtubeIframe){ youtubeIframe.remove(); youtubeIframe = null; }
  youtubePlaying = false;
  toggleMusicBtn.textContent = 'Play Musik';
}
