var Cryptocat = function() {};

Cryptocat.random = function() {
	// If called from inside a web worker, just return from web worker reserve
	if (typeof(window) === 'undefined') {
		randomReserve.splice(0, 1);
		return randomReserve[0];
	}
	var output = '';
	// The following incredibly ugly Firefox hack is completely the fault of 
	// Firefox developers sucking and it taking them four years+ to implement
	// window.crypto.getRandomValues().
	function firefoxRandomBytes() {
		var element = document.createElement('cryptocatFirefoxElement');
		document.documentElement.appendChild(element);
		var evt = document.createEvent('HTMLEvents');
		evt.initEvent('cryptocatGenerateRandomBytes', true, false);
		element.dispatchEvent(evt);
		var output = element.getAttribute('randomValues').split(',');
		delete element;
		return output;
	}
	// Firefox
	if (navigator.userAgent.match('Firefox')) {
		var buffer = firefoxRandomBytes();
		for (var i in buffer) {
			if (buffer[i] < 250) {
				output += buffer[i] % 10;
			}
		}
	}
	// Browsers that don't require shitty workarounds
	else {
		var buffer = new Uint8Array(1);
		while (output.length < 16) {
			window.crypto.getRandomValues(buffer);
			if (buffer[0] < 250) {
				output += buffer[0] % 10;
			}
		}
	}
	return parseFloat('0.' + output);
}