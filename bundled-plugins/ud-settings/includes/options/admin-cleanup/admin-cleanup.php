<?php
/**
 * Option: Admin-Oberfläche aufräumen.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'UD_SETTINGS_OPTION_ADMIN_CLEANUP', 'ud_settings_admin_cleanup' );
define( 'UD_SETTINGS_OPTION_ADMIN_CLEANUP_DASHBOARD_WIDGETS', 'ud_settings_admin_cleanup_dashboard_widgets' );

/**
 * Gibt die Standardwerte für die Admin-Aufräum-Einstellungen zurück.
 *
 * @return array
 */
function ud_settings_admin_cleanup_get_default_settings() {
	return array(
		'removeWpLogo'                     => true,
		'removeNewContent'                 => true,
		'removeArchive'                    => true,
		'hideDashboardWidgets'             => true,
		'hiddenDashboardWidgets'           => array(
			'dashboard_site_health',
			'dashboard_right_now',
			'dashboard_activity',
			'dashboard_quick_press',
			'dashboard_primary',
			'welcome_panel',
		),
		'renamePosts'                      => false,
		'postSingularName'                 => 'Beitrag',
		'postPluralName'                   => 'Beiträge',
		'hidePostsMenu'                    => false,
		'allowEditorsPrivacyPolicyAccess' => false,
	);
}

/**
 * Gibt die gespeicherten Admin-Aufräum-Einstellungen zurück.
 *
 * @return array
 */
function ud_settings_admin_cleanup_get_settings() {
	$settings = get_option( UD_SETTINGS_OPTION_ADMIN_CLEANUP, array() );

	if ( ! is_array( $settings ) ) {
		$settings = array();
	}

	return array_merge(
		ud_settings_admin_cleanup_get_default_settings(),
		$settings
	);
}

/**
 * Bereinigt die Admin-Aufräum-Einstellungen.
 *
 * @param mixed $settings Einstellungen.
 *
 * @return array
 */
function ud_settings_admin_cleanup_sanitize_settings( $settings ) {
	if ( ! is_array( $settings ) ) {
		$settings = array();
	}

	$sanitized_settings = array();

	$sanitized_settings['removeWpLogo']                    = ! empty( $settings['removeWpLogo'] );
	$sanitized_settings['removeNewContent']                = ! empty( $settings['removeNewContent'] );
	$sanitized_settings['removeArchive']                   = ! empty( $settings['removeArchive'] );
	$sanitized_settings['hideDashboardWidgets']            = ! empty( $settings['hideDashboardWidgets'] );
	$sanitized_settings['renamePosts']                     = ! empty( $settings['renamePosts'] );
	$sanitized_settings['hidePostsMenu']                   = ! empty( $settings['hidePostsMenu'] );
	$sanitized_settings['allowEditorsPrivacyPolicyAccess'] = ! empty( $settings['allowEditorsPrivacyPolicyAccess'] );

	$sanitized_settings['postSingularName'] = ! empty( $settings['postSingularName'] )
		? sanitize_text_field( $settings['postSingularName'] )
		: 'Beitrag';

	$sanitized_settings['postPluralName'] = ! empty( $settings['postPluralName'] )
		? sanitize_text_field( $settings['postPluralName'] )
		: 'Beiträge';

	$sanitized_settings['hiddenDashboardWidgets'] = array();

	if ( ! empty( $settings['hiddenDashboardWidgets'] ) && is_array( $settings['hiddenDashboardWidgets'] ) ) {
		$sanitized_settings['hiddenDashboardWidgets'] = array_values(
			array_unique(
				array_map(
					'sanitize_key',
					$settings['hiddenDashboardWidgets']
				)
			)
		);
	}

	return $sanitized_settings;
}

/**
 * Registriert die REST-Routen für diese Option.
 */
