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

	wp_enqueue_style( 'ud-settings-header', UD_SETTINGS_URL . 'assets/admin-header.css', array( 'wp-components' ), filemtime( UD_SETTINGS_PATH . 'assets/admin-header.css' ) );

	wp_enqueue_style( 'ud-settings-buttons', UD_SETTINGS_URL . 'assets/admin-buttons.css', array( 'ud-settings-editor' ), filemtime( UD_SETTINGS_PATH . 'assets/admin-buttons.css' ) );

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

/**
 * Lädt Styles und Lightbox-Script für die Redaktionshilfe im Dashboard.
 *
 * @param string $hook_suffix Aktueller Admin-Hook.
 */
function ud_settings_enqueue_editor_help_dashboard_assets( $hook_suffix ) {
	if ( 'index.php' !== $hook_suffix ) {
		return;
	}

	$settings = ud_settings_editor_help_get_settings();

	if ( empty( $settings['enableEditorHelp'] ) || empty( $settings['sections'] ) ) {
		return;
	}

	$style_path = UD_SETTINGS_PATH . 'build/editor.css';

	if ( file_exists( $style_path ) ) {
		wp_enqueue_style(
			'ud-settings-editor-help',
			UD_SETTINGS_URL . 'build/editor.css',
			array(),
			filemtime( $style_path )
		);
	}

	$script_path = UD_SETTINGS_PATH . 'build/options/editor-help/dashboard-script.js';
	$asset_path  = UD_SETTINGS_PATH . 'build/options/editor-help/dashboard-script.asset.php';

	if ( ! file_exists( $script_path ) || ! file_exists( $asset_path ) ) {
		return;
	}

	$asset = require $asset_path;

	wp_enqueue_script(
		'ud-settings-editor-help-dashboard',
		UD_SETTINGS_URL . 'build/options/editor-help/dashboard-script.js',
		$asset['dependencies'],
		$asset['version'],
		true
	);
}
add_action( 'admin_enqueue_scripts', 'ud_settings_enqueue_editor_help_dashboard_assets' );
