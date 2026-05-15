<?php

/**
 * Option: Medien-Einstellungen.
 */

if (! defined('ABSPATH')) {
    exit;
}

define('UD_SETTINGS_OPTION_MEDIA_SETTINGS', 'ud_settings_media_settings');

/**
 * Gibt die Standardwerte für Medien-Einstellungen zurück.
 *
 * @return array
 */
function ud_settings_media_settings_get_default_settings() {
    return array(
        'allowSvgUpload'                => true,
        'limitLargeImagesTo2560'        => true,
        'disableBigImageThreshold'      => false,
        'useMaxImageSizeInEditor'       => true,
        'hideOpenverseMediaCategory'    => true,
        'convertJpegTo'                 => 'webp',
    );
}
/**
 * Gibt die gespeicherten Medien-Einstellungen zurück.
 *
 * @return array
 */
function ud_settings_media_settings_get_settings() {
    $settings = get_option(UD_SETTINGS_OPTION_MEDIA_SETTINGS, array());

    if (! is_array($settings)) {
        $settings = array();
    }

    return array_merge(
        ud_settings_media_settings_get_default_settings(),
        $settings
    );
}

/**
 * Bereinigt die Medien-Einstellungen.
 *
 * @param mixed $settings Einstellungen.
 *
 * @return array
 */
function ud_settings_media_settings_sanitize_settings($settings) {
    if (! is_array($settings)) {
        $settings = array();
    }

    $convert_jpeg_to = '';

    if (isset($settings['convertJpegTo'])) {
        $convert_jpeg_to = sanitize_text_field($settings['convertJpegTo']);
    }

    if (! in_array($convert_jpeg_to, array('', 'avif', 'webp'), true)) {
        $convert_jpeg_to = '';
    }

    $limit_large_images_to_2560 = ! empty($settings['limitLargeImagesTo2560']);
    $disable_big_image_threshold = ! empty($settings['disableBigImageThreshold']);

    if ($disable_big_image_threshold) {
        $limit_large_images_to_2560 = false;
    }

    if ($limit_large_images_to_2560) {
        $disable_big_image_threshold = false;
    }

    return array(
        'allowSvgUpload'              => ! empty($settings['allowSvgUpload']),
        'limitLargeImagesTo2560'      => $limit_large_images_to_2560,
        'disableBigImageThreshold'    => $disable_big_image_threshold,
        'useMaxImageSizeInEditor'     => ! empty($settings['useMaxImageSizeInEditor']),
        'hideOpenverseMediaCategory'  => ! empty($settings['hideOpenverseMediaCategory']),
        'convertJpegTo'               => $convert_jpeg_to,
    );
}

/**
 * Registriert die REST-Routen für diese Option.
 */
function ud_settings_media_settings_register_rest_routes() {
    register_rest_route(
        'ud-settings/v1',
        '/media-settings',
        array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'ud_settings_media_settings_rest_get_data',
            'permission_callback' => 'ud_settings_media_settings_rest_permissions',
        )
    );

    register_rest_route(
        'ud-settings/v1',
        '/media-settings',
        array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => 'ud_settings_media_settings_rest_update_data',
            'permission_callback' => 'ud_settings_media_settings_rest_permissions',
            'args'                => array(
                'settings' => array(
                    'type'     => 'object',
                    'required' => true,
                ),
            ),
        )
    );
}
add_action('rest_api_init', 'ud_settings_media_settings_register_rest_routes');

/**
 * Prüft REST-Berechtigungen.
 *
 * @return bool
 */
function ud_settings_media_settings_rest_permissions() {
    return current_user_can('manage_options');
}

/**
 * Gibt die gespeicherten Medien-Einstellungen zurück.
 *
 * @return WP_REST_Response
 */
function ud_settings_media_settings_rest_get_data() {
    return rest_ensure_response(
        array(
            'settings' => ud_settings_media_settings_get_settings(),
        )
    );
}

/**
 * Speichert die Medien-Einstellungen.
 *
 * @param WP_REST_Request $request REST Request.
 *
 * @return WP_REST_Response
 */
function ud_settings_media_settings_rest_update_data(WP_REST_Request $request) {
    $settings = $request->get_param('settings');
    $settings = ud_settings_media_settings_sanitize_settings($settings);

    update_option(UD_SETTINGS_OPTION_MEDIA_SETTINGS, $settings);

    return rest_ensure_response(
        array(
            'success'  => true,
            'settings' => $settings,
        )
    );
}

/**
 * Begrenzt grosse Uploads optional automatisch auf 2560 px.
 *
 * @param int|false $threshold Schwellwert.
 *
 * @return int|false
 */
function ud_settings_media_settings_big_image_size_threshold($threshold) {
    $settings = ud_settings_media_settings_get_settings();

    if (! empty($settings['disableBigImageThreshold'])) {
        return false;
    }

    if (! empty($settings['limitLargeImagesTo2560'])) {
        return 2560;
    }

    return $threshold;
}
add_filter('big_image_size_threshold', 'ud_settings_media_settings_big_image_size_threshold');


/**
 * Registriert die Bildgrösse „Maximale Grösse“.
 */
function ud_settings_media_settings_register_image_sizes() {
    add_image_size('maximale-groesse', 2560, 9999, false);
}
add_action('after_setup_theme', 'ud_settings_media_settings_register_image_sizes');

/**
 * Macht die Bildgrösse in der Mediathek auswählbar.
 *
 * @param array $sizes Bildgrössen.
 *
 * @return array
 */
function ud_settings_media_settings_image_size_names_choose($sizes) {
    return array_merge(
        $sizes,
        array(
            'maximale-groesse' => __('Maximale Grösse', 'ud-settings'),
        )
    );
}
add_filter('image_size_names_choose', 'ud_settings_media_settings_image_size_names_choose');

/**
 * Setzt die Standard-Bildgrösse im Block-Editor.
 *
 * @param array $settings Editor-Einstellungen.
 *
 * @return array
 */
function ud_settings_media_settings_block_editor_settings($settings) {
    $media_settings = ud_settings_media_settings_get_settings();

    if (! empty($media_settings['useMaxImageSizeInEditor'])) {
        $settings['imageDefaultSize'] = 'maximale-groesse';
    }

    if (! empty($media_settings['hideOpenverseMediaCategory'])) {
        $settings['enableOpenverseMediaCategory'] = false;
    }

    return $settings;
}
add_filter('block_editor_settings_all', 'ud_settings_media_settings_block_editor_settings');


/**
 * Erlaubt SVG/SVGZ Uploads.
 *
 * @param array $upload_mimes Erlaubte MIME-Types.
 *
 * @return array
 */
function ud_settings_media_settings_upload_mimes($upload_mimes) {
    $settings = ud_settings_media_settings_get_settings();

    if (empty($settings['allowSvgUpload'])) {
        return $upload_mimes;
    }

    $upload_mimes['svg']  = 'image/svg+xml';
    $upload_mimes['svgz'] = 'image/svg+xml';

    return $upload_mimes;
}
add_filter('upload_mimes', 'ud_settings_media_settings_upload_mimes');

/**
 * Konvertiert generierte JPEG-Bildgrössen optional zu AVIF oder WebP.
 *
 * @param array $formats Ausgabeformate.
 *
 * @return array
 */
function ud_settings_media_settings_image_output_format($formats) {
    $settings = ud_settings_media_settings_get_settings();

    if ('avif' === $settings['convertJpegTo']) {
        $formats['image/jpeg'] = 'image/avif';
    }

    if ('webp' === $settings['convertJpegTo']) {
        $formats['image/jpeg'] = 'image/webp';
    }

    return $formats;
}
add_filter('image_editor_output_format', 'ud_settings_media_settings_image_output_format');

/**
 * Legt die Qualität für generierte Bildformate fest.
 *
 * @param int    $quality   Qualität.
 * @param string $mime_type MIME-Type.
 *
 * @return int
 */
function ud_settings_media_settings_image_quality($quality, $mime_type) {
    if ('image/avif' === $mime_type) {
        return 100;
    }

    if ('image/webp' === $mime_type) {
        return 95;
    }

    if ('image/jpeg' === $mime_type) {
        return 85;
    }

    return $quality;
}
add_filter('wp_editor_set_quality', 'ud_settings_media_settings_image_quality', 10, 2);
