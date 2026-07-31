import apiFetch from "@wordpress/api-fetch";
import {
	Button,
	Card,
	CardBody,
	CheckboxControl,
	Notice,
	Spinner,
	TextControl,
} from "@wordpress/components";
import { useEffect, useState } from "@wordpress/element";
import { __, sprintf } from "@wordpress/i18n";

const REST_ENDPOINT = "/ud-settings/v1/admin-cleanup";

const DEFAULT_SETTINGS = {
	removeWpLogo: false,
	removeNewContent: false,
	removeArchive: false,

	hideDashboardWidgets: false,
	hiddenDashboardWidgets: [],

	renamePosts: false,
	postSingularName: "Beitrag",
	postPluralName: "Beiträge",
	hidePostsMenu: false,
};

const ADMIN_BAR_OPTIONS = [
	{
		key: "removeWpLogo",
		title: __("WordPress-Logo entfernen", "ud-settings"),
		description: __(
			"Entfernt das WordPress-Logo oben links aus der Admin-Bar.",
			"ud-settings"
		),
	},
	{
		key: "removeNewContent",
		title: __("„Neu“-Menü entfernen", "ud-settings"),
		description: __(
			"Entfernt das Menü zum schnellen Erstellen neuer Inhalte aus der Admin-Bar.",
			"ud-settings"
		),
	},
	{
		key: "removeArchive",
		title: __("Archiv-Link entfernen", "ud-settings"),
		description: __(
			"Entfernt den Archiv-Link aus der Admin-Bar, falls dieser vorhanden ist.",
			"ud-settings"
		),
	},
];

function normalizeSettings(settings = {}) {
	return {
		...DEFAULT_SETTINGS,
		...settings,
		removeWpLogo: !!settings.removeWpLogo,
		removeNewContent: !!settings.removeNewContent,
		removeArchive: !!settings.removeArchive,
		hideDashboardWidgets: !!settings.hideDashboardWidgets,
		hiddenDashboardWidgets: Array.isArray(settings.hiddenDashboardWidgets)
			? settings.hiddenDashboardWidgets
			: [],
		renamePosts: !!settings.renamePosts,
		postSingularName:
			typeof settings.postSingularName === "string"
				? settings.postSingularName
				: DEFAULT_SETTINGS.postSingularName,
		postPluralName:
			typeof settings.postPluralName === "string"
				? settings.postPluralName
				: DEFAULT_SETTINGS.postPluralName,
		hidePostsMenu: !!settings.hidePostsMenu,
	};
}

function getVisibilityStatus(value) {
	return value
		? __("Ausgeblendet", "ud-settings")
		: __("Angezeigt", "ud-settings");
}

function getBooleanStatus(value) {
	return value ? __("Aktiv", "ud-settings") : __("Inaktiv", "ud-settings");
}

export default function AdminCleanupOption() {
	const [settings, setSettings] = useState(DEFAULT_SETTINGS);
	const [dashboardWidgets, setDashboardWidgets] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [notice, setNotice] = useState(null);

	useEffect(() => {
		loadSettings();
	}, []);

	const loadSettings = async () => {
		setIsLoading(true);
		setNotice(null);

		try {
			const response = await apiFetch({
				path: REST_ENDPOINT,
			});

			setSettings(normalizeSettings(response.settings || {}));
			setDashboardWidgets(response.dashboardWidgets || []);
		} catch (error) {
			setNotice({
				status: "error",
				message:
					error?.message ||
					__(
						"Die Admin-Einstellung konnte nicht geladen werden.",
						"ud-settings"
					),
			});
		} finally {
			setIsLoading(false);
		}
	};

	const updateSetting = (key, value) => {
		setSettings((currentSettings) => ({
			...currentSettings,
			[key]: value,
		}));
	};

	const toggleDashboardWidget = (widgetId) => {
		setSettings((currentSettings) => {
			const currentWidgets = currentSettings.hiddenDashboardWidgets || [];
			const isSelected = currentWidgets.includes(widgetId);

			return {
				...currentSettings,
				hiddenDashboardWidgets: isSelected
					? currentWidgets.filter((id) => id !== widgetId)
					: [...currentWidgets, widgetId],
			};
		});
	};

	const saveSettings = async () => {
		setIsSaving(true);
		setNotice(null);

		try {
			const response = await apiFetch({
				path: REST_ENDPOINT,
				method: "POST",
				data: {
					settings,
				},
			});

			setSettings(normalizeSettings(response.settings || {}));

			if (response.dashboardWidgets) {
				setDashboardWidgets(response.dashboardWidgets);
			}

			setNotice({
				status: "success",
				message: __(
					"Die Admin-Einstellung wurde gespeichert. Die Seite wird neu geladen.",
					"ud-settings"
				),
			});

			window.setTimeout(() => {
				window.location.reload();
			}, 700);
		} catch (error) {
			setNotice({
				status: "error",
				message:
					error?.message ||
					__(
						"Die Admin-Einstellung konnte nicht gespeichert werden.",
						"ud-settings"
					),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const adminBarActiveCount = ADMIN_BAR_OPTIONS.filter((option) => {
		return !!settings[option.key];
	}).length;

	const hiddenDashboardWidgets = settings.hiddenDashboardWidgets || [];
	const dashboardHiddenCount = settings.hideDashboardWidgets
		? hiddenDashboardWidgets.length
		: 0;

	const postsActiveCount = [
		settings.renamePosts,
		settings.hidePostsMenu,
	].filter(Boolean).length;

	const renderCheckboxSetting = ({
		key,
		title,
		description,
		checked,
		onChange,
		status,
	}) => {
		const isActive = !!checked;

		return (
			<label
				key={key}
				className={
					isActive
						? "setting-row setting-row--checkbox is-active"
						: "setting-row setting-row--checkbox"
				}
			>
				<div className="setting-control">
					<CheckboxControl
						checked={isActive}
						onChange={onChange}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>
				</div>

				<div className="setting-content">
					<h4 className="setting-title">{title}</h4>

					<p className="setting-description">{description}</p>
				</div>

				<span className="setting-meta">{status}</span>
			</label>
		);
	};

	if (isLoading) {
		return (
			<Card className="ud-settings-card">
				<CardBody>
					<div className="ud-settings-option ud-settings-option--admin-cleanup">
						<div className="option-loading">
							<Spinner />
							<p>{__("Admin-Einstellung wird geladen ...", "ud-settings")}</p>
						</div>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card className="ud-settings-card">
			<CardBody>
				<div className="ud-settings-option ud-settings-option--admin-cleanup">
					<header className="option-header">
						<div className="option-intro">
							<h2 className="option-title">
								{__("Admin-Oberfläche", "ud-settings")}
							</h2>

							<p className="option-description">
								{__(
									"Hier können Admin-Bar, Dashboard und der Standard-Inhaltstyp Beiträge vereinfacht oder angepasst werden.",
									"ud-settings"
								)}
							</p>
						</div>
					</header>

					{notice && (
						<div className="option-notice">
							<Notice
								status={notice.status}
								onRemove={() => setNotice(null)}
							>
								{notice.message}
							</Notice>
						</div>
					)}

					<div className="option-body">
						<section className="option-section">
							<div className="section-header">
								<div className="section-intro">
									<h3 className="section-title">
										{__("Admin-Bar", "ud-settings")}
									</h3>

									<p className="section-description">
										{__(
											"Elemente der oberen Admin-Leiste entfernen.",
											"ud-settings"
										)}
									</p>
								</div>

								<span className="section-meta">
									{sprintf(
										__("%d ausgeblendet", "ud-settings"),
										adminBarActiveCount
									)}
								</span>
							</div>

							<div className="section-body">
								{ADMIN_BAR_OPTIONS.map((option) =>
									renderCheckboxSetting({
										key: option.key,
										title: option.title,
										description: option.description,
										checked: !!settings[option.key],
										onChange: (value) =>
											updateSetting(option.key, value),
										status: getVisibilityStatus(
											!!settings[option.key]
										),
									})
								)}
							</div>
						</section>

						<section className="option-section">
							<div className="section-header">
								<div className="section-intro">
									<h3 className="section-title">
										{__("Dashboard", "ud-settings")}
									</h3>

									<p className="section-description">
										{__(
											"Dashboard-Widgets gezielt ausblenden.",
											"ud-settings"
										)}
									</p>
								</div>

								<span className="section-meta">
									{sprintf(
										__("%d ausgeblendet", "ud-settings"),
										dashboardHiddenCount
									)}
								</span>
							</div>

							<div className="section-body">
								{renderCheckboxSetting({
									key: "hideDashboardWidgets",
									title: __(
										"Dashboard-Widgets ausblenden",
										"ud-settings"
									),
									description: __(
										"Aktiviert das gezielte Ausblenden einzelner Dashboard-Widgets.",
										"ud-settings"
									),
									checked: !!settings.hideDashboardWidgets,
									onChange: (value) =>
										updateSetting(
											"hideDashboardWidgets",
											value
										),
									status: getBooleanStatus(
										!!settings.hideDashboardWidgets
									),
								})}

								{settings.hideDashboardWidgets && (
									<div className="option-subsection">
										<div className="subsection-header">
											<h4 className="subsection-title">
												{__("Widget-Auswahl", "ud-settings")}
											</h4>
										</div>

										<div className="subsection-body">
											{dashboardWidgets.length > 0 ? (
												dashboardWidgets.map((widget) => {
													const isSelected =
														hiddenDashboardWidgets.includes(
															widget.id
														);

													return renderCheckboxSetting({
														key: widget.id,
														title: widget.title,
														description: widget.id,
														checked: isSelected,
														onChange: () =>
															toggleDashboardWidget(
																widget.id
															),
														status:
															getVisibilityStatus(
																isSelected
															),
													});
												})
											) : (
												<p className="option-empty">
													{__(
														"Keine Dashboard-Widgets gefunden.",
														"ud-settings"
													)}
												</p>
											)}
										</div>
									</div>
								)}
							</div>
						</section>

						<section className="option-section">
							<div className="section-header">
								<div className="section-intro">
									<h3 className="section-title">
										{__("Beiträge", "ud-settings")}
									</h3>

									<p className="section-description">
										{__(
											"Standard-Inhaltstyp Beiträge umbenennen oder ausblenden.",
											"ud-settings"
										)}
									</p>
								</div>

								<span className="section-meta">
									{sprintf(
										__("%d aktiv", "ud-settings"),
										postsActiveCount
									)}
								</span>
							</div>

							<div className="section-body">
								{renderCheckboxSetting({
									key: "renamePosts",
									title: __("Beiträge umbenennen", "ud-settings"),
									description: __(
										"Passt die Bezeichnung des WordPress-Standard-Inhaltstyps an.",
										"ud-settings"
									),
									checked: !!settings.renamePosts,
									onChange: (value) =>
										updateSetting("renamePosts", value),
									status: getBooleanStatus(
										!!settings.renamePosts
									),
								})}

								{settings.renamePosts && (
									<div className="setting-fields">
										<TextControl
											label={__(
												"Bezeichnung Singular",
												"ud-settings"
											)}
											value={settings.postSingularName}
											onChange={(value) =>
												updateSetting(
													"postSingularName",
													value
												)
											}
											__next40pxDefaultSize={true}
											__nextHasNoMarginBottom={true}
										/>

										<TextControl
											label={__(
												"Bezeichnung Plural",
												"ud-settings"
											)}
											value={settings.postPluralName}
											onChange={(value) =>
												updateSetting(
													"postPluralName",
													value
												)
											}
											__next40pxDefaultSize={true}
											__nextHasNoMarginBottom={true}
										/>
									</div>
								)}

								{renderCheckboxSetting({
									key: "hidePostsMenu",
									title: __(
										"Beiträge im Admin-Menü ausblenden",
										"ud-settings"
									),
									description: __(
										"Entfernt den Menüpunkt Beiträge aus der linken Admin-Navigation.",
										"ud-settings"
									),
									checked: !!settings.hidePostsMenu,
									onChange: (value) =>
										updateSetting("hidePostsMenu", value),
									status: getBooleanStatus(
										!!settings.hidePostsMenu
									),
								})}
							</div>
						</section>
					</div>

					<div className="option-actions">
						<Button
							variant="primary"
							onClick={saveSettings}
							isBusy={isSaving}
							disabled={isSaving}
							__next40pxDefaultSize={true}
							__nextHasNoMarginBottom={true}
						>
							{__("Speichern", "ud-settings")}
						</Button>
					</div>
				</div>
			</CardBody>
		</Card>
	);
}