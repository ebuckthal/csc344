var voices = new Array();
var audioContext = null;
var gui = null;

var keys = new Array( 256 );
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

var volNode = null;
var tremoloGain = null;
var tremoloLFO = null;

window.addEventListener('keyup', keyUp, false);
window.addEventListener('keydown', keyDown, false);
document.querySelector('input[type="file"]').addEventListener('change', onFileSelect, false); 

window.onload = function initAudio() {

   window.AudioContext = window.AudioContext || window.webkitAudioContext;

   try {
      audioContext = new AudioContext();
   } catch(e) {
      alert('The Web Audio API is apparently not supported in this browser.');
   }

   initGUI();
   initEffects();
}

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

   menuOsc = gui.addFolder('Oscillator');
   menuOsc.add(settings, 'oscWaveform', ['sine', 'square']);
   menuOsc.add(settings, 'oscGain', 0, 1);

   menuLfo = gui.addFolder('Tremolo');
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

function onFileSelect(e) {

   var reader = new FileReader();

   reader.onload = function(e) {

      midifile = MidiFile(this.result);
      
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

   reader.readAsBinaryString(this.files[0]);

};

var currentOctave = 3;

function keyDown( ev ) {

	var note = keys[ev.keyCode];
	if (note)
		noteOn( note + 12*(3-currentOctave), 0.75 );
	return false;
}

function keyUp( ev ) {

	var note = keys[ev.keyCode];
	if (note)
		noteOff( note + 12*(3-currentOctave) );
	return false;
}


function frequencyFromNoteNumber( note ) {
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

   this.o = audioContext.createScriptProcessor(1024, 0, 1);
   this.oGain = audioContext.createGain();

   this.o.type = settings.oscWaveform;
   this.o.frequency = this.originalFrequency;
   this.o.x = 0;
   this.o.onaudioprocess = (this.o.type == "sine") ? audioSine : audioSquare; 
   this.o.connect(this.oGain);

   this.oGain.gain.value = settings.oscGain;
   this.oGain.connect(tremoloGain);
}

Voice.prototype.noteOff = function() {
	var now = audioContext.currentTime;
        this.o.disconnect();
}

function audioSine(audioEvent) {
   var outputBuffer = audioEvent.outputBuffer;

   for(var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {

      var outData = outputBuffer.getChannelData(0);

      for(var sample = 0; sample < outputBuffer.length; sample++) {
         this.x += (this.frequency / 44100);
         
         outData[sample] = Math.sin(this.x * Math.PI * 2) + (1/3) * Math.sin(this.x * Math.PI * 6)
      }
   }
};

function audioSquare(audioEvent) {
   var outputBuffer = audioEvent.outputBuffer;

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
};
