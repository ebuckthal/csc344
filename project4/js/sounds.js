var context = new webkitAudioContext(); 

var sounds = {
   kick: { url: 'sounds/pling1.mp3' },
   hat: { url: 'sounds/pling2.mp3' },
   snare: { url: 'sounds/pling3.mp3' }
};

function loadSounds() {

   _.each(sounds, function(value, key) {

      var request = new XMLHttpRequest();
      request.open('GET', value.url, true);
      request.responseType = 'arraybuffer';

      request.onload = function() {

         context.decodeAudioData(request.response, function(buffer) {
            value.buffer = buffer;
         }, function(err) {
            console.log('decodeAudioData error: ' + err);
         })
      };

      request.send();

   });

}

function playSound(sound, time) {
   var source = context.createBufferSource();
   source.buffer = sound.buffer;
   source.connect(context.destination);
   source.start(time);
}

function generatePattern(instrument) {

   var patternLength = 32;
   var pattern = [];

   for(var i = 0; i < patternLength; i++) {
      pattern[i] = 0;

      if(instrument == 'snare') {
         pattern[i] = (i % 4 == 0 ? 1 : 0);
      }

      if(instrument == 'kick') {
         pattern[i] = (i % 8 == 0 ? 1 : 0);
      }
   }

   return pattern;

}

function generateSequence() {

   _.each(sounds, function(data, instrument) {

      data.pattern = generatePattern(instrument);

   });

}

function playSequence(bpm) {

   var now = context.currentTime;

   console.log(now);

   var timePerTick = 0.06;

   _.each(sounds, function(data, instrument) {
      for(var tick = 0; tick < 32; tick++) {

         if(data.pattern[tick] > 0) {
            playSound(data, now + tick*timePerTick);
         }
      }
   });

}


window.onload = function() {
   loadSounds();
}

window.addEventListener('click', function(e) {
   generateSequence();
   playSequence();
});
