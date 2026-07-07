<?php
/**
 * Option: Block-Sichtbarkeit im Editor.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'UD_SETTINGS_OPTION_EXCLUDED_BLOCKS', 'ud_settings_excluded_blocks' );
define( 'UD_SETTINGS_OPTION_EXCLUDED_BLOCK_VARIATIONS', 'ud_settings_excluded_block_variations' );

/**
 * Registriert die REST-Routen für diese Option.
 */
function ud_settings_block_visibility_register_rest_routes() {
	register_rest_route(
		'ud-settings/v1',
		'/block-visibility',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'ud_settings_block_visibility_rest_get_data',
			'permission_callback' => 'ud_settings_block_visibility_rest_permissions',
		)
	);

	register_rest_route(
		'ud-settings/v1',
		'/block-visibility',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'ud_settings_block_visibility_rest_update_data',
			'permission_callback' => 'ud_settings_block_visibility_rest_permissions',
			'args'                => array(
				'excludedBlocks'     => array(
					'type'     => 'array',
					'required' => true,
					'items'    => array(
						'type' => 'string',
					),
				),
				'excludedVariations' => array(
					'type'     => 'array',
					'required' => false,
					'items'    => array(
						'type' => 'string',
					),
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'ud_settings_block_visibility_register_rest_routes' );

/**
 * Prüft REST-Berechtigungen.
 *
 * @return bool
 */
function ud_settings_block_visibility_rest_permissions() {
	return current_user_can( 'manage_options' );
}

/**
 * Gibt alle registrierten Blöcke und gespeicherten Ausschlüsse zurück.
 *
 * @return WP_REST_Response
 */
function ud_settings_block_visibility_rest_get_data() {
	$registered_blocks               = WP_Block_Type_Registry::get_instance()->get_all_registered();
	$excluded_blocks                 = get_option( UD_SETTINGS_OPTION_EXCLUDED_BLOCKS, array() );
	$excluded_variations             = get_option( UD_SETTINGS_OPTION_EXCLUDED_BLOCK_VARIATIONS, array() );

	$blocks     = array();
	$variations = ud_settings_block_visibility_get_variations_for_rest( $excluded_variations );

	foreach ( $registered_blocks as $block_name => $block ) {
		$blocks[] = array(
			'name'        => $block_name,
			'title'       => ! empty( $block->title ) ? $block->title : $block_name,
			'category'    => ! empty( $block->category ) ? $block->category : '',
			'description' => ! empty( $block->description ) ? wp_strip_all_tags( $block->description ) : '',
			'isExcluded'  => in_array( $block_name, $excluded_blocks, true ),
		);
	}

	usort(
		$blocks,
		function ( $a, $b ) {
			$category_compare = strcasecmp( $a['category'], $b['category'] );

			if ( 0 !== $category_compare ) {
				return $category_compare;
			}

			return strcasecmp( $a['title'], $b['title'] );
		}
	);

	return rest_ensure_response(
		array(
			'blocks'             => $blocks,
			'excludedBlocks'     => array_values( $excluded_blocks ),
			'variations'                   => $variations,
			'excludedVariations'           => array_values( $excluded_variations ),
		)
	);
}

/**
 * Speichert die ausgeschlossenen Blöcke und Block-Variationen.
 *
 * @param WP_REST_Request $request REST Request.
 *
 * @return WP_REST_Response
 */
function ud_settings_block_visibility_rest_update_data( WP_REST_Request $request ) {
	$excluded_blocks               = $request->get_param( 'excludedBlocks' );
	$excluded_variations           = $request->get_param( 'excludedVariations' );

	if ( ! is_array( $excluded_blocks ) ) {
		$excluded_blocks = array();
	}

	if ( ! is_array( $excluded_variations ) ) {
		$excluded_variations = array();
	}

	$excluded_blocks     = ud_settings_block_visibility_sanitize_blocks( $excluded_blocks );
	$excluded_variations = ud_settings_block_visibility_sanitize_variations( $excluded_variations );

	update_option( UD_SETTINGS_OPTION_EXCLUDED_BLOCKS, $excluded_blocks );
	update_option( UD_SETTINGS_OPTION_EXCLUDED_BLOCK_VARIATIONS, $excluded_variations );

	return rest_ensure_response(
		array(
			'success'                    => true,
			'excludedBlocks'             => $excluded_blocks,
			'excludedVariations'         => $excluded_variations,
		)
	);
}

/**
 * Gibt bekannte Core-Block-Variationen zurück, die über die Block-Sichtbarkeit gesteuert werden.
 *
 * @return array
 */
function ud_settings_block_visibility_get_manageable_variations() {
	return array(
		array(
			'blockName'     => 'core/heading',
			'variationName' => 'stretchy-heading',
			'title'         => __( 'Stretchy Heading', 'ud-settings' ),
			'description'   => __( 'Variation des Überschrift-Blocks.', 'ud-settings' ),
		),
		array(
			'blockName'     => 'core/paragraph',
			'variationName' => 'stretchy-paragraph',
			'title'         => __( 'Stretchy Paragraph', 'ud-settings' ),
			'description'   => __( 'Variation des Absatz-Blocks.', 'ud-settings' ),
		),
	);
}

/**
 * Bereitet verwaltbare Block-Variationen für die REST-Ausgabe auf.
 *
 * @param array $excluded_variations Ausgeschlossene Variation-IDs.
 *
 * @return array
 */
function ud_settings_block_visibility_get_variations_for_rest( $excluded_variations ) {
	$manageable_variations = ud_settings_block_visibility_get_manageable_variations();

	return array_map(
		function ( $variation ) use ( $excluded_variations ) {
			$id = $variation['blockName'] . '::' . $variation['variationName'];

			return array(
				'id'            => $id,
				'blockName'     => $variation['blockName'],
				'variationName' => $variation['variationName'],
				'title'         => $variation['title'],
				'description'   => $variation['description'],
				'isExcluded'    => in_array( $id, $excluded_variations, true ),
			);
		},
		$manageable_variations
	);
}

/**
 * Bereinigt Blocknamen.
 *
 * @param array $blocks Blocknamen.
 *
 * @return array
 */
function ud_settings_block_visibility_sanitize_blocks( $blocks ) {
	$blocks = array_map( 'sanitize_text_field', $blocks );

	$blocks = array_filter(
		$blocks,
		function ( $block_name ) {
			return (bool) preg_match( '/^[a-z0-9-]+\/[a-z0-9-]+$/', $block_name );
		}
	);

	return array_values( array_unique( $blocks ) );
}

/**
 * Bereinigt ausgeschlossene Block-Variationen.
 *
 * @param array $variations Variation-IDs.
 *
 * @return array
 */
function ud_settings_block_visibility_sanitize_variations( $variations ) {
	$variations = array_map( 'sanitize_text_field', $variations );

	$allowed_variations = array_map(
		function ( $variation ) {
			return $variation['blockName'] . '::' . $variation['variationName'];
		},
		ud_settings_block_visibility_get_manageable_variations()
	);

	$variations = array_filter(
		$variations,
		function ( $variation_id ) use ( $allowed_variations ) {
			return in_array( $variation_id, $allowed_variations, true );
		}
	);

	return array_values( array_unique( $variations ) );
}

/**
 * Entfernt ausgeschlossene Blöcke aus dem Editor.
 *
 * @param bool|string[]           $allowed_block_types  Erlaubte Blocktypen.
 * @param WP_Block_Editor_Context $block_editor_context Editor-Kontext.
 *
 * @return bool|string[]
 */
function ud_settings_block_visibility_filter_allowed_block_types( $allowed_block_types, $block_editor_context ) {
	$excluded_blocks = get_option( UD_SETTINGS_OPTION_EXCLUDED_BLOCKS, array() );

	if ( empty( $excluded_blocks ) ) {
		return $allowed_block_types;
	}

	$registered_blocks = array_keys(
		WP_Block_Type_Registry::get_instance()->get_all_registered()
	);

	if ( empty( $registered_blocks ) ) {
		return $allowed_block_types;
	}

	if ( true === $allowed_block_types ) {
		return array_values( array_diff( $registered_blocks, $excluded_blocks ) );
	}

	if ( is_array( $allowed_block_types ) ) {
		return array_values( array_diff( $allowed_block_types, $excluded_blocks ) );
	}

	return $allowed_block_types;
}
add_filter( 'allowed_block_types_all', 'ud_settings_block_visibility_filter_allowed_block_types', 20, 2 );

/**
 * Lädt das Block-Visibility-Script im Block-Editor.
 */
function ud_settings_block_visibility_enqueue_editor_assets() {
	$script_path = UD_SETTINGS_PATH . 'build/options/block-visibility/editor-script.js';
	$script_url  = UD_SETTINGS_URL . 'build/options/block-visibility/editor-script.js';
	$asset_path  = UD_SETTINGS_PATH . 'build/options/block-visibility/editor-script.asset.php';

	if ( ! file_exists( $script_path ) || ! file_exists( $asset_path ) ) {
		return;
	}

	$asset = require $asset_path;

	wp_enqueue_script(
		'ud-settings-block-visibility-editor',
		$script_url,
		$asset['dependencies'],
		$asset['version'],
		true
	);

	$excluded_variation_ids = get_option( UD_SETTINGS_OPTION_EXCLUDED_BLOCK_VARIATIONS, array() );
	$manageable_variations = ud_settings_block_visibility_get_manageable_variations();

	$excluded_variations = array_values(
		array_filter(
			$manageable_variations,
			function ( $variation ) use ( $excluded_variation_ids ) {
				$id = $variation['blockName'] . '::' . $variation['variationName'];

				return in_array( $id, $excluded_variation_ids, true );
			}
		)
	);

	wp_add_inline_script(
		'ud-settings-block-visibility-editor',
		'window.udSettingsBlockVisibility = ' . wp_json_encode(
			array(
				'excludedVariations' => $excluded_variations,
			)
		) . ';',
		'before'
	);
}
add_action( 'enqueue_block_editor_assets', 'ud_settings_block_visibility_enqueue_editor_assets' );
