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

	<div class="wrap ud-settings-wrap ud-admin-page">
		<header class="ud-admin-header">
            <div class="ud-admin-header__content">
                <p class="ud-admin-header__brand">ulrich.digital</p>
                <h1 class="ud-admin-header__title"><?php esc_html_e( 'Individuelle Einstellungen für WordPress', 'ud-settings' ); ?></h1>
                <p class="ud-admin-header__lead"><?php esc_html_e( 'Hier passen Sie Verwaltung, Editor und Medien über die Standard-Einstellungen von WordPress hinaus an.', 'ud-settings' ); ?></p>
            </div>
            <span class="ud-admin-header__version"><?php echo esc_html( sprintf( __( 'Version %s', 'ud-settings' ), UD_SETTINGS_VERSION ) ); ?></span>
        </header>
        <hr class="wp-header-end" />
		<div id="ud-settings-app"></div>
	</div>

	<?php
}