function ud_settings_admin_cleanup_register_rest_routes() {
	register_rest_route(
		'ud-settings/v1',
		'/admin-cleanup',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'ud_settings_admin_cleanup_rest_get_data',
			'permission_callback' => 'ud_settings_admin_cleanup_rest_permissions',
		)
	);

	register_rest_route(
		'ud-settings/v1',
		'/admin-cleanup',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'ud_settings_admin_cleanup_rest_update_data',
			'permission_callback' => 'ud_settings_admin_cleanup_rest_permissions',
			'args'                => array(
				'settings' => array(
					'type'     => 'object',
					'required' => true,
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'ud_settings_admin_cleanup_register_rest_routes' );

/**
 * Prüft REST-Berechtigungen.
 *
 * @return bool
 */
function ud_settings_admin_cleanup_rest_permissions() {
	return current_user_can( 'manage_options' );
}

/**
 * Gibt die gespeicherte Einstellung zurück.
 *
 * @return WP_REST_Response
 */
function ud_settings_admin_cleanup_rest_get_data() {
	return rest_ensure_response(
		array(
			'settings'         => ud_settings_admin_cleanup_get_settings(),
			'dashboardWidgets' => ud_settings_admin_cleanup_get_dashboard_widgets(),
		)
	);
}

/**
 * Speichert die Einstellung.
 *
 * @param WP_REST_Request $request REST Request.
 *
 * @return WP_REST_Response
 */
function ud_settings_admin_cleanup_rest_update_data( WP_REST_Request $request ) {
	$settings = $request->get_param( 'settings' );
	$settings = ud_settings_admin_cleanup_sanitize_settings( $settings );

	update_option( UD_SETTINGS_OPTION_ADMIN_CLEANUP, $settings );

	return rest_ensure_response(
		array(
			'success'          => true,
			'settings'         => $settings,
			'dashboardWidgets' => ud_settings_admin_cleanup_get_dashboard_widgets(),
		)
	);
}

/**
 * Entfernt Einträge aus der Admin-Bar.
 *
 * @param WP_Admin_Bar $wp_admin_bar Admin-Bar-Instanz.
 */
function ud_settings_admin_cleanup_admin_bar( $wp_admin_bar ) {
	$settings = ud_settings_admin_cleanup_get_settings();

	if ( ! empty( $settings['removeWpLogo'] ) ) {
		$wp_admin_bar->remove_node( 'wp-logo' );
	}

	if ( ! empty( $settings['removeNewContent'] ) ) {
		$wp_admin_bar->remove_node( 'new-content' );
	}

	if ( ! empty( $settings['removeArchive'] ) ) {
		$wp_admin_bar->remove_node( 'archive' );
	}
}
add_action( 'admin_bar_menu', 'ud_settings_admin_cleanup_admin_bar', 999 );

/**
 * Speichert die im echten Dashboard registrierten Widgets für die Settings-Oberfläche.
 */
function ud_settings_admin_cleanup_capture_dashboard_widgets() {
	global $wp_meta_boxes;

	if ( ! is_admin() ) {
		return;
	}

	$screen = get_current_screen();

	if ( ! $screen || 'dashboard' !== $screen->id ) {
		return;
	}

	if ( empty( $wp_meta_boxes['dashboard'] ) || ! is_array( $wp_meta_boxes['dashboard'] ) ) {
		return;
	}

	$widgets = array();

	foreach ( $wp_meta_boxes['dashboard'] as $context => $priorities ) {
		if ( ! is_array( $priorities ) ) {
			continue;
		}

		foreach ( $priorities as $priority => $items ) {
			if ( ! is_array( $items ) ) {
				continue;
			}

			foreach ( $items as $widget_id => $widget ) {
				if ( empty( $widget['title'] ) ) {
					continue;
				}

				$widgets[] = array(
					'id'       => sanitize_key( $widget_id ),
					'title'    => wp_strip_all_tags( $widget['title'] ),
					'context'  => sanitize_key( $context ),
					'priority' => sanitize_key( $priority ),
				);
			}
		}
	}

	$widgets[] = array(
		'id'       => 'welcome_panel',
		'title'    => __( 'Willkommen-Panel', 'ud-settings' ),
		'context'  => 'normal',
		'priority' => 'core',
	);

	update_option( UD_SETTINGS_OPTION_ADMIN_CLEANUP_DASHBOARD_WIDGETS, $widgets, false );
}
add_action( 'wp_dashboard_setup', 'ud_settings_admin_cleanup_capture_dashboard_widgets', 998 );

/**
 * Gibt die zuletzt im Dashboard gefundenen Widgets zurück.
 *
 * @return array
 */
function ud_settings_admin_cleanup_get_dashboard_widgets() {
	$widgets = get_option( UD_SETTINGS_OPTION_ADMIN_CLEANUP_DASHBOARD_WIDGETS, array() );

	if ( ! is_array( $widgets ) ) {
		return array();
	}

	return $widgets;
}

/**
 * Entfernt die ausgewählten Dashboard-Widgets.
 */
function ud_settings_admin_cleanup_remove_dashboard_widgets() {
	$settings = ud_settings_admin_cleanup_get_settings();

	if ( empty( $settings['hideDashboardWidgets'] ) ) {
		return;
	}

	if ( empty( $settings['hiddenDashboardWidgets'] ) || ! is_array( $settings['hiddenDashboardWidgets'] ) ) {
		return;
	}

	foreach ( $settings['hiddenDashboardWidgets'] as $widget_id ) {
		if ( 'welcome_panel' === $widget_id ) {
			remove_action( 'welcome_panel', 'wp_welcome_panel' );
			continue;
		}

		remove_meta_box( $widget_id, 'dashboard', 'normal' );
		remove_meta_box( $widget_id, 'dashboard', 'side' );
		remove_meta_box( $widget_id, 'dashboard', 'column3' );
		remove_meta_box( $widget_id, 'dashboard', 'column4' );
	}
}
add_action( 'wp_dashboard_setup', 'ud_settings_admin_cleanup_remove_dashboard_widgets', 999 );

/**
 * Passt die Labels des Standard-Post-Types Beiträge an.
 *
 * @param object $labels Post-Type-Labels.
 *
 * @return object
 */
function ud_settings_admin_cleanup_rename_posts_labels( $labels ) {
	$settings = ud_settings_admin_cleanup_get_settings();

	if ( empty( $settings['renamePosts'] ) ) {
		return $labels;
	}

	$singular = ! empty( $settings['postSingularName'] )
		? $settings['postSingularName']
		: 'Beitrag';

	$plural = ! empty( $settings['postPluralName'] )
		? $settings['postPluralName']
		: 'Beiträge';

	$labels->name                  = $plural;
	$labels->singular_name         = $singular;
	$labels->menu_name             = $plural;
	$labels->name_admin_bar        = $singular;
	$labels->add_new               = __( 'Erstellen', 'ud-settings' );
	$labels->add_new_item          = sprintf( __( '%s erstellen', 'ud-settings' ), $singular );
	$labels->edit_item             = sprintf( __( '%s bearbeiten', 'ud-settings' ), $singular );
	$labels->new_item              = sprintf( __( 'Neuer %s', 'ud-settings' ), $singular );
	$labels->view_item             = sprintf( __( '%s ansehen', 'ud-settings' ), $singular );
	$labels->view_items            = sprintf( __( '%s ansehen', 'ud-settings' ), $plural );
	$labels->search_items          = sprintf( __( '%s suchen', 'ud-settings' ), $plural );
	$labels->not_found             = sprintf( __( 'Keine %s gefunden.', 'ud-settings' ), $plural );
	$labels->not_found_in_trash    = sprintf( __( 'Keine %s im Papierkorb gefunden.', 'ud-settings' ), $plural );
	$labels->all_items             = sprintf( __( 'Alle %s', 'ud-settings' ), $plural );
	$labels->archives              = sprintf( __( '%s-Archiv', 'ud-settings' ), $singular );
	$labels->attributes            = sprintf( __( '%s-Attribute', 'ud-settings' ), $singular );
	$labels->insert_into_item      = sprintf( __( 'In %s einfügen', 'ud-settings' ), $singular );
	$labels->uploaded_to_this_item = sprintf( __( 'Zu diesem %s hochgeladen', 'ud-settings' ), $singular );
	$labels->filter_items_list     = sprintf( __( '%s-Liste filtern', 'ud-settings' ), $plural );
	$labels->items_list_navigation = sprintf( __( '%s-Listennavigation', 'ud-settings' ), $plural );
	$labels->items_list            = sprintf( __( '%s-Liste', 'ud-settings' ), $plural );

	return $labels;
}
add_filter( 'post_type_labels_post', 'ud_settings_admin_cleanup_rename_posts_labels' );

/**
 * Passt den Admin-Menüpunkt Beiträge an oder blendet ihn aus.
 */
function ud_settings_admin_cleanup_posts_admin_menu() {
	global $menu, $submenu;

	$settings = ud_settings_admin_cleanup_get_settings();

	if ( ! empty( $settings['hidePostsMenu'] ) ) {
		remove_menu_page( 'edit.php' );
		return;
	}

	if ( empty( $settings['renamePosts'] ) ) {
		return;
	}

	$plural = ! empty( $settings['postPluralName'] )
		? $settings['postPluralName']
		: 'Beiträge';

	foreach ( $menu as $index => $item ) {
		if ( ! empty( $item[2] ) && 'edit.php' === $item[2] ) {
			$menu[ $index ][0] = $plural;
			break;
		}
	}

	if ( ! empty( $submenu['edit.php'] ) && is_array( $submenu['edit.php'] ) ) {
		foreach ( $submenu['edit.php'] as $index => $item ) {
			if ( empty( $item[2] ) ) {
				continue;
			}

			if ( 'edit.php' === $item[2] ) {
				$submenu['edit.php'][ $index ][0] = sprintf(
					__( 'Alle %s', 'ud-settings' ),
					$plural
				);
			}

			if ( 'post-new.php' === $item[2] ) {
				$submenu['edit.php'][ $index ][0] = __( 'Erstellen', 'ud-settings' );
			}
		}
	}
}
add_action( 'admin_menu', 'ud_settings_admin_cleanup_posts_admin_menu', 999 );

/**
 * Erlaubt Redaktoren das Bearbeiten der hinterlegten Datenschutzerklärung.
 *
 * WordPress schützt die Datenschutzerklärungs-Seite zusätzlich über
 * manage_privacy_options. Diese Option entfernt nur diese Zusatzhürde beim
 * Bearbeiten der konkret hinterlegten Seite.
 *
 * @param string[] $caps    Erforderliche Primitive Capabilities.
 * @param string   $cap     Angefragte Meta-Capability.
 * @param int      $user_id Benutzer-ID.
 * @param mixed[]  $args    Zusätzliche Argumente, bei edit_post die Post-ID.
 *
 * @return string[]
 */
function ud_settings_admin_cleanup_privacy_policy_meta_caps( $caps, $cap, $user_id, $args ) {
	if ( 'edit_post' !== $cap ) {
		return $caps;
	}

	$settings = ud_settings_admin_cleanup_get_settings();

	if ( empty( $settings['allowEditorsPrivacyPolicyAccess'] ) ) {
		return $caps;
	}

	if ( empty( $args[0] ) ) {
		return $caps;
	}

	$post_id                = (int) $args[0];
	$privacy_policy_page_id = (int) get_option( 'wp_page_for_privacy_policy' );

	if ( $privacy_policy_page_id <= 0 || $post_id !== $privacy_policy_page_id ) {
		return $caps;
	}

	if ( ! user_can( $user_id, 'edit_pages' ) ) {
		return $caps;
	}

	return array_values(
		array_diff(
			$caps,
			array( 'manage_privacy_options', 'manage_options' )
		)
	);
}
add_filter( 'map_meta_cap', 'ud_settings_admin_cleanup_privacy_policy_meta_caps', 10, 4 );
