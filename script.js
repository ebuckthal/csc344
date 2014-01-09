var context = new window.webkitAudioContext();
var source = null;
var audioBuffer = null;
var audioArrayBuffer = null;

function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function stopSound() {
   if(source) {
      source.noteOff(0);
   }
}

function playSound() {

   source = context.createBufferSource();
   source.buffer = audioBuffer;
   source.loop = false;
   source.connect(context.destination);
   source.noteOn(0);
}

function playFrom(i) {

   f32 = new Float32Array(audioBuffer.getChannelData(0));
   console.log(f32);

   f32 = shuffle(f32);

   initSound(f32);

}

function initSound(arrayBuffer) {
   audioArrayBuffer = arrayBuffer;

   context.decodeAudioData(arrayBuffer, function(buffer) {

      audioBuffer = buffer;

      document.querySelectorAll('button')[0].disabled = false;
      document.querySelectorAll('button')[1].disabled = false;
      document.querySelectorAll('button')[2].disabled = false;

   }, function(err) {

      console.log('Error decoding file', e);
   });
}

var fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', function(e) {

   var reader = new FileReader();

   reader.onload = function(e) {
      initSound(this.result);
   };

   reader.readAsArrayBuffer(this.files[0]);

}, false);

