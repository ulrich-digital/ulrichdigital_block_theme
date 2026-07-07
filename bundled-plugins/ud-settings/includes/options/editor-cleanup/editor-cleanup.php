<?php
/**
 * Editor-Bereinigung.
 *
 * Steuert Einstellungen, mit denen Werkzeuge, Formatierungsoptionen
 * und Vorlagen im Block Editor gezielt reduziert werden können.
 */

if (! defined('ABSPATH')) {
	exit;
}

const UD_SETTINGS_EDITOR_CLEANUP_OPTION = 'ud_settings_editor_cleanup';

if (! defined('UD_SETTINGS_OPTION_DISABLE_CORE_BLOCK_PATTERNS')) {
	define('UD_SETTINGS_OPTION_DISABLE_CORE_BLOCK_PATTERNS', 'ud_settings_disable_core_block_patterns');
}

if (! defined('UD_SETTINGS_OPTION_DISABLE_REMOTE_BLOCK_PATTERNS')) {
	define('UD_SETTINGS_OPTION_DISABLE_REMOTE_BLOCK_PATTERNS', 'ud_settings_disable_remote_block_patterns');
}

/**
 * Standardwerte für die Editor-Bereinigung.
 *
 * @return array
 */
function ud_settings_get_editor_cleanup_defaults() {
	return array(
		'disableCoreBlockPatterns'   => true,
		'disableRemoteBlockPatterns' => true,
		'hiddenFormatting'           => array(
			'core/heading' => array(
				'bold'   => false,
				'italic' => false,
				'link'   => false,
				'more'   => false,
			),
		),
	);
}

/**
 * Einstellungen der Editor-Bereinigung bereinigen.
 *
 * @param mixed $settings Eingehende Einstellungen.
 * @return array
 */
function ud_settings_sanitize_editor_cleanup_settings($settings) {
	$defaults = ud_settings_get_editor_cleanup_defaults();

	if (! is_array($settings)) {
		return $defaults;
	}

	$sanitized = $defaults;

	$sanitized['disableCoreBlockPatterns'] = array_key_exists('disableCoreBlockPatterns', $settings)
		? ! empty($settings['disableCoreBlockPatterns'])
		: $defaults['disableCoreBlockPatterns'];

	$sanitized['disableRemoteBlockPatterns'] = array_key_exists('disableRemoteBlockPatterns', $settings)
		? ! empty($settings['disableRemoteBlockPatterns'])
		: $defaults['disableRemoteBlockPatterns'];

	if (
		isset($settings['hiddenFormatting']) &&
		is_array($settings['hiddenFormatting'])
	) {
		foreach ($defaults['hiddenFormatting'] as $block_name => $formats) {
			foreach ($formats as $format_key => $default_value) {
				$sanitized['hiddenFormatting'][$block_name][$format_key] = ! empty(
					$settings['hiddenFormatting'][$block_name][$format_key]
				);
			}
		}
	}

	return $sanitized;
}

/**
 * Prüft, ob mindestens eine Formatierungsoption aktiv ist.
 *
 * @param array $settings Editor-Bereinigungseinstellungen.
 * @return bool
 */
function ud_settings_editor_cleanup_has_active_hidden_formatting($settings) {
	if (
		empty($settings['hiddenFormatting']) ||
		! is_array($settings['hiddenFormatting'])
	) {
		return false;
	}

	foreach ($settings['hiddenFormatting'] as $formats) {
		if (! is_array($formats)) {
			continue;
		}

		foreach ($formats as $is_hidden) {
			if (! empty($is_hidden)) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Berechtigungsprüfung für die REST-Routen.
 *
 * @return bool
 */
function ud_settings_editor_cleanup_rest_permission_callback() {
	return current_user_can('manage_options');
}

/**
 * REST-Routen für die Editor-Bereinigung registrieren.
 *
 * @return void
 */
function ud_settings_register_editor_cleanup_rest_routes() {
	register_rest_route(
		'ud-settings/v1',
		'/editor-cleanup',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'ud_settings_get_editor_cleanup_rest',
			'permission_callback' => 'ud_settings_editor_cleanup_rest_permission_callback',
		)
	);

	register_rest_route(
		'ud-settings/v1',
		'/editor-cleanup',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'ud_settings_save_editor_cleanup_rest',
			'permission_callback' => 'ud_settings_editor_cleanup_rest_permission_callback',
		)
	);
}
add_action('rest_api_init', 'ud_settings_register_editor_cleanup_rest_routes');

/**
 * Editor-Bereinigung über REST laden.
 *
 * @return WP_REST_Response
 */
function ud_settings_get_editor_cleanup_rest() {
	$settings = get_option(
		UD_SETTINGS_EDITOR_CLEANUP_OPTION,
		ud_settings_get_editor_cleanup_defaults()
	);

	if (! is_array($settings)) {
		$settings = array();
	}

	$settings['disableCoreBlockPatterns'] = (bool) get_option(
		UD_SETTINGS_OPTION_DISABLE_CORE_BLOCK_PATTERNS,
		true
	);

	$settings['disableRemoteBlockPatterns'] = (bool) get_option(
		UD_SETTINGS_OPTION_DISABLE_REMOTE_BLOCK_PATTERNS,
		true
	);

	return rest_ensure_response(
		ud_settings_sanitize_editor_cleanup_settings($settings)
	);
}

/**
 * Editor-Bereinigung über REST speichern.
 *
 * @param WP_REST_Request $request REST-Anfrage.
 * @return WP_REST_Response
 */
function ud_settings_save_editor_cleanup_rest($request) {
	$params = $request->get_json_params();

	$settings = ud_settings_sanitize_editor_cleanup_settings($params);

	update_option(UD_SETTINGS_EDITOR_CLEANUP_OPTION, $settings);

	update_option(
		UD_SETTINGS_OPTION_DISABLE_CORE_BLOCK_PATTERNS,
		! empty($settings['disableCoreBlockPatterns'])
	);

	update_option(
		UD_SETTINGS_OPTION_DISABLE_REMOTE_BLOCK_PATTERNS,
		! empty($settings['disableRemoteBlockPatterns'])
	);

	return rest_ensure_response($settings);
}

/**
 * Entfernt WordPress-Standardvorlagen, falls aktiviert.
 *
 * @return void
 */
function ud_settings_editor_cleanup_maybe_disable_core_block_patterns() {
	if (get_option(UD_SETTINGS_OPTION_DISABLE_CORE_BLOCK_PATTERNS, true)) {
		remove_theme_support('core-block-patterns');
	}
}
add_action('after_setup_theme', 'ud_settings_editor_cleanup_maybe_disable_core_block_patterns', 20);

/**
 * Deaktiviert externe Vorlagen aus dem WordPress Pattern Directory, falls aktiviert.
 *
 * @param bool $should_load_remote_block_patterns Ob Remote-Vorlagen geladen werden sollen.
 * @return bool
 */
function ud_settings_editor_cleanup_filter_remote_block_patterns($should_load_remote_block_patterns) {
	if (get_option(UD_SETTINGS_OPTION_DISABLE_REMOTE_BLOCK_PATTERNS, true)) {
		return false;
	}

	return $should_load_remote_block_patterns;
}
add_filter('should_load_remote_block_patterns', 'ud_settings_editor_cleanup_filter_remote_block_patterns');

/**
 * Editor-Bereinigung im Block Editor laden.
 *
 * @return void
 */
function ud_settings_enqueue_editor_cleanup_assets() {
	$settings = get_option(
		UD_SETTINGS_EDITOR_CLEANUP_OPTION,
		ud_settings_get_editor_cleanup_defaults()
	);

	$settings = ud_settings_sanitize_editor_cleanup_settings($settings);

	if (! ud_settings_editor_cleanup_has_active_hidden_formatting($settings)) {
		return;
	}

	wp_register_script(
		'ud-settings-editor-cleanup',
		'',
		array('wp-data', 'wp-dom-ready'),
		UD_SETTINGS_VERSION,
		true
	);

	wp_enqueue_script('ud-settings-editor-cleanup');

	wp_add_inline_script(
		'ud-settings-editor-cleanup',
		'window.udSettingsEditorCleanup = ' . wp_json_encode($settings) . ';',
		'before'
	);

	wp_add_inline_script(
		'ud-settings-editor-cleanup',
		<<<'JS'
(function (wp, settings) {
	if (!wp || !wp.data || !wp.domReady || !settings) {
		return;
	}

	const FORMAT_LABELS = {
		bold: [
			"bold",
			"fett"
		],
		italic: [
			"italic",
			"kursiv"
		],
		link: [
			"link"
		],
		more: [
			"more",
			"mehr",
			"weitere"
		]
	};

	let timeout = null;

	function getSelectedBlockName() {
		const blockEditor = wp.data.select("core/block-editor");

		if (!blockEditor || typeof blockEditor.getSelectedBlock !== "function") {
			return "";
		}

		const selectedBlock = blockEditor.getSelectedBlock();

		return selectedBlock && selectedBlock.name ? selectedBlock.name : "";
	}

	function getHiddenFormattingForSelectedBlock() {
		const blockName = getSelectedBlockName();

		if (!blockName || !settings.hiddenFormatting) {
			return {};
		}

		return settings.hiddenFormatting[blockName] || {};
	}

	function resetHiddenToolbarButtons() {
		document
			.querySelectorAll("[data-ud-settings-editor-cleanup-hidden]")
			.forEach((element) => {
				element.style.removeProperty("display");
				element.removeAttribute("data-ud-settings-editor-cleanup-hidden");
			});
	}

	function hideEmptyToolbarGroups() {
		document
			.querySelectorAll(".block-editor-block-toolbar .components-toolbar-group")
			.forEach((group) => {
				const visibleButtons = Array.from(
					group.querySelectorAll("button")
				).filter((button) => {
					return window.getComputedStyle(button).display !== "none";
				});

				if (visibleButtons.length > 0) {
					return;
				}

				group.style.display = "none";
				group.setAttribute("data-ud-settings-editor-cleanup-hidden", "true");
			});
	}

	function isToolbarButton(button) {
		return !!button.closest(
			".block-editor-block-toolbar, .components-toolbar, .components-toolbar-group, .components-popover"
		);
	}

	function buttonMatchesFormat(button, formatKey) {
		const label = [
			button.getAttribute("aria-label") || "",
			button.getAttribute("title") || ""
		]
			.join(" ")
			.toLowerCase();

		const matches = FORMAT_LABELS[formatKey] || [];

		return matches.some((match) => label.includes(match));
	}

	function applyEditorCleanup() {
		resetHiddenToolbarButtons();

		const hiddenFormatting = getHiddenFormattingForSelectedBlock();

		const activeFormatKeys = Object.keys(hiddenFormatting).filter(
			(formatKey) => !!hiddenFormatting[formatKey]
		);

		if (!activeFormatKeys.length) {
			return;
		}

		document
			.querySelectorAll("button[aria-label], button[title]")
			.forEach((button) => {
				if (!isToolbarButton(button)) {
					return;
				}

				const shouldHide = activeFormatKeys.some((formatKey) =>
					buttonMatchesFormat(button, formatKey)
				);

				if (!shouldHide) {
					return;
				}

				button.style.display = "none";
				button.setAttribute("data-ud-settings-editor-cleanup-hidden", "true");
			});

		hideEmptyToolbarGroups();
	}

	function scheduleEditorCleanup() {
		window.clearTimeout(timeout);

		timeout = window.setTimeout(() => {
			applyEditorCleanup();
		}, 50);
	}

	wp.domReady(() => {
		applyEditorCleanup();

		wp.data.subscribe(scheduleEditorCleanup);

		const observer = new MutationObserver(scheduleEditorCleanup);

		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["aria-label", "title", "class"]
		});
	});
})(window.wp, window.udSettingsEditorCleanup || {});
JS
	);
}
add_action('enqueue_block_editor_assets', 'ud_settings_enqueue_editor_cleanup_assets');