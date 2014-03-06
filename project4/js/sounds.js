var context = new webkitAudioContext(); 

//keeps track of the current patterns for each istrument and the seed
var sequence = {
   instruments: {},
   playing: false,
   seed: null
}

//predetermined possible samples for each instrument and potential patterns
var instruments = {
   kick: { 
            urls: [
               'sounds/kick/sk1-bd.wav',
               'sounds/kick/pairwave.wav',
               'sounds/kick/casiokick.wav',
               'sounds/kick/artifact.wav',
               'sounds/kick/idm.wav'
            ],
            buffers: [],
            repeat: 2,
            subPatterns: [
               [true, false, true, false, true, false, true, false],
               [true, true, false, false, true, true, false, false],
               [true, false, false, false, true, true, false, false],
               [true, false, false, true, true, false, false, false],
               [false, false, false, false, false, false, false, false],
               [false, false, false, false, false, false, false, false],
            ]
         },
   hat: { 
           urls: [
              'sounds/hat/sk-hhc.wav',
              'sounds/hat/hh-rz1.wav',
              'sounds/snare/dah.wav'
           ],
           buffers: [],
           repeat: 2,
           subPatterns: [
               [true, false, false, false, true, false, false, false],
               [true, false, false, false, true, false, false, false],
               [true, false, true, false, true, false, false, false],
               [false, false, false, false, false, false, false, false],
               [false, false, false, false, false, false, false, false],
           ]
        },
   snare: { 
             urls: [
              'sounds/snare/sk-tomlo.wav',
              'sounds/hat/oceanic.wav',
              'sounds/snare/synth-base.wav',
             ],
             buffers: [],
             repeat: 2,
             subPatterns: [
                [true, false, false, true, true, false, false, false],
                [true, false, false, false, true, false, false, false],
                [true, false, false, false, true, false, false, false],
                [false, false, false, false, false, false, false, false],
                [false, false, false, false, false, false, false, false],
             ]
          },
   fx: {
          urls: [
             'sounds/fx/52.mp3',
             'sounds/fx/elmomo.wav',
             'sounds/fx/53.mp3',
             'sounds/fx/55.mp3',
             'sounds/fx/57.mp3',
             'sounds/fx/success.wav',
             'sounds/fx/error.wav',
             'sounds/fx/insult.wav',
             'sounds/fx/moog.mp3',
          ],
          buffers: [],
          repeat: 1,
          subPatterns: [
             [true, false, false, false, false, false, false, false],
             [false, false, false, true, false, false, false, false],
             [false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false],
         ],
      }
};

//my own random so I can play with custom seeds 
function random() {
   var x = Math.sin(sequence.seed++) * 10000;
   return x - Math.floor(x);
}

//plays a list of seeds (re: a song), in order
function playSong(seeds) {

   var seedIndex = 0;
   while(seedIndex < seeds.length) {

      if(!isSequencePlaying()) {
         seedSequence(seeds[seedIndex++]);
      }
   }

}

//generates a new sequence with the seed, then plays the sequence
function seedSequence(seed) {
   console.log(seed);

   sequence.seed = seed;
   
   generateSequence();
   playSequence();
}

//a sequence is a collection of patterns and instruments
//an instrument is a sample
//a pattern is a pretermined pattern of how those samples will be played
function playSequence() {

   var now = context.currentTime;
   
   //WARNING: magic number
   var timePerTick = 0.13;

   //16 ticks per sequence
   sequence.playing = now + (timePerTick * 16);

   _.each(sequence.instruments, function(data, instrument) {

         console.log(data.pattern);

         _.each(_.flatten(data.pattern), function(beat, index) {

               var buffer = sequence.instruments[instrument];

               //can't tell if this does anything
               var tastefuloffset = random() * 0.05;

               if(beat) {
                  playSound(buffer, now + index*timePerTick + tastefuloffset);
               }

      });
   });
}

//creates a random pattern and isntrument for each instrument
function generateSequence(seed) {

   _.each(instruments, function(data, instrument) {

      sequence.instruments[instrument] = {};

      //gets a random possible sample
      var index = Math.floor(random() * data.buffers.length);
      sequence.instruments[instrument].buffer = data.buffers[index];

      sequence.instruments[instrument].pattern = generatePattern(data);
   });
}

//gets a pattern by chosing a random one from the list. if its made of subpatterns,
//repeat them
function generatePattern(instrument) {

   var pattern = [];

   for(var p = 0; p < instrument.repeat; p++) {
      var index = Math.floor(random() * instrument.subPatterns.length);

      pattern[p] = instrument.subPatterns[index];
   }

   return pattern;
}

//makes a new audio node and plays the buffer of the sample
function playSound(sound, time) {
   var source = context.createBufferSource();
   source.buffer = sound.buffer;
   source.connect(context.destination);
   source.start(time);
}

function isSequencePlaying() {
   return context.currentTime < sequence.playing;
}

//initializes all of the samples from the original list of instruments
function loadSounds() {

   _.each(instruments, function(value, key) {

      _.each(value.urls, function(url, index) {

         var request = new XMLHttpRequest();
         request.open('GET', url, true);
         request.responseType = 'arraybuffer';

         request.onload = function() {

            context.decodeAudioData(request.response, function(buffer) {

               value.buffers[index] = buffer;

            }, function(err) {
               console.log('decodeAudioData error: ' + err);
            })
         };

         request.send();

      });
   });

}

window.ondload = loadSounds();
