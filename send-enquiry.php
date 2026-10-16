<?php
/**
 * Receives the "Request a callback" form (JSON from js/app.js) and emails it internally.
 * Upload next to index.html. Needs PHP hosting (any cPanel/shared host has it).
 */

// ---- SETTINGS: change these two ----
$TO   = 'enquiries@greenstechnologys.com';   // inbox that should receive leads
$FROM = 'no-reply@greenstechnologys.com';    // an address on YOUR domain (helps avoid spam folders)
// ------------------------------------

date_default_timezone_set('Asia/Kolkata');   // so the Time: line in lead emails is IST

header('Content-Type: application/json; charset=utf-8');

function fail($code, $msg) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'POST only');

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) fail(400, 'Bad request');

// Strip line breaks (blocks email header injection) and limit length
$clean = function ($v, $max = 120) {
    $v = is_string($v) ? $v : '';
    $v = trim(preg_replace('/[\r\n\t]+/', ' ', $v));
    return mb_substr($v, 0, $max);
};

$name   = $clean($data['name']   ?? '');
$phone  = $clean($data['phone']  ?? '', 20);
$course = $clean($data['course'] ?? '');
$page   = $clean($data['page']   ?? '', 200);
$url    = $clean($data['url']    ?? '', 300);
// 'syllabus' = phone-for-PDF form (name optional); anything else = callback form
$type   = (($data['type'] ?? '') === 'syllabus') ? 'syllabus' : 'callback';

// Basic validation
if (($type === 'callback' && $name === '') || strlen(preg_replace('/\D/', '', $phone)) < 10) fail(422, 'Invalid details');
if (empty($data['consent'])) fail(422, 'Consent required');

// Simple throttle: one submission per 20 seconds per visitor IP and form type
$ipFile = sys_get_temp_dir() . '/enq_' . $type . '_' . md5($_SERVER['REMOTE_ADDR'] ?? '');
if (file_exists($ipFile) && time() - filemtime($ipFile) < 20) fail(429, 'Please wait a moment');
touch($ipFile);

$subject = ($type === 'syllabus') ? "Syllabus download: $course ($phone)" : "Callback request: $course ($name)";
$body =
    ($type === 'syllabus' ? "New syllabus download\n\n" : "New callback request\n\n") .
    "Name:   " . ($name !== '' ? $name : '(not given)') . "\n" .
    "Phone:  $phone\n" .
    "Course: $course\n" .
    "Consent: " . (!empty($data['consent']) ? 'Yes' : 'No') . " (" . $clean($data['consent_policy'] ?? '', 80) . ")\n" .
    "Page:   $page\n" .
    "URL:    $url\n" .
    "Time:   " . date('d M Y, H:i') . "\n";

$headers  = "From: Greens Technology <$FROM>\r\n";
$headers .= "Reply-To: $FROM\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

if (!mail($TO, $subject, $body, $headers)) fail(500, 'Mail failed');

echo json_encode(['ok' => true]);
