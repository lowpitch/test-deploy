/*! This script is copy & mixing of:
 *  https://gist.github.com/KrofDrakula/5318048
 *  https://gist.github.com/joelambert/1002116
 *
 *  draf.js
 *  'play-safe' requestAnimationFrame (also safe for iOS)
 *
 *  Public License
 */
(function() {

	var blacklisted = /iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent),
		lastTime = 0,
		nativeRequest = window.requestAnimationFrame || null,
		nativeCancel = window.cancelAnimationFrame || null;

	['webkit', 'moz'].forEach(function(prefix) {
		nativeRequest = nativeRequest || window[prefix + 'RequestAnimationFrame'] || null;
		nativeCancel = nativeCancel || window[prefix + 'CancelAnimationFrame'] || window[prefix + 'CancelRequestAnimationFrame'] || null;
	});

	function polyfillRequest(callback, element) {
		var currTime = Date.now();
		var timeToCall = Math.max(0, 16 - (currTime - lastTime));
		var id = window.setTimeout(function() {
			callback(currTime + timeToCall);
		}, timeToCall);
		lastTime = currTime + timeToCall;
		return id;
	}

	function polyfillCancel(id) {
		clearTimeout(id);
	}

	window.requestAnimationFrame = (!blacklisted && nativeRequest != null) ? nativeRequest : polyfillRequest;
	window.cancelAnimationFrame = (!blacklisted && nativeCancel != null) ? nativeCancel : polyfillCancel;



	// drop in replacement for setTimeout
	// behaves the same as setTimeout, except uses requestAnimationFrame when possible for better performance
	window.requestTimeout = function(fn, delay) {
		if (blacklisted === true || nativeRequest == null)
			return window.setTimeout(fn, delay);

		var start = Date.now(),
			handle = {};

		function loop() {
			var current = Date.now(),
				delta = current - start;

			delta >= delay ? fn.call() : handle.value = requestAnimationFrame(loop);
		};

		handle.value = requestAnimationFrame(loop);
		return handle;
	};

	// drop in replacement for clearTimeout
	// behaves the same as clearTimeout, except uses requestAnimationFrame when possible for better performance
	window.clearRequestTimeout = function(handle) {
		(!blacklisted && nativeCancel != null) ? window.cancelAnimationFrame(handle.value): clearTimeout(handle);
	};



	// drop in replacement for setInterval
	// behaves the same as setInterval, except uses requestAnimationFrame when possible for better performance
	window.requestInterval = function(fn, delay) {
		if (blacklisted === true || nativeRequest == null)
			return window.setInterval(fn, delay);

		var start = Date.now(),
			handle = {};

		function loop() {
			handle.value = requestAnimationFrame(loop);
			var current = Date.now(),
				delta = current - start;

			if (delta >= delay) {
				fn.call();
				start = Date.now();
			}
		};

		handle.value = requestAnimationFrame(loop);
		return handle;
	}

	// drop in replacement for clearInterval
	// behaves the same as clearInterval, except uses requestAnimationFrame when possible for better performance
	window.clearRequestInterval = function(handle) {
		(!blacklisted && nativeCancel != null) ? window.cancelAnimationFrame(handle.value): clearInterval(handle);
	};

})();