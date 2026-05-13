<?php
/**
 * Option: Revisionen bereinigen.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'UD_SETTINGS_OPTION_REVISIONS', 'ud_settings_revisions' );

/**
 * Gibt die Standardwerte für Revisionen zurück.
 *
 * @return array
 */
function ud_settings_revisions_get_default_settings() {
	return array(
		'keepRevisions' => 10,
	);
}

/**
 * Gibt die gespeicherten Revisionen-Einstellungen zurück.
 *
 * @return array
 */
function ud_settings_revisions_get_settings() {
	$settings = get_option( UD_SETTINGS_OPTION_REVISIONS, array() );

	if ( ! is_array( $settings ) ) {
		$settings = array();
	}

	return array_merge(
		ud_settings_revisions_get_default_settings(),
		$settings
	);
}

/**
 * Bereinigt die Revisionen-Einstellungen.
 *
 * @param mixed $settings Einstellungen.
 *
 * @return array
 */
function ud_settings_revisions_sanitize_settings( $settings ) {
	if ( ! is_array( $settings ) ) {
		$settings = array();
	}

	$keep_revisions = isset( $settings['keepRevisions'] )
		? absint( $settings['keepRevisions'] )
		: 10;

	if ( $keep_revisions < 1 ) {
		$keep_revisions = 1;
	}

	if ( $keep_revisions > 100 ) {
		$keep_revisions = 100;
	}

	return array(
		'keepRevisions' => $keep_revisions,
	);
}

/**
 * Registriert die REST-Routen für diese Option.
 */
function ud_settings_revisions_register_rest_routes() {
	register_rest_route(
		'ud-settings/v1',
		'/revisions',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'ud_settings_revisions_rest_get_data',
			'permission_callback' => 'ud_settings_revisions_rest_permissions',
		)
	);

	register_rest_route(
		'ud-settings/v1',
		'/revisions',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'ud_settings_revisions_rest_update_data',
			'permission_callback' => 'ud_settings_revisions_rest_permissions',
			'args'                => array(
				'settings' => array(
					'type'     => 'object',
					'required' => true,
				),
			),
		)
	);

	register_rest_route(
		'ud-settings/v1',
		'/revisions/cleanup',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'ud_settings_revisions_rest_cleanup',
			'permission_callback' => 'ud_settings_revisions_rest_permissions',
			'args'                => array(
				'keepRevisions' => array(
					'type'     => 'integer',
					'required' => true,
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'ud_settings_revisions_register_rest_routes' );

/**
 * Prüft REST-Berechtigungen.
 *
 * @return bool
 */
function ud_settings_revisions_rest_permissions() {
	return current_user_can( 'manage_options' );
}

/**
 * Gibt die gespeicherten Revisionen-Einstellungen zurück.
 *
 * @return WP_REST_Response
 */
function ud_settings_revisions_rest_get_data() {
	return rest_ensure_response(
		array(
			'settings'      => ud_settings_revisions_get_settings(),
			'revisionCount' => ud_settings_revisions_count_revisions(),
		)
	);
}

/**
 * Speichert die Revisionen-Einstellungen.
 *
 * @param WP_REST_Request $request REST Request.
 *
 * @return WP_REST_Response
 */
function ud_settings_revisions_rest_update_data( WP_REST_Request $request ) {
	$settings = $request->get_param( 'settings' );
	$settings = ud_settings_revisions_sanitize_settings( $settings );

	update_option( UD_SETTINGS_OPTION_REVISIONS, $settings );

	return rest_ensure_response(
		array(
			'success'  => true,
			'settings' => $settings,
		)
	);
}

/**
 * Löscht alte Revisionen und behält pro Inhalt nur die letzten X Revisionen.
 *
 * @param WP_REST_Request $request REST Request.
 *
 * @return WP_REST_Response
 */
function ud_settings_revisions_rest_cleanup( WP_REST_Request $request ) {
	$keep_revisions = absint( $request->get_param( 'keepRevisions' ) );

	if ( $keep_revisions < 1 ) {
		$keep_revisions = 1;
	}

	if ( $keep_revisions > 100 ) {
		$keep_revisions = 100;
	}

	$result = ud_settings_revisions_cleanup_old_revisions( $keep_revisions );

	return rest_ensure_response(
		array(
			'success'       => true,
			'deleted'       => $result['deleted'],
			'parents'       => $result['parents'],
			'revisionCount' => ud_settings_revisions_count_revisions(),
		)
	);
}

/**
 * Zählt alle vorhandenen Revisionen.
 *
 * @return int
 */
function ud_settings_revisions_count_revisions() {
	global $wpdb;

	return (int) $wpdb->get_var(
		"SELECT COUNT(ID) FROM {$wpdb->posts} WHERE post_type = 'revision'"
	);
}

/**
 * Löscht alte Revisionen.
 *
 * @param int $keep_revisions Anzahl Revisionen, die pro Inhalt behalten werden.
 *
 * @return array
 */
function ud_settings_revisions_cleanup_old_revisions( $keep_revisions ) {
	global $wpdb;

	$post_parent_ids = $wpdb->get_col(
		"SELECT DISTINCT post_parent
		FROM {$wpdb->posts}
		WHERE post_type = 'revision'
		AND post_parent > 0"
	);

	$deleted = 0;
	$parents = 0;

	foreach ( $post_parent_ids as $post_parent_id ) {
		$revision_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT ID
				FROM {$wpdb->posts}
				WHERE post_type = 'revision'
				AND post_parent = %d
				ORDER BY post_date DESC, ID DESC",
				$post_parent_id
			)
		);

		if ( count( $revision_ids ) <= $keep_revisions ) {
			continue;
		}

		$parents++;
		$revision_ids_to_delete = array_slice( $revision_ids, $keep_revisions );

		foreach ( $revision_ids_to_delete as $revision_id ) {
			wp_delete_post( (int) $revision_id, true );
			$deleted++;
		}
	}

	return array(
		'deleted' => $deleted,
		'parents' => $parents,
	);
}