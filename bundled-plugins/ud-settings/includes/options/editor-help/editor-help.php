<?php
/**
 * Option: Redaktionshilfe im Dashboard.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'UD_SETTINGS_OPTION_EDITOR_HELP', 'ud_settings_editor_help' );

/**
 * Gibt die Standardwerte für die Redaktionshilfe zurück.
 *
 * @return array
 */
function ud_settings_editor_help_get_default_settings() {
	return array(
		'enableEditorHelp' => false,
		'title'            => __( 'Kurzanleitung für die Redaktion', 'ud-settings' ),
		'sections'         => array(),
		'content'          => '',
	);
}

/**
 * Gibt die gespeicherten Redaktionshilfe-Einstellungen zurück.
 *
 * @return array
 */
function ud_settings_editor_help_get_settings() {
	$settings = get_option( UD_SETTINGS_OPTION_EDITOR_HELP, array() );

	if ( ! is_array( $settings ) ) {
		$settings = array();
	}

	$settings = array_merge(
		ud_settings_editor_help_get_default_settings(),
		$settings
	);

	if ( empty( $settings['sections'] ) && ! empty( $settings['content'] ) ) {
		$settings['sections'] = array(
			array(
				'id'        => 'section-legacy',
				'title'     => '',
				'content'   => wp_kses_post( $settings['content'] ),
				'imageUrl'  => '',
				'imageFile' => '',
			),
		);
	}

	if ( ! is_array( $settings['sections'] ) ) {
		$settings['sections'] = array();
	}

	return $settings;
}

/**
 * Bereinigt die Redaktionshilfe-Einstellungen.
 *
 * @param mixed $settings Einstellungen.
 *
 * @return array
 */
function ud_settings_editor_help_sanitize_settings( $settings ) {
	if ( ! is_array( $settings ) ) {
		$settings = array();
	}

	$sections = array();

	if ( ! empty( $settings['sections'] ) && is_array( $settings['sections'] ) ) {
		foreach ( $settings['sections'] as $section ) {
			if ( ! is_array( $section ) ) {
				continue;
			}

			$id = ! empty( $section['id'] )
				? sanitize_key( $section['id'] )
				: 'section-' . wp_generate_uuid4();

			$title = isset( $section['title'] )
				? sanitize_text_field( $section['title'] )
				: '';

			$content = isset( $section['content'] )
				? wp_kses_post( $section['content'] )
				: '';

			$image_url = isset( $section['imageUrl'] )
				? esc_url_raw( $section['imageUrl'] )
				: '';

			$image_file = isset( $section['imageFile'] )
				? sanitize_file_name( $section['imageFile'] )
				: '';

			if ( '' === $title && '' === $content && '' === $image_url ) {
				continue;
			}

			$sections[] = array(
				'id'        => $id,
				'title'     => $title,
				'content'   => $content,
				'imageUrl'  => $image_url,
				'imageFile' => $image_file,
			);
		}
	}

	return array(
		'enableEditorHelp' => ! empty( $settings['enableEditorHelp'] ),
		'title'            => isset( $settings['title'] ) ? sanitize_text_field( $settings['title'] ) : '',
		'sections'         => $sections,
		'content'          => '',
	);
}

/**
 * Registriert die REST-Routen für diese Option.
 */
function ud_settings_editor_help_register_rest_routes() {
	register_rest_route(
		'ud-settings/v1',
		'/editor-help',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'ud_settings_editor_help_rest_get_data',
			'permission_callback' => 'ud_settings_editor_help_rest_permissions',
		)
	);

	register_rest_route(
		'ud-settings/v1',
		'/editor-help',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'ud_settings_editor_help_rest_update_data',
			'permission_callback' => 'ud_settings_editor_help_rest_permissions',
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
		'/editor-help/upload',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'ud_settings_editor_help_rest_upload_image',
			'permission_callback' => 'ud_settings_editor_help_rest_permissions',
		)
	);

	register_rest_route(
		'ud-settings/v1',
		'/editor-help/delete-image',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'ud_settings_editor_help_rest_delete_image',
			'permission_callback' => 'ud_settings_editor_help_rest_permissions',
			'args'                => array(
				'imageFile' => array(
					'type'     => 'string',
					'required' => true,
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'ud_settings_editor_help_register_rest_routes' );

/**
 * Prüft REST-Berechtigungen.
 *
 * @return bool
 */
function ud_settings_editor_help_rest_permissions() {
	return current_user_can( 'manage_options' );
}

/**
 * Gibt die gespeicherten Redaktionshilfe-Einstellungen zurück.
 *
 * @return WP_REST_Response
 */
function ud_settings_editor_help_rest_get_data() {
	return rest_ensure_response(
		array(
			'settings' => ud_settings_editor_help_get_settings(),
		)
	);
}

/**
 * Speichert die Redaktionshilfe-Einstellungen.
 *
 * @param WP_REST_Request $request REST Request.
 *
 * @return WP_REST_Response
 */
function ud_settings_editor_help_rest_update_data( WP_REST_Request $request ) {
	$settings = $request->get_param( 'settings' );
	$settings = ud_settings_editor_help_sanitize_settings( $settings );

	update_option( UD_SETTINGS_OPTION_EDITOR_HELP, $settings );

	return rest_ensure_response(
		array(
			'success'  => true,
			'settings' => $settings,
		)
	);
}

/**
 * Gibt den Upload-Ordner für Redaktionshilfe-Bilder zurück.
 *
 * @return array
 */
function ud_settings_editor_help_get_upload_directory() {
	$upload_dir = wp_upload_dir();
	$subdir     = '/ud-settings/editor-help';

	return array(
		'path' => trailingslashit( $upload_dir['basedir'] ) . trim( $subdir, '/' ),
		'url'  => trailingslashit( $upload_dir['baseurl'] ) . trim( $subdir, '/' ),
	);
}

/**
 * Passt den Upload-Ordner temporär für Redaktionshilfe-Bilder an.
 *
 * @param array $dirs Upload-Verzeichnisse.
 *
 * @return array
 */
function ud_settings_editor_help_upload_dir( $dirs ) {
	$subdir = '/ud-settings/editor-help';

	$dirs['subdir'] = $subdir;
	$dirs['path']   = $dirs['basedir'] . $subdir;
	$dirs['url']    = $dirs['baseurl'] . $subdir;

	return $dirs;
}

/**
 * Lädt ein Redaktionshilfe-Bild hoch.
 *
 * @return WP_REST_Response|WP_Error
 */
function ud_settings_editor_help_rest_upload_image() {
	if ( empty( $_FILES['file'] ) ) {
		return new WP_Error(
			'ud_settings_editor_help_missing_file',
			__( 'Es wurde keine Datei hochgeladen.', 'ud-settings' ),
			array( 'status' => 400 )
		);
	}

	require_once ABSPATH . 'wp-admin/includes/file.php';

	add_filter( 'upload_dir', 'ud_settings_editor_help_upload_dir' );

	$uploaded_file = wp_handle_upload(
		$_FILES['file'],
		array(
			'test_form' => false,
			'mimes'     => array(
				'jpg|jpeg' => 'image/jpeg',
				'png'      => 'image/png',
				'webp'     => 'image/webp',
			),
		)
	);

	remove_filter( 'upload_dir', 'ud_settings_editor_help_upload_dir' );

	if ( isset( $uploaded_file['error'] ) ) {
		return new WP_Error(
			'ud_settings_editor_help_upload_error',
			$uploaded_file['error'],
			array( 'status' => 400 )
		);
	}

	$image_file = basename( $uploaded_file['file'] );

	return rest_ensure_response(
		array(
			'url'       => esc_url_raw( $uploaded_file['url'] ),
			'imageFile' => sanitize_file_name( $image_file ),
		)
	);
}

/**
 * Löscht ein Redaktionshilfe-Bild aus dem eigenen Upload-Ordner.
 *
 * @param WP_REST_Request $request REST Request.
 *
 * @return WP_REST_Response|WP_Error
 */
function ud_settings_editor_help_rest_delete_image( WP_REST_Request $request ) {
	$image_file = sanitize_file_name( $request->get_param( 'imageFile' ) );

	if ( empty( $image_file ) ) {
		return new WP_Error(
			'ud_settings_editor_help_missing_image_file',
			__( 'Es wurde keine Bilddatei angegeben.', 'ud-settings' ),
			array( 'status' => 400 )
		);
	}

	$upload_directory = ud_settings_editor_help_get_upload_directory();
	$image_path       = trailingslashit( $upload_directory['path'] ) . $image_file;

	if ( file_exists( $image_path ) && is_file( $image_path ) ) {
		wp_delete_file( $image_path );
	}

	return rest_ensure_response(
		array(
			'success' => true,
		)
	);
}

/**
 * Registriert das Dashboard-Widget für die Redaktionshilfe.
 */
function ud_settings_editor_help_register_dashboard_widget() {
	$settings = ud_settings_editor_help_get_settings();

	if ( empty( $settings['enableEditorHelp'] ) ) {
		return;
	}

	if ( empty( $settings['sections'] ) ) {
		return;
	}

	$title = ! empty( $settings['title'] )
		? $settings['title']
		: __( 'Kurzanleitung für die Redaktion', 'ud-settings' );

	wp_add_dashboard_widget(
		'ud_settings_editor_help_widget',
		esc_html( $title ),
		'ud_settings_editor_help_render_dashboard_widget'
	);
}
add_action( 'wp_dashboard_setup', 'ud_settings_editor_help_register_dashboard_widget' );

/**
 * Gibt das Dashboard-Widget aus.
 */
function ud_settings_editor_help_render_dashboard_widget() {
	$settings = ud_settings_editor_help_get_settings();

	if ( empty( $settings['sections'] ) || ! is_array( $settings['sections'] ) ) {
		return;
	}

	echo '<div class="ud-settings-editor-help-widget">';

	foreach ( $settings['sections'] as $section ) {
		$title     = ! empty( $section['title'] ) ? $section['title'] : '';
		$content   = ! empty( $section['content'] ) ? $section['content'] : '';
		$image_url = ! empty( $section['imageUrl'] ) ? $section['imageUrl'] : '';

		if ( '' === $title && '' === $content && '' === $image_url ) {
			continue;
		}

		echo '<section class="ud-settings-editor-help-widget__section">';

		if ( '' !== $title ) {
			echo '<h2>' . esc_html( $title ) . '</h2>';
		}

		if ( '' !== $content ) {
			echo '<div class="ud-settings-editor-help-widget__content">';
			echo wp_kses_post( $content );
			echo '</div>';
		}

		if ( '' !== $image_url ) {
			echo '<figure class="ud-settings-editor-help-widget__image">';
			echo '<button class="ud-settings-editor-help-widget__image-button" type="button" data-ud-settings-lightbox-image="' . esc_url( $image_url ) . '">';
			echo '<img src="' . esc_url( $image_url ) . '" alt="" loading="lazy" />';
			echo '</button>';
			echo '</figure>';
		}

		echo '</section>';
	}

	echo '</div>';
}
