import apiFetch from "@wordpress/api-fetch";
import {
	Button,
	Card,
	CardBody,
	CheckboxControl,
	Notice,
	RadioControl,
	Spinner,
} from "@wordpress/components";
import { useEffect, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";

const REST_ENDPOINT = "/ud-settings/v1/media-settings";

const DEFAULT_SETTINGS = {
	allowSvgUpload: false,
	limitLargeImagesTo2560: false,
	disableBigImageThreshold: false,
	useMaxImageSizeInEditor: false,
	convertJpegTo: "",
};

const BOOLEAN_OPTIONS = [
	{
		key: "allowSvgUpload",
		title: __("SVG/SVGZ Upload erlauben", "ud-settings"),
		description: __(
			"Erlaubt den Upload von SVG- und SVGZ-Dateien in der WordPress-Mediathek.",
			"ud-settings"
		),
	},
	{
		key: "limitLargeImagesTo2560",
		title: __("Grosse Bilder automatisch auf 2560 px begrenzen", "ud-settings"),
		description: __(
			"Skaliert sehr grosse Uploads automatisch auf maximal 2560 px herunter. Das reduziert Dateigrösse und Speicherverbrauch.",
			"ud-settings"
		),
	},
	{
		key: "disableBigImageThreshold",
		title: __("WordPress-Skalierung für grosse Bilder deaktivieren", "ud-settings"),
		description: __(
			"Deaktiviert die automatische WordPress-Begrenzung für sehr grosse Bilder. Die Originaldatei bleibt dadurch unverändert gross. Nur verwenden, wenn die Originalgrösse bewusst erhalten bleiben soll.",
			"ud-settings"
		),
	},
	{
		key: "useMaxImageSizeInEditor",
		title: __("Im Editor standardmässig „Maximale Grösse“ einfügen", "ud-settings"),
		description: __(
			"Setzt beim Einfügen von Bildern im Block Editor automatisch die Bildgrösse „Maximale Grösse“.",
			"ud-settings"
		),
	},
];

const JPEG_FORMAT_OPTIONS = [
	{
		label: __("Nicht konvertieren", "ud-settings"),
		value: "",
	},
	{
		label: __("JPEG zu AVIF konvertieren", "ud-settings"),
		value: "avif",
	},
	{
		label: __("JPEG zu WebP konvertieren", "ud-settings"),
		value: "webp",
	},
];

function normalizeSettings(settings = {}) {
	const convertJpegTo = ["", "avif", "webp"].includes(settings.convertJpegTo)
		? settings.convertJpegTo
		: "";

	return {
		...DEFAULT_SETTINGS,
		...settings,
		allowSvgUpload: !!settings.allowSvgUpload,
		limitLargeImagesTo2560: !!settings.limitLargeImagesTo2560,
		disableBigImageThreshold: !!settings.disableBigImageThreshold,
		useMaxImageSizeInEditor: !!settings.useMaxImageSizeInEditor,
		convertJpegTo,
	};
}

function getBooleanStatus(value) {
	return value ? __("Aktiv", "ud-settings") : __("Inaktiv", "ud-settings");
}

function getJpegConversionStatus(value) {
	if (!value) {
		return __("Inaktiv", "ud-settings");
	}

	return value.toUpperCase();
}

export default function MediaSettingsOption() {
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

			setSettings(normalizeSettings(response.settings || {}));
		} catch (error) {
			setNotice({
				status: "error",
				message:
					error?.message ||
					__(
						"Die Medien-Einstellungen konnten nicht geladen werden.",
						"ud-settings"
					),
			});
		} finally {
			setIsLoading(false);
		}
	};

	const updateSetting = (key, value) => {
		setSettings((currentSettings) => {
			const newSettings = {
				...currentSettings,
				[key]: value,
			};

			if (key === "disableBigImageThreshold" && value) {
				newSettings.limitLargeImagesTo2560 = false;
			}

			if (key === "limitLargeImagesTo2560" && value) {
				newSettings.disableBigImageThreshold = false;
			}

			return newSettings;
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

			setNotice({
				status: "success",
				message: __(
					"Die Medien-Einstellungen wurden gespeichert.",
					"ud-settings"
				),
			});
		} catch (error) {
			setNotice({
				status: "error",
				message:
					error?.message ||
					__(
						"Die Medien-Einstellungen konnten nicht gespeichert werden.",
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
					<div className="ud-settings-option ud-settings-option--media">
						<div className="option-loading">
							<Spinner />
							<p>
								{__(
									"Medien-Einstellungen werden geladen ...",
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
				<div className="ud-settings-option ud-settings-option--media">
					<header className="option-header">
						<div className="option-intro">
							<h2 className="option-title">
								{__("Medien", "ud-settings")}
							</h2>

							<p className="option-description">
								{__(
									"Hier können Uploads und die Verarbeitung generierter Bildgrössen gesteuert werden.",
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
						{BOOLEAN_OPTIONS.map((option) => {
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
										{getBooleanStatus(isActive)}
									</span>
								</label>
							);
						})}

						<div
							className={
								settings.convertJpegTo
									? "setting-row setting-row--radio is-active"
									: "setting-row setting-row--radio"
							}
						>
							<div className="setting-content">
								<h3 className="setting-title">
									{__(
										"JPEG zu modernem Format konvertieren",
										"ud-settings"
									)}
								</h3>

								<p className="setting-description">
									{__(
										"Speichert neu erzeugte WordPress-Bilddateien von JPEGs wahlweise als AVIF oder WebP. Die hochgeladene Originaldatei bleibt unverändert.",
										"ud-settings"
									)}
								</p>
							</div>

							<div className="setting-control">
								<RadioControl
									selected={settings.convertJpegTo}
									options={JPEG_FORMAT_OPTIONS}
									onChange={(value) =>
										updateSetting("convertJpegTo", value)
									}
									__next40pxDefaultSize={true}
									__nextHasNoMarginBottom={true}
								/>
							</div>

							<span className="setting-meta">
								{getJpegConversionStatus(settings.convertJpegTo)}
							</span>
						</div>
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