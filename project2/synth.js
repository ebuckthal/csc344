var voices = new Array();
var audioContext = null;
var settings = null;
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

var waveshaper = null;
var volNode = null;
var revNode = null;
var revGain = null;
var revBypassGain = null;

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

var currentPitchWheel = 0.0;
// 'value' is normalized to [-1,1]
function pitchWheel( value ) {
	var i;

	currentPitchWheel = value;
	for (var i=0; i<255; i++) {
		if (voices[i]) {
			if (voices[i].osc1)
				voices[i].osc1.detune.value = currentOsc1Detune + currentPitchWheel * 500;	// value in cents - detune major fifth.
			if (voices[i].osc2)
				voices[i].osc2.detune.value = currentOsc2Detune + currentPitchWheel * 500;	// value in cents - detune major fifth.
		}
	}
}

var waveforms = ["sine","square","sawtooth","triangle"];

function onUpdateModWaveform( ev ) {
	currentModWaveform = ev.target.selectedIndex;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setModWaveform( waveforms[currentModWaveform] );
		}
	}
}

function onUpdateModFrequency( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	currentModFrequency = value;
	var oscFreq = currentModFrequency * modOscFreqMultiplier;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateModFrequency( oscFreq );
		}
	}
}

function onUpdateModOsc1( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	currentModOsc1 = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateModOsc1( currentModOsc1 );
		}
	}
}

function onUpdateModOsc2( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	currentModOsc2 = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateModOsc2( currentModOsc2 );
		}
	}
}

function onUpdateFilterCutoff( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	currentFilterCutoff = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setFilterCutoff( value );
		}
	}
}

function onUpdateFilterQ( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	currentFilterQ = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setFilterQ( value );
		}
	}
}

function onUpdateFilterMod( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	currentFilterMod = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setFilterMod( value );
		}
	}
}

function onUpdateFilterEnv( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	currentFilterEnv = value;
}

function onUpdateOsc1Wave( ev ) {
	currentOsc1Waveform = ev.target.selectedIndex;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setOsc1Waveform( waveforms[currentOsc1Waveform] );
		}
	}
}

function onUpdateOsc1Octave( ev ) {
	currentOsc1Octave = ev.target.selectedIndex;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateOsc1Frequency();
		}
	}
}

function onUpdateOsc1Detune( ev ) {
	var value = ev.currentTarget.value;
	currentOsc1Detune = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateOsc1Frequency();
		}
	}
}

function onUpdateOsc1Mix( value ) {
	if (value.currentTarget)
		value = value.currentTarget.value;
	currentOsc1Mix = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateOsc1Mix( value );
		}
	}
}

function onUpdateOsc2Wave( ev ) {
	currentOsc2Waveform = ev.target.selectedIndex;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setOsc2Waveform( waveforms[currentOsc2Waveform] );
		}
	}
}

function onUpdateOsc2Octave( ev ) {
	currentOsc2Octave = ev.target.selectedIndex;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateOsc2Frequency();
		}
	}
}

function onUpdateOsc2Detune( ev ) {
	var value = ev.currentTarget.value;
	currentOsc2Detune = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateOsc2Frequency();
		}
	}
}

function onUpdateOsc2Mix( ev ) {
	var value = ev.currentTarget.value;
	currentOsc2Mix = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateOsc2Mix( value );
		}
	}
}

function onUpdateEnvA( ev ) {
	currentEnvA = ev.currentTarget.value;
}

function onUpdateEnvD( ev ) {
	currentEnvD = ev.currentTarget.value;
}

function onUpdateEnvS( ev ) {
	currentEnvS = ev.currentTarget.value;
}

function onUpdateEnvR( ev ) {
	currentEnvR = ev.currentTarget.value;
}

function onUpdateFilterEnvA( ev ) {
	currentFilterEnvA = ev.currentTarget.value;
}

function onUpdateFilterEnvD( ev ) {
	currentFilterEnvD = ev.currentTarget.value;
}

function onUpdateFilterEnvS( ev ) {
	currentFilterEnvS = ev.currentTarget.value;
}

function onUpdateFilterEnvR( ev ) {
	currentFilterEnvR = ev.currentTarget.value;
}

function onUpdateDrive( value ) {
	currentDrive = value;
    //waveshaper.setDrive( 0.01 + (currentDrive*currentDrive/500.0) );
}

function onUpdateVolume( ev ) {
	volNode.gain.value = (ev.currentTarget ? ev.currentTarget.value : ev)/100;
}

function onUpdateReverb( ev ) {
	var value = ev.cxurrentTarget ? ev.currentTarget.value : ev;
	value = value/100;

	// equal-power crossfade
	var gain1 = Math.cos(value * 0.5*Math.PI);
	var gain2 = Math.cos((1.0-value) * 0.5*Math.PI);

	revBypassGain.gain.value = gain1;
	revGain.gain.value = gain2;
}

/*
var FOURIER_SIZE = 4096;
var wave = false;

	if ( wave ) {
		var real = new Float32Array(FOURIER_SIZE);
		var imag = new Float32Array(FOURIER_SIZE);
		real[0] = 0.0;
		imag[0] = 0.0;

		for (var i=1; i<FOURIER_SIZE; i++) {
			real[i]=1.0;
			imag[i]=1.0;
		}

		var wavetable = audioContext.createWaveTable(real, imag);
		oscillatorNode.setWaveTable(wavetable);
	} else {

*/

function filterFrequencyFromCutoff( pitch, cutoff ) {
    var nyquist = 0.5 * audioContext.sampleRate;

    var filterFrequency = Math.pow(2, (9 * cutoff) - 1) * pitch;
    if (filterFrequency > nyquist)
        filterFrequency = nyquist;
	return filterFrequency;
}

SineWave = function(context) {
     var that = this;
       this.x = 0; // Initial sample number
         this.context = context;
           this.node = context.createJavaScriptNode(1024, 1, 1);
             this.node.onaudioprocess = function(e) { that.process(e) };
}

SineWave.prototype.process = function(e) {
     var data = e.outputBuffer.getChannelData(0);
       for (var i = 0; i < data.length; ++i) {
              data[i] = Math.sin(this.x++);
                }
}

SineWave.prototype.play = function() {
     this.node.connect(this.context.destination);
}

SineWave.prototype.pause = function() {
     this.node.disconnect();
}

function Voice( note, velocity ) {
   this.originalFrequency = frequencyFromNoteNumber( note );

   Sine

   this.o = audioContext.createOscillator();
   this.lfo = audioContext.createOscillator();
   this.lfo2 = audioContext.createOscillator();

   this.oGain = audioContext.createGain();
   this.lfoGain = audioContext.createGain();
   this.lfo2Gain = audioContext.createGain();

   this.o.frequency.value = this.originalFrequency;
   this.o.type = settings.oscWaveform;
   this.o.connect(this.oGain);

   this.oGain.gain.value = settings.oscGain;
   this.oGain.connect(volNode);

   this.lfo.frequency.value = settings.lfoFrequency;
   this.lfo.type = settings.lfoWaveform;
   this.lfo.connect(this.lfoGain);

   this.lfoGain.gain.value = settings.lfoGain;
   this.lfoGain.connect(this.oGain.gain);

   this.lfo2.type = settings.lfo2Waveform;
   this.lfo2.frequency.value = settings.lfo2Frequency;
   this.lfo2.connect(this.lfo2Gain);

   this.lfo2Gain.gain.value = settings.lfo2Gain;
   this.lfo2Gain.connect(this.o.frequency);

   this.lfo.start(0);
   this.lfo2.start(0);
   this.o.start(0);
}


Voice.prototype.setModWaveform = function( value ) {
	this.modOsc.type = value;
}

Voice.prototype.updateModFrequency = function( value ) {
	this.modOsc.frequency.value = value;
}

Voice.prototype.updateModOsc1 = function( value ) {
	this.modOsc1Gain.gain.value = value/10;
}

Voice.prototype.updateModOsc2 = function( value ) {
	this.modOsc2Gain.gain.value = value/10;
}

Voice.prototype.setOsc1Waveform = function( value ) {
	this.osc1.type = value;
}

Voice.prototype.updateOsc1Frequency = function( value ) {
	this.osc1.frequency.value = (this.originalFrequency*Math.pow(2,currentOsc1Octave-2));  // -2 because osc1 is 32', 16', 8'
	this.osc1.detune.value = currentOsc1Detune + currentPitchWheel * 500;	// value in cents - detune major fifth.
}

Voice.prototype.updateOsc1Mix = function( value ) {
	this.osc1Gain.gain.value = 0.005 * value;
}

Voice.prototype.setOsc2Waveform = function( value ) {
	this.osc2.type = value;
}

Voice.prototype.updateOsc2Frequency = function( value ) {
	this.osc2.frequency.value = (this.originalFrequency*Math.pow(2,currentOsc2Octave-1));
	this.osc2.detune.value = currentOsc2Detune + currentPitchWheel * 500;	// value in cents - detune major fifth.
}

Voice.prototype.updateOsc2Mix = function( value ) {
	this.osc2Gain.gain.value = 0.005 * value;
}

Voice.prototype.setFilterCutoff = function( value ) {
	var now =  audioContext.currentTime;
	var filterFrequency = filterFrequencyFromCutoff( this.originalFrequency, value/100 );
	this.filter1.frequency.cancelScheduledValues( now );
	this.filter1.frequency.setValueAtTime( filterFrequency, now );
	this.filter2.frequency.cancelScheduledValues( now );
	this.filter2.frequency.setValueAtTime( filterFrequency, now );
}

Voice.prototype.setFilterQ = function( value ) {
	this.filter1.Q.value = value;
	this.filter2.Q.value = value;
}

Voice.prototype.setFilterMod = function( value ) {
	this.modFilterGain.gain.value = currentFilterMod*24;
}

Voice.prototype.noteOff = function() {
	var now =  audioContext.currentTime;

        this.o.stop(now);
        //this.lfo.stop(now);

        /*
	var release = now + (currentEnvR/10.0);	
    var initFilter = filterFrequencyFromCutoff( this.originalFrequency, currentFilterCutoff/100 * (1.0-(currentFilterEnv/100.0)) );

//    console.log("noteoff: now: " + now + " val: " + this.filter1.frequency.value + " initF: " + initFilter + " fR: " + currentFilterEnvR/100 );
	this.envelope.gain.cancelScheduledValues(now);
	this.envelope.gain.setValueAtTime( this.envelope.gain.value, now );  // this is necessary because of the linear ramp
	this.envelope.gain.setTargetAtTime(0.0, now, (currentEnvR/100));
	this.filter1.frequency.cancelScheduledValues(now);
	this.filter1.frequency.setValueAtTime( this.filter1.frequency.value, now );  // this is necessary because of the linear ramp
	this.filter1.frequency.setTargetAtTime( initFilter, now, (currentFilterEnvR/100.0) );
	this.filter2.frequency.cancelScheduledValues(now);
	this.filter2.frequency.setValueAtTime( this.filter2.frequency.value, now );  // this is necessary because of the linear ramp
	this.filter2.frequency.setTargetAtTime( initFilter, now, (currentFilterEnvR/100.0) );

	this.osc1.stop( release );
	this.osc2.stop( release );
        */
}

var currentOctave = 3;
var modOscFreqMultiplier = 1;
var moDouble = false;
var moQuadruple = false;

function changeModMultiplier() {
	modOscFreqMultiplier = (moDouble?2:1)*(moQuadruple?4:1);
	onUpdateModFrequency( currentModFrequency );
}

function keyDown( ev ) {
	if ((ev.keyCode==49)||(ev.keyCode==50)) {
		if (ev.keyCode==49)
			moDouble = true;
		else if (ev.keyCode==50)
			moQuadruple = true;
		changeModMultiplier();
	}

	var note = keys[ev.keyCode];
	if (note)
		noteOn( note + 12*(3-currentOctave), 0.75 );
//	console.log( "key down: " + ev.keyCode );

	return false;
}

function keyUp( ev ) {
	if ((ev.keyCode==49)||(ev.keyCode==50)) {
		if (ev.keyCode==49)
			moDouble = false;
		else if (ev.keyCode==50)
			moQuadruple = false;
		changeModMultiplier();
	}

	var note = keys[ev.keyCode];
	if (note)
		noteOff( note + 12*(3-currentOctave) );
//	console.log( "key up: " + ev.keyCode );

	return false;
}


function onChangeOctave( ev ) {
	currentOctave = ev.target.selectedIndex;
}


var currentSettings = function() {

   this.volume = 0.3;

   this.oscWaveform = 'sine';
   this.oscGain = 0.5;

   this.lfoWaveform = 'sine';
   this.lfoFrequency = 2;
   this.lfoGain = 0.3;

   this.lfo2Waveform = 'sine';
   this.lfo2Frequency = 5;
   this.lfo2Gain = 50;

   this.timeWarp = 1;

}



function initAudio() {
   window.AudioContext = window.AudioContext || window.webkitAudioContext;

   try {
      audioContext = new AudioContext();

   } catch(e) {

      alert('The Web Audio API is apparently not supported in this browser.');
   }

   window.addEventListener('keydown', keyDown, false);
   window.addEventListener('keyup', keyUp, false);

   gui = new dat.GUI();
   settings = new currentSettings();

   var volController = gui.add(settings, 'volume', 0, 1);

   var menuOsc = gui.addFolder('Oscillator');
   menuOsc.add(settings, 'oscWaveform', ['sine', 'square', 'triangle', 'sawtooth']);
   menuOsc.add(settings, 'oscGain', 0, 1);

   var menuLfo = gui.addFolder('Tremolo');
   menuLfo.add(settings, 'lfoWaveform', ['sine', 'square', 'triangle', 'sawtooth']);
   menuLfo.add(settings, 'lfoFrequency', 0, 20);
   menuLfo.add(settings, 'lfoGain', 0, 1);

   var menuLfo2 = gui.addFolder('Vibrato');
   menuLfo2.add(settings, 'lfo2Waveform', ['sine', 'square', 'triangle', 'sawtooth']);
   menuLfo2.add(settings, 'lfo2Frequency', 0, 20);
   menuLfo2.add(settings, 'lfo2Gain', 0, 100);

   menuOsc.open();
   menuLfo.open();
   menuLfo2.open();


   // set up the master effects chain for all voices to connect to.
   volNode = audioContext.createGain();
   volNode.connect(audioContext.destination);
   volNode.gain.value = settings.volume;

   volController.onChange( function(value) { 

      volNode.gain.value = value;

   });

}

window.onload=initAudio;

document.querySelector('input[type="file"]').addEventListener('change', function(e) {

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

}, false);
