var SYNTH = (function() { "use strict";

   var audioContext = new webkitAudioContext();
   var voices = {};

   //GUI stuff
   var settings;
   var gui;

   var keyboard;

   //Effects stuff
   var masterGain;
   var effectsChain;
   var filter;
   var bufferSource = audioContext.createBufferSource();

   initFile();
   initGUI();
   initKeyboard();
   initEffects();

   function initFile(file) {

      var reader = new FileReader();

      reader.onload = function(result) {

         audioContext.decodeAudioData(result.target.result, function(buffer) {
            bufferSource.buffer = buffer;
            bufferSource.connect(effectsChain);
            bufferSource.noteOn(0);
         });
      };

      reader.readAsArrayBuffer(file);

   };
   
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

         this.filterType = 'lowpass';
         this.filterFreq = 100;
         this.filterQ = 10;
      };


      var menuOscillator = gui.addFolder('Oscillator');
      menuOscillator.add(settings, 'oscillatorWaveform', ['sine', 'square', 'triangle', 'sawtooth']);
      menuOscillator.add(settings, 'oscillatorGain', 0, 1);
      menuOscillator.add(settings, 'attackGain', 0, 1);
      menuOscillator.add(settings, 'attackTime', 0.01, 1);
      menuOscillator.add(settings, 'decayTime', 0.01, 1);
      menuOscillator.add(settings, 'releaseTime', 0.01, 1);

      var menuLFO = gui.addFolder('Frequency Modulator');
      var lfoFreqCtrl = menuLFO.add(settings, 'lfoFrequency', 0, 20);
      var lfoGainCtrl = menuLFO.add(settings, 'lfoGain', 0, 1);

      menuOscillator.open();
      menuLFO.open();

      var volController = gui.add(settings, 'masterGain', 0, 1); 
      var filterFreqCtrl = gui.add(settings, 'filterFreq', 100, 22050);
      var filterQCtrl = gui.add(settings, 'filterQ', 0, 30);
      var filterTypeCtrl = gui.add(settings, 'filterType', ['lowpass', 'highpass', 'bandpass']);

      volController.onChange(function(value) {
         masterGain.gain.value = value;
      });

      filterFreqCtrl.onChange(function(value) {
         filter.frequency.value = value;
      });
      
      filterQCtrl.onChange(function(value) {
         filter.Q.value = value;
      });

      filterTypeCtrl.onChange(function(value) {
         filter.type = value;
      });

      lfoFreqCtrl.onChange(function(value) {
         for(var voice in voices) {
            voices[voice].updateLFOFreq(value);
         }
      });

      lfoGainCtrl.onChange(function(value) {
         for(var voice in voices) {
            voices[voice].updateLFOGain(value);
         }
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
      effectsChain = audioContext.createGain();
      filter = audioContext.createBiquadFilter();

      effectsChain.gain.value = 1;
      effectsChain.connect(filter);

      filter.type = settings.filterType;
      filter.frequency.value = settings.filterFreq;
      filter.Q.value = settings.filterQ;
      filter.connect(masterGain);


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

      this.lfoGain.gain.value = settings.lfoGain * this.originalFrequency / 2;
      this.lfoGain.connect(this.oscillator.frequency);

      this.oscillator.frequency.value = this.originalFrequency;
      this.oscillator.type = settings.oscillatorWaveform;
      this.oscillator.connect(this.envelope);

      this.envelope.gain.setValueAtTime(0, now);
      this.envelope.gain.linearRampToValueAtTime(settings.attackGain, now + settings.attackTime);
      this.envelope.gain.linearRampToValueAtTime(settings.oscillatorGain, now + settings.attackTime + settings.decayTime);
      this.envelope.connect(effectsChain);

      this.lfo.start(0);
      this.oscillator.start(0);
   };

   Voice.prototype.updateLFOFreq = function(value) {
      this.lfo.frequency.value = value;
   }
   Voice.prototype.updateLFOGain = function(value) {
      this.lfoGain.gain.value = value*this.originalFrequency / 2;
   }


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
      initFile: initFile
   }

})();
