<?php
/**
 * Option: Editor-Inserter vereinfachen.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'UD_SETTINGS_OPTION_EDITOR_INSERTER', 'ud_settings_editor_inserter' );

/**
 * Gibt die Standardwerte für den Editor-Inserter zurück.
 *
 * @return array
 */
function ud_settings_editor_inserter_get_default_settings() {
	return array(
		'onlyOwnPatterns'   => true,
		'onlyLocalMedia'    => true,
	);
}

/**
 * Gibt die gespeicherten Editor-Inserter-Einstellungen zurück.
 *
 * @return array
 */
function ud_settings_editor_inserter_get_settings() {
	$settings = get_option( UD_SETTINGS_OPTION_EDITOR_INSERTER, array() );

	if ( ! is_array( $settings ) ) {
		$settings = array();
	}

	return array_merge(
		ud_settings_editor_inserter_get_default_settings(),
		$settings
	);
}

/**
 * Bereinigt die Editor-Inserter-Einstellungen.
 *
 * @param mixed $settings Einstellungen.
 *
 * @return array
 */
function ud_settings_editor_inserter_sanitize_settings( $settings ) {
	if ( ! is_array( $settings ) ) {
		$settings = array();
	}

	return array(
		'onlyOwnPatterns' => ! empty( $settings['onlyOwnPatterns'] ),
		'onlyLocalMedia'  => ! empty( $settings['onlyLocalMedia'] ),
	);
}

/**
 * Registriert die REST-Routen für diese Option.
 */
function ud_settings_editor_inserter_register_rest_routes() {
	register_rest_route(
		'ud-settings/v1',
		'/editor-inserter',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'ud_settings_editor_inserter_rest_get_data',
			'permission_callback' => 'ud_settings_editor_inserter_rest_permissions',
		)
	);

	register_rest_route(
		'ud-settings/v1',
		'/editor-inserter',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'ud_settings_editor_inserter_rest_update_data',
			'permission_callback' => 'ud_settings_editor_inserter_rest_permissions',
			'args'                => array(
				'settings' => array(
					'type'     => 'object',
					'required' => true,
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'ud_settings_editor_inserter_register_rest_routes' );

/**
 * Prüft REST-Berechtigungen.
 *
 * @return bool
 */
function ud_settings_editor_inserter_rest_permissions() {
	return current_user_can( 'manage_options' );
}

/**
 * Gibt die gespeicherten Editor-Inserter-Einstellungen zurück.
 *
 * @return WP_REST_Response
 */
function ud_settings_editor_inserter_rest_get_data() {
	return rest_ensure_response(
		array(
			'settings' => ud_settings_editor_inserter_get_settings(),
		)
	);
}

/**
 * Speichert die Editor-Inserter-Einstellungen.
 *
 * @param WP_REST_Request $request REST Request.
 *
 * @return WP_REST_Response
 */
function ud_settings_editor_inserter_rest_update_data( WP_REST_Request $request ) {
	$settings = $request->get_param( 'settings' );
	$settings = ud_settings_editor_inserter_sanitize_settings( $settings );

	update_option( UD_SETTINGS_OPTION_EDITOR_INSERTER, $settings );

	return rest_ensure_response(
		array(
			'success'  => true,
			'settings' => $settings,
		)
	);
}

/**
 * Entfernt Core-Block-Patterns.
 */
function ud_settings_editor_inserter_remove_core_block_patterns() {
	$settings = ud_settings_editor_inserter_get_settings();

	if ( empty( $settings['onlyOwnPatterns'] ) ) {
		return;
	}

	remove_theme_support( 'core-block-patterns' );
}
add_action( 'after_setup_theme', 'ud_settings_editor_inserter_remove_core_block_patterns', 20 );

/**
 * Deaktiviert Remote-Block-Patterns aus dem Pattern Directory.
 *
 * @param bool $should_load_remote_block_patterns Ob Remote-Patterns geladen werden sollen.
 *
 * @return bool
 */
function ud_settings_editor_inserter_disable_remote_block_patterns( $should_load_remote_block_patterns ) {
	$settings = ud_settings_editor_inserter_get_settings();

	if ( empty( $settings['onlyOwnPatterns'] ) ) {
		return $should_load_remote_block_patterns;
	}

	return false;
}
add_filter( 'should_load_remote_block_patterns', 'ud_settings_editor_inserter_disable_remote_block_patterns' );

/**
 * Entfernt registrierte Theme-, Plugin- und Core-Vorlagen aus dem Inserter.
 *
 * Selbst im Editor erstellte Vorlagen werden dadurch nicht deregistriert.
 */
function ud_settings_editor_inserter_unregister_registered_patterns() {
	$settings = ud_settings_editor_inserter_get_settings();

	if ( empty( $settings['onlyOwnPatterns'] ) ) {
		return;
	}

	if ( ! class_exists( 'WP_Block_Patterns_Registry' ) ) {
		return;
	}

	$registry = WP_Block_Patterns_Registry::get_instance();
	$patterns = $registry->get_all_registered();

	foreach ( $patterns as $pattern_name => $pattern ) {
		unregister_block_pattern( $pattern_name );
	}
}
add_action( 'init', 'ud_settings_editor_inserter_unregister_registered_patterns', 100 );

/**
 * Entfernt externe Medienquellen aus dem Medien-Tab des Inserters.
 *
 * @param array $settings Editor-Einstellungen.
 *
 * @return array
 */
function ud_settings_editor_inserter_block_editor_settings( $settings ) {
	$editor_inserter_settings = ud_settings_editor_inserter_get_settings();

	if ( ! empty( $editor_inserter_settings['onlyLocalMedia'] ) ) {
		$settings['enableOpenverseMediaCategory'] = false;
	}

	return $settings;
}
add_filter( 'block_editor_settings_all', 'ud_settings_editor_inserter_block_editor_settings' );