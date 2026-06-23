<?php
/**
 * Installiert und aktiviert gebündelte interne Plugins beim Theme-Wechsel.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Kopiert einen Ordner rekursiv.
 *
 * @param string $source Quelle.
 * @param string $destination Ziel.
 *
 * @return bool
 */
function ud_theme_copy_directory( $source, $destination ) {
	if ( ! is_dir( $source ) ) {
		return false;
	}

	if ( ! is_dir( $destination ) ) {
		if ( ! wp_mkdir_p( $destination ) ) {
			return false;
		}
	}

	$items = scandir( $source );

	if ( false === $items ) {
		return false;
	}

	foreach ( $items as $item ) {
		if ( '.' === $item || '..' === $item ) {
			continue;
		}

		$source_path      = trailingslashit( $source ) . $item;
		$destination_path = trailingslashit( $destination ) . $item;

		if ( is_dir( $source_path ) ) {
			$copied = ud_theme_copy_directory( $source_path, $destination_path );

			if ( ! $copied ) {
				return false;
			}

			continue;
		}

		if ( ! copy( $source_path, $destination_path ) ) {
			return false;
		}
	}

	return true;
}

/**
 * Installiert und aktiviert UD Settings beim Aktivieren des Themes.
 *
 * @return void
 */
function ud_theme_install_bundled_plugins() {
	$plugin_slug = 'ud-settings';
	$plugin_file = 'ud-settings/ud-settings.php';

	$source_dir = get_stylesheet_directory() . '/bundled-plugins/' . $plugin_slug;
	$target_dir = WP_PLUGIN_DIR . '/' . $plugin_slug;

if ( ! file_exists( WP_PLUGIN_DIR . '/' . $plugin_file ) ) {
	$copied = ud_theme_copy_directory( $source_dir, $target_dir );
} 


	if ( ! function_exists( 'is_plugin_active' ) || ! function_exists( 'activate_plugin' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}

	if ( ! file_exists( WP_PLUGIN_DIR . '/' . $plugin_file ) ) {
		return;
	}

	if ( is_plugin_active( $plugin_file ) ) {
		return;
	}

	$result = activate_plugin( $plugin_file );

	if ( is_wp_error( $result ) ) {
		return;
	}


}
add_action( 'after_switch_theme', 'ud_theme_install_bundled_plugins' );
