<?php
/**
 * Lädt Scripts und Styles für die Admin-Seite.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Lädt Assets für die UD-Settings-Seite und das Dashboard.
 *
 * @param string $hook_suffix Aktueller Admin-Hook.
 */
function ud_settings_enqueue_admin_assets( $hook_suffix ) {
	$is_settings_page = 'settings_page_ud-settings' === $hook_suffix;
	$is_dashboard     = 'index.php' === $hook_suffix;

	if ( ! $is_settings_page && ! $is_dashboard ) {
		return;
	}

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

	if ( $is_dashboard ) {
		$dashboard_script_path = UD_SETTINGS_PATH . 'build/options/editor-help/dashboard-script.js';
		$dashboard_script_url  = UD_SETTINGS_URL . 'build/options/editor-help/dashboard-script.js';
		$dashboard_asset_path  = UD_SETTINGS_PATH . 'build/options/editor-help/dashboard-script.asset.php';

		if ( file_exists( $dashboard_script_path ) && file_exists( $dashboard_asset_path ) ) {
			$dashboard_asset = require $dashboard_asset_path;

			wp_enqueue_script(
				'ud-settings-editor-help-dashboard',
				$dashboard_script_url,
				$dashboard_asset['dependencies'],
				$dashboard_asset['version'],
				true
			);
		}
	}

	if ( ! $is_settings_page ) {
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

	wp_add_inline_script(
		'ud-settings-admin-script',
		'window.udSettingsAdmin = ' . wp_json_encode(
			array(
				'logoUrl' => UD_SETTINGS_URL . 'assets/ulrich_digital.svg',
			)
		) . ';',
		'before'
	);
}
add_action( 'admin_enqueue_scripts', 'ud_settings_enqueue_admin_assets' );
