<?php
require __DIR__ . '/test-verification-links.php';

function check($condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
function WC() { return $GLOBALS['wc']; }
function get_woocommerce_currency() { return $GLOBALS['currency']; }
function sanitize_email($email) { return $email; }
function is_email($email) { return filter_var($email, FILTER_VALIDATE_EMAIL) !== false; }
function wc_get_orders($args) { return $GLOBALS['existing_orders']; }
function wc_get_order($id) { return $GLOBALS['order']; }
function absint($value) { return abs((int) $value); }
function wp_json_encode($value) { return json_encode($value); }
function is_wp_error($value) { return false; }
function rest_do_request($request) {
    $GLOBALS['store_request'] = $request;
    return new WP_REST_Response(array(
        'order_id' => 42, 'status' => 'processing',
        'payment_result' => array('payment_status' => 'success', 'redirect_url' => ''),
    ), 200);
}
class WP_REST_Response {
    private $data;
    private $status;
    public function __construct($data, $status = 200) { $this->data = $data; $this->status = $status; }
    public function get_data() { return $this->data; }
    public function get_status() { return $this->status; }
}
class WP_REST_Request {
    public $data;
    public $body;
    public function __construct($method = '', $route = '') {}
    public function get_json_params() { return $this->data; }
    public function set_header($name, $value) {}
    public function set_body($body) { $this->body = $body; }
}
class FakeRate {
    public $cost = 25;
    public $taxes = array(1 => 1.25);
    public $label = 'Delivery';
    private $method;
    public function __construct($method) { $this->method = $method; }
    public function get_method_id() { return $this->method; }
    public function set_cost($value) { $this->cost = $value; }
    public function get_taxes() { return $this->taxes; }
    public function set_taxes($value) { $this->taxes = $value; }
    public function set_label($value) { $this->label = $value; }
}
class FakeCart {
    public $subtotal = 0;
    public function get_cart_contents_total() { return $this->subtotal; }
}
class FakeGateways {
    public $enabled = 'yes';
    public function payment_gateways() { return array('cod' => $this); }
}
class FakeWC {
    public $cart;
    public $gateways;
    public function __construct() { $this->cart = new FakeCart(); $this->gateways = new FakeGateways(); }
    public function payment_gateways() { return $this->gateways; }
}
class FakeDB {
    public function prepare($sql, ...$args) { return $sql; }
    public function get_var($sql) { return '1'; }
}
class FakeOrder {
    public function get_meta($key, $single = true) { return str_repeat('a', 64); }
    public function has_status($statuses) { return false; }
    public function get_id() { return 42; }
    public function get_status() { return 'processing'; }
    public function get_order_key() { return 'wc_order_test12345642'; }
    public function update_meta_data($key, $value) {}
    public function save() {}
    public function save_meta_data() {}
    public function is_paid() { return false; }
}
$GLOBALS['wc'] = new FakeWC();
$GLOBALS['wpdb'] = new FakeDB();
$GLOBALS['order'] = new FakeOrder();
$GLOBALS['existing_orders'] = array();

foreach (array('AED', 'USD') as $currency) {
    $GLOBALS['currency'] = $currency;
    foreach (array(0, 199.99, 200, 200.01, 500) as $subtotal) {
        $GLOBALS['wc']->cart->subtotal = $subtotal;
        foreach (array('AE', 'SA', 'GB') as $country) {
            $rates = array('flat' => new FakeRate('flat_rate'), 'express' => new FakeRate('express'), 'pickup' => new FakeRate('local_pickup'));
            $result = EngineerParts_Customer_Accounts::apply_free_delivery($rates, array('destination' => array('country' => $country)));
            $free = $currency === 'AED' && $subtotal >= 200;
            check($result['flat']->cost === ($free ? 0 : 25), 'Incorrect shipping at threshold');
            check($result['express']->cost === ($free ? 0 : 25), 'Express delivery not updated');
            check($result['flat']->taxes === array(1 => $free ? 0 : 1.25), 'Incorrect shipping tax');
            check($result['pickup']->cost === 25, 'Pickup rates must not change');
        }
    }
}
$GLOBALS['currency'] = 'AED';
$GLOBALS['wc']->cart->subtotal = 199.99;
$below = EngineerParts_Customer_Accounts::delivery_policy_packages(array(array()));
$GLOBALS['wc']->cart->subtotal = 200;
$above = EngineerParts_Customer_Accounts::delivery_policy_packages(array(array()));
check($below !== $above, 'Cached shipping must invalidate when the qualifying subtotal changes');
check(EngineerParts_Customer_Accounts::apply_free_delivery(array(), array()) === array(), 'Unsupported destinations must not acquire a shipping rate');

function checkout_request($method, $country = 'AE') {
    $request = new WP_REST_Request();
    $request->data = array(
        'idempotencyKey' => 'ORD-test123', 'requestHash' => str_repeat('a', 64), 'cartToken' => 'cart',
        'nonce' => 'nonce', 'checkout' => array(
            'payment_method' => $method, 'billing_address' => array('email' => 'user@example.com'),
            'shipping_address' => array('country' => $country),
        ),
    );
    return $request;
}
$foreign = EngineerParts_Customer_Accounts::proxy_storefront_checkout(checkout_request('cod', 'GB'));
check($foreign->get_status() === 422 && $foreign->get_data()['code'] === 'cod_country_not_supported', 'Non-UAE COD must be rejected');
$invalid = EngineerParts_Customer_Accounts::proxy_storefront_checkout(checkout_request('unknown'));
check($invalid->get_status() === 400, 'Unknown payment methods must be rejected');
$GLOBALS['wc']->gateways->enabled = 'no';
$disabled = EngineerParts_Customer_Accounts::proxy_storefront_checkout(checkout_request('cod'));
check($disabled->get_data()['code'] === 'cod_unavailable', 'Disabled COD must fail explicitly');
$GLOBALS['wc']->gateways->enabled = 'yes';
$cod = EngineerParts_Customer_Accounts::proxy_storefront_checkout(checkout_request('cod'));
check($cod->get_status() === 200, 'UAE COD checkout must complete');
check($cod->get_data()['checkout']['order_key'] === 'wc_order_test12345642', 'COD confirmation needs the real order key');
check(json_decode($GLOBALS['store_request']->body, true)['payment_method'] === 'cod', 'COD must be passed to Store API');
$GLOBALS['existing_orders'] = array($GLOBALS['order']);
$GLOBALS['store_request'] = null;
$retry = EngineerParts_Customer_Accounts::proxy_storefront_checkout(checkout_request('cod'));
check($retry->get_status() === 200 && $retry->get_data()['checkout']['order_id'] === 42, 'Retry must reuse the existing order');
check($GLOBALS['store_request'] === null, 'Retry must not place a duplicate order');
$GLOBALS['existing_orders'] = array();
$GLOBALS['wc']->gateways->enabled = 'no';
$online = EngineerParts_Customer_Accounts::proxy_storefront_checkout(checkout_request('nomod', 'GB'));
check($online->get_status() === 200, 'Online payment must work internationally even when COD is disabled');
check(json_decode($GLOBALS['store_request']->body, true)['payment_method'] === 'nomod', 'Online gateway selection must be preserved');
echo "Checkout policy tests passed.\n";
