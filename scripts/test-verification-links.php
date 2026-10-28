<?php
// Standalone regression test: php scripts/test-verification-links.php
define('ABSPATH', __DIR__);
define('DAY_IN_SECONDS', 86400);

function add_action(...$args) {}
function add_filter(...$args) {}
function register_activation_hook(...$args) {}
function register_deactivation_hook(...$args) {}
function update_user_meta($id, $key, $value) {
    $GLOBALS['verification_meta'][$key] = $value;
}
function esc_url_raw($url) { return $url; }
function wp_parse_url($url, $component = -1) { return parse_url($url, $component); }
function home_url($path = '') { return 'https://shop.engineerparts.com' . $path; }
function site_url() { return 'https://shop.engineerparts.com'; }
function untrailingslashit($url) { return rtrim($url, '/'); }
function esc_url($url) { return htmlspecialchars($url, ENT_QUOTES, 'UTF-8'); }
function esc_html($text) { return htmlspecialchars($text, ENT_QUOTES, 'UTF-8'); }
function wp_mail($to, $subject, $body, $headers) {
    $GLOBALS['verification_email'] = $body;
    return true;
}

function add_query_arg($args, $url) {
    // WordPress does not URL-encode newly supplied query argument values.
    $query = array();
    foreach ($args as $key => $value) {
        $query[] = $key . '=' . $value;
    }
    return $url . '?' . implode('&', $query);
}

require __DIR__ . '/../wordpress-plugin/engineerparts-account/engineerparts-account.php';

$send = new ReflectionMethod(EngineerParts_Customer_Accounts::class, 'send_verification');
$send->setAccessible(true);

foreach (array('user@example.com', 'user+test@example.com', 'user+one+two@example.com', 'user&team@example.com') as $email) {
    $send->invoke(null, 123, $email);
    if (!preg_match('/href="([^"]*\/verify-email\?[^"]*)"/', $GLOBALS['verification_email'], $match)) {
        throw new RuntimeException('Verification email has no action link.');
    }
    $url = html_entity_decode($match[1], ENT_QUOTES, 'UTF-8');
    parse_str(parse_url($url, PHP_URL_QUERY), $query);
    if (($query['email'] ?? null) !== $email) {
        throw new RuntimeException('Email address did not survive the verification URL round trip.');
    }
    if (!preg_match('/^[a-f0-9]{64}$/', $query['token'] ?? '')) {
        throw new RuntimeException('Verification token is malformed.');
    }
    if (!hash_equals($GLOBALS['verification_meta']['_engineerparts_verify_hash'], hash('sha256', $query['token']))) {
        throw new RuntimeException('Verification token does not match the stored hash.');
    }
}

echo "Verification link tests passed.\n";
