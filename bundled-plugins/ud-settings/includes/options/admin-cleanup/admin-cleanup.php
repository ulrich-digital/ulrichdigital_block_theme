<?php
/**
 * Option: Admin-Oberfläche aufräumen.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'UD_SETTINGS_OPTION_ADMIN_CLEANUP', 'ud_settings_admin_cleanup' );

/**
 * Gibt die Standardwerte für die Admin-Aufräum-Einstellungen zurück.
 *
 * @return array
 */
function ud_settings_admin_cleanup_get_default_settings() {
	return array(
		'removeWpLogo'         => true,
		'removeNewContent'     => true,
		'removeArchive'        => true,
		'hideDashboardWidgets' => true,
	);
}

/**
 * Gibt die gespeicherten Admin-Aufräum-Einstellungen zurück.
 *
 * @return array
 */
function ud_settings_admin_cleanup_get_settings() {
	$settings = get_option( UD_SETTINGS_OPTION_ADMIN_CLEANUP, array() );

	if ( ! is_array( $settings ) ) {
		$settings = array();
	}

	return array_merge(
		ud_settings_admin_cleanup_get_default_settings(),
		$settings
	);
}

/**
 * Bereinigt die Admin-Aufräum-Einstellungen.
 *
 * @param mixed $settings Einstellungen.
 *
 * @return array
 */
function ud_settings_admin_cleanup_sanitize_settings( $settings ) {
	if ( ! is_array( $settings ) ) {
		$settings = array();
	}

	$defaults = ud_settings_admin_cleanup_get_default_settings();
	$sanitized_settings = array();

	foreach ( $defaults as $key => $default_value ) {
		$sanitized_settings[ $key ] = ! empty( $settings[ $key ] );
	}

	return $sanitized_settings;
}

/**
 * Registriert die REST-Routen für diese Option.
 */
function ud_settings_admin_cleanup_register_rest_routes() {
	register_rest_route(
		'ud-settings/v1',
		'/admin-cleanup',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'ud_settings_admin_cleanup_rest_get_data',
			'permission_callback' => 'ud_settings_admin_cleanup_rest_permissions',
		)
	);

	register_rest_route(
		'ud-settings/v1',
		'/admin-cleanup',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'ud_settings_admin_cleanup_rest_update_data',
			'permission_callback' => 'ud_settings_admin_cleanup_rest_permissions',
			'args'                => array(
				'settings' => array(
					'type'     => 'object',
					'required' => true,
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'ud_settings_admin_cleanup_register_rest_routes' );

/**
 * Prüft REST-Berechtigungen.
 *
 * @return bool
 */
function ud_settings_admin_cleanup_rest_permissions() {
	return current_user_can( 'manage_options' );
}

/**
 * Gibt die gespeicherte Einstellung zurück.
 *
 * @return WP_REST_Response
 */
function ud_settings_admin_cleanup_rest_get_data() {
	return rest_ensure_response(
		array(
			'settings' => ud_settings_admin_cleanup_get_settings(),
		)
	);
}

/**
 * Speichert die Einstellung.
 *
 * @param WP_REST_Request $request REST Request.
 *
 * @return WP_REST_Response
 */
function ud_settings_admin_cleanup_rest_update_data( WP_REST_Request $request ) {
	$settings = $request->get_param( 'settings' );
	$settings = ud_settings_admin_cleanup_sanitize_settings( $settings );

	update_option( UD_SETTINGS_OPTION_ADMIN_CLEANUP, $settings );

	return rest_ensure_response(
		array(
			'success'  => true,
			'settings' => $settings,
		)
	);
}

/**
 * Entfernt Einträge aus der Admin-Bar.
 *
 * @param WP_Admin_Bar $wp_admin_bar Admin-Bar-Instanz.
 */
function ud_settings_admin_cleanup_admin_bar( $wp_admin_bar ) {
	$settings = ud_settings_admin_cleanup_get_settings();

	if ( ! empty( $settings['removeWpLogo'] ) ) {
		$wp_admin_bar->remove_node( 'wp-logo' );
	}

	if ( ! empty( $settings['removeNewContent'] ) ) {
		$wp_admin_bar->remove_node( 'new-content' );
	}

	if ( ! empty( $settings['removeArchive'] ) ) {
		$wp_admin_bar->remove_node( 'archive' );
	}
}
add_action( 'admin_bar_menu', 'ud_settings_admin_cleanup_admin_bar', 999 );

/**
 * Blendet Dashboard-Boxen standardmässig aus.
 *
 * @param array     $hidden Ausgeblendete Meta-Boxen.
 * @param WP_Screen $screen Aktueller Screen.
 *
 * @return array
 */
function ud_settings_admin_cleanup_default_hidden_meta_boxes( $hidden, $screen ) {
	$settings = ud_settings_admin_cleanup_get_settings();

	if ( empty( $settings['hideDashboardWidgets'] ) ) {
		return $hidden;
	}

	if ( 'dashboard' !== $screen->id ) {
		return $hidden;
	}

	return array_values(
		array_unique(
			array_merge(
				$hidden,
				array(
					'dashboard_site_health',
					'dashboard_right_now',
					'dashboard_activity',
					'dashboard_quick_press',
					'dashboard_primary',
					'dashboard_welcome',
				)
			)
		)
	);
}
add_filter( 'default_hidden_meta_boxes', 'ud_settings_admin_cleanup_default_hidden_meta_boxes', 10, 2 );

/**
 * Entfernt Dashboard-Boxen zusätzlich aktiv aus dem Dashboard.
 */
function ud_settings_admin_cleanup_remove_dashboard_widgets() {
	$settings = ud_settings_admin_cleanup_get_settings();

	if ( empty( $settings['hideDashboardWidgets'] ) ) {
		return;
	}

	remove_meta_box( 'dashboard_site_health', 'dashboard', 'normal' );
	remove_meta_box( 'dashboard_right_now', 'dashboard', 'normal' );
	remove_meta_box( 'dashboard_activity', 'dashboard', 'normal' );
	remove_meta_box( 'dashboard_quick_press', 'dashboard', 'side' );
	remove_meta_box( 'dashboard_primary', 'dashboard', 'side' );
	remove_action( 'welcome_panel', 'wp_welcome_panel' );
}
add_action( 'wp_dashboard_setup', 'ud_settings_admin_cleanup_remove_dashboard_widgets', 999 );