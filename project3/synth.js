var SYNTH = (function() { "use strict";

   var audioContext = new webkitAudioContext();
   var voices = {};

   //GUI stuff
   var settings = null;
   var gui = null;

   var keyboard = null;

   //Effects stuff
   var masterGain = null;

   initGUI();
   initKeyboard();
   initEffects();
   
   function initGUI() {
      
      gui = new dat.GUI();
      settings = new function() { //for GUI
         this.masterGain = 0.3;

         this.oscillatorWaveform = 'sawtooth';
         this.oscillatorGain = 0.5;

         this.lfoWaveform = 'sine';
         this.lfoFrequency = 2;
         this.lfoGain = 0.1;

         this.attackGain = 0.7;
         this.attackTime = 0.1;
         this.decayTime = 0.1;
         this.releaseTime = 0.1;
      };


      var menuOscillator = gui.addFolder('Oscillator');
      menuOscillator.add(settings, 'oscillatorWaveform', ['sine', 'square', 'triangle', 'sawtooth']);
      menuOscillator.add(settings, 'oscillatorGain', 0, 1);
      menuOscillator.add(settings, 'attackGain', 0, 1);
      menuOscillator.add(settings, 'attackTime', 0.01, 1);
      menuOscillator.add(settings, 'decayTime', 0.01, 1);
      menuOscillator.add(settings, 'releaseTime', 0.01, 1);

      var menuLFO = gui.addFolder('Frequency Modulator');
      menuLFO.add(settings, 'lfoFrequency', 0, 200);
      menuLFO.add(settings, 'lfoGain', 0, 1);

      menuOscillator.open();
      menuLFO.open();

      var volController = gui.add(settings, 'masterGain', 0, 1); 

      volController.onChange(function(value) {
         masterGain.gain.value = value;
      });

   };

   function initKeyboard() {
      var keyboard = new QwertyHancock({
         id: 'keyboard',
         width: 600,
         height: 150,
         octaves: 2,
         startNote: 'A3',
         whiteNotesColour: 'white',
         blackNotesColour: 'black',
         hoverColour: '#f3e939',
         keyboardLayout: 'en'
      });

      keyboard.keyDown = function(note, frequency) {
         console.log('down ' + note);

         if(voices[note] === null || voices[note] === undefined || !voices[note].active) {
            voices[note] = new Voice(frequency, 120);
            voices[note].active = true;
            //console.log(voices);
         }

      };

      keyboard.keyUp = function(note, frequency) {
         console.log('up ' + note);

         voices[note].noteOff();
         voices[note].active = false;
         //delete voices[note];
      };
   };

   function initEffects() {

      masterGain = audioContext.createGain();

      masterGain.gain.value = settings.masterGain;
      masterGain.connect(audioContext.destination);


   };

   function Voice(frequency, velocity) {
      var now = audioContext.currentTime;

      this.originalFrequency = frequency;

      this.oscillator = audioContext.createOscillator();
      this.envelope = audioContext.createGain();

      this.lfo = audioContext.createOscillator();
      this.lfoGain = audioContext.createGain();

      this.lfo.type = 'sine';
      this.lfo.frequency.value = settings.lfoFrequency;
      this.lfo.connect(this.lfoGain);

      this.lfoGain.gain.value = this.originalFrequency;
      this.lfoGain.connect(this.oscillator.frequency);

      //this.oscillator.frequency.value = t;
      this.oscillator.type = settings.oscillatorWaveform;
      this.oscillator.connect(this.envelope);

      this.envelope.gain.setValueAtTime(0, now);
      this.envelope.gain.linearRampToValueAtTime(settings.attackGain, now + settings.attackTime);
      this.envelope.gain.linearRampToValueAtTime(settings.oscillatorGain, now + settings.attackTime + settings.decayTime);
      this.envelope.connect(masterGain);

      this.lfo.start(0);
      this.oscillator.start(0);
   };

   Voice.prototype.noteOff = function() {
      var now = audioContext.currentTime;

      //console.log(now + settings.attackTime);
      this.envelope.gain.setValueAtTime(this.envelope.gain.value, now);
      this.envelope.gain.linearRampToValueAtTime(0, now + settings.releaseTime);
      //this.envelope.gain.setTargetAtTime(0.0, now, 0.1);

      this.oscillator.stop(now + settings.releaseTime);
      this.lfo.stop(now + settings.releaseTime);
   };

   return {
   }

})();
