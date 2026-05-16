<?php
/**
 * Plugin Name:     UD Settings
 * Description:     Stellt zentrale Einstellungen für WordPress-Projekte bereit.
 * Version:         0.1.0
 * Author:          ulrich.digital gmbh
 * Author URI:      https://ulrich.digital/
 * License:         GPL v2 or later
 * License URI:     https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:     ud-settings
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'UD_SETTINGS_VERSION', '0.1.0' );
define( 'UD_SETTINGS_PATH', plugin_dir_path( __FILE__ ) );
define( 'UD_SETTINGS_URL', plugin_dir_url( __FILE__ ) );

require_once UD_SETTINGS_PATH . 'includes/admin-page.php';
require_once UD_SETTINGS_PATH . 'includes/assets.php';

require_once UD_SETTINGS_PATH . 'includes/options/admin-cleanup/admin-cleanup.php';
require_once UD_SETTINGS_PATH . 'includes/options/block-visibility/block-visibility.php';
require_once UD_SETTINGS_PATH . 'includes/options/comments/comments.php';
require_once UD_SETTINGS_PATH . 'includes/options/media-settings/media-settings.php';
require_once UD_SETTINGS_PATH . 'includes/options/revisions/revisions.php';
require_once UD_SETTINGS_PATH . 'includes/options/editor-cleanup/editor-cleanup.php';