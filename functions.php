<?php
/* =============================================================== *\
   WP-Head
\* =============================================================== */
add_action('wp_head', function () { ?>
    <meta name="viewport" content="width=device-width" />
    <meta name="robots" content="index, follow">
<?php

});

/* =============================================================== *\
   wp-config.php anpassen
   define('WP_POST_REVISIONS', 20);
\* =============================================================== */

/* =============================================================== *\
    UD-Settings installieren
\* =============================================================== */
require_once get_stylesheet_directory() . '/inc/bundled-plugins.php';

/* =============================================================== *\
   Add Styles
\* =============================================================== */

/* Frontend only */
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style(
        'ud-theme-frontend',
        get_stylesheet_directory_uri() . '/build/frontend.css',
        array('ud-theme-shared'),
        filemtime(get_stylesheet_directory() . '/build/frontend.css')
    );
});

/* Frontend + Editor */
add_action('enqueue_block_assets', function () {

    wp_enqueue_style(
        'ud-fontawesome',
        get_stylesheet_directory_uri() . '/assets/libs/fontawesome/fontawesome.bundle.css',
        array(),
        filemtime(get_stylesheet_directory() . '/assets/libs/fontawesome/fontawesome.bundle.css')
    );

    wp_enqueue_style(
        'ud-theme-shared',
        get_stylesheet_directory_uri() . '/build/shared.css',
        array('ud-fontawesome'),
        filemtime(get_stylesheet_directory() . '/build/shared.css')
    );

    /* Editor only */
    if (is_admin()) {
        wp_enqueue_style(
            'ud-theme-editor',
            get_stylesheet_directory_uri() . '/build/editor.css',
            array('ud-theme-shared'),
            filemtime(get_stylesheet_directory() . '/build/editor.css')
        );
    }
});

/* Backend */
add_action('admin_enqueue_scripts', function () {
	$screen = function_exists('get_current_screen') ? get_current_screen() : null;

	if ($screen && method_exists($screen, 'is_block_editor') && $screen->is_block_editor()) {
		return;
	}

	$shared_css_path = get_stylesheet_directory() . '/build/shared.css';

	if (!file_exists($shared_css_path)) {
		return;
	}

	wp_enqueue_style(
		'ud-theme-shared-admin',
		get_stylesheet_directory_uri() . '/build/shared.css',
		array(),
		filemtime($shared_css_path)
	);
});


/* =============================================================== *\
   Add Scripts
\* =============================================================== */

/* Frontend */
add_action('wp_enqueue_scripts', function () {

    wp_enqueue_script(
        'ud-theme-shared',
        get_stylesheet_directory_uri() . '/build/shared.js',
        array(),
        filemtime(get_stylesheet_directory() . '/build/shared.js'),
        true
    );

    wp_enqueue_script(
        'ud-theme-frontend',
        get_stylesheet_directory_uri() . '/build/frontend.js',
        array('ud-theme-shared'),
        filemtime(get_stylesheet_directory() . '/build/frontend.js'),
        true
    );
});

/* Editor */
add_action('enqueue_block_editor_assets', function () {

    wp_enqueue_script(
        'ud-theme-shared',
        get_stylesheet_directory_uri() . '/build/shared.js',
        array(),
        filemtime(get_stylesheet_directory() . '/build/shared.js'),
        true
    );

    wp_enqueue_script(
        'ud-theme-editor',
        get_stylesheet_directory_uri() . '/build/editor.js',
        array(
            'ud-theme-shared', // wichtig!
            'wp-blocks',
            'wp-dom-ready',
            'wp-data',
        ),
        filemtime(get_stylesheet_directory() . '/build/editor.js'),
        true
    );
});


/* =============================================================== *\
   Custom Admin-Logo
\* =============================================================== */
add_action('login_enqueue_scripts', 'my_login_logo');
function my_login_logo() { ?>
    <style type="text/css">
        #login h1 a,
        .login h1 a {
            background-image: url(<?php echo get_stylesheet_directory_uri(); ?>/images/ulrich_digital_schriftzug_inter.svg);
            padding-bottom: 60px;
            width: 320px;
            background-repeat: no-repeat;
            background-size: 250px auto;
        }
    </style>
<?php }


/* =============================================================== *\
   Custom Admin-Logo link to Home URL
\* =============================================================== */
function my_login_logo_url() {
    return home_url();
}
add_filter('login_headerurl', 'my_login_logo_url');


/* =============================================================== *\
 	 Custom-Logo
\* =============================================================== */
//add_theme_support( 'custom-logo' );
function uldi_custom_logo_setup() {
    $defaults = array(
        'height'               => 100,
        'width'                => 400,
        'flex-height'          => true,
        'flex-width'           => true,
        'header-text'          => array('site-title', 'site-description'),
        'unlink-homepage-logo' => false,
    );

    add_theme_support('custom-logo', $defaults);
}
add_action('after_setup_theme', 'uldi_custom_logo_setup');

function get_custom_logo_callback($html) {
    if (has_custom_logo()) {
        return $html;
    } else {
        return '<h3>Logo</h3>';
    }
}
add_filter('get_custom_logo', 'get_custom_logo_callback');

/* =============================================================== *\
   Add Custom Admin Footer
\* =============================================================== */
function backend_entwickelt_mit_herz($text) {
    return ('<span style="color:black;">Entwickelt mit </span><span style="color: red;font-size:20px;vertical-align:-3px">&hearts;</span><span style="color:black;"</span><span> von <a href="https://ulrich.digital" target="_blank">ulrich.digital</a></span>');
}
add_filter('admin_footer_text', 'backend_entwickelt_mit_herz');


/* =============================================================== *\
   Add is_frontend Class to body
\* =============================================================== */
if (!is_admin()):
    add_filter('body_class', function ($classes) {
        return array_merge($classes, array('is_frontend'));
    });
endif;
?>