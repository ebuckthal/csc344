var SYNTH = (function() { "use strict";

   var instance = null;

   function init() {

      var pub = {};

      var audioContext = null;

      var volNode = null; 
      var tremoloGain = null; 
      var tremoloLFO = null; 

      var voices = null;
      var keys = null;

      var gui = null;
      var settings = null;

      var volController = null;
      var tremoloWaveformCtrl = null;
      var tremoloFrequencyCtrl = null;
      var tremoloGainCtrl = null;

      
      pub.initAudio = initAudio;
      function initAudio() {
         voices = new Array();
         keys = new Array( 256 );

         window.AudioContext = window.AudioContext || window.webkitAudioContext;
         try {
            audioContext = new AudioContext();
         } catch(e) {
            alert('The Web Audio API is apparently not supported in this browser.');
         }

         keys[65] = 60; // = C4 ("middle C")
         keys[87] = 61;
         keys[83] = 62;
         keys[69] = 63;
         keys[68] = 64;
         keys[70] = 65; // = F4
         keys[84] = 66;
         keys[71] = 67;
         keys[89] = 68;
         keys[72] = 69;
         keys[85] = 70;
         keys[74] = 71;
         keys[75] = 72; // = C5
         keys[79] = 73;
         keys[76] = 74;
         keys[80] = 75;
         keys[186] = 76;
         keys[222] = 77; // = F5
         keys[221] = 78;
         keys[13] = 79;
         keys[220] = 80;

         initGUI();
         initEffects();
      }

      pub.keyDown = keyDown;
      function keyDown(ev) {

         var note = keys[ev.keyCode];
         if (note)
            noteOn(note, 0.75);

         return false;
      }

      pub.keyUp = keyUp;
      function keyUp(ev) {

         var note = keys[ev.keyCode];
         if (note)
            noteOff(note);

         return false;
      }

      pub.playMIDIFile = playMIDIFile;
      function playMIDIFile(file) {

         var midifile = MidiFile(file);

         MIDI.Player.addListener(function(data) {
            if(data.message == 144) {
               noteOn(data.note, data.velocity);
            } else if (data.message == 128) {
               noteOff(data.note);
            }
         });

         MIDI.Player.loadMidiFile(midifile, function(data) {
            MIDI.Player.start();
         });

      };

      //private methods

      function initGUI() {
         gui = new dat.GUI();
         settings = new function() {
            
            this.volume = 0.3;

            this.oscWaveform = 'sine';
            this.oscGain = 0.5;

            this.lfoWaveform = 'sine';
            this.lfoFrequency = 2;
            this.lfoGain = 0.3;

            this.timeWarp = 1;
         };


         volController = gui.add(settings, 'volume', 0, 1);

         var menuOsc = gui.addFolder('Oscillator');
         menuOsc.add(settings, 'oscWaveform', ['sine', 'square']);
         menuOsc.add(settings, 'oscGain', 0, 1);

         var menuLfo = gui.addFolder('Tremolo');
         tremoloWaveformCtrl = menuLfo.add(settings, 'lfoWaveform', ['sine', 'square', 'triangle', 'sawtooth']);
         tremoloFrequencyCtrl = menuLfo.add(settings, 'lfoFrequency', 0, 300);
         tremoloGainCtrl = menuLfo.add(settings, 'lfoGain', 0, 2);

         menuOsc.open();
         menuLfo.open();
      }

      function initEffects() {

         volNode = audioContext.createGain();
         tremoloGain = audioContext.createGain();
         tremoloLFO = audioContext.createOscillator();

         tremoloLFO.frequency.value = settings.lfoFrequency;
         tremoloLFO.type = settings.lfoWaveform;
         tremoloLFO.connect(tremoloGain.gain);
         tremoloLFO.start(0);

         tremoloGain.gain.value = 0;
         tremoloGain.connect(volNode);

         volNode.connect(audioContext.destination);
         volNode.gain.value = settings.volume;

         tremoloGainCtrl.onChange(function(value) {
            tremoloGain.gain.value = value;
         });

         tremoloFrequencyCtrl.onChange( function(value) {
            tremoloLFO.frequency.value = value;
         });

         tremoloWaveformCtrl.onChange( function(value) {
            tremoloLFO.type = value;
         });

         volController.onChange( function(value) { 
            volNode.gain.value = value;
         });
      }

      var frequencyFromNoteNumber = function(note) {
         return 440 * Math.pow(2,(note-69)/12);
      }

      function noteOn( note, velocity ) {
         if (voices[note] == null) {
            // Create a new synth node
            voices[note] = new Voice(note, velocity);
         }
      }

      function noteOff( note ) {
         if (voices[note] != null) {
            // Shut off the note playing and clear it 
            voices[note].noteOff();
            voices[note] = null;
         }
      }


      function Voice( note, velocity ) {
         this.originalFrequency = frequencyFromNoteNumber( note );
         var now = audioContext.currentTime;

         this.envelope = audioContext.createGain();
         this.o = audioContext.createScriptProcessor(1024, 0, 1);
         this.oGain = audioContext.createGain();

         this.o.type = settings.oscWaveform;
         this.o.frequency = this.originalFrequency;
         this.o.x = 0;
         this.o.onaudioprocess = oscillatorNode; 
         this.o.connect(this.oGain);

         this.oGain.gain.value = settings.oscGain;
         this.oGain.connect(this.envelope);

         this.envelope.connect(tremoloGain);

         this.envelope.gain.value = 0.0;
         this.envelope.gain.setValueAtTime(0.0, now);
         this.envelope.gain.linearRampToValueAtTime(1.0, now+0.2);

      }

      Voice.prototype.noteOff = function() {
         var now = audioContext.currentTime;
         var release = now + 0.1;

         this.envelope.gain.cancelScheduledValues(now);
         this.envelope.gain.setValueAtTime( this.envelope.gain.value, now );  // this is necessary because of the linear ramp
         this.envelope.gain.setTargetAtTime(0.0, now, 0.1);

      }


      function oscillatorNode(audioEvent) {
         var outputBuffer = audioEvent.outputBuffer;

         switch(this.type) {

            case "sine":
               for(var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {

                  var outData = outputBuffer.getChannelData(0);

                  for(var sample = 0; sample < outputBuffer.length; sample++) {
                     this.x += (this.frequency / 44100);
                     
                     outData[sample] = Math.sin(this.x * Math.PI * 2) + (1/3) * Math.sin(this.x * Math.PI * 6)
                  }
               }

               break;

            case "square":
                  for(var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {

                     var outData = outputBuffer.getChannelData(0);

                     for(var sample = 0; sample < outputBuffer.length; sample++) {

                        this.x += (this.frequency / 44100);
                        outData[sample] = Math.sin(this.x * Math.PI * 2);

                        for(var waves = 3; waves <= 13; waves += 2) {
                           outData[sample] += ((1/waves) * Math.sin(this.x * Math.PI * 2 * waves));
                        }
                     }
                  }

               break;

            default:

               break;
         }

      };

      return pub;
   };

   return {

      createSynth:
         function() {

            if(!instance) {
               instance = init();
            }

            return instance;
         }
   };

})();
