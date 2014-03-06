var context = new webkitAudioContext(); 

var events = [];

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

function random() {
   var x = Math.sin(sequence.seed++) * 10000;
   return x - Math.floor(x);
}

function playSong(seeds) {

   var seedIndex = 0;
   while(seedIndex < seeds.length) {

      if(!isSequencePlaying()) {
         g(seeds[seedIndex++]);
      }
   }

}

function g(seed) {
   console.log(seed);
   sequence.seed = seed;
   generateSequence();
   playSequence();
}

function generateSequence(seed) {

   _.each(instruments, function(data, instrument) {

      var index = Math.floor(random() * data.buffers.length);

      sequence.instruments[instrument] = {};

      sequence.instruments[instrument].buffer = data.buffers[index];

      sequence.instruments[instrument].pattern = generatePattern(data);
   });
}

function generatePattern(instrument) {

   var pattern = [];

   for(var p = 0; p < instrument.repeat; p++) {
      var index = Math.floor(random() * instrument.subPatterns.length);

      pattern[p] = instrument.subPatterns[index];
   }

   return pattern;
}

var sequence = {
   instruments: {},
   playing: false,
   seed: null
}

function loadSounds() {

   _.each(instruments, function(value, key) {

      _.each(value.urls, function(url, index) {

         console.log(url);

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

function playSound(sound, time) {
   var source = context.createBufferSource();
   source.buffer = sound.buffer;
   source.connect(context.destination);
   source.start(time);
}

function isSequencePlaying() {
   return context.currentTime < sequence.playing;
}

function playSequence(bpm) {

   var now = context.currentTime;
   var timePerTick = 0.13;

   sequence.playing = now + (timePerTick * 16);


   _.each(sequence.instruments, function(data, instrument) {

         console.log(data.pattern);

         _.each(_.flatten(data.pattern), function(beat, index) {

               var buffer = sequence.instruments[instrument];

               var tastefuloffset = random() * 0.05;

               if(beat) {
                  playSound(buffer, now + index*timePerTick + tastefuloffset);
               }

      });
   });
}
