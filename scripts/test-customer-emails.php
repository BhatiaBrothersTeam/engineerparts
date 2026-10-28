<?php
// Standalone regression test: php scripts/test-customer-emails.php
require __DIR__ . '/test-verification-links.php';

function get_userdata($id) { return (object) array('ID' => $id, 'user_login' => 'user+test@example.com', 'roles' => array('customer')); }
function is_admin() { return $GLOBALS['page'] === 'admin'; }
function wp_doing_ajax() { return $GLOBALS['page'] === 'ajax'; }
function wp_doing_cron() { return false; }
function is_wc_endpoint_url($name) { return $GLOBALS['page'] === $name; }
function is_account_page() { return $GLOBALS['page'] === 'account'; }
function is_cart() { return $GLOBALS['page'] === 'cart'; }
function is_checkout() { return $GLOBALS['page'] === 'checkout'; }
function is_shop() { return $GLOBALS['page'] === 'shop'; }
function is_product_taxonomy() { return $GLOBALS['page'] === 'category'; }
function is_product() { return $GLOBALS['page'] === 'product'; }
function is_front_page() { return $GLOBALS['page'] === 'home'; }
function is_home() { return false; }
function get_post_field($field, $id) { return 'industrial-part'; }
function get_queried_object_id() { return 12; }
function get_query_var($name) { return 42; }
function wc_get_order($id) { return new WC_Order(); }
class WC_Order {
    public function get_id() { return 42; }
    public function get_order_key() { return 'wc_order_test12345642'; }
}
class TestCustomerEmail {
    public $object;
    private $type;
    private $customer;
    public function __construct($type = 'html', $customer = true) {
        $this->type = $type;
        $this->customer = $customer;
        $this->object = new WC_Order();
    }
    public function is_customer_email() { return $this->customer; }
    public function get_email_type() { return $this->type; }
    public function get_heading() { return 'Your order update'; }
}
function check($condition, $message) {
    if (!$condition) throw new RuntimeException($message);
}

$class = EngineerParts_Customer_Accounts::class;
$body = '<html><body><header>Old store header</header><div id="body_content_inner"><p>Order #42, AED 210.00, cash on delivery.</p>' .
    '<a href="https://shop.engineerparts.com/checkout/order-pay/42/?key=secret">Pay / view order</a>' .
    '<a href="https://shop.engineerparts.com/my-account/">Account</a>' .
    '<a href="https://shop.engineerparts.com/product/industrial-part/">Product</a>' .
    '<img src="https://shop.engineerparts.com/uploads/part.jpg" alt="Part">' .
    '<a href="https://pay.nomod.com/payment/test">Hosted payment</a>' .
    '<p>WordPress WooCommerce shop.engineerparts.com</p></div><footer>Old footer</footer></body></html>';
$params = array('customer@example.com', 'Order update', $body, 'Content-Type: text/html', array('invoice.pdf'));
foreach (array('html', 'multipart', 'plain') as $type) {
    $GLOBALS['phpmailer'] = (object) array('AltBody' => 'https://shop.engineerparts.com/my-account/ WordPress');
    $result = $class::customer_email_params($params, new TestCustomerEmail($type));
    check(!preg_match('/shop\.engineerparts\.com|WordPress|WooCommerce/i', $result[2] . $GLOBALS['phpmailer']->AltBody), 'Backend branding leaked in email.');
    check(str_contains($result[2], 'https://engineerparts.com/checkout/pay?order_id=42'), 'Payment link missing.');
    check(str_contains($result[2], 'order_key=wc_order_test12345642'), 'Payment link lost guest order authorization.');
    check(str_contains($result[2], 'https://engineerparts.com/product/industrial-part'), 'Product URL missing.');
    check(str_contains($result[2], 'https://pay.nomod.com/payment/test'), 'Hosted payment URL changed.');
    check(str_contains($result[2], 'AED 210.00'), 'Order details lost.');
    check($result[4] === $params[4], 'Attachments changed.');
    if ($type !== 'plain') {
        check(str_contains($result[2], '#dc2626'), 'Brand styling missing.');
        if (class_exists('DOMDocument') && method_exists('DOMDocument', 'loadHTML')) check(!str_contains($result[2], 'Old footer') && !str_contains($result[2], 'Old store header'), 'Old shell retained.');
        check(!str_contains($result[2], '<img'), 'Backend image should not become a broken frontend image.');
    }
}
check($class::customer_email_params($params, new TestCustomerEmail('html', false)) === $params, 'Administrator email altered.');
$view = $class::customer_email_params(array('customer@example.com', 'View order', '<div id="body_content_inner"><a href="https://shop.engineerparts.com/my-account/view-order/42">View</a></div>', '', array()), new TestCustomerEmail());
check(str_contains($view[2], 'https://engineerparts.com/checkout/success?order_id=42'), 'Guest order view requires an account instead of its order key.');
check(str_contains($view[2], 'order_key=wc_order_test12345642'), 'Guest order view lost its key.');

$url = new ReflectionMethod($class, 'customer_url');
foreach (array('https://shop.engineerparts.com/my-account/lost-password/?key=reset123&id=123', 'https://shop.engineerparts.com/wp-login.php?action=rp&key=reset123&login=user%2Btest%40example.com') as $reset) {
    $result = $url->invoke(null, $reset);
    parse_str(parse_url($result, PHP_URL_QUERY), $query);
    check(str_starts_with($result, 'https://engineerparts.com/reset-password?'), 'Reset route wrong.');
    check($query['login'] === 'user+test@example.com' && $query['key'] === 'reset123', 'Reset credentials corrupted.');
}
$customer = get_userdata(123);
$reset_email = new TestCustomerEmail();
$reset_email->object = $customer;
$reset_content = $class::customer_email_params(array('customer@example.com', 'Reset password', '<div id="body_content_inner"><a href="https://shop.engineerparts.com/my-account/lost-password/?key=reset123&amp;id=123">Reset</a></div>', '', array()), $reset_email);
check(str_contains($reset_content[2], 'login=user%2Btest%40example.com'), 'WooCommerce password reset credentials did not survive email formatting.');
$email = array('to' => 'customer@example.com', 'subject' => 'WordPress account', 'message' => 'https://shop.engineerparts.com/my-account/ ###SITENAME### ###SITEURL###', 'headers' => '');
$reset = $class::customer_reset_email($email, 'reset123', $customer->user_login, $customer);
check(str_contains($reset['message'], 'user%2Btest%40example.com'), 'Core password reset login not encoded.');
check(!str_contains($reset['message'], 'shop.engineerparts.com'), 'Core reset exposes backend.');
$core = $class::customer_core_email($email, $customer);
check(!preg_match('/shop\.engineerparts\.com|WordPress/i', $core['message'] . $core['subject']), 'Core notification exposes backend.');
check(!str_contains($core['message'], '###SITE'), 'Core notification must resolve site placeholders before WordPress can inject the backend URL.');
$admin = (object) array('roles' => array('administrator'));
check($class::customer_reset_email($email, 'key', 'admin', $admin) === $email, 'Administrator reset must stay unchanged.');

foreach (array('shop' => '/clearance', 'category' => '/clearance', 'cart' => '/cart', 'checkout' => '/checkout', 'account' => '/account', 'product' => '/product/industrial-part', 'home' => '') as $page => $path) {
    $GLOBALS['page'] = $page;
    $_GET = array();
    $_SERVER['REQUEST_METHOD'] = 'GET';
    check($class::customer_page_destination() === 'https://engineerparts.com' . $path, 'Wrong redirect for ' . $page);
}
foreach (array('admin', 'ajax', 'order-pay', 'other') as $page) {
    $GLOBALS['page'] = $page;
    check($class::customer_page_destination() === null, 'Protected endpoint redirected: ' . $page);
}
$GLOBALS['page'] = 'checkout';
foreach (array(array('wc-api' => 'nomod'), array('wc-ajax' => 'checkout'), array('add-to-cart' => 12)) as $query) {
    $_GET = $query;
    check($class::customer_page_destination() === null, 'Gateway or cart action redirected.');
}
$_GET = array();
$_SERVER['REQUEST_METHOD'] = 'POST';
check($class::customer_page_destination() === null, 'POST payment submission redirected.');
$_SERVER['REQUEST_METHOD'] = 'GET';
$GLOBALS['page'] = 'order-received';
$_GET = array('key' => 'wc_order_test12345642');
check(str_starts_with($class::customer_page_destination(), 'https://engineerparts.com/checkout/success?order_id=42'), 'Order confirmation redirect missing.');
$_GET = array('key' => 'wrong-key');
check($class::customer_page_destination() === 'https://engineerparts.com/account/orders', 'Invalid order key exposed confirmation.');
echo "Customer email and storefront redirect tests passed.\n";
