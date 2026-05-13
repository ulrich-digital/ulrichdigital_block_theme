import apiFetch from "@wordpress/api-fetch";
import {
	Button,
	Card,
	CardBody,
	CheckboxControl,
	Notice,
	Spinner,
} from "@wordpress/components";
import { useEffect, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";

const REST_ENDPOINT = "/ud-settings/v1/admin-cleanup";

const DEFAULT_SETTINGS = {
	removeWpLogo: false,
	removeNewContent: false,
	removeArchive: false,
	hideDashboardWidgets: false,
};

const CLEANUP_OPTIONS = [
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
	{
		key: "hideDashboardWidgets",
		title: __("Dashboard-Boxen ausblenden", "ud-settings"),
		description: __(
			"Blendet ausgewählte WordPress-Dashboard-Boxen standardmässig aus.",
			"ud-settings"
		),
	},
];

export default function AdminCleanupOption() {
	const [settings, setSettings] = useState(DEFAULT_SETTINGS);
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

			setSettings({
				...DEFAULT_SETTINGS,
				...(response.settings || {}),
			});
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
		setSettings((currentSettings) => {
			return {
				...currentSettings,
				[key]: value,
			};
		});
	};

	const enableAll = () => {
		setSettings(
			Object.keys(DEFAULT_SETTINGS).reduce((newSettings, key) => {
				return {
					...newSettings,
					[key]: true,
				};
			}, {})
		);
	};

	const disableAll = () => {
		setSettings(DEFAULT_SETTINGS);
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

			setSettings({
				...DEFAULT_SETTINGS,
				...(response.settings || {}),
			});

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

	if (isLoading) {
		return (
			<Card className="ud-settings-card">
				<CardBody>
					<div className="ud-settings-admin-cleanup__loading">
						<Spinner />
						<p>
							{__(
								"Admin-Einstellung wird geladen ...",
								"ud-settings"
							)}
						</p>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card className="ud-settings-card">
			<CardBody>
				<div className="ud-settings-section-header">
					<div>
						<h2>{__("Admin-Oberfläche", "ud-settings")}</h2>
						<p>
							{__(
								"Hier kann die WordPress-Admin-Oberfläche vereinfacht werden.",
								"ud-settings"
							)}
						</p>
					</div>

					<div className="ud-settings-admin-cleanup__actions">
						<Button
							variant="secondary"
							onClick={enableAll}
							disabled={isSaving}
							__next40pxDefaultSize={true}
						>
							{__("Alle aktivieren", "ud-settings")}
						</Button>

						<Button
							variant="secondary"
							onClick={disableAll}
							disabled={isSaving}
							__next40pxDefaultSize={true}
						>
							{__("Alle deaktivieren", "ud-settings")}
						</Button>

						<Button
							variant="primary"
							onClick={saveSettings}
							isBusy={isSaving}
							disabled={isSaving}
							__next40pxDefaultSize={true}
						>
							{__("Speichern", "ud-settings")}
						</Button>
					</div>
				</div>

				{notice && (
					<Notice
						status={notice.status}
						onRemove={() => setNotice(null)}
					>
						{notice.message}
					</Notice>
				)}

				<div className="ud-settings-admin-cleanup__list">
					{CLEANUP_OPTIONS.map((option) => {
						const isActive = !!settings[option.key];

						return (
							<label
								className={
									isActive
										? "ud-settings-choice is-active"
										: "ud-settings-choice"
								}
								key={option.key}
							>
								<CheckboxControl
									checked={isActive}
									onChange={(value) =>
										updateSetting(option.key, value)
									}
									__nextHasNoMarginBottom={true}
								/>

								<span className="ud-settings-choice__content">
									<span className="ud-settings-choice__title">
										{option.title}
									</span>

									<span className="ud-settings-choice__description">
										{option.description}
									</span>
								</span>

								<span className="ud-settings-status">
									{isActive
										? __("Aktiv", "ud-settings")
										: __("Inaktiv", "ud-settings")}
								</span>
							</label>
						);
					})}
				</div>
			</CardBody>
		</Card>
	);
}