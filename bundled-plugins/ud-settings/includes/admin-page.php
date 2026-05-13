<?php
/**
 * Registriert die Admin-Seite für die UD Settings.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registriert die Optionen-Seite.
 */
function ud_settings_register_admin_page() {
	add_options_page(
		__( 'UD Settings', 'ud-settings' ),
		__( 'UD Settings', 'ud-settings' ),
		'manage_options',
		'ud-settings',
		'ud_settings_render_admin_page'
	);
}
add_action( 'admin_menu', 'ud_settings_register_admin_page' );

/**
 * Rendert den React-Mountpoint.
 */
function ud_settings_render_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>

	<div class="wrap ud-settings-wrap">
		<div id="ud-settings-app"></div>
	</div>

	<?php
}
