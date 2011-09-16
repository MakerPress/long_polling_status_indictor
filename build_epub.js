function getParameterByName(name) {

    var match = RegExp('[?&]' + name + '=([^&]*)')
                    .exec(window.location.search);

    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));

}


jQuery(function () {
	var default_config = {
		// The element that should trigger the plugin.
		'activate_selector': '#start_button',
		
		// The type(s) of events that should trigger the plugin
		'activate_events':   'click',
		
		// Base URL for the location of the epub-url and log-url
		// directories.
		'file_url':       '.',
		
		// The URL to initalize with, should return a JSON object
		// with a 'key_log' key.
		'init_url': 'wsgi-bin/launch_validate.wsgi?root=' + getParameterByName('root'),
		
		// The URL to get progress from.
		'prog_url': 'wsgi-bin/monitor_validate.wsgi',
		
		// The minimal delay in milliseconds to wait between status
		// updates. Also waits for previous status updates to
		// complete.
		'delay': 100
	};
	
	function poll_server($root, key, callback_url) {
		var config = $root.file_progress('config');
		var start_time = (new Date()).getTime();
		$.ajax({
			url: config.prog_url,
			data: {
				key_log: key,
				rand:    start_time,
			},
			dataType: 'json',
			type:     'get',
			success:  function (json) {
				
				var status = json.status.toLowerCase();
				var diff_time = (new Date()).getTime() - start_time;
				var $log = $root.find('.log');
				var $last_log = $log.find('li:last');
				var $status = $root.find('.status');
				var row_class = $last_log.hasClass('odd') ? 'even' : 'odd';
				$status.text(json.status);
				switch (status) {
					case 'running':
						var newest_log = Array.prototype.slice.call(json.log, -1);
						if (newest_log != $log.find('li:last').text())
							$log.append('<li class="' + row_class + '">' + newest_log + '</li>');
						
						setTimeout(function () {
							poll_server($root, key);
						}, diff_time > config.delay ? -1 : config.delay - diff_time);
						break;
					case 'complete':
						$log.append('<li class="' + row_class + '"><a href="' + config.file_url + json['epub-url'] + '">' + json['epub-url'] + '</a></li>');
						$status.addClass('complete');
						break;
					case 'error':
						$log.append('<li class="' + row_class + '"><a href="' + config.file_url + json['log-url'] + '">' + json['log-url'] + '</a></li>');
						$status.addClass('error');
						break;
				}
			}
		});
	}
	
	$.fn.file_progress = function () {
		var args = arguments;
		var $root = $(this);
		var config = $root.data('config') == undefined ? default_config : $root.data('config');
		var sub_func = 'init';
		if (typeof args[0] == 'object') {
			config = $.extend({}, config, args[0]);
			if (typeof args[1] == 'string')
				sub_func = args[1];
			args = Array.prototype.slice.call(args, 2);
		} else if (typeof args[0] == 'string') {
			sub_func = args[0];
			args = Array.prototype.slice.call(args, 1);
		}
		switch (sub_func) {
			case 'config':
				if (args[0] != undefined)
					config = $.extend({}, config, args[0]);
				break;
			case 'init':
				if ($.trim($root.html()) == '')
					$root.html('<div><strong>Status:</strong> <span class="status">Initalizing...</span></div><ul class="log"></ul>');
				// Add the click event
				$(config.activate_selector)
					.data('file_progress', $root)
					.bind(config.activate_events, function (event) {
						event.preventDefault ? event.preventDefault() : event.returnValue = false;
						var $root = $(this).data('file_progress');
						$root.find('.status').removeClass('error complete');
						var config = $root.data('config');
						
						$root.find('.status').text('INITALIZING');
						$root.find('.log').html('');
						
						$.ajax({
							url: config.init_url,
							dataType: 'json',
							type: 'get',
							success: function (json) {
								poll_server($root, json.key_log, json.callback_url);
							}
						});
					});
				break;
		}
		$root.data('config', config);
		return sub_func == 'config' ? config : $root;
	}
});
