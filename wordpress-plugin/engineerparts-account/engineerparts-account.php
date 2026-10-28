<?php
/**
 * Plugin Name: EngineerParts Customer Accounts
 * Description: Secure customer authentication endpoints for the EngineerParts storefront.
 * Version: 1.9.3
 * Requires PHP: 8.0
 * Requires Plugins: woocommerce
 */

defined('ABSPATH') || exit;

final class EngineerParts_Customer_Accounts {
    private const NAMESPACE = 'engineerparts/v1';
    private const STOREFRONT_REFERENCE_META = '_engineerparts_storefront_reference';
    private const STOREFRONT_REQUEST_HASH_META = '_engineerparts_storefront_request_hash';
    private const STOREFRONT_PAYMENT_URL_META = '_engineerparts_storefront_payment_url';
    private const STOREFRONT_LATE_PAYMENT_META = '_engineerparts_late_payment_after_hold';
    private const VERIFIED_META = '_engineerparts_email_verified';
    private const VERIFY_HASH_META = '_engineerparts_verify_hash';
    private const VERIFY_EXPIRES_META = '_engineerparts_verify_expires';
    private static ?array $storefront_checkout_context = null;
    private const CUSTOMER_TYPES = array(
        'End User',
        'Contractor',
        'EPC Contractor',
        'Trading Company',
        'Distributor',
        'Maintenance Company',
        'OEM',
        'Other',
    );

    public static function boot(): void {
        add_action('plugins_loaded', array(self::class, 'maybe_install_enquiries_table'), 1);
        add_action('init', array(self::class, 'register_legacy_enquiry_type'), 0);
        add_action('init', array(self::class, 'maybe_migrate_legacy_enquiries'), 1);
        add_action('init', array(self::class, 'maybe_migrate_legacy_contacts'), 2);
        add_action('init', array(self::class, 'maybe_migrate_clearance_alert_signups'), 3);
        add_action('admin_menu', array(self::class, 'register_enquiries_admin_page'));
        add_action('admin_post_engineerparts_update_enquiry', array(self::class, 'update_enquiry_admin'));
        add_action('admin_post_engineerparts_delete_enquiry', array(self::class, 'delete_enquiry_admin'));
        add_action('admin_post_engineerparts_payment_handoff', array(self::class, 'payment_handoff'));
        add_action('admin_post_nopriv_engineerparts_payment_handoff', array(self::class, 'payment_handoff'));
        add_action('rest_api_init', array(self::class, 'register_routes'));
        add_filter('woocommerce_email_styles', array(self::class, 'woocommerce_email_styles'), 10, 2);
        add_filter('woocommerce_mail_callback_params', array(self::class, 'customer_email_params'), 100, 2);
        add_filter('woocommerce_email_from_name', static fn($name): string => 'EngineerParts');
        add_filter('wp_mail_from_name', static fn($name): string => 'EngineerParts', 100);
        add_filter('retrieve_password_notification_email', array(self::class, 'customer_reset_email'), 100, 4);
        add_filter('wp_new_user_notification_email', array(self::class, 'customer_core_email'), 100, 3);
        add_filter('password_change_email', array(self::class, 'customer_core_email'), 100, 3);
        add_filter('email_change_email', array(self::class, 'customer_core_email'), 100, 3);
        add_action('template_redirect', array(self::class, 'redirect_customer_pages'), 20);
        add_action('woocommerce_new_order', array(self::class, 'tag_storefront_checkout_order'), 10, 2);
        add_action('woocommerce_store_api_checkout_order_processed', array(self::class, 'tag_storefront_checkout_order'));
        add_filter('woocommerce_payment_complete_order_status', array(self::class, 'hold_late_storefront_payment'), 10, 3);
        add_filter('woocommerce_payment_complete_reduce_order_stock', array(self::class, 'prevent_late_storefront_stock_reduction'), 10, 2);
        add_action('engineerparts_purge_sessions', array(self::class, 'purge_sessions'));
        add_filter('woocommerce_get_checkout_order_received_url', array(self::class, 'order_received_url'), 10, 2);
        add_filter('woocommerce_package_rates', array(self::class, 'apply_free_delivery'), 100, 2);
        add_filter('woocommerce_cart_shipping_packages', array(self::class, 'delivery_policy_packages'));
    }

    public static function maybe_migrate_legacy_contacts(): void {
        global $wpdb;
        if (get_option('engineerparts_contacts_migrated_v1') === '1') {
            return;
        }
        $source = self::enquiries_table();
        $target = self::contacts_table();
        $source_exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($source)));
        $target_exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($target)));
        if ($source_exists !== $source || $target_exists !== $target) {
            return;
        }
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$source} WHERE lead_type = %s ORDER BY id ASC",
            'general_contact'
        ), ARRAY_A);
        if ($rows === null) {
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'contacts',
                'category' => 'legacy_migration_query_failed',
                'databaseError' => $wpdb->last_error,
            )));
            return;
        }
        foreach ($rows ?: array() as $row) {
            $reference = (string) $row['enquiry_reference'];
            if ($reference === '') {
                $reference = 'EP-LEGACY-CONTACT-' . (int) $row['id'];
            }
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$target} WHERE contact_reference = %s",
                $reference
            ));
            if (!$exists && $wpdb->insert($target, array(
                'contact_reference' => $reference,
                'customer_id' => (int) $row['customer_id'],
                'topic' => (string) $row['enquiry_type'],
                'reference' => (string) $row['sku'],
                'message' => (string) $row['message'],
                'company' => (string) $row['company'],
                'contact' => (string) $row['contact'],
                'email' => (string) $row['email'],
                'phone' => (string) $row['phone'],
                'country' => (string) $row['country'],
                'status' => (string) $row['status'],
                'source' => (string) $row['source'],
                'created_at' => (string) $row['created_at'],
                'updated_at' => (string) $row['updated_at'],
            )) === false) {
                error_log(wp_json_encode(array(
                    'timestamp' => gmdate(DATE_ATOM),
                    'endpoint' => 'contacts',
                    'category' => 'legacy_migration_failed',
                    'enquiryId' => (int) $row['id'],
                    'databaseError' => $wpdb->last_error,
                )));
                return;
            }
            if ($wpdb->delete($source, array('id' => (int) $row['id']), array('%d')) === false) {
                error_log(wp_json_encode(array(
                    'timestamp' => gmdate(DATE_ATOM),
                    'endpoint' => 'contacts',
                    'category' => 'legacy_migration_cleanup_failed',
                    'enquiryId' => (int) $row['id'],
                    'databaseError' => $wpdb->last_error,
                )));
                return;
            }
        }
        update_option('engineerparts_contacts_migrated_v1', '1');
    }

    public static function activate(): void {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $table = self::session_table();
        $charset = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE {$table} (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint unsigned NOT NULL,
            token_hash char(64) NOT NULL,
            expires_at datetime NOT NULL,
            created_at datetime NOT NULL,
            last_seen_at datetime NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY token_hash (token_hash),
            KEY user_id (user_id),
            KEY expires_at (expires_at)
        ) {$charset};");

        if (self::install_enquiries_table()) {
            update_option('engineerparts_enquiries_schema_version', '1.4.0');
        }
        if (self::install_contacts_table()) {
            update_option('engineerparts_contacts_db_version', '1.0.0');
        }
        if (self::install_clearance_alerts_table()) {
            update_option('engineerparts_clearance_alerts_db_version', '1.0.0');
        }
        if (self::install_logs_table()) {
            update_option('engineerparts_logs_db_version', '1.0.0');
        }

        if (!wp_next_scheduled('engineerparts_purge_sessions')) {
            wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', 'engineerparts_purge_sessions');
        }
    }

    public static function deactivate(): void {
        wp_clear_scheduled_hook('engineerparts_purge_sessions');
    }

    public static function register_routes(): void {
        self::route('/auth/register', 'POST', 'register');
        self::route('/auth/login', 'POST', 'login');
        self::route('/auth/logout', 'POST', 'logout');
        self::route('/auth/me', 'GET', 'me');
        self::route('/auth/verify-email', 'POST', 'verify_email');
        self::route('/auth/resend-verification', 'POST', 'resend_verification');
        self::route('/auth/forgot-password', 'POST', 'forgot_password');
        self::route('/auth/reset-password', 'POST', 'reset_password');
        self::route('/account', 'GET', 'account');
        self::route('/account', 'PUT', 'update_account');
        self::route('/account/addresses', 'PUT', 'update_addresses');
        self::route('/account/security/password', 'PUT', 'change_password');
        self::route('/account/orders', 'GET', 'orders');
        self::route('/account/orders/(?P<id>\d+)/payment-link', 'POST', 'create_payment_link');
        self::route('/account/orders/(?P<id>\d+)', 'GET', 'order');
        self::route('/account/orders/(?P<id>\d+)/reorder', 'POST', 'reorder');
        self::route('/orders/checkout', 'POST', 'proxy_storefront_checkout');
        self::route('/orders/(?P<id>\d+)/payment-link', 'POST', 'create_proxy_payment_link');
        self::route('/account/enquiries', 'GET', 'enquiries');
        self::route('/account/enquiries/claim', 'POST', 'claim_enquiries');
        self::route('/account/saved-products', 'GET', 'saved_products');
        self::route('/account/saved-products', 'POST', 'toggle_saved_product');
        self::route('/enquiries', 'POST', 'submit_enquiry');
        self::route('/clearance-alerts', 'POST', 'subscribe_clearance_alerts');
        self::route('/logs', 'POST', 'store_logs');
    }

    public static function maybe_install_enquiries_table(): void {
        if (get_option('engineerparts_enquiries_schema_version') !== '1.4.0' && self::install_enquiries_table()) {
            update_option('engineerparts_enquiries_schema_version', '1.4.0');
        } elseif (get_option('engineerparts_enquiries_schema_version') !== '1.4.0') {
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'enquiries',
                'category' => 'table_install_failed',
            )));
        }
        if (get_option('engineerparts_clearance_alerts_db_version') !== '1.0.0' && self::install_clearance_alerts_table()) {
            update_option('engineerparts_clearance_alerts_db_version', '1.0.0');
        } elseif (get_option('engineerparts_clearance_alerts_db_version') !== '1.0.0') {
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'clearance-alerts',
                'category' => 'table_install_failed',
            )));
        }
        if (get_option('engineerparts_contacts_db_version') !== '1.0.0' && self::install_contacts_table()) {
            update_option('engineerparts_contacts_db_version', '1.0.0');
        } elseif (get_option('engineerparts_contacts_db_version') !== '1.0.0') {
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'contacts',
                'category' => 'table_install_failed',
            )));
        }
        if (get_option('engineerparts_logs_db_version') !== '1.0.0' && self::install_logs_table()) {
            update_option('engineerparts_logs_db_version', '1.0.0');
        } elseif (get_option('engineerparts_logs_db_version') !== '1.0.0') {
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'logs',
                'category' => 'table_install_failed',
            )));
        }
    }

    private static function install_logs_table(): bool {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = self::logs_table();
        $charset = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE {$table} (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            level varchar(10) NOT NULL DEFAULT 'info',
            event varchar(191) NOT NULL DEFAULT '',
            source varchar(10) NOT NULL DEFAULT 'server',
            context longtext NOT NULL,
            logged_at datetime NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY level (level),
            KEY event (event),
            KEY logged_at (logged_at)
        ) {$charset};");
        return $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) === $table;
    }

    public static function register_legacy_enquiry_type(): void {
        register_post_type('ep_enquiry', array(
            'public' => false,
            'show_ui' => false,
            'show_in_menu' => false,
            'supports' => array('title', 'editor'),
        ));
    }

    public static function maybe_migrate_legacy_enquiries(): void {
        if (get_option('engineerparts_enquiries_db_version') === '1.3.0') {
            return;
        }
        if (self::install_enquiries_table() && self::migrate_legacy_enquiries()) {
            update_option('engineerparts_enquiries_db_version', '1.3.0');
        }
    }

    private static function install_enquiries_table(): bool {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = self::enquiries_table();
        $charset = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE {$table} (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            enquiry_reference varchar(40) DEFAULT NULL,
            customer_id bigint unsigned NOT NULL DEFAULT 0,
            lead_type varchar(40) NOT NULL DEFAULT '',
            enquiry_type varchar(100) NOT NULL DEFAULT '',
            product_id bigint unsigned NOT NULL DEFAULT 0,
            product_name text NOT NULL,
            sku varchar(191) NOT NULL DEFAULT '',
            part_number varchar(191) NOT NULL DEFAULT '',
            lot_id varchar(191) NOT NULL DEFAULT '',
            equipment_id varchar(191) NOT NULL DEFAULT '',
            listing_url text NOT NULL,
            requested_quantity int unsigned NOT NULL DEFAULT 0,
            budget varchar(191) NOT NULL DEFAULT '',
            message text NOT NULL,
            company varchar(191) NOT NULL DEFAULT '',
            contact varchar(191) NOT NULL DEFAULT '',
            email varchar(191) NOT NULL DEFAULT '',
            phone varchar(100) NOT NULL DEFAULT '',
            country varchar(100) NOT NULL DEFAULT '',
            status varchar(40) NOT NULL DEFAULT 'submitted',
            source varchar(100) NOT NULL DEFAULT 'web',
            created_at varchar(35) NOT NULL DEFAULT '',
            updated_at varchar(35) NOT NULL DEFAULT '',
            PRIMARY KEY  (id),
            UNIQUE KEY enquiry_reference (enquiry_reference),
            KEY customer_id (customer_id),
            KEY email (email),
            KEY created_at (created_at)
        ) {$charset};");
        return $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) === $table;
    }

    private static function install_clearance_alerts_table(): bool {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = self::clearance_alerts_table();
        $charset = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE {$table} (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            email varchar(191) NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'subscribed',
            source varchar(100) NOT NULL DEFAULT 'web',
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY email (email),
            KEY status (status)
        ) {$charset};");
        return $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) === $table;
    }

    public static function maybe_migrate_clearance_alert_signups(): void {
        global $wpdb;
        if (get_option('engineerparts_clearance_alerts_migrated_v1') === '1') {
            return;
        }
        $source = self::enquiries_table();
        $target = self::clearance_alerts_table();
        $source_exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($source)));
        $target_exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($target)));
        if ($source_exists !== $source || $target_exists !== $target) {
            return;
        }
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT email, source, created_at, updated_at FROM {$source} WHERE lead_type = %s",
            'clearance_alert'
        ), ARRAY_A);
        if ($rows === null) {
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'clearance-alerts',
                'category' => 'legacy_migration_query_failed',
                'databaseError' => $wpdb->last_error,
            )));
            return;
        }
        foreach ($rows ?: array() as $row) {
            $email = strtolower(sanitize_email($row['email']));
            if (!is_email($email) || strlen($email) > 191) {
                continue;
            }
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$target} WHERE email = %s",
                $email
            ));
            if ($exists) {
                continue;
            }
            $created_at = strtotime($row['created_at']) ? gmdate('Y-m-d H:i:s', strtotime($row['created_at'])) : current_time('mysql', true);
            $updated_at = strtotime($row['updated_at']) ? gmdate('Y-m-d H:i:s', strtotime($row['updated_at'])) : $created_at;
            if ($wpdb->insert($target, array(
                'email' => $email,
                'status' => 'subscribed',
                'source' => sanitize_key($row['source'] ?: 'legacy'),
                'created_at' => $created_at,
                'updated_at' => $updated_at,
            )) === false) {
                error_log(wp_json_encode(array(
                    'timestamp' => gmdate(DATE_ATOM),
                    'endpoint' => 'clearance-alerts',
                    'category' => 'legacy_migration_failed',
                    'databaseError' => $wpdb->last_error,
                )));
                return;
            }
        }
        update_option('engineerparts_clearance_alerts_migrated_v1', '1');
    }

    private static function install_contacts_table(): bool {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = self::contacts_table();
        $charset = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE {$table} (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            contact_reference varchar(40) DEFAULT NULL,
            customer_id bigint unsigned NOT NULL DEFAULT 0,
            topic varchar(100) NOT NULL DEFAULT '',
            reference varchar(191) NOT NULL DEFAULT '',
            message text NOT NULL,
            company varchar(191) NOT NULL DEFAULT '',
            contact varchar(191) NOT NULL DEFAULT '',
            email varchar(191) NOT NULL DEFAULT '',
            phone varchar(100) NOT NULL DEFAULT '',
            country varchar(100) NOT NULL DEFAULT '',
            status varchar(40) NOT NULL DEFAULT 'submitted',
            source varchar(100) NOT NULL DEFAULT 'web',
            created_at varchar(35) NOT NULL DEFAULT '',
            updated_at varchar(35) NOT NULL DEFAULT '',
            PRIMARY KEY  (id),
            UNIQUE KEY contact_reference (contact_reference),
            KEY customer_id (customer_id),
            KEY email (email),
            KEY created_at (created_at)
        ) {$charset};");
        return $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) === $table;
    }

    private static function migrate_legacy_enquiries(): bool {
        global $wpdb;
        $table = self::enquiries_table();
        $posts = get_posts(array(
            'post_type' => 'ep_enquiry',
            'post_status' => 'any',
            'numberposts' => -1,
            'orderby' => 'ID',
            'order' => 'ASC',
        ));
        foreach ($posts as $post) {
            $reference = (string) get_post_meta($post->ID, 'enquiry_reference', true);
            if (!$reference) {
                $reference = 'EP-LEGACY-' . (int) $post->ID;
            }
            if ($wpdb->get_var($wpdb->prepare("SELECT id FROM {$table} WHERE enquiry_reference = %s", $reference))) {
                continue;
            }
            $created_at = (string) get_post_meta($post->ID, 'created_at', true);
            $row = array(
                'enquiry_reference' => $reference,
                'customer_id' => (int) get_post_meta($post->ID, 'customer_id', true),
                'lead_type' => (string) get_post_meta($post->ID, 'lead_type', true),
                'enquiry_type' => (string) get_post_meta($post->ID, 'enquiry_type', true),
                'product_id' => (int) get_post_meta($post->ID, 'product_id', true),
                'product_name' => (string) get_post_meta($post->ID, 'product_name', true),
                'sku' => (string) get_post_meta($post->ID, 'sku', true),
                'part_number' => (string) get_post_meta($post->ID, 'part_number', true),
                'lot_id' => (string) get_post_meta($post->ID, 'lot_id', true),
                'equipment_id' => (string) get_post_meta($post->ID, 'equipment_id', true),
                'listing_url' => (string) get_post_meta($post->ID, 'listing_url', true),
                'requested_quantity' => (int) get_post_meta($post->ID, 'requested_quantity', true),
                'budget' => (string) get_post_meta($post->ID, 'budget', true),
                'message' => (string) get_post_meta($post->ID, 'message', true),
                'company' => (string) get_post_meta($post->ID, 'company', true),
                'contact' => (string) get_post_meta($post->ID, 'contact', true),
                'email' => (string) get_post_meta($post->ID, 'email', true),
                'phone' => (string) get_post_meta($post->ID, 'phone', true),
                'country' => (string) get_post_meta($post->ID, 'country', true),
                'status' => (string) get_post_meta($post->ID, 'status', true) ?: 'submitted',
                'source' => (string) get_post_meta($post->ID, 'source', true) ?: 'web',
                'created_at' => $created_at ?: get_post_time(DATE_ATOM, true, $post),
                'updated_at' => (string) get_post_meta($post->ID, 'updated_at', true) ?: get_post_modified_time(DATE_ATOM, true, $post),
            );
            if ($wpdb->insert($table, $row) === false) {
                error_log(wp_json_encode(array(
                    'timestamp' => gmdate(DATE_ATOM),
                    'endpoint' => 'enquiries',
                    'category' => 'legacy_migration_failed',
                    'postId' => (int) $post->ID,
                    'databaseError' => $wpdb->last_error,
                )));
                return false;
            }
        }
        return true;
    }

    public static function register_enquiries_admin_page(): void {
        add_submenu_page(
            'woocommerce',
            'EngineerParts Enquiries',
            'EngineerParts Enquiries',
            'manage_woocommerce',
            'engineerparts-enquiries',
            array(self::class, 'render_enquiries_admin_page')
        );
        add_submenu_page(
            'woocommerce',
            'EngineerParts Logs',
            'EngineerParts Logs',
            'manage_woocommerce',
            'engineerparts-logs',
            array(self::class, 'render_logs_admin_page')
        );
    }

    public static function render_logs_admin_page(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to view logs.', 'engineerparts'));
        }
        global $wpdb;
        $table = self::logs_table();
        $level = isset($_GET['level']) ? sanitize_key(wp_unslash($_GET['level'])) : '';
        $source = isset($_GET['source']) ? sanitize_key(wp_unslash($_GET['source'])) : '';
        $event = isset($_GET['event']) ? sanitize_text_field(wp_unslash($_GET['event'])) : '';
        $page = max(1, absint($_GET['paged'] ?? 1));
        $per_page = 50;

        $where = array('1=1');
        $args = array();
        if (in_array($level, array('debug', 'info', 'warn', 'error'), true)) {
            $where[] = 'level = %s';
            $args[] = $level;
        }
        if (in_array($source, array('server', 'client'), true)) {
            $where[] = 'source = %s';
            $args[] = $source;
        }
        if ($event !== '') {
            $where[] = 'event LIKE %s';
            $args[] = '%' . $wpdb->esc_like($event) . '%';
        }
        $where_sql = implode(' AND ', $where);
        $count_sql = "SELECT COUNT(*) FROM {$table} WHERE {$where_sql}";
        $total = (int) $wpdb->get_var($args ? $wpdb->prepare($count_sql, $args) : $count_sql);
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$table} WHERE {$where_sql} ORDER BY logged_at DESC, id DESC LIMIT %d OFFSET %d",
            array_merge($args, array($per_page, ($page - 1) * $per_page))
        ), ARRAY_A);

        $colors = array('error' => '#b32d2e', 'warn' => '#996800', 'info' => '#2271b1', 'debug' => '#646970');
        echo '<div class="wrap"><h1>EngineerParts Logs</h1>';
        echo '<p>Application logs from the storefront (server and browser). Entries older than '
            . esc_html((string) max(1, (int) apply_filters('engineerparts_log_retention_days', 30)))
            . ' days are removed automatically.</p>';
        echo '<form method="get" style="margin:12px 0;display:flex;gap:8px;flex-wrap:wrap;align-items:center">';
        echo '<input type="hidden" name="page" value="engineerparts-logs" />';
        echo '<select name="level"><option value="">All levels</option>';
        foreach (array('error', 'warn', 'info', 'debug') as $option) {
            echo '<option value="' . esc_attr($option) . '"' . selected($level, $option, false) . '>' . esc_html(ucfirst($option)) . '</option>';
        }
        echo '</select><select name="source"><option value="">All sources</option>';
        foreach (array('server', 'client') as $option) {
            echo '<option value="' . esc_attr($option) . '"' . selected($source, $option, false) . '>' . esc_html(ucfirst($option)) . '</option>';
        }
        echo '</select><input type="search" name="event" placeholder="Event contains…" value="' . esc_attr($event) . '" />';
        submit_button('Filter', 'secondary', '', false);
        echo '</form>';

        echo '<table class="widefat striped"><thead><tr><th style="width:170px">Time (UTC)</th><th style="width:70px">Level</th><th style="width:70px">Source</th><th>Event</th><th>Details</th></tr></thead><tbody>';
        if (!$rows) {
            echo '<tr><td colspan="5">No log entries found.</td></tr>';
        }
        foreach ($rows ?: array() as $row) {
            $decoded = json_decode((string) $row['context'], true);
            $pretty = is_array($decoded) && $decoded ? wp_json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : '';
            echo '<tr>';
            echo '<td>' . esc_html($row['logged_at']) . '</td>';
            echo '<td><strong style="color:' . esc_attr($colors[$row['level']] ?? '#1d2327') . '">' . esc_html(strtoupper($row['level'])) . '</strong></td>';
            echo '<td>' . esc_html($row['source']) . '</td>';
            echo '<td><code>' . esc_html($row['event']) . '</code></td>';
            echo '<td>' . ($pretty !== ''
                ? '<details><summary>View</summary><pre style="white-space:pre-wrap;max-width:720px">' . esc_html($pretty) . '</pre></details>'
                : '&mdash;') . '</td>';
            echo '</tr>';
        }
        echo '</tbody></table>';

        $pages = (int) ceil($total / $per_page);
        if ($pages > 1) {
            echo '<div class="tablenav"><div class="tablenav-pages">' . paginate_links(array(
                'base' => add_query_arg('paged', '%#%'),
                'format' => '',
                'current' => $page,
                'total' => $pages,
            )) . '</div></div>';
        }
        echo '</div>';
    }

    public static function render_enquiries_admin_page(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to view enquiries.', 'engineerparts'));
        }
        global $wpdb;
        $reference = isset($_GET['reference']) ? sanitize_text_field(wp_unslash($_GET['reference'])) : '';
        $kind = isset($_GET['type']) ? sanitize_key(wp_unslash($_GET['type'])) : 'enquiry';
        echo '<div class="wrap"><h1>EngineerParts Leads</h1>';
        $notice = isset($_GET['notice']) ? sanitize_key(wp_unslash($_GET['notice'])) : '';
        if ($notice === 'saved') {
            echo '<div class="notice notice-success is-dismissible"><p>Enquiry updated.</p></div>';
        } elseif ($notice === 'deleted') {
            echo '<div class="notice notice-success is-dismissible"><p>Enquiry deleted.</p></div>';
        } elseif ($notice === 'not_found') {
            echo '<div class="notice notice-error"><p>That enquiry no longer exists; it may have been deleted.</p></div>';
        } elseif ($notice === 'error') {
            echo '<div class="notice notice-error"><p>Unable to update or delete the enquiry. Please try again.</p></div>';
        }
        if ($reference !== '') {
            $is_contact = $kind === 'contact';
            $is_clearance_alert = $kind === 'clearance-alert';
            if ($is_clearance_alert) {
                $enquiry = $wpdb->get_row($wpdb->prepare(
                    'SELECT * FROM ' . self::clearance_alerts_table() . ' WHERE id = %d',
                    absint($reference)
                ), ARRAY_A);
            } else {
                $table = $is_contact ? self::contacts_table() : self::enquiries_table();
                $reference_column = $is_contact ? 'contact_reference' : 'enquiry_reference';
                $enquiry = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE {$reference_column} = %s", $reference), ARRAY_A);
            }
            if (!$enquiry) {
                echo '<p>Submission not found.</p>';
            } elseif (!$is_contact && !$is_clearance_alert && isset($_GET['edit']) && $_GET['edit'] === '1') {
                self::render_enquiry_edit_form($enquiry);
            } else {
                $detail_kind = $is_clearance_alert ? 'clearance-alert' : ($is_contact ? 'contact' : 'enquiry');
                $back_label = $is_clearance_alert ? 'clearance alert subscribers' : ($is_contact ? 'contact submissions' : 'listing enquiries');
                echo '<p><a href="' . esc_url(add_query_arg(
                    array('page' => 'engineerparts-enquiries', 'type' => $detail_kind),
                    admin_url('admin.php')
                )) . '">&larr; All ' . esc_html($back_label) . '</a></p>';
                if (!$is_contact && !$is_clearance_alert) {
                    echo '<p><a class="button button-primary" href="' . esc_url(add_query_arg(
                        array('page' => 'engineerparts-enquiries', 'type' => 'enquiry', 'reference' => $reference, 'edit' => '1'),
                        admin_url('admin.php')
                    )) . '">Edit enquiry</a></p>';
                }
                echo '<table class="widefat striped"><tbody>';
                $labels = $is_clearance_alert ? array(
                    'email' => 'Email', 'status' => 'Status', 'source' => 'Source',
                    'created_at' => 'Subscribed', 'updated_at' => 'Last updated',
                ) : ($is_contact ? array(
                    'contact_reference' => 'Reference', 'topic' => 'Topic', 'contact' => 'Name', 'company' => 'Company',
                    'email' => 'Email', 'phone' => 'Phone', 'country' => 'Country',
                    'reference' => 'Product reference', 'message' => 'Message', 'status' => 'Status',
                    'source' => 'Source', 'created_at' => 'Submitted',
                ) : array(
                    'enquiry_reference' => 'Reference', 'enquiry_type' => 'Enquiry type',
                    'contact' => 'Name', 'company' => 'Company', 'email' => 'Email',
                    'phone' => 'Phone', 'country' => 'Country', 'product_name' => 'Product',
                    'sku' => 'Product / SKU / Lot reference', 'part_number' => 'Part number',
                    'lot_id' => 'Lot ID', 'equipment_id' => 'Equipment ID',
                    'requested_quantity' => 'Quantity', 'budget' => 'Budget / target price',
                    'listing_url' => 'Listing URL', 'message' => 'Message',
                    'status' => 'Status', 'created_at' => 'Submitted',
                ));
                foreach ($labels as $key => $label) {
                    $value = (string) $enquiry[$key];
                    echo '<tr><th scope="row">' . esc_html($label) . '</th><td>' . nl2br(esc_html($value)) . '</td></tr>';
                }
                echo '</tbody></table>';
                if (!$is_contact && !$is_clearance_alert) {
                    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="margin-top:16px" onsubmit="return confirm(\'Permanently delete this enquiry?\')">';
                    echo '<input type="hidden" name="action" value="engineerparts_delete_enquiry">';
                    echo '<input type="hidden" name="reference" value="' . esc_attr($reference) . '">';
                    wp_nonce_field('engineerparts_delete_enquiry_' . $reference);
                    echo '<button type="submit" class="button button-link-delete">Delete enquiry</button></form>';
                }
            }
        } else {
            $enquiry_table = self::enquiries_table();
            $contact_table = self::contacts_table();
            $clearance_alert_table = self::clearance_alerts_table();
            $enquiries = $wpdb->get_results("SELECT * FROM {$enquiry_table} ORDER BY id DESC LIMIT 100", ARRAY_A);
            $contacts = $wpdb->get_results("SELECT * FROM {$contact_table} ORDER BY id DESC LIMIT 100", ARRAY_A);
            $clearance_alerts = $wpdb->get_results("SELECT * FROM {$clearance_alert_table} ORDER BY id DESC LIMIT 100", ARRAY_A);
            echo '<h2>Contact submissions</h2>';
            if (!$contacts) {
                echo '<p>No contact messages have been submitted.</p>';
            } else {
                echo '<table class="widefat striped"><thead><tr><th>Reference</th><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Submitted</th></tr></thead><tbody>';
                foreach ($contacts as $contact) {
                    $url = add_query_arg(
                        array('page' => 'engineerparts-enquiries', 'type' => 'contact', 'reference' => $contact['contact_reference']),
                        admin_url('admin.php')
                    );
                    echo '<tr><td><a href="' . esc_url($url) . '">' . esc_html($contact['contact_reference']) . '</a></td>';
                    echo '<td>' . esc_html($contact['contact']) . '</td><td>' . esc_html($contact['company']) . '</td>';
                    echo '<td>' . esc_html($contact['email']) . '</td><td>' . esc_html($contact['phone']) . '</td>';
                    echo '<td>' . esc_html($contact['created_at']) . '</td></tr>';
                }
                echo '</tbody></table>';
            }

            echo '<h2 style="margin-top:32px">Clearance alert subscribers</h2>';
            if (!$clearance_alerts) {
                echo '<p>No clearance alert signups have been submitted.</p>';
            } else {
                echo '<table class="widefat striped"><thead><tr><th>Email</th><th>Status</th><th>Source</th><th>Subscribed</th></tr></thead><tbody>';
                foreach ($clearance_alerts as $subscriber) {
                    $url = add_query_arg(
                        array('page' => 'engineerparts-enquiries', 'type' => 'clearance-alert', 'reference' => $subscriber['id']),
                        admin_url('admin.php')
                    );
                    echo '<tr><td><a href="' . esc_url($url) . '">' . esc_html($subscriber['email']) . '</a></td>';
                    echo '<td>' . esc_html(ucfirst($subscriber['status'])) . '</td>';
                    echo '<td>' . esc_html($subscriber['source']) . '</td>';
                    echo '<td>' . esc_html($subscriber['created_at']) . '</td></tr>';
                }
                echo '</tbody></table>';
            }

            echo '<h2 style="margin-top:32px">Listing enquiries</h2>';
            if (!$enquiries) {
                echo '<p>No enquiries have been submitted yet.</p>';
            } else {
                echo '<table class="widefat striped"><thead><tr><th>Reference</th><th>Name</th><th>Company</th><th>Email</th><th>Enquiry type</th><th>Submitted</th></tr></thead><tbody>';
                foreach ($enquiries as $enquiry) {
                    $url = add_query_arg(
                        array('page' => 'engineerparts-enquiries', 'type' => 'enquiry', 'reference' => $enquiry['enquiry_reference']),
                        admin_url('admin.php')
                    );
                    echo '<tr><td><a href="' . esc_url($url) . '">' . esc_html($enquiry['enquiry_reference']) . '</a></td>';
                    echo '<td>' . esc_html($enquiry['contact']) . '</td><td>' . esc_html($enquiry['company']) . '</td>';
                    echo '<td>' . esc_html($enquiry['email']) . '</td><td>' . esc_html($enquiry['enquiry_type'] ?: $enquiry['lead_type']) . '</td>';
                    echo '<td>' . esc_html($enquiry['created_at']) . '</td></tr>';
                }
                echo '</tbody></table>';
            }
        }
        echo '</div>';
    }

    private static function render_enquiry_edit_form(array $enquiry): void {
        $reference = (string) $enquiry['enquiry_reference'];
        echo '<p><a href="' . esc_url(add_query_arg(
            array('page' => 'engineerparts-enquiries', 'reference' => $reference),
            admin_url('admin.php')
        )) . '">&larr; Cancel</a></p>';
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
        echo '<input type="hidden" name="action" value="engineerparts_update_enquiry">';
        echo '<input type="hidden" name="reference" value="' . esc_attr($reference) . '">';
        wp_nonce_field('engineerparts_update_enquiry_' . $reference);
        echo '<table class="form-table"><tbody>';
        $fields = array(
            'enquiry_type' => array('Enquiry type', 'text'),
            'contact' => array('Name', 'text'),
            'company' => array('Company', 'text'),
            'email' => array('Email', 'email'),
            'phone' => array('Phone', 'text'),
            'country' => array('Country', 'text'),
            'product_name' => array('Product', 'text'),
            'sku' => array('Product / SKU / Lot reference', 'text'),
            'requested_quantity' => array('Quantity', 'number'),
        );
        foreach ($fields as $key => $field) {
            echo '<tr><th scope="row"><label for="enquiry-' . esc_attr($key) . '">' . esc_html($field[0]) . '</label></th><td>';
            echo '<input class="regular-text" id="enquiry-' . esc_attr($key) . '" name="fields[' . esc_attr($key) . ']" type="' . esc_attr($field[1]) . '" value="' . esc_attr((string) $enquiry[$key]) . '"' . ($field[1] === 'number' ? ' min="0" step="1"' : '') . '></td></tr>';
        }
        echo '<tr><th scope="row"><label for="enquiry-status">Status</label></th><td><select id="enquiry-status" name="fields[status]">';
        foreach (array('submitted', 'reviewing', 'responded', 'closed') as $status) {
            echo '<option value="' . esc_attr($status) . '"' . selected((string) $enquiry['status'], $status, false) . '>' . esc_html(ucfirst($status)) . '</option>';
        }
        echo '</select></td></tr>';
        echo '<tr><th scope="row"><label for="enquiry-message">Message</label></th><td><textarea class="large-text" rows="8" id="enquiry-message" name="fields[message]">' . esc_textarea((string) $enquiry['message']) . '</textarea></td></tr>';
        echo '</tbody></table><p><button type="submit" class="button button-primary">Save changes</button></p></form>';
    }

    public static function update_enquiry_admin(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to edit enquiries.', 'engineerparts'));
        }
        $reference = isset($_POST['reference']) ? sanitize_text_field(wp_unslash($_POST['reference'])) : '';
        check_admin_referer('engineerparts_update_enquiry_' . $reference);
        $submitted = isset($_POST['fields']) && is_array($_POST['fields']) ? wp_unslash($_POST['fields']) : array();
        $email = sanitize_email($submitted['email'] ?? '');
        $contact = sanitize_text_field($submitted['contact'] ?? '');
        if (!$reference || !$contact || !is_email($email)) {
            self::redirect_enquiry_admin($reference, 'error');
        }
        $fields = array(
            'enquiry_type' => sanitize_text_field($submitted['enquiry_type'] ?? ''),
            'contact' => $contact,
            'company' => sanitize_text_field($submitted['company'] ?? ''),
            'email' => $email,
            'phone' => sanitize_text_field($submitted['phone'] ?? ''),
            'country' => sanitize_text_field($submitted['country'] ?? ''),
            'product_name' => sanitize_text_field($submitted['product_name'] ?? ''),
            'sku' => sanitize_text_field($submitted['sku'] ?? ''),
            'requested_quantity' => max(0, absint($submitted['requested_quantity'] ?? 0)),
            'message' => sanitize_textarea_field($submitted['message'] ?? ''),
            'status' => in_array(($submitted['status'] ?? ''), array('submitted', 'reviewing', 'responded', 'closed'), true)
                ? sanitize_key($submitted['status'])
                : 'submitted',
            'updated_at' => gmdate(DATE_ATOM),
        );
        global $wpdb;
        $exists = $wpdb->get_var($wpdb->prepare(
            'SELECT COUNT(*) FROM ' . self::enquiries_table() . ' WHERE enquiry_reference = %s',
            $reference
        ));
        if (!$exists) {
            self::redirect_enquiry_admin($reference, 'not_found');
        }
        $updated = $wpdb->update(
            self::enquiries_table(),
            $fields,
            array('enquiry_reference' => $reference),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s'),
            array('%s')
        );
        self::redirect_enquiry_admin($reference, $updated === false ? 'error' : 'saved');
    }

    public static function delete_enquiry_admin(): void {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to delete enquiries.', 'engineerparts'));
        }
        $reference = isset($_POST['reference']) ? sanitize_text_field(wp_unslash($_POST['reference'])) : '';
        check_admin_referer('engineerparts_delete_enquiry_' . $reference);
        global $wpdb;
        $deleted = $wpdb->delete(
            self::enquiries_table(),
            array('enquiry_reference' => $reference),
            array('%s')
        );
        if ($deleted === false) {
            self::redirect_enquiry_admin($reference, 'error');
        }
        wp_safe_redirect(add_query_arg(
            array('page' => 'engineerparts-enquiries', 'notice' => 'deleted'),
            admin_url('admin.php')
        ));
        exit;
    }

    private static function redirect_enquiry_admin(string $reference, string $notice): void {
        wp_safe_redirect(add_query_arg(
            array('page' => 'engineerparts-enquiries', 'reference' => $reference, 'notice' => $notice),
            admin_url('admin.php')
        ));
        exit;
    }

    private static function route(string $path, string $method, string $callback): void {
        register_rest_route(self::NAMESPACE, $path, array(
            'methods' => $method,
            'callback' => array(self::class, $callback),
            'permission_callback' => array(self::class, 'allow_proxy'),
        ));
    }

    public static function allow_proxy(WP_REST_Request $request): bool {
        $configured = defined('ENGINEERPARTS_PROXY_SECRET') ? (string) ENGINEERPARTS_PROXY_SECRET : '';
        $provided = (string) $request->get_header('x-engineerparts-proxy-secret');
        return strlen($configured) >= 32 && hash_equals($configured, $provided);
    }

    public static function delivery_policy_packages(array $packages): array {
        foreach ($packages as &$package) {
            $package['engineerparts_delivery_policy'] = 'aed-200-v1:' . get_woocommerce_currency() . ':' . (WC()->cart ? WC()->cart->get_cart_contents_total() : '');
        }
        unset($package);
        return $packages;
    }

    public static function apply_free_delivery(array $rates, array $package): array {
        if (get_woocommerce_currency() !== 'AED' || !WC()->cart || (float) WC()->cart->get_cart_contents_total() < 200) {
            return $rates;
        }
        foreach ($rates as $rate) {
            if ($rate->get_method_id() === 'local_pickup') {
                continue;
            }
            $rate->set_cost(0);
            $taxes = $rate->get_taxes();
            $rate->set_taxes(array_fill_keys(array_keys($taxes), 0));
            $rate->set_label('Free delivery');
        }
        return $rates;
    }

    public static function proxy_storefront_checkout(WP_REST_Request $request): WP_REST_Response {
        global $wpdb;

        $data = self::json($request);
        $reference = is_string($data['idempotencyKey'] ?? null) ? $data['idempotencyKey'] : '';
        $request_hash = is_string($data['requestHash'] ?? null) ? $data['requestHash'] : '';
        $cart_token = is_string($data['cartToken'] ?? null) ? $data['cartToken'] : '';
        $nonce = is_string($data['nonce'] ?? null) ? $data['nonce'] : '';
        $checkout = $data['checkout'] ?? null;
        $raw_email = is_array($checkout) && is_array($checkout['billing_address'] ?? null)
            ? ($checkout['billing_address']['email'] ?? '')
            : '';
        $billing_email = is_string($raw_email)
            ? sanitize_email($raw_email)
            : '';

        if (
            !preg_match('/^[A-Za-z0-9_-]{8,80}$/', $reference) ||
            !preg_match('/^[a-f0-9]{64}$/', $request_hash) ||
            strlen($cart_token) > 4096 ||
            $nonce === '' ||
            strlen($nonce) > 256 ||
            !is_array($checkout) ||
            !in_array($checkout['payment_method'] ?? '', array('nomod', 'cod'), true) ||
            !is_email($billing_email)
        ) {
            return self::error('Invalid checkout request.', 400, 'invalid_checkout_request');
        }
        if ($checkout['payment_method'] === 'cod' && ($checkout['shipping_address']['country'] ?? '') !== 'AE') {
            return self::error('Cash on Delivery is available for UAE delivery addresses only.', 422, 'cod_country_not_supported');
        }

        $lock_name = 'ep-checkout-' . substr(hash('sha256', $reference), 0, 48);
        $locked = $wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 20)', $lock_name));
        if ((string) $locked !== '1') {
            return self::error('Your checkout is already being processed. Please wait and try again.', 503, 'checkout_request_busy');
        }

        try {
            $existing = wc_get_orders(array(
                'limit' => 1,
                'meta_key' => self::STOREFRONT_REFERENCE_META,
                'meta_value' => $reference,
                'return' => 'objects',
            ));
            if ($existing) {
                $order = $existing[0];
                $existing_hash = (string) $order->get_meta(self::STOREFRONT_REQUEST_HASH_META, true);
                if (!hash_equals($existing_hash, $request_hash)) {
                    return self::error('This checkout has already created an order. Return to your existing order before changing its details.', 409, 'checkout_request_conflict');
                }
                if ($order->has_status(array('failed', 'cancelled', 'refunded'))) {
                    return self::error('This payment attempt has ended. Please submit checkout again to start a new attempt.', 409, 'checkout_attempt_closed');
                }

                $payment_url = (string) $order->get_meta(self::STOREFRONT_PAYMENT_URL_META, true);
                if (!$payment_url) {
                    $payment_url = $order->is_paid()
                        ? $order->get_checkout_order_received_url()
                        : $order->get_checkout_payment_url();
                }
                return self::success(array(
                    'checkout' => array(
                        'order_id' => $order->get_id(),
                        'order_key' => $order->get_order_key(),
                        'status' => $order->get_status(),
                        'payment_result' => array(
                            'payment_status' => $order->is_paid() ? 'success' : 'pending',
                            'redirect_url' => $payment_url,
                        ),
                    ),
                ));
            }

            if ($checkout['payment_method'] === 'cod') {
                $gateways = WC()->payment_gateways()->payment_gateways();
                if (!isset($gateways['cod']) || $gateways['cod']->enabled !== 'yes') {
                    return self::error('Cash on Delivery is unavailable. Choose online payment or contact sales.', 422, 'cod_unavailable');
                }
            }
            $store_request = new WP_REST_Request('POST', '/wc/store/v1/checkout');
            $store_request->set_header('Cart-Token', $cart_token);
            $store_request->set_header('Nonce', $nonce);
            $store_request->set_header('Content-Type', 'application/json');
            $store_request->set_body(wp_json_encode($checkout));

            self::$storefront_checkout_context = array(
                'reference' => $reference,
                'request_hash' => $request_hash,
                'order_id' => 0,
            );
            $had_cart_token = array_key_exists('HTTP_CART_TOKEN', $_SERVER);
            $previous_cart_token = $_SERVER['HTTP_CART_TOKEN'] ?? null;
            $_SERVER['HTTP_CART_TOKEN'] = $cart_token;
            try {
                $store_response = rest_do_request($store_request);
            } finally {
                if ($had_cart_token) {
                    $_SERVER['HTTP_CART_TOKEN'] = $previous_cart_token;
                } else {
                    unset($_SERVER['HTTP_CART_TOKEN']);
                }
            }
            self::$storefront_checkout_context = null;

            if (is_wp_error($store_response)) {
                return self::error('WooCommerce could not complete checkout. Please try again.', 502, 'storefront_checkout_failed');
            }

            $response_data = $store_response->get_data();
            if ($store_response->get_status() >= 400) {
                $error_code = is_array($response_data) && is_string($response_data['code'] ?? null)
                    ? $response_data['code']
                    : '';
                if (in_array($error_code, array(
                    'woocommerce_rest_product_partially_out_of_stock',
                    'woocommerce_rest_product_out_of_stock',
                    'woocommerce_rest_product_not_purchasable',
                    'woocommerce_rest_product_too_many_in_cart',
                ), true)) {
                    error_log(wp_json_encode(array(
                        'timestamp' => gmdate(DATE_ATOM),
                        'event' => 'storefront_inventory_conflict',
                        'reference_hash' => substr(hash('sha256', $reference), 0, 16),
                        'code' => $error_code,
                    )));
                    return self::error(
                        'Sorry, this product is no longer available in the requested quantity. Please update your cart and try again.',
                        409,
                        'insufficient_stock'
                    );
                }
                return new WP_REST_Response($response_data, $store_response->get_status());
            }

            $checkout_result = is_array($response_data) ? ($response_data['payment_result'] ?? null) : null;
            $order = is_array($response_data) ? wc_get_order(absint($response_data['order_id'] ?? 0)) : false;
            if (!$order || !is_array($checkout_result)) {
                return self::error('WooCommerce returned an incomplete checkout response.', 502, 'storefront_checkout_failed');
            }

            $order->update_meta_data(self::STOREFRONT_REFERENCE_META, $reference);
            $order->update_meta_data(self::STOREFRONT_REQUEST_HASH_META, $request_hash);
            $response_data['order_key'] = $order->get_order_key();
            $raw_payment_url = is_string($checkout_result['redirect_url'] ?? null)
                ? $checkout_result['redirect_url']
                : '';
            $payment_url = esc_url_raw($raw_payment_url);
            if ($payment_url) {
                $order->update_meta_data(self::STOREFRONT_PAYMENT_URL_META, $payment_url);
                $checkout_result['redirect_url'] = $payment_url;
                $response_data['payment_result'] = $checkout_result;
            }
            $order->save_meta_data();
            return self::success(array('checkout' => $response_data));
        } catch (Throwable $error) {
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'event' => 'storefront_checkout_failed',
                'reference_hash' => substr(hash('sha256', $reference), 0, 16),
                'error_class' => get_class($error),
            )));
            return self::error('WooCommerce could not complete checkout. Please try again.', 502, 'storefront_checkout_failed');
        } finally {
            self::$storefront_checkout_context = null;
            $wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)', $lock_name));
        }
    }

    public static function tag_storefront_checkout_order($order, $order_object = null): void {
        if (!$order instanceof WC_Order) {
            $order = $order_object;
        }
        if (!self::$storefront_checkout_context || !$order instanceof WC_Order) {
            return;
        }
        if (
            self::$storefront_checkout_context['order_id'] &&
            self::$storefront_checkout_context['order_id'] !== $order->get_id()
        ) {
            return;
        }
        self::$storefront_checkout_context['order_id'] = $order->get_id();
        $order->update_meta_data(self::STOREFRONT_REFERENCE_META, self::$storefront_checkout_context['reference']);
        $order->update_meta_data(self::STOREFRONT_REQUEST_HASH_META, self::$storefront_checkout_context['request_hash']);
        $order->save_meta_data();
    }

    public static function hold_late_storefront_payment(string $status, int $order_id, $order): string {
        if (
            !$order instanceof WC_Order ||
            !$order->get_meta(self::STOREFRONT_REFERENCE_META, true)
        ) {
            return $status;
        }

        if (
            !$order->has_status(array('failed', 'cancelled', 'refunded')) &&
            !$order->get_meta(self::STOREFRONT_LATE_PAYMENT_META, true)
        ) {
            return $status;
        }
        $order->update_meta_data(self::STOREFRONT_LATE_PAYMENT_META, '1');
        $order->save_meta_data();
        error_log(wp_json_encode(array(
            'timestamp' => gmdate(DATE_ATOM),
            'event' => 'late_storefront_payment_after_stock_hold_release',
            'order_id' => $order_id,
        )));
        return 'on-hold';
    }

    public static function prevent_late_storefront_stock_reduction(bool $reduce, int $order_id): bool {
        if (!$reduce) {
            return false;
        }
        $order = wc_get_order($order_id);
        return $order && $order->get_meta(self::STOREFRONT_LATE_PAYMENT_META, true) ? false : $reduce;
    }

    public static function register(WP_REST_Request $request): WP_REST_Response {
        if (!function_exists('wc_create_new_customer')) {
            return self::error('Account service is temporarily unavailable.', 503);
        }

        $data = self::json($request);
        $first_name = sanitize_text_field($data['firstName'] ?? '');
        $last_name = sanitize_text_field($data['lastName'] ?? '');
        $email = sanitize_email($data['email'] ?? '');
        $phone = sanitize_text_field($data['phone'] ?? '');
        $company = sanitize_text_field($data['company'] ?? '');
        $password = (string) ($data['password'] ?? '');

        if (!$first_name || !$last_name || !is_email($email) || !$phone || !self::valid_password($password)) {
            return self::error('Unable to create your account. Please check the information and try again.', 422);
        }
        if (!self::rate_limit('register', self::client_identifier($request), 5, HOUR_IN_SECONDS)) {
            return self::error('Too many registration attempts. Please try again later.', 429);
        }
        $captcha_error = self::verify_turnstile((string) ($data['captchaToken'] ?? ''));
        if ($captcha_error) {
            return $captcha_error;
        }
        if (email_exists($email)) {
            return self::error('An account already exists with this email address. Please sign in instead.', 409, 'email_exists');
        }

        $customer_id = wc_create_new_customer($email, '', $password, array(
            'first_name' => $first_name,
            'last_name' => $last_name,
            'display_name' => trim("{$first_name} {$last_name}"),
        ));
        if (is_wp_error($customer_id)) {
            self::log_failure('register', 'customer_create', $customer_id);
            return self::error('Unable to create your account. Please check the information and try again.', 502);
        }

        $customer = new WC_Customer($customer_id);
        $customer->set_billing_first_name($first_name);
        $customer->set_billing_last_name($last_name);
        $customer->set_billing_email($email);
        $customer->set_billing_phone($phone);
        $customer->set_billing_company($company);
        if (!empty($data['country'])) {
            $customer->set_billing_country(strtoupper(sanitize_text_field($data['country'])));
        }
        $customer->save();

        self::save_business_meta($customer_id, $data);
        update_user_meta($customer_id, self::VERIFIED_META, '0');
        self::send_verification($customer_id, $email);

        return self::success(array(
            'message' => 'Account created. Please check your email to verify your account before signing in.',
            'requiresVerification' => true,
        ), 201);
    }

    public static function login(WP_REST_Request $request): WP_REST_Response {
        $data = self::json($request);
        $email = sanitize_email($data['email'] ?? '');
        $password = (string) ($data['password'] ?? '');
        $identifier = strtolower($email);

        if (!self::rate_limit('login', $identifier, 10, 15 * MINUTE_IN_SECONDS)) {
            return self::error('Too many sign-in attempts. Please try again later.', 429);
        }
        if (!is_email($email) || !$password) {
            return self::error('Incorrect email or password.', 401, 'invalid_credentials');
        }

        $existing = get_user_by('email', $email);
        $user = $existing ? wp_authenticate($existing->user_login, $password) : new WP_Error('invalid_credentials');
        if (is_wp_error($user) || !$user instanceof WP_User) {
            return self::error('Incorrect email or password.', 401, 'invalid_credentials');
        }
        $verification = (string) get_user_meta($user->ID, self::VERIFIED_META, true);
        if ($verification === '0') {
            if (!self::woocommerce_email_verified($user->ID)) {
                return self::error('Please verify your email address before signing in.', 403, 'email_unverified');
            }
            update_user_meta($user->ID, self::VERIFIED_META, '1');
        }
        if ($verification === '') update_user_meta($user->ID, self::VERIFIED_META, '1');

        $remember = !empty($data['remember']);
        $session = self::create_session($user->ID, $remember);
        if (!$session) {
            return self::error('Unable to sign in right now. Please try again.', 503);
        }

        return self::success(array(
            'token' => $session['token'],
            'expiresAt' => $session['expiresAt'],
            'customer' => self::customer_payload($user->ID),
        ));
    }

    public static function logout(WP_REST_Request $request): WP_REST_Response {
        $token = self::session_token($request);
        if ($token) {
            global $wpdb;
            $wpdb->delete(self::session_table(), array('token_hash' => hash('sha256', $token)), array('%s'));
        }
        return self::success(array('message' => 'Signed out.'));
    }

    public static function me(WP_REST_Request $request): WP_REST_Response {
        $user_id = self::authenticated_user_id($request);
        if (!$user_id) {
            return self::error('Authentication required.', 401, 'unauthenticated');
        }
        return self::success(array('customer' => self::customer_payload($user_id)));
    }

    public static function verify_email(WP_REST_Request $request): WP_REST_Response {
        $data = self::json($request);
        $email = sanitize_email($data['email'] ?? '');
        $token = (string) ($data['token'] ?? '');
        $user = get_user_by('email', $email);

        if (!$user || !$token || time() > (int) get_user_meta($user->ID, self::VERIFY_EXPIRES_META, true)) {
            return self::error('This verification link is invalid or has expired.', 400, 'invalid_verification');
        }
        $stored_hash = (string) get_user_meta($user->ID, self::VERIFY_HASH_META, true);
        if (!$stored_hash || !hash_equals($stored_hash, hash('sha256', $token))) {
            return self::error('This verification link is invalid or has expired.', 400, 'invalid_verification');
        }

        update_user_meta($user->ID, self::VERIFIED_META, '1');
        delete_user_meta($user->ID, self::VERIFY_HASH_META);
        delete_user_meta($user->ID, self::VERIFY_EXPIRES_META);
        return self::success(array('message' => 'Email verified. You can now sign in.'));
    }

    public static function resend_verification(WP_REST_Request $request): WP_REST_Response {
        $data = self::json($request);
        $email = sanitize_email($data['email'] ?? '');
        if (self::rate_limit('resend', strtolower($email), 3, HOUR_IN_SECONDS)) {
            $user = get_user_by('email', $email);
            if ($user && get_user_meta($user->ID, self::VERIFIED_META, true) !== '1') {
                self::send_verification($user->ID, $email);
            }
        }
        return self::success(array('message' => 'If this account requires verification, a new email has been sent.'));
    }

    public static function forgot_password(WP_REST_Request $request): WP_REST_Response {
        $data = self::json($request);
        $email = sanitize_email($data['email'] ?? '');
        $identifier = strtolower($email);

        if (self::rate_limit('forgot', $identifier, 3, HOUR_IN_SECONDS)) {
            $user = get_user_by('email', $email);
            if ($user) {
                $key = get_password_reset_key($user);
                if (!is_wp_error($key)) {
                    $url = add_query_arg(array(
                        'key' => $key,
                        'login' => rawurlencode($user->user_login),
                    ), self::frontend_url() . '/reset-password');
                    self::send_branded_email(
                        $email,
                        'Reset your EngineerParts password',
                        'Reset your password',
                        'We received a request to reset the password for your EngineerParts account.',
                        '<p style="margin:0;color:#52525b;font-size:14px;line-height:1.6;">If you did not request a password reset, you can safely ignore this email.</p>',
                        'Reset password',
                        $url
                    );
                }
            }
        }

        return self::success(array('message' => 'If an account exists for this email address, password reset instructions have been sent.'));
    }

    public static function reset_password(WP_REST_Request $request): WP_REST_Response {
        $data = self::json($request);
        $login = sanitize_user($data['login'] ?? '');
        $key = sanitize_text_field($data['key'] ?? '');
        $password = (string) ($data['password'] ?? '');

        if (!self::valid_password($password)) {
            return self::error('Password must be at least 8 characters and contain letters and numbers.', 422);
        }
        if (!self::rate_limit('reset', strtolower($login), 5, HOUR_IN_SECONDS)) {
            return self::error('Too many reset attempts. Please request a new password reset email.', 429);
        }

        $user = check_password_reset_key($key, $login);
        if (is_wp_error($user)) {
            return self::error('This password reset link is invalid or has expired.', 400, 'invalid_reset');
        }
        reset_password($user, $password);
        self::revoke_user_sessions($user->ID);
        return self::success(array('message' => 'Password updated. You can now sign in.'));
    }

    public static function account(WP_REST_Request $request): WP_REST_Response {
        $user_id = self::authenticated_user_id($request);
        if (!$user_id) return self::error('Authentication required.', 401, 'unauthenticated');
        return self::success(array('customer' => self::customer_payload($user_id, true)));
    }

    public static function update_account(WP_REST_Request $request): WP_REST_Response {
        $user_id = self::authenticated_user_id($request);
        if (!$user_id) return self::error('Authentication required.', 401, 'unauthenticated');
        $data = self::json($request);
        $first_name = sanitize_text_field($data['firstName'] ?? '');
        $last_name = sanitize_text_field($data['lastName'] ?? '');
        $email = sanitize_email($data['email'] ?? '');
        if (!$first_name || !$last_name || !is_email($email)) {
            return self::error('Please check the required profile fields.', 422);
        }
        $email_owner = email_exists($email);
        if ($email_owner && (int) $email_owner !== $user_id) {
            return self::error('This email address is already used by another account.', 409, 'email_exists');
        }
        $existing_user = get_userdata($user_id);
        $email_changed = $existing_user && strtolower($existing_user->user_email) !== strtolower($email);
        $updated = wp_update_user(array(
            'ID' => $user_id, 'first_name' => $first_name, 'last_name' => $last_name,
            'display_name' => trim("{$first_name} {$last_name}"), 'user_email' => $email,
        ));
        if (is_wp_error($updated)) {
            self::log_failure('account', 'profile_update', $updated);
            return self::error('Unable to update your profile right now.', 502);
        }
        $customer = new WC_Customer($user_id);
        $customer->set_billing_first_name($first_name);
        $customer->set_billing_last_name($last_name);
        $customer->set_billing_email($email);
        $customer->set_billing_phone(sanitize_text_field($data['phone'] ?? ''));
        $customer->set_billing_company(sanitize_text_field($data['company'] ?? ''));
        $customer->save();
        self::save_business_meta($user_id, $data);
        if ($email_changed) {
            update_user_meta($user_id, self::VERIFIED_META, '0');
            self::send_verification($user_id, $email);
        }
        return self::success(array('message' => $email_changed ? 'Profile updated. Verify your new email address before your next sign-in.' : 'Profile updated.', 'customer' => self::customer_payload($user_id, true)));
    }

    public static function update_addresses(WP_REST_Request $request): WP_REST_Response {
        $user_id = self::authenticated_user_id($request);
        if (!$user_id) return self::error('Authentication required.', 401, 'unauthenticated');
        $data = self::json($request);
        $billing = isset($data['billing']) && is_array($data['billing']) ? $data['billing'] : array();
        $shipping = !empty($data['sameAsBilling']) ? $billing : (isset($data['shipping']) && is_array($data['shipping']) ? $data['shipping'] : array());
        if (!self::valid_address($billing, true) || !self::valid_address($shipping, false)) {
            return self::error('Please complete all required address fields.', 422);
        }
        $customer = new WC_Customer($user_id);
        self::set_customer_address($customer, 'billing', $billing);
        self::set_customer_address($customer, 'shipping', $shipping);
        $customer->save();
        return self::success(array('message' => 'Addresses updated.', 'customer' => self::customer_payload($user_id, true)));
    }

    public static function change_password(WP_REST_Request $request): WP_REST_Response {
        $user_id = self::authenticated_user_id($request);
        if (!$user_id) return self::error('Authentication required.', 401, 'unauthenticated');
        $data = self::json($request);
        $current = (string) ($data['currentPassword'] ?? '');
        $password = (string) ($data['newPassword'] ?? '');
        if (!self::rate_limit('change_password', self::client_identifier($request) . '|' . $user_id, 5, 15 * MINUTE_IN_SECONDS)) {
            return self::error('Too many password attempts. Please try again later.', 429);
        }
        $user = get_userdata($user_id);
        if (!$user || !wp_check_password($current, $user->user_pass, $user_id)) {
            return self::error('Current password is incorrect.', 403, 'invalid_password');
        }
        if (!self::valid_password($password)) {
            return self::error('Password must be at least 8 characters and contain letters and numbers.', 422);
        }
        wp_set_password($password, $user_id);
        self::revoke_user_sessions($user_id);
        return self::success(array('message' => 'Password changed. Please sign in again.'));
    }

    public static function orders(WP_REST_Request $request): WP_REST_Response {
        $user_id = self::authenticated_user_id($request);
        if (!$user_id) return self::error('Authentication required.', 401, 'unauthenticated');
        $orders = wc_get_orders(array('customer_id' => $user_id, 'limit' => 50, 'orderby' => 'date', 'order' => 'DESC'));
        return self::success(array('orders' => array_map(array(self::class, 'order_summary'), $orders)));
    }

    public static function order(WP_REST_Request $request): WP_REST_Response {
        $user_id = self::authenticated_user_id($request);
        if (!$user_id) return self::error('Authentication required.', 401, 'unauthenticated');
        $order = wc_get_order((int) $request['id']);
        if (!$order || (int) $order->get_customer_id() !== $user_id) return self::error('Order not found.', 404, 'not_found');
        $detail = self::order_detail($order);
        if ($order->needs_payment() && empty($detail['paymentUrl'])) {
            return self::error('Secure payment could not be started. Please try again later.', 503, 'payment_handoff_failed');
        }
        return self::success(array('order' => $detail));
    }

    public static function create_payment_link(WP_REST_Request $request): WP_REST_Response {
        $user_id = self::authenticated_user_id($request);
        if (!$user_id) return self::error('Authentication required.', 401, 'unauthenticated');
        $order = wc_get_order((int) $request['id']);
        if (!$order || (int) $order->get_customer_id() !== $user_id || !$order->needs_payment()) {
            return self::error('Order not found or does not require payment.', 404, 'not_found');
        }

        $payment_url = self::payment_handoff_url($order);
        if (!$payment_url) return self::error('Secure payment could not be started. Please try again later.', 503, 'payment_handoff_failed');
        return self::success(array('paymentUrl' => $payment_url));
    }

    public static function create_proxy_payment_link(WP_REST_Request $request): WP_REST_Response {
        $order = wc_get_order((int) $request['id']);
        if (!$order || !$order->needs_payment() || $order->get_payment_method() !== 'nomod') {
            return self::error('Order not found or does not require Nomod payment.', 404, 'not_found');
        }

        $payment_url = self::nomod_payment_url($order);
        if (!$payment_url) {
            return self::error('Secure Nomod payment could not be started. Please try again later.', 503, 'payment_handoff_failed');
        }
        return self::success(array('paymentUrl' => $payment_url));
    }

    private static function nomod_payment_url(WC_Order $order): ?string {
        try {
            $gateways = WC()->payment_gateways()->payment_gateways();
            $gateway = $gateways[$order->get_payment_method()] ?? null;
            if (!$gateway || !is_callable(array($gateway, 'process_payment'))) {
                error_log(wp_json_encode(array(
                    'timestamp' => gmdate(DATE_ATOM),
                    'endpoint' => 'nomod_payment_handoff',
                    'category' => 'gateway_unavailable',
                    'order_id' => $order->get_id(),
                )));
                return null;
            }
            $result = $gateway->process_payment($order->get_id());
        } catch (Throwable $error) {
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'nomod_payment_handoff',
                'category' => 'gateway_failed',
                'order_id' => $order->get_id(),
                'error' => get_class($error),
            )));
            return null;
        }

        $payment_url = is_array($result) && ($result['result'] ?? '') === 'success'
            ? esc_url_raw($result['redirect'] ?? '')
            : '';
        $parts = $payment_url ? wp_parse_url($payment_url) : false;
        $store_host = wp_parse_url(home_url('/'), PHP_URL_HOST);
        if (
            !$parts ||
            strtolower((string) ($parts['scheme'] ?? '')) !== 'https' ||
            empty($parts['host']) ||
            strtolower((string) $parts['host']) === strtolower((string) $store_host) ||
            !wp_http_validate_url($payment_url)
        ) {
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'nomod_payment_handoff',
                'category' => 'invalid_gateway_redirect',
                'order_id' => $order->get_id(),
            )));
            return null;
        }
        return $payment_url;
    }

    /**
     * Creates a short-lived, single-use link that signs in only the customer who
     * owns this order before opening WooCommerce's order-payment page.
     */
    private static function payment_handoff_url(WC_Order $order): ?string {
        if ($order->get_payment_method() === 'nomod') {
            return add_query_arg(array('order_id' => $order->get_id(), 'order_key' => rawurlencode($order->get_order_key())), self::frontend_url() . '/checkout/pay');
        }
        $user_id = (int) $order->get_customer_id();
        if (!$user_id) return $order->get_checkout_payment_url();

        $token = bin2hex(random_bytes(32));
        $transient = 'ep_payment_handoff_' . hash('sha256', $token);
        if (!set_transient($transient, array('order_id' => $order->get_id(), 'user_id' => $user_id), 5 * MINUTE_IN_SECONDS)) {
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'payment_handoff',
                'category' => 'token_storage_failed',
                'order_id' => $order->get_id(),
            )));
            return null;
        }

        return add_query_arg(array(
            'action' => 'engineerparts_payment_handoff',
            'token' => $token,
        ), admin_url('admin-post.php'));
    }

    public static function payment_handoff(): void {
        nocache_headers();
        header('Referrer-Policy: no-referrer');

        $token = isset($_GET['token']) && is_string($_GET['token']) ? sanitize_text_field(wp_unslash($_GET['token'])) : '';
        if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
            wp_die(esc_html__('This payment link is invalid or has expired.', 'engineerparts-account'), '', array('response' => 403));
        }

        $transient = 'ep_payment_handoff_' . hash('sha256', $token);
        $lock = 'ep_payment_handoff_consume_' . hash('sha256', $token);
        if (!add_option($lock, '1', '', 'no')) {
            wp_die(esc_html__('This payment link has already been used or has expired.', 'engineerparts-account'), '', array('response' => 403));
        }
        try {
            $handoff = get_transient($transient);
            delete_transient($transient);
        } finally {
            delete_option($lock);
        }

        if (!is_array($handoff) || empty($handoff['order_id']) || empty($handoff['user_id'])) {
            wp_die(esc_html__('This payment link is invalid or has expired.', 'engineerparts-account'), '', array('response' => 403));
        }

        $order = wc_get_order((int) $handoff['order_id']);
        $user_id = (int) $handoff['user_id'];
        $user = get_userdata($user_id);
        if (!$order || !$user || (int) $order->get_customer_id() !== $user_id || !$order->needs_payment()) {
            wp_die(esc_html__('This order is no longer available for payment.', 'engineerparts-account'), '', array('response' => 403));
        }

        wp_set_current_user($user_id);
        $short_cookie = static fn(int $expiration): int => min($expiration, HOUR_IN_SECONDS);
        add_filter('auth_cookie_expiration', $short_cookie, PHP_INT_MAX);
        try {
            wp_set_auth_cookie($user_id, false, is_ssl());
        } finally {
            remove_filter('auth_cookie_expiration', $short_cookie, PHP_INT_MAX);
        }
        do_action('wp_login', $user->user_login, $user);
        wp_safe_redirect($order->get_checkout_payment_url());
        exit;
    }

    /**
     * Sends the customer to the headless frontend's confirmation page instead of
     * WooCommerce's own thank-you page after a gateway redirects back. The order
     * key travels in the URL the same way it does for payment_handoff_url above,
     * so the frontend can look the order up without a WordPress session.
     */
    public static function order_received_url($url, $order) {
        if (!$order instanceof WC_Order) return $url;
        return add_query_arg(array(
            'order_id' => $order->get_id(),
            'order_key' => $order->get_order_key(),
        ), self::frontend_url() . '/checkout/success');
    }

    public static function reorder(WP_REST_Request $request): WP_REST_Response {
        $user_id = self::authenticated_user_id($request);
        if (!$user_id) return self::error('Authentication required.', 401, 'unauthenticated');
        $order = wc_get_order((int) $request['id']);
        if (!$order || (int) $order->get_customer_id() !== $user_id) return self::error('Order not found.', 404, 'not_found');
        $items = array();
        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            if (!$product || !$product->is_purchasable() || !$product->is_in_stock()) continue;
            $stock = $product->get_stock_quantity();
            $quantity = min((int) $item->get_quantity(), $stock === null ? 99 : max(0, (int) $stock));
            if ($quantity < 1) continue;
            $image_id = $product->get_image_id();
            $items[] = array(
                'productId' => (string) $product->get_id(), 'sku' => $product->get_sku(),
                'name' => $product->get_name(), 'slug' => $product->get_slug(),
                'brand' => (string) $product->get_meta('brand'),
                'condition' => (string) ($product->get_meta('condition') ?: 'New Surplus'),
                'unitPrice' => (float) wc_get_price_to_display($product), 'currency' => get_woocommerce_currency(),
                'quantity' => $quantity, 'maxQuantity' => $stock === null ? 99 : (int) $stock,
                'image' => $image_id ? wp_get_attachment_image_url($image_id, 'woocommerce_thumbnail') : wc_placeholder_img_src(),
                'warehouse' => (string) $product->get_meta('warehouse_location'),
            );
        }
        return self::success(array('items' => $items));
    }

    public static function enquiries(WP_REST_Request $request): WP_REST_Response {
        $user_id = self::authenticated_user_id($request);
        if (!$user_id) return self::error('Authentication required.', 401, 'unauthenticated');
        global $wpdb;
        $table = self::enquiries_table();
        $rows = $wpdb->get_results(
            $wpdb->prepare("SELECT * FROM {$table} WHERE customer_id = %d ORDER BY id DESC LIMIT 100", $user_id),
            ARRAY_A
        );
        return self::success(array('enquiries' => array_map(array(self::class, 'enquiry_payload'), $rows ?: array())));
    }

    public static function claim_enquiries(WP_REST_Request $request): WP_REST_Response {
        $user_id = self::authenticated_user_id($request);
        if (!$user_id) return self::error('Authentication required.', 401, 'unauthenticated');
        $data = self::json($request);
        $references = isset($data['references']) && is_array($data['references']) ? array_slice($data['references'], 0, 200) : array();
        $user = get_userdata($user_id);
        $claimed = 0;
        global $wpdb;
        $table = self::enquiries_table();
        foreach ($references as $reference) {
            $reference = sanitize_text_field($reference);
            $updated = $wpdb->update(
                $table,
                array('customer_id' => $user_id, 'updated_at' => gmdate(DATE_ATOM)),
                array('enquiry_reference' => $reference, 'email' => $user->user_email, 'customer_id' => 0),
                array('%d', '%s'),
                array('%s', '%s', '%d')
            );
            if ($updated === false) {
                error_log(wp_json_encode(array(
                    'timestamp' => gmdate(DATE_ATOM),
                    'endpoint' => 'enquiries',
                    'category' => 'claim_failed',
                    'databaseError' => $wpdb->last_error,
                )));
            } else {
                $claimed += $updated;
            }
        }
        return self::success(array('claimed' => $claimed));
    }

    public static function submit_enquiry(WP_REST_Request $request): WP_REST_Response {
        global $wpdb;
        $data = self::json($request);
        $email = sanitize_email($data['email'] ?? '');
        $contact = sanitize_text_field($data['contact'] ?? '');
        if (!is_email($email) || !$contact) return self::error('Please provide a valid name and email address.', 422);
        $lead_type = sanitize_key($data['lead_type'] ?? 'general_contact');
        $phone = sanitize_text_field($data['phone'] ?? '');
        $company = sanitize_text_field($data['company'] ?? '');
        $message = sanitize_textarea_field($data['message'] ?? '');
        $requires_business_contact = in_array($lead_type, array('general_contact', 'product_enquiry', 'whole_lot_enquiry', 'equipment_enquiry'), true);
        if ($requires_business_contact && (!$company || !$phone)) {
            return self::error('Please provide your company and phone number.', 422);
        }
        if ($lead_type === 'general_contact' && !$message) {
            return self::error('Please provide a message.', 422);
        }
        if (!self::rate_limit('enquiry', strtolower($email), 10, HOUR_IN_SECONDS)) {
            return self::error('Too many enquiries have been submitted. Please try again later.', 429);
        }
        $user_id = self::authenticated_user_id($request);
        if ($user_id) {
            $user = get_userdata($user_id);
            $email = $user->user_email;
        }
        if ($lead_type === 'general_contact') {
            return self::save_contact_submission($data, $user_id, $contact, $email, $phone);
        }
        $table = self::enquiries_table();
        $fields = array(
            'customer_id' => $user_id,
            'lead_type' => $lead_type,
            'enquiry_type' => sanitize_text_field($data['enquiry_type'] ?? ''),
            'product_id' => absint($data['product_id'] ?? 0),
            'product_name' => sanitize_text_field($data['product_name'] ?? ''),
            'sku' => sanitize_text_field($data['sku'] ?? ''),
            'part_number' => sanitize_text_field($data['part_number'] ?? ''),
            'lot_id' => sanitize_text_field($data['lot_id'] ?? ''),
            'equipment_id' => sanitize_text_field($data['equipment_id'] ?? ''),
            'listing_url' => esc_url_raw($data['listing_url'] ?? ''),
            'requested_quantity' => max(0, absint($data['quantity'] ?? 0)),
            'budget' => sanitize_text_field($data['budget'] ?? ''),
            'message' => $message,
            'company' => $company,
            'contact' => $contact,
            'email' => $email,
            'phone' => $phone,
            'country' => sanitize_text_field($data['country'] ?? ''),
            'status' => 'submitted',
            'source' => sanitize_key($data['source'] ?? 'web'),
            'created_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        );
        if ($wpdb->insert($table, $fields) === false) {
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'enquiries',
                'category' => 'create_failed',
                'databaseError' => $wpdb->last_error,
            )));
            return self::error('Unable to submit your enquiry right now.', 502);
        }
        $enquiry_id = (int) $wpdb->insert_id;
        $reference_id = $enquiry_id;
        do {
            $reference = sprintf('EP-RFQ-%s-%06d', gmdate('Y'), $reference_id++);
            $reference_exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$table} WHERE enquiry_reference = %s",
                $reference
            ));
        } while ($reference_exists);
        if ($wpdb->update($table, array('enquiry_reference' => $reference), array('id' => $enquiry_id), array('%s'), array('%d')) === false) {
            $wpdb->delete($table, array('id' => $enquiry_id), array('%d'));
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'enquiries',
                'category' => 'reference_save_failed',
                'databaseError' => $wpdb->last_error,
            )));
            return self::error('Unable to submit your enquiry right now.', 502);
        }
        $details = self::email_details_table(array(
            'Reference' => $reference,
            'Enquiry type' => $fields['enquiry_type'] ?: $fields['lead_type'],
            'Name' => $contact,
            'Company' => $fields['company'],
            'Email' => $email,
            'Phone' => $fields['phone'],
            'Country' => $fields['country'],
            'Product / SKU / Lot reference' => $fields['sku'],
            'Part number' => $fields['part_number'],
            'Lot ID' => $fields['lot_id'],
            'Equipment ID' => $fields['equipment_id'],
            'Quantity' => (string) $fields['requested_quantity'],
            'Budget / target price' => $fields['budget'],
            'Listing URL' => $fields['listing_url'],
            'Message' => $fields['message'],
        ));
        $admin_email = sanitize_email(get_option('admin_email'));
        $admin_sent = is_email($admin_email) && wp_mail(
            $admin_email,
            "New EngineerParts listing enquiry {$reference}",
            self::email_template(
                'New listing enquiry',
                'A customer has submitted a listing enquiry. Reply directly to this email to contact them.',
                $details
            ),
            array("Content-Type: text/html; charset=UTF-8", "Reply-To: {$contact} <{$email}>")
        );
        $customer_sent = self::send_branded_email(
            $email,
            "We received your EngineerParts enquiry {$reference}",
            'We received your enquiry',
            'Thank you, ' . $contact . '. Your enquiry has been received. Our team will respond during the next working day.',
            $details,
            'Visit EngineerParts',
            self::frontend_url()
        );
        foreach (array('admin_notification' => $admin_sent, 'customer_confirmation' => $customer_sent) as $category => $sent) {
            if (!$sent) {
                error_log(wp_json_encode(array(
                    'timestamp' => gmdate(DATE_ATOM),
                    'endpoint' => 'enquiries',
                    'category' => $category . '_mail_failed',
                )));
            }
        }
        return self::success(array(
            'lead_id' => $reference,
            'received_at' => $fields['created_at'],
            'admin_email_sent' => $admin_sent,
        ), 201);
    }

    public static function subscribe_clearance_alerts(WP_REST_Request $request): WP_REST_Response {
        global $wpdb;
        $data = self::json($request);
        $email = strtolower(sanitize_email($data['email'] ?? ''));
        if (!is_email($email)) {
            return self::error('Please enter a valid email address.', 422);
        }
        if (!self::rate_limit('clearance_alerts', $email, 10, HOUR_IN_SECONDS)) {
            return self::error('Too many subscription attempts. Please try again later.', 429);
        }

        $table = self::clearance_alerts_table();
        $now = current_time('mysql', true);
        $saved = $wpdb->query($wpdb->prepare(
            "INSERT INTO {$table} (email, status, source, created_at, updated_at)
            VALUES (%s, 'subscribed', %s, %s, %s)
            ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)",
            $email,
            sanitize_key($data['source'] ?? 'web'),
            $now,
            $now
        ));
        if ($saved === false) {
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'clearance-alerts',
                'category' => 'subscription_save_failed',
                'databaseError' => $wpdb->last_error,
            )));
            return self::error('Unable to save your email right now.', 502);
        }
        return self::success(array('subscribed' => true), 201);
    }

    private static function save_contact_submission(array $data, int $user_id, string $contact, string $email, string $phone): WP_REST_Response {
        global $wpdb;
        $table = self::contacts_table();
        $created_at = gmdate(DATE_ATOM);
        $fields = array(
            'customer_id' => $user_id,
            'message' => sanitize_textarea_field($data['message'] ?? ''),
            'company' => sanitize_text_field($data['company'] ?? ''),
            'contact' => $contact,
            'email' => $email,
            'phone' => $phone,
            'country' => sanitize_text_field($data['country'] ?? ''),
            'status' => 'submitted',
            'source' => sanitize_key($data['source'] ?? 'web'),
            'created_at' => $created_at,
            'updated_at' => $created_at,
        );
        if ($wpdb->insert($table, $fields) === false) {
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'contacts',
                'category' => 'create_failed',
                'databaseError' => $wpdb->last_error,
            )));
            return self::error('Unable to send your message right now.', 502);
        }
        $contact_id = (int) $wpdb->insert_id;
        $reference_id = $contact_id;
        do {
            $reference = sprintf('EP-CONTACT-%s-%06d', gmdate('Y'), $reference_id++);
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$table} WHERE contact_reference = %s",
                $reference
            ));
        } while ($exists);
        if ($wpdb->update($table, array('contact_reference' => $reference), array('id' => $contact_id), array('%s'), array('%d')) === false) {
            $wpdb->delete($table, array('id' => $contact_id), array('%d'));
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'contacts',
                'category' => 'reference_save_failed',
                'databaseError' => $wpdb->last_error,
            )));
            return self::error('Unable to send your message right now.', 502);
        }
        $details = self::email_details_table(array(
            'Reference' => $reference,
            'Name' => $contact,
            'Company' => $fields['company'],
            'Email' => $email,
            'Phone' => $fields['phone'],
            'Country' => $fields['country'],
            'Message' => $fields['message'],
        ));
        $admin_email = sanitize_email(get_option('admin_email'));
        $admin_sent = is_email($admin_email) && wp_mail(
            $admin_email,
            "New EngineerParts contact message {$reference}",
            self::email_template(
                'New contact message',
                'A customer has sent a message through the EngineerParts contact form. Reply directly to this email to contact them.',
                $details
            ),
            array("Content-Type: text/html; charset=UTF-8", "Reply-To: {$contact} <{$email}>")
        );
        $customer_sent = self::send_branded_email(
            $email,
            "We received your EngineerParts message {$reference}",
            'We received your message',
            'Thank you, ' . $contact . '. Your message has been received. Our team will respond during the next working day.',
            $details,
            'Visit EngineerParts',
            self::frontend_url()
        );
        foreach (array('admin_notification' => $admin_sent, 'customer_confirmation' => $customer_sent) as $category => $sent) {
            if (!$sent) {
                error_log(wp_json_encode(array(
                    'timestamp' => gmdate(DATE_ATOM),
                    'endpoint' => 'contacts',
                    'category' => $category . '_mail_failed',
                )));
            }
        }
        return self::success(array(
            'lead_id' => $reference,
            'received_at' => $created_at,
            'admin_email_sent' => $admin_sent,
        ), 201);
    }

    public static function saved_products(WP_REST_Request $request): WP_REST_Response {
        $user_id = self::authenticated_user_id($request);
        if (!$user_id) return self::error('Authentication required.', 401, 'unauthenticated');
        $ids = get_user_meta($user_id, 'engineerparts_saved_products', true);
        return self::success(array('productIds' => is_array($ids) ? array_values(array_map('intval', $ids)) : array()));
    }

    public static function toggle_saved_product(WP_REST_Request $request): WP_REST_Response {
        $user_id = self::authenticated_user_id($request);
        if (!$user_id) return self::error('Authentication required.', 401, 'unauthenticated');
        $data = self::json($request);
        $product_id = absint($data['productId'] ?? 0);
        $product = $product_id ? wc_get_product($product_id) : false;
        if (!$product || $product->get_status() !== 'publish') return self::error('Product not found.', 404, 'not_found');
        $ids = get_user_meta($user_id, 'engineerparts_saved_products', true);
        $ids = is_array($ids) ? array_values(array_unique(array_map('intval', $ids))) : array();
        $saved = !in_array($product_id, $ids, true);
        if ($saved) $ids[] = $product_id;
        else $ids = array_values(array_diff($ids, array($product_id)));
        update_user_meta($user_id, 'engineerparts_saved_products', array_slice($ids, -100));
        return self::success(array('saved' => $saved, 'productIds' => $ids));
    }

    public static function purge_sessions(): void {
        global $wpdb;
        $wpdb->query($wpdb->prepare('DELETE FROM ' . self::session_table() . ' WHERE expires_at < %s', current_time('mysql', true)));
        self::purge_logs();
    }

    /**
     * Stores a batch of application log entries sent by the Next.js server logger.
     * Body: { entries: [{ level, event, source, timestamp, context }], dropped?: int }.
     */
    public static function store_logs(WP_REST_Request $request): WP_REST_Response {
        global $wpdb;
        $data = self::json($request);
        $entries = is_array($data['entries'] ?? null) ? array_slice($data['entries'], 0, 50) : array();
        $dropped = max(0, (int) ($data['dropped'] ?? 0));
        $now = current_time('mysql', true);

        $rows = array();
        foreach ($entries as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            $level = in_array($entry['level'] ?? '', array('debug', 'info', 'warn', 'error'), true) ? $entry['level'] : '';
            $event = substr(preg_replace('/[^A-Za-z0-9_.:\-]/', '_', (string) ($entry['event'] ?? '')), 0, 191);
            if ($level === '' || $event === '') {
                continue;
            }
            $timestamp = is_string($entry['timestamp'] ?? null) ? strtotime($entry['timestamp']) : false;
            $context = wp_json_encode(is_array($entry['context'] ?? null) ? $entry['context'] : new stdClass());
            $rows[] = array(
                $level,
                $event,
                ($entry['source'] ?? '') === 'client' ? 'client' : 'server',
                substr($context === false ? '{}' : $context, 0, 20000),
                $timestamp ? gmdate('Y-m-d H:i:s', $timestamp) : $now,
                $now,
            );
        }
        if ($dropped > 0) {
            $rows[] = array('warn', 'log_entries_dropped', 'server', wp_json_encode(array('count' => $dropped)), $now, $now);
        }
        if (!$rows) {
            return self::error('No valid log entries.', 400, 'invalid_log_entries');
        }

        $placeholders = array();
        $values = array();
        foreach ($rows as $row) {
            $placeholders[] = '(%s, %s, %s, %s, %s, %s)';
            array_push($values, ...$row);
        }
        $saved = $wpdb->query($wpdb->prepare(
            'INSERT INTO ' . self::logs_table() . ' (level, event, source, context, logged_at, created_at) VALUES ' . implode(', ', $placeholders),
            $values
        ));
        if ($saved === false) {
            error_log(wp_json_encode(array(
                'timestamp' => gmdate(DATE_ATOM),
                'endpoint' => 'logs',
                'category' => 'log_save_failed',
                'databaseError' => $wpdb->last_error,
            )));
            return self::error('Unable to store log entries.', 502, 'log_save_failed');
        }
        return self::success(array('stored' => count($rows)), 201);
    }

    /** Deletes log entries older than the retention window (default 30 days). */
    private static function purge_logs(): void {
        global $wpdb;
        $days = max(1, (int) apply_filters('engineerparts_log_retention_days', 30));
        $cutoff = gmdate('Y-m-d H:i:s', time() - $days * DAY_IN_SECONDS);
        // Delete in chunks so a large backlog does not lock the table for long.
        for ($i = 0; $i < 20; $i++) {
            $deleted = $wpdb->query($wpdb->prepare(
                'DELETE FROM ' . self::logs_table() . ' WHERE logged_at < %s LIMIT 5000',
                $cutoff
            ));
            if (!$deleted) {
                break;
            }
        }
    }

    private static function authenticated_user_id(WP_REST_Request $request): int {
        $token = self::session_token($request);
        if (!$token) {
            return 0;
        }

        global $wpdb;
        $row = $wpdb->get_row($wpdb->prepare(
            'SELECT user_id, expires_at FROM ' . self::session_table() . ' WHERE token_hash = %s LIMIT 1',
            hash('sha256', $token)
        ));
        if (!$row || strtotime($row->expires_at . ' UTC') <= time()) {
            return 0;
        }

        $wpdb->update(
            self::session_table(),
            array('last_seen_at' => current_time('mysql', true)),
            array('token_hash' => hash('sha256', $token)),
            array('%s'),
            array('%s')
        );
        return (int) $row->user_id;
    }

    private static function create_session(int $user_id, bool $remember): ?array {
        global $wpdb;
        $token = bin2hex(random_bytes(32));
        $expires = time() + ($remember ? 30 * DAY_IN_SECONDS : DAY_IN_SECONDS);
        $created = current_time('mysql', true);
        $inserted = $wpdb->insert(self::session_table(), array(
            'user_id' => $user_id,
            'token_hash' => hash('sha256', $token),
            'expires_at' => gmdate('Y-m-d H:i:s', $expires),
            'created_at' => $created,
            'last_seen_at' => $created,
        ), array('%d', '%s', '%s', '%s', '%s'));

        return $inserted ? array('token' => $token, 'expiresAt' => gmdate(DATE_ATOM, $expires)) : null;
    }

    private static function revoke_user_sessions(int $user_id): void {
        global $wpdb;
        $wpdb->delete(self::session_table(), array('user_id' => $user_id), array('%d'));
    }

    private static function customer_payload(int $user_id, bool $include_account = false): array {
        $user = get_userdata($user_id);
        $customer = class_exists('WC_Customer') ? new WC_Customer($user_id) : null;
        $payload = array(
            'id' => $user_id,
            'firstName' => $customer ? $customer->get_first_name() : $user->first_name,
            'lastName' => $customer ? $customer->get_last_name() : $user->last_name,
            'displayName' => $user->display_name,
            'email' => $user->user_email,
            'phone' => $customer ? $customer->get_billing_phone() : '',
            'company' => $customer ? $customer->get_billing_company() : '',
            'emailVerified' => get_user_meta($user_id, self::VERIFIED_META, true) === '1',
        );
        if ($include_account && $customer) {
            $payload['jobTitle'] = (string) get_user_meta($user_id, 'engineerparts_job_title', true);
            $payload['department'] = (string) get_user_meta($user_id, 'engineerparts_department', true);
            $payload['vatNumber'] = (string) get_user_meta($user_id, 'engineerparts_vat_trn', true);
            $payload['companyWebsite'] = (string) get_user_meta($user_id, 'engineerparts_company_website', true);
            $payload['customerType'] = (string) get_user_meta($user_id, 'engineerparts_customer_type', true);
            $payload['billingAddress'] = self::customer_address($customer, 'billing');
            $payload['shippingAddress'] = self::customer_address($customer, 'shipping');
            global $wpdb;
            $payload['activeSessionCount'] = (int) $wpdb->get_var($wpdb->prepare(
                'SELECT COUNT(*) FROM ' . self::session_table() . ' WHERE user_id = %d AND expires_at > %s',
                $user_id,
                current_time('mysql', true)
            ));
        }
        return $payload;
    }

    private static function woocommerce_email_verified(int $user_id): bool {
        global $wpdb;
        $user = get_userdata($user_id);
        $meta_key = '_wc_email_verified_' . rtrim($wpdb->get_blog_prefix(get_current_blog_id()), '_');
        $verified_email = strtolower((string) get_user_meta($user_id, $meta_key, true));
        return $user instanceof WP_User && $verified_email !== '' &&
            hash_equals(strtolower($user->user_email), $verified_email);
    }

    private static function customer_address(WC_Customer $customer, string $type): array {
        $get = static fn(string $field): string => (string) $customer->{"get_{$type}_{$field}"}();
        return array(
            'firstName' => $get('first_name'), 'lastName' => $get('last_name'), 'company' => $get('company'),
            'address1' => $get('address_1'), 'address2' => $get('address_2'), 'city' => $get('city'),
            'state' => $get('state'), 'postalCode' => $get('postcode'), 'country' => $get('country'),
            'email' => $type === 'billing' ? $get('email') : '', 'phone' => $type === 'billing' ? $get('phone') : '',
        );
    }

    private static function valid_address(array $address, bool $billing): bool {
        $required = array('firstName', 'lastName', 'address1', 'city', 'country');
        if ($billing) { $required[] = 'email'; $required[] = 'phone'; }
        foreach ($required as $field) {
            if (empty(trim((string) ($address[$field] ?? '')))) return false;
        }
        return preg_match('/^[A-Z]{2}$/', strtoupper((string) $address['country'])) === 1;
    }

    private static function set_customer_address(WC_Customer $customer, string $type, array $address): void {
        $fields = array(
            'first_name' => 'firstName', 'last_name' => 'lastName', 'company' => 'company',
            'address_1' => 'address1', 'address_2' => 'address2', 'city' => 'city',
            'state' => 'state', 'postcode' => 'postalCode', 'country' => 'country',
        );
        foreach ($fields as $woo => $input) {
            $value = sanitize_text_field($address[$input] ?? '');
            $customer->{"set_{$type}_{$woo}"}($woo === 'country' ? strtoupper($value) : $value);
        }
        if ($type === 'billing') {
            $customer->set_billing_email(sanitize_email($address['email'] ?? ''));
            $customer->set_billing_phone(sanitize_text_field($address['phone'] ?? ''));
        }
    }

    public static function order_summary($order): array {
        return array(
            'id' => $order->get_id(), 'number' => $order->get_order_number(),
            'date' => $order->get_date_created() ? $order->get_date_created()->date(DATE_ATOM) : '',
            'status' => $order->get_status(), 'total' => (float) $order->get_total(), 'currency' => $order->get_currency(),
            'paymentStatus' => $order->get_payment_method() === 'cod' && $order->has_status(array('processing', 'on-hold'))
                ? 'pay-on-delivery'
                : ($order->is_paid() ? 'paid' : ($order->needs_payment() ? 'unpaid' : 'not-required')),
            'itemCount' => $order->get_item_count(), 'canPay' => $order->needs_payment(), 'canReorder' => $order->has_status('completed'),
        );
    }

    private static function order_detail($order): array {
        $payload = self::order_summary($order);
        $payload['paymentMethod'] = $order->get_payment_method_title();
        $payload['paymentUrl'] = $order->needs_payment()
            ? self::payment_handoff_url($order)
            : '';
        $payload['transactionReference'] = $order->get_transaction_id();
        $payload['customerNote'] = $order->get_customer_note();
        $payload['subtotal'] = (float) $order->get_subtotal();
        $payload['tax'] = (float) $order->get_total_tax();
        $payload['shipping'] = (float) $order->get_shipping_total();
        $payload['billingAddress'] = self::order_address($order, 'billing');
        $payload['shippingAddress'] = self::order_address($order, 'shipping');
        $payload['items'] = array_values(array_map(static function ($item): array {
            $quantity = max(1, (int) $item->get_quantity());
            return array(
                'productId' => $item->get_product_id(), 'name' => $item->get_name(), 'quantity' => $quantity,
                'unitPrice' => (float) $item->get_subtotal() / $quantity,
                'subtotal' => (float) $item->get_subtotal(), 'total' => (float) $item->get_total(),
            );
        }, $order->get_items()));
        return $payload;
    }

    private static function order_address($order, string $type): array {
        $get = static fn(string $field): string => (string) $order->{"get_{$type}_{$field}"}();
        return array(
            'firstName' => $get('first_name'), 'lastName' => $get('last_name'), 'company' => $get('company'),
            'address1' => $get('address_1'), 'address2' => $get('address_2'), 'city' => $get('city'),
            'state' => $get('state'), 'postalCode' => $get('postcode'), 'country' => $get('country'),
            'email' => $type === 'billing' ? $get('email') : '', 'phone' => $type === 'billing' ? $get('phone') : '',
        );
    }

    public static function enquiry_payload(array $row): array {
        return array(
            'reference' => (string) $row['enquiry_reference'],
            'date' => (string) $row['created_at'],
            'productId' => (int) $row['product_id'],
            'productName' => (string) $row['product_name'],
            'sku' => (string) $row['sku'],
            'partNumber' => (string) $row['part_number'],
            'lotId' => (string) $row['lot_id'],
            'equipmentId' => (string) $row['equipment_id'],
            'listingUrl' => (string) $row['listing_url'],
            'quantity' => (int) $row['requested_quantity'],
            'budget' => (string) $row['budget'],
            'message' => (string) $row['message'],
            'status' => (string) $row['status'],
        );
    }

    public static function woocommerce_email_styles(string $css, $email): string {
        return $css . '
            #wrapper { background-color: #f4f4f5 !important; }
            #template_header { background-color: #0a0a0a !important; border-top: 4px solid #dc2626 !important; }
            #template_header h1 { color: #ffffff !important; }
            #body_content { background-color: #ffffff !important; }
            #body_content table td a { color: #dc2626; }
            #body_content table td a.button,
            #body_content table td a.button:hover { background-color: #dc2626 !important; border-color: #dc2626 !important; color: #ffffff !important; }
            #template_footer { color: #71717a !important; }
        ';
    }

    private static function customer_url(string $url, $order = null): string {
        $parts = wp_parse_url(html_entity_decode($url, ENT_QUOTES, 'UTF-8'));
        $hosts = array_map('strtolower', array_unique(array_filter(array(
            wp_parse_url(home_url(), PHP_URL_HOST),
            wp_parse_url(site_url(), PHP_URL_HOST),
            'shop.engineerparts.com',
        ))));
        if (!is_array($parts) || !in_array(strtolower($parts['host'] ?? ''), $hosts, true)) return $url;
        $path = $parts['path'] ?? '/';
        parse_str($parts['query'] ?? '', $query);
        $base = self::frontend_url();
        if (!empty($query['key']) && (!empty($query['login']) || !empty($query['id']))) {
            $user = !empty($query['id']) ? get_userdata((int) $query['id']) : null;
            $login = $user ? $user->user_login : ($query['login'] ?? '');
            if ($login !== '') return add_query_arg(array('key' => rawurlencode($query['key']), 'login' => rawurlencode($login)), $base . '/reset-password');
        }
        if (str_contains($path, 'lost-password') || ($query['action'] ?? '') === 'lostpassword') return $base . '/forgot-password';
        if ($order instanceof WC_Order && (str_contains($path, 'order-pay') || ($query['action'] ?? '') === 'engineerparts_payment_handoff')) {
            return add_query_arg(array('order_id' => $order->get_id(), 'order_key' => rawurlencode($order->get_order_key())), $base . '/checkout/pay');
        }
        if ($order instanceof WC_Order && (str_contains($path, 'checkout') || str_contains($path, 'view-order'))) return self::order_received_url('', $order);
        if ($order instanceof WC_Order && isset($query['download_file'])) return $base . '/account/orders/' . $order->get_id();
        if (preg_match('~/(?:view-order|order-pay|order-received)/(\d+)~', $path, $match)) return $base . '/account/orders/' . $match[1];
        if (str_contains($path, 'my-account') || str_contains($path, 'wp-login')) return $base . '/account';
        if (preg_match('~/product/([^/]+)~', $path, $match)) return $base . '/product/' . $match[1];
        if (str_contains($path, 'checkout')) return $base . '/checkout';
        if (str_contains($path, 'cart')) return $base . '/cart';
        if (str_contains($path, 'shop') || str_contains($path, 'product-category')) return $base . '/clearance';
        return $base;
    }

    private static function customer_email_content(string $content, $order = null): string {
        $content = preg_replace_callback(
            '~(?:https?:)?//[^\s<>"\')]+~i',
            static fn(array $match): string => self::customer_url($match[0], $order),
            $content
        );
        $content = str_ireplace('shop.engineerparts.com', (string) wp_parse_url(self::frontend_url(), PHP_URL_HOST), $content);
        return str_ireplace(array('WordPress', 'WooCommerce'), 'EngineerParts', $content);
    }

    public static function customer_email_params(array $params, $email): array {
        if (!$email->is_customer_email()) return $params;
        $order = $email->object instanceof WC_Order ? $email->object : null;
        $message = (string) $params[2];
        if ($email->get_email_type() !== 'plain') {
            if (class_exists('DOMDocument') && method_exists('DOMDocument', 'loadHTML')) {
                $document = new DOMDocument();
                $previous = libxml_use_internal_errors(true);
                try {
                    $document->loadHTML('<?xml encoding="UTF-8">' . $message);
                    foreach (iterator_to_array($document->getElementsByTagName('img')) as $image) {
                        $src = $image->getAttribute('src');
                        if (self::customer_url($src) !== $src) $image->parentNode->removeChild($image);
                    }
                    $body = (new DOMXPath($document))->query('//*[@id="body_content_inner"]')->item(0);
                    if ($body) {
                        $message = '';
                        foreach ($body->childNodes as $child) $message .= $document->saveHTML($child);
                    } else {
                        error_log('EngineerParts: customer email body container missing; preserving original email content.');
                        $message = preg_replace('~</?(?:html|head|body)[^>]*>|<!doctype[^>]*>~i', '', $message);
                    }
                } finally {
                    libxml_clear_errors();
                    libxml_use_internal_errors($previous);
                }
            } else {
                error_log('EngineerParts: enable PHP DOM/XML for formatted customer emails; sending branded text content.');
                $message = preg_replace('~<a\b[^>]*href=(["\'])(.*?)\1[^>]*>(.*?)</a>~is', '$3 ($2)', $message);
                $message = self::customer_email_content($message, $order);
                $message = nl2br(esc_html(strip_tags(preg_replace('~</(?:p|div|tr|td|h[1-6])>~i', "\n", $message))));
            }
            $message = self::email_template($email->get_heading(), '', $message);
        }
        $params[1] = self::customer_email_content((string) $params[1], $order);
        $params[2] = self::customer_email_content($message, $order);
        global $phpmailer;
        if (is_object($phpmailer) && isset($phpmailer->AltBody)) {
            $phpmailer->AltBody = self::customer_email_content((string) $phpmailer->AltBody, $order);
        }
        return $params;
    }

    private static function is_customer_user($user): bool {
        return $user && in_array('customer', (array) $user->roles, true) &&
            !array_intersect(array('administrator', 'shop_manager'), (array) $user->roles);
    }

    public static function customer_reset_email(array $email, string $key, string $login, $user): array {
        if (!self::is_customer_user($user)) return $email;
        $url = add_query_arg(array('key' => rawurlencode($key), 'login' => rawurlencode($login)), self::frontend_url() . '/reset-password');
        $email['subject'] = 'Reset your EngineerParts password';
        $email['message'] = self::email_template('Reset your password', 'We received a request to reset your EngineerParts password.', '<p>If you did not request this change, you can ignore this email.</p>', 'Reset password', $url);
        $email['headers'] = array('Content-Type: text/html; charset=UTF-8');
        return $email;
    }

    public static function customer_core_email(array $email, $user, $unused = null): array {
        $user = is_array($user) ? get_userdata((int) ($user['ID'] ?? 0)) : $user;
        if (!self::is_customer_user($user)) return $email;
        $email['subject'] = self::customer_email_content((string) $email['subject']);
        $message = str_replace(array('###SITENAME###', '###SITEURL###'), array('EngineerParts', self::frontend_url()), (string) $email['message']);
        $email['message'] = self::email_template('Your EngineerParts account', '', nl2br(esc_html(self::customer_email_content($message))));
        $email['headers'] = array('Content-Type: text/html; charset=UTF-8');
        return $email;
    }

    public static function customer_page_destination(): ?string {
        if (is_admin() || wp_doing_ajax() || wp_doing_cron() || (defined('REST_REQUEST') && REST_REQUEST) ||
            !in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', array('GET', 'HEAD'), true) ||
            isset($_GET['wc-api']) || isset($_GET['wc-ajax']) || isset($_GET['add-to-cart']) ||
            is_wc_endpoint_url('order-pay')) return null;
        if (is_wc_endpoint_url('order-received')) {
            $order = wc_get_order((int) get_query_var('order-received'));
            if ($order && hash_equals($order->get_order_key(), (string) ($_GET['key'] ?? ''))) return self::order_received_url('', $order);
            return self::frontend_url() . '/account/orders';
        }
        if (is_account_page()) {
            if (is_wc_endpoint_url('lost-password')) {
                return self::customer_url(add_query_arg(array_map('sanitize_text_field', wp_unslash($_GET)), home_url('/my-account/lost-password/')));
            }
            return self::frontend_url() . '/account';
        }
        if (is_cart()) return self::frontend_url() . '/cart';
        if (is_checkout()) return self::frontend_url() . '/checkout';
        if (is_shop() || is_product_taxonomy()) return self::frontend_url() . '/clearance';
        if (is_product()) return self::frontend_url() . '/product/' . get_post_field('post_name', get_queried_object_id());
        if (is_front_page() || is_home()) return self::frontend_url();
        return null;
    }

    public static function redirect_customer_pages(): void {
        if (!function_exists('is_shop')) return;
        $url = self::customer_page_destination();
        if ($url) {
            wp_redirect($url, 302, 'EngineerParts');
            exit;
        }
    }

    private static function send_branded_email(
        string $to,
        string $subject,
        string $title,
        string $intro,
        string $body_html,
        ?string $button_label = null,
        ?string $button_url = null,
        array $headers = array()
    ): bool {
        $headers[] = 'Content-Type: text/html; charset=UTF-8';
        return wp_mail(
            $to,
            $subject,
            self::customer_email_content(self::email_template($title, $intro, $body_html, $button_label, $button_url)),
            $headers
        );
    }

    private static function email_template(
        string $title,
        string $intro,
        string $body_html,
        ?string $button_label = null,
        ?string $button_url = null
    ): string {
        $site_url = esc_url(self::frontend_url());
        $action_html = '';
        if ($button_label && $button_url) {
            $safe_url = esc_url($button_url);
            $action_html =
                '<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0 12px;">' .
                    '<tr><td bgcolor="#dc2626" style="border-radius:4px;">' .
                        '<a href="' . $safe_url . '" style="display:inline-block;padding:13px 20px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">' . esc_html($button_label) . '</a>' .
                    '</td></tr>' .
                '</table>' .
                '<p style="margin:0;color:#71717a;font-size:12px;line-height:1.6;word-break:break-word;">If the button does not work, copy and paste this link into your browser:<br>' .
                    '<a href="' . $safe_url . '" style="color:#dc2626;">' . esc_html($button_url) . '</a>' .
                '</p>';
        }

        return
            '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' .
            '<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">' .
                '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' . esc_html($intro) . '</div>' .
                '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f4f4f5" style="width:100%;background-color:#f4f4f5;">' .
                    '<tr><td align="center" style="padding:32px 16px;">' .
                        '<table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">' .
                            '<tr><td height="4" bgcolor="#dc2626" style="height:4px;background-color:#dc2626;font-size:0;line-height:0;">&nbsp;</td></tr>' .
                            '<tr><td bgcolor="#0a0a0a" style="padding:22px 28px;background-color:#0a0a0a;">' .
                                '<a href="' . $site_url . '" style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.4px;text-decoration:none;">Engineer<span style="color:#ef4444;">Parts</span></a>' .
                            '</td></tr>' .
                            '<tr><td style="padding:32px 28px 28px;">' .
                                '<h1 style="margin:0 0 12px;color:#0a0a0a;font-size:24px;line-height:1.3;">' . esc_html($title) . '</h1>' .
                                '<p style="margin:0 0 22px;color:#52525b;font-size:14px;line-height:1.7;">' . esc_html($intro) . '</p>' .
                                $body_html . $action_html .
                            '</td></tr>' .
                            '<tr><td bgcolor="#f6f6f6" style="padding:18px 28px;background-color:#f6f6f6;border-top:1px solid #e4e4e7;color:#71717a;font-size:12px;line-height:1.6;">' .
                                'This is an automated message from <a href="' . $site_url . '" style="color:#dc2626;text-decoration:none;">EngineerParts.com</a>. For your security, never share passwords or account verification links.' .
                            '</td></tr>' .
                        '</table>' .
                        '<p style="margin:16px 0 0;color:#a1a1aa;font-size:11px;">&copy; ' . esc_html(gmdate('Y')) . ' EngineerParts</p>' .
                    '</td></tr>' .
                '</table>' .
            '</body></html>';
    }

    private static function email_details_table(array $items): string {
        $rows = '';
        foreach ($items as $label => $raw_value) {
            $value = trim((string) $raw_value);
            if ($value === '') {
                continue;
            }
            $rows .= '<tr><td valign="top" style="width:34%;padding:10px 12px;border-bottom:1px solid #e4e4e7;color:#52525b;font-size:13px;font-weight:700;">' . esc_html((string) $label) . '</td><td valign="top" style="padding:10px 12px;border-bottom:1px solid #e4e4e7;color:#27272a;font-size:13px;line-height:1.6;word-break:break-word;">' . nl2br(esc_html($value)) . '</td></tr>';
        }
        return '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border:1px solid #e4e4e7;border-collapse:collapse;">' . $rows . '</table>';
    }

    private static function send_verification(int $user_id, string $email): void {
        $token = bin2hex(random_bytes(32));
        update_user_meta($user_id, self::VERIFY_HASH_META, hash('sha256', $token));
        update_user_meta($user_id, self::VERIFY_EXPIRES_META, (string) (time() + DAY_IN_SECONDS));
        $url = add_query_arg(array('token' => $token, 'email' => rawurlencode($email)), self::frontend_url() . '/verify-email');
        self::send_branded_email(
            $email,
            'Verify your EngineerParts account',
            'Verify your email address',
            'Welcome to EngineerParts. Confirm your email address to finish setting up your account.',
            '<p style="margin:0;color:#52525b;font-size:14px;line-height:1.6;">For your security, this verification link expires in 24 hours.</p>',
            'Verify email address',
            $url
        );
    }

    private static function save_business_meta(int $user_id, array $data): void {
        $fields = array(
            'jobTitle' => 'engineerparts_job_title',
            'department' => 'engineerparts_department',
            'vatNumber' => 'engineerparts_vat_trn',
        );
        foreach ($fields as $input => $meta_key) {
            update_user_meta($user_id, $meta_key, sanitize_text_field($data[$input] ?? ''));
        }
        update_user_meta($user_id, 'engineerparts_company_website', esc_url_raw($data['companyWebsite'] ?? ''));
        $type = sanitize_text_field($data['customerType'] ?? '');
        update_user_meta($user_id, 'engineerparts_customer_type', in_array($type, self::CUSTOMER_TYPES, true) ? $type : '');
    }

    private static function valid_password(string $password): bool {
        return strlen($password) >= 8 && preg_match('/[A-Za-z]/', $password) && preg_match('/\d/', $password);
    }

    private static function rate_limit(string $scope, string $identifier, int $limit, int $window): bool {
        $key = 'ep_' . substr(hash_hmac('sha256', $scope . '|' . $identifier, wp_salt('auth')), 0, 40);
        $count = (int) get_transient($key);
        if ($count >= $limit) {
            return false;
        }
        set_transient($key, $count + 1, $window);
        return true;
    }

    private static function client_identifier(WP_REST_Request $request): string {
        $forwarded = sanitize_text_field($request->get_header('x-engineerparts-client-ip'));
        if ($forwarded && filter_var($forwarded, FILTER_VALIDATE_IP)) {
            return $forwarded;
        }
        $remote = sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? '');
        return filter_var($remote, FILTER_VALIDATE_IP) ? $remote : 'unknown';
    }

    private static function session_token(WP_REST_Request $request): string {
        return sanitize_text_field($request->get_header('x-engineerparts-session'));
    }

    private static function frontend_url(): string {
        $url = defined('ENGINEERPARTS_FRONTEND_URL') ? (string) ENGINEERPARTS_FRONTEND_URL : 'https://engineerparts.com';
        return untrailingslashit(esc_url_raw($url));
    }

    private static function session_table(): string {
        global $wpdb;
        return $wpdb->prefix . 'engineerparts_sessions';
    }

    private static function enquiries_table(): string {
        global $wpdb;
        return $wpdb->prefix . 'engineerparts_enquiries';
    }

    private static function contacts_table(): string {
        global $wpdb;
        return $wpdb->prefix . 'engineerparts_contacts';
    }

    private static function clearance_alerts_table(): string {
        global $wpdb;
        return $wpdb->prefix . 'engineerparts_clearance_alerts';
    }

    private static function logs_table(): string {
        global $wpdb;
        return $wpdb->prefix . 'engineerparts_logs';
    }

    private static function verify_turnstile(string $token): ?WP_REST_Response {
        $secret = defined('ENGINEERPARTS_TURNSTILE_SECRET') ? trim((string) ENGINEERPARTS_TURNSTILE_SECRET) : '';
        if ($secret === '') {
            return self::error('Account registration verification is not configured.', 503);
        }
        if ($token === '' || strlen($token) > 4096) {
            return self::error('Please complete the CAPTCHA verification and try again.', 422, 'captcha_required');
        }

        $response = wp_remote_post('https://challenges.cloudflare.com/turnstile/v0/siteverify', array(
            'timeout' => 8,
            'body' => array(
                'secret' => $secret,
                'response' => $token,
            ),
        ));
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) < 200 || wp_remote_retrieve_response_code($response) >= 300) {
            return self::error('Unable to verify CAPTCHA right now. Please try again.', 503);
        }

        $result = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($result) || empty($result['success'])) {
            return self::error('CAPTCHA verification failed. Please try again.', 422, 'captcha_failed');
        }
        return null;
    }

    private static function json(WP_REST_Request $request): array {
        $data = $request->get_json_params();
        return is_array($data) ? $data : array();
    }

    private static function success(array $data, int $status = 200): WP_REST_Response {
        return new WP_REST_Response(array_merge(array('ok' => true), $data), $status);
    }

    private static function error(string $message, int $status, string $code = 'request_failed'): WP_REST_Response {
        return new WP_REST_Response(array('ok' => false, 'error' => $message, 'code' => $code), $status);
    }

    private static function log_failure(string $endpoint, string $category, WP_Error $error): void {
        error_log(wp_json_encode(array(
            'timestamp' => gmdate(DATE_ATOM),
            'endpoint' => $endpoint,
            'category' => $category,
            'wordpressCode' => $error->get_error_code(),
        )));
    }
}

register_activation_hook(__FILE__, array(EngineerParts_Customer_Accounts::class, 'activate'));
register_deactivation_hook(__FILE__, array(EngineerParts_Customer_Accounts::class, 'deactivate'));
EngineerParts_Customer_Accounts::boot();