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
	useMaxImageSizeInEditor: false,
	convertJpegTo: "",
};
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

			setSettings({
				...DEFAULT_SETTINGS,
				...(response.settings || {}),
			});

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
					<div className="ud-settings-media-settings__loading">
						<Spinner />
						<p>
							{__(
								"Medien-Einstellungen werden geladen ...",
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
						<h2>{__("Medien", "ud-settings")}</h2>
						<p>
							{__(
								"Hier können Uploads und die Verarbeitung generierter Bildgrössen gesteuert werden.",
								"ud-settings"
							)}
						</p>
					</div>

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

				{notice && (
					<Notice
						status={notice.status}
						onRemove={() => setNotice(null)}
					>
						{notice.message}
					</Notice>
				)}

				<div className="ud-settings-media-settings__list">
					<label
						className={
							settings.allowSvgUpload
								? "ud-settings-choice is-active"
								: "ud-settings-choice"
						}
					>
						<CheckboxControl
							checked={settings.allowSvgUpload}
							onChange={(value) =>
								updateSetting("allowSvgUpload", value)
							}
							__nextHasNoMarginBottom={true}
						/>

						<span className="ud-settings-choice__content">
							<span className="ud-settings-choice__title">
								{__("SVG/SVGZ Upload erlauben", "ud-settings")}
							</span>

							<span className="ud-settings-choice__description">
								{__(
									"Erlaubt den Upload von SVG- und SVGZ-Dateien in der WordPress-Mediathek.",
									"ud-settings"
								)}
							</span>
						</span>

						<span className="ud-settings-status">
							{settings.allowSvgUpload
								? __("Aktiv", "ud-settings")
								: __("Inaktiv", "ud-settings")}
						</span>
					</label>
					<label
						className={
							settings.limitLargeImagesTo2560
								? "ud-settings-choice is-active"
								: "ud-settings-choice"
						}
					>
						<CheckboxControl
							checked={settings.limitLargeImagesTo2560}
							onChange={(value) =>
								updateSetting("limitLargeImagesTo2560", value)
							}
							__nextHasNoMarginBottom={true}
						/>

						<span className="ud-settings-choice__content">
							<span className="ud-settings-choice__title">
								{__(
									"Grosse Bilder automatisch auf 2560 px begrenzen",
									"ud-settings"
								)}
							</span>

							<span className="ud-settings-choice__description">
								{__(
									"Skaliert sehr grosse Uploads automatisch auf maximal 2560 px herunter. Das reduziert Dateigrösse und Speicherverbrauch.",
									"ud-settings"
								)}
							</span>
						</span>

						<span className="ud-settings-status">
							{settings.limitLargeImagesTo2560
								? __("Aktiv", "ud-settings")
								: __("Inaktiv", "ud-settings")}
						</span>
					</label>
					<label
						className={
							settings.useMaxImageSizeInEditor
								? "ud-settings-choice is-active"
								: "ud-settings-choice"
						}
					>
						<CheckboxControl
							checked={settings.useMaxImageSizeInEditor}
							onChange={(value) =>
								updateSetting("useMaxImageSizeInEditor", value)
							}
							__nextHasNoMarginBottom={true}
						/>

						<span className="ud-settings-choice__content">
							<span className="ud-settings-choice__title">
								{__(
									"Im Editor standardmässig „Maximale Grösse“ einfügen",
									"ud-settings"
								)}
							</span>

							<span className="ud-settings-choice__description">
								{__(
									"Setzt beim Einfügen von Bildern im Block-Editor automatisch die Bildgrösse „Maximale Grösse“.",
									"ud-settings"
								)}
							</span>
						</span>

						<span className="ud-settings-status">
							{settings.useMaxImageSizeInEditor
								? __("Aktiv", "ud-settings")
								: __("Inaktiv", "ud-settings")}
						</span>
					</label>

					<div
						className={
							settings.convertJpegTo
								? "ud-settings-choice is-active ud-settings-media-settings__conversion"
								: "ud-settings-choice ud-settings-media-settings__conversion"
						}
					>
						<div className="ud-settings-media-settings__spacer" />

						<div className="ud-settings-choice__content">
							<span className="ud-settings-choice__title">
								{__(
									"JPEG zu modernem Format konvertieren",
									"ud-settings"
								)}
							</span>

							<span className="ud-settings-choice__description">
								{__(
									"Speichert neu erzeugte WordPress-Bilddateien von JPEGs wahlweise als AVIF oder WebP. Die hochgeladene Originaldatei bleibt unverändert.",
									"ud-settings"
								)}
							</span>

							<RadioControl
								selected={settings.convertJpegTo}
								options={[
									{
										label: __(
											"Nicht konvertieren",
											"ud-settings"
										),
										value: "",
									},
									{
										label: __(
											"JPEG zu AVIF konvertieren",
											"ud-settings"
										),
										value: "avif",
									},
									{
										label: __(
											"JPEG zu WebP konvertieren",
											"ud-settings"
										),
										value: "webp",
									},
								]}
								onChange={(value) =>
									updateSetting("convertJpegTo", value)
								}
							/>
						</div>

						<span className="ud-settings-status">
							{settings.convertJpegTo
								? __("Aktiv", "ud-settings")
								: __("Inaktiv", "ud-settings")}
						</span>
					</div>
				</div>
			</CardBody>
		</Card>
	);
}
