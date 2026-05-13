<?php
/**
 * Option: Kommentar-Funktion deaktivieren.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'UD_SETTINGS_OPTION_DISABLE_COMMENTS', 'ud_settings_disable_comments' );
/**
 * Gibt den Standardwert für die Kommentar-Einstellung zurück.
 *
 * @return bool
 */
function ud_settings_comments_get_default_value() {
	return true;
}

/**
 * Registriert die REST-Routen für diese Option.
 */
function ud_settings_comments_register_rest_routes() {
	register_rest_route(
		'ud-settings/v1',
		'/comments',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'ud_settings_comments_rest_get_data',
			'permission_callback' => 'ud_settings_comments_rest_permissions',
		)
	);

	register_rest_route(
		'ud-settings/v1',
		'/comments',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'ud_settings_comments_rest_update_data',
			'permission_callback' => 'ud_settings_comments_rest_permissions',
			'args'                => array(
				'disableComments' => array(
					'type'     => 'boolean',
					'required' => true,
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'ud_settings_comments_register_rest_routes' );

/**
 * Prüft REST-Berechtigungen.
 *
 * @return bool
 */
function ud_settings_comments_rest_permissions() {
	return current_user_can( 'manage_options' );
}

/**
 * Gibt die gespeicherte Kommentar-Einstellung zurück.
 *
 * @return WP_REST_Response
 */
function ud_settings_comments_rest_get_data() {
	return rest_ensure_response(
		array(
			'disableComments' => ud_settings_comments_are_disabled(),
		)
	);
}

/**
 * Speichert die Kommentar-Einstellung.
 *
 * @param WP_REST_Request $request REST Request.
 *
 * @return WP_REST_Response
 */
function ud_settings_comments_rest_update_data( WP_REST_Request $request ) {
	$disable_comments = (bool) $request->get_param( 'disableComments' );

	update_option( UD_SETTINGS_OPTION_DISABLE_COMMENTS, $disable_comments );

	return rest_ensure_response(
		array(
			'success'         => true,
			'disableComments' => $disable_comments,
		)
	);
}

/**
 * Prüft, ob Kommentare deaktiviert werden sollen.
 *
 * @return bool
 */
function ud_settings_comments_are_disabled() {
	return (bool) get_option(
		UD_SETTINGS_OPTION_DISABLE_COMMENTS,
		ud_settings_comments_get_default_value()
	);
}

/**
 * Verhindert den direkten Zugriff auf die Kommentar-Übersicht.
 */
function ud_settings_comments_redirect_comments_page() {
	if ( ! ud_settings_comments_are_disabled() ) {
		return;
	}

	global $pagenow;

	if ( 'edit-comments.php' === $pagenow ) {
		wp_safe_redirect( admin_url() );
		exit;
	}
}
add_action( 'admin_init', 'ud_settings_comments_redirect_comments_page' );

/**
 * Entfernt Kommentar- und Trackback-Unterstützung von allen Post Types.
 */
function ud_settings_comments_remove_post_type_support() {
	if ( ! ud_settings_comments_are_disabled() ) {
		return;
	}

	foreach ( get_post_types() as $post_type ) {
		if ( post_type_supports( $post_type, 'comments' ) ) {
			remove_post_type_support( $post_type, 'comments' );
		}

		if ( post_type_supports( $post_type, 'trackbacks' ) ) {
			remove_post_type_support( $post_type, 'trackbacks' );
		}
	}
}
add_action( 'admin_init', 'ud_settings_comments_remove_post_type_support' );

/**
 * Entfernt Kommentar-Metaboxen aus dem Dashboard.
 */
function ud_settings_comments_remove_dashboard_widgets() {
	if ( ! ud_settings_comments_are_disabled() ) {
		return;
	}

	remove_meta_box( 'dashboard_recent_comments', 'dashboard', 'normal' );
}
add_action( 'admin_init', 'ud_settings_comments_remove_dashboard_widgets' );

/**
 * Schliesst Kommentare im Frontend.
 *
 * @param bool $open Kommentarstatus.
 *
 * @return bool
 */
function ud_settings_comments_close_comments( $open ) {
	if ( ! ud_settings_comments_are_disabled() ) {
		return $open;
	}

	return false;
}
add_filter( 'comments_open', 'ud_settings_comments_close_comments', 20 );
add_filter( 'pings_open', 'ud_settings_comments_close_comments', 20 );

/**
 * Blendet bestehende Kommentare im Frontend aus.
 *
 * @param array $comments Kommentare.
 *
 * @return array
 */
function ud_settings_comments_hide_existing_comments( $comments ) {
	if ( ! ud_settings_comments_are_disabled() ) {
		return $comments;
	}

	return array();
}
add_filter( 'comments_array', 'ud_settings_comments_hide_existing_comments', 10 );

/**
 * Entfernt die Kommentar-Seite aus dem Admin-Menü.
 */
function ud_settings_comments_remove_admin_menu() {
	if ( ! ud_settings_comments_are_disabled() ) {
		return;
	}

	remove_menu_page( 'edit-comments.php' );
}
add_action( 'admin_menu', 'ud_settings_comments_remove_admin_menu' );

/**
 * Entfernt den Kommentar-Link aus der Admin-Bar.
 *
 * @param WP_Admin_Bar $wp_admin_bar Admin-Bar-Instanz.
 */
function ud_settings_comments_remove_admin_bar_menu( $wp_admin_bar ) {
	if ( ! ud_settings_comments_are_disabled() ) {
		return;
	}

	$wp_admin_bar->remove_node( 'comments' );
}
add_action( 'admin_bar_menu', 'ud_settings_comments_remove_admin_bar_menu', 999 );