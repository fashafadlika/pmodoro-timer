let defaultMinutes = 25;
function stop(){
clearInterval(interval);
interval = null;
running = false;
}


function reset(){
stop();
seconds = defaultMinutes * 60;
update();
}


startBtn.addEventListener('click',()=>{start();});
pauseBtn.addEventListener('click',()=>{stop();});
resetBtn.addEventListener('click',()=>{reset();});


modeButtons.forEach(btn=>{
btn.addEventListener('click',()=>{
modeButtons.forEach(b=>b.classList.remove('active'));
btn.classList.add('active');
defaultMinutes = parseInt(btn.dataset.min);
seconds = defaultMinutes * 60;
update();
stop();
})
})


function beep(){
try{
const ctx = new (window.AudioContext || window.webkitAudioContext)();
const o = ctx.createOscillator();
const g = ctx.createGain();
o.type = 'sine';
o.frequency.value = 880;
o.connect(g);
g.connect(ctx.destination);
g.gain.setValueAtTime(0.0001, ctx.currentTime);
g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
o.start();
o.stop(ctx.currentTime + 0.6);
}catch(e){
console.warn('Audio not supported', e);
}
}


function flashCard(){
const card = document.querySelector('.card');
card.style.boxShadow = '0 0 0 4px rgba(139,60,255,0.12)';
setTimeout(()=>{card.style.boxShadow='none'},600);
}


// initial render
update();