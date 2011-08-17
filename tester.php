<?php
if (isset($_GET['init'])) {
	echo json_encode(array('key_log' => substr(md5(time()), 0, 20)));
	exit;
}

session_start();

$key = $_GET['key_log'];

if (!isset($_SESSION[$key])) {
	$_SESSION[$key] = (object) array(
		'index' => 0,
		'time' => time() + 1
	);
}

if ($_SESSION[$key]->time < time()) {
	$_SESSION[$key]->index++;
	$_SESSION[$key]->time = time() + 1;
}

$json = array(
	'status' => 'RUNNING',
	'log'    => array(
		'Starting conversion'
	),
	'epub-url' => '/epub/tmp5_ww_F.epub',
	'log-url'  => '/log/tmp5_ww_F.html'
);

if ($_SESSION[$key]->index >= 1)
	$json['log'][] = 'Converting AsciiDoc to DocBook';
if ($_SESSION[$key]->index >= 2)
	$json['log'][] = 'Validating DocBook';
if ($_SESSION[$key]->index >= 3)
	$json['log'][] = 'Generating epub';
if ($_SESSION[$key]->index >= 4)
	$json['log'][] = 'Cleaning up files';
if ($_SESSION[$key]->index == 5) {
	$json['log'][] = 'Conversion complete';
	$json['status'] = isset($_GET['error']) ? 'ERROR' : 'COMPLETE';
	unset($_SESSION[$key]);
} else
	$_SESSION[$key]++;

echo json_encode($json);