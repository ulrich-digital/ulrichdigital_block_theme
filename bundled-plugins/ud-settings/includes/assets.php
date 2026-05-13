<?php
/**
 * Lädt Scripts und Styles für die Admin-Seite.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Lädt die Admin-App nur auf der eigenen Optionen-Seite.
 *
 * @param string $hook_suffix Aktueller Admin-Hook.
 */
function ud_settings_enqueue_admin_assets( $hook_suffix ) {
	if ( 'settings_page_ud-settings' !== $hook_suffix ) {
		return;
	}

	$script_path = UD_SETTINGS_PATH . 'build/admin-script.js';
	$script_url  = UD_SETTINGS_URL . 'build/admin-script.js';
	$asset_path  = UD_SETTINGS_PATH . 'build/admin-script.asset.php';

	if ( ! file_exists( $script_path ) || ! file_exists( $asset_path ) ) {
		return;
	}

	$asset = require $asset_path;

	wp_enqueue_script(
		'ud-settings-admin-script',
		$script_url,
		$asset['dependencies'],
		$asset['version'],
		true
	);

	$style_path = UD_SETTINGS_PATH . 'build/editor.css';
	$style_url  = UD_SETTINGS_URL . 'build/editor.css';

	if ( file_exists( $style_path ) ) {
		wp_enqueue_style(
			'ud-settings-editor',
			$style_url,
			array( 'wp-components' ),
			filemtime( $style_path )
		);
	}
}
add_action( 'admin_enqueue_scripts', 'ud_settings_enqueue_admin_assets' );