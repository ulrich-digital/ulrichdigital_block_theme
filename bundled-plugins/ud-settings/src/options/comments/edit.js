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

const REST_ENDPOINT = "/ud-settings/v1/comments";

const DEFAULT_SETTINGS = {
	disableComments: false,
};

const COMMENT_OPTIONS = [
	{
		key: "disableComments",
		title: __("Kommentar-Funktion deaktivieren", "ud-settings"),
		description: __(
			"Deaktiviert Kommentare und Trackbacks im Frontend, entfernt Kommentarbereiche aus Post Types, blendet bestehende Kommentare aus und entfernt Kommentar-Menüs aus dem WordPress-Admin.",
			"ud-settings"
		),
	},
];

function normalizeSettings(settings = {}) {
	return {
		...DEFAULT_SETTINGS,
		...settings,
		disableComments: !!settings.disableComments,
	};
}

export default function CommentsOption() {
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

			setSettings(normalizeSettings(response));
		} catch (error) {
			setNotice({
				status: "error",
				message:
					error?.message ||
					__(
						"Die Kommentar-Einstellung konnte nicht geladen werden.",
						"ud-settings"
					),
			});
		} finally {
			setIsLoading(false);
		}
	};

	const saveSettings = async () => {
		setIsSaving(true);
		setNotice(null);

		try {
			const response = await apiFetch({
				path: REST_ENDPOINT,
				method: "POST",
				data: settings,
			});

			setSettings(normalizeSettings(response));

			setNotice({
				status: "success",
				message: __(
					"Die Kommentar-Einstellung wurde gespeichert. Die Seite wird neu geladen.",
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
						"Die Kommentar-Einstellung konnte nicht gespeichert werden.",
						"ud-settings"
					),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const updateSetting = (key, value) => {
		setSettings((currentSettings) => ({
			...currentSettings,
			[key]: value,
		}));
	};

	if (isLoading) {
		return (
			<Card className="ud-settings-card">
				<CardBody>
					<div className="ud-settings-option ud-settings-option--comments">
						<div className="option-loading">
							<Spinner />
							<p>
								{__(
									"Kommentar-Einstellung wird geladen ...",
									"ud-settings"
								)}
							</p>
						</div>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card className="ud-settings-card">
			<CardBody>
				<div className="ud-settings-option ud-settings-option--comments">
					<header className="option-header">
						<div className="option-intro">
							<h2 className="option-title">
								{__("Kommentare", "ud-settings")}
							</h2>

							<p className="option-description">
								{__(
									"Hier kann die Kommentar-Funktion global deaktiviert und die Admin-Oberfläche entsprechend bereinigt werden.",
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
						{COMMENT_OPTIONS.map((option) => {
							const isActive = !!settings[option.key];

							return (
								<label
									key={option.key}
									className={
										isActive
											? "setting-row setting-row--checkbox is-active"
											: "setting-row setting-row--checkbox"
									}
								>
									<div className="setting-control">
										<CheckboxControl
											checked={isActive}
											onChange={(value) =>
												updateSetting(option.key, value)
											}
											__next40pxDefaultSize={true}
											__nextHasNoMarginBottom={true}
										/>
									</div>

									<div className="setting-content">
										<h3 className="setting-title">
											{option.title}
										</h3>

										<p className="setting-description">
											{option.description}
										</p>
									</div>

									<span className="setting-meta">
										{isActive
											? __("Aktiv", "ud-settings")
											: __("Inaktiv", "ud-settings")}
									</span>
								</label>
							);
						})}
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