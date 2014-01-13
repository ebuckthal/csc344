var context = new window.webkitAudioContext();
var source = null;
var audioBuffer = null;
var audioArrayBuffer = null;
var audioBlob = null;
var reader = new FileReader();
var fileInput = document.querySelector('input[type="file"]');

fileInput.addEventListener('change', function(e) {

   readAudioBlob(this.files[0]);

}, false);

function forceDownload(blob, filename){
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var link = window.document.createElement('a');
    link.href = url;
    link.download = filename || 'output.wav';
    var click = document.createEvent("Event");
    click.initEvent("click", true, true);
    link.dispatchEvent(click);
  }

function stopSound() {
   if(source) {
      source.noteOff(0);
   }
}

function playSound() {

   stopSound();

   source = context.createBufferSource();
   source.buffer = audioBuffer;
   source.loop = false;
   source.connect(context.destination);
   source.noteOn(0);
}

function scramble() {

   var lAudioArray = new Array(); 
   var rAudioArray = new Array();

   lAudioArray = audioBuffer.getChannelData(0);
   rAudioArray = audioBuffer.getChannelData(1);

   var lAudioScramble = new Array();
   var rAudioScramble = new Array();

   console.log(audioBuffer.sampleRate);

   var seconds = Math.floor(audioBuffer.length / audioBuffer.sampleRate) - 1;

   console.log('seconds: ' + seconds);

   for(var i = 0; i < 30; i++) {
      var rand = Math.floor((Math.random() * seconds));
      console.log(rand);

      for(var j = 0; j < audioBuffer.sampleRate; j++) {

         lAudioScramble[audioBuffer.sampleRate*i + j] = lAudioArray[audioBuffer.sampleRate*rand + j];
         rAudioScramble[audioBuffer.sampleRate*i + j] = rAudioArray[audioBuffer.sampleRate*rand + j];

      }
   }

   var interleaved = interleaveArrays(lAudioScramble, rAudioScramble);

   var dataview = encodeWAV(interleaved);
   audioBlob = new Blob([dataview], { type: 'audio/wav' });

   reader.onload = function(e) {
      initSound(this.result);
   };
   reader.readAsArrayBuffer(audioBlob);
}

function downloadAudioBlob() {
   forceDownload(audioBlob, "scrambled.wav");
}

function interleaveArrays(lArray, rArray) {

   var interleaved = new Array();

   var i_length = rArray.length + lArray.length;
   
   for(var i = 0; i < i_length; i++) {
      interleaved[i * 2] = lArray[i];
      interleaved[i * 2 + 1] = rArray[i];
   }

   return interleaved;
}


function initSound(arrayBuffer) {
   audioArrayBuffer = arrayBuffer;
   console.log(arrayBuffer);

   context.decodeAudioData(arrayBuffer, function(buffer) {

      audioBuffer = buffer;

      document.querySelectorAll('button')[0].disabled = false;
      document.querySelectorAll('button')[1].disabled = false;
      document.querySelectorAll('button')[2].disabled = false;
      document.querySelectorAll('button')[3].disabled = false;

   }, function(err) {

      console.log('Error decoding file', err);
   });
}

function readAudioBlob(blob) {

   reader.onload = function(e) {
      initSound(this.result);
   };

   reader.readAsArrayBuffer(blob);

}


function floatTo16BitPCM(output, offset, input){
  for (var i = 0; i < input.length; i++, offset+=2){
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string){
  for (var i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples){
  var buffer = new ArrayBuffer(44 + samples.length * 2);
  var view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 32 + samples.length, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 2, true);
  /* sample rate */
  view.setUint32(24, audioBuffer.sampleRate , true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, audioBuffer.sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 4, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length, true);

  floatTo16BitPCM(view, 44, samples);

  return view;
}
