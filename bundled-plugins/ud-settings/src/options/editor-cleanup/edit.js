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
import { __, sprintf } from "@wordpress/i18n";

const REST_ENDPOINT = "/ud-settings/v1/editor-cleanup";

const DEFAULT_SETTINGS = {
	disableCoreBlockPatterns: true,
	disableRemoteBlockPatterns: true,
	hiddenFormatting: {
		"core/heading": {
			bold: false,
			italic: false,
			link: false,
			more: false,
		},
	},
};

const FORMATTING_BLOCKS = [
	{
		name: "core/heading",
		title: __("Überschrift", "ud-settings"),
		description: __(
			"Werkzeuge für den Überschrift-Block reduzieren.",
			"ud-settings"
		),
	},
];

const FORMAT_OPTIONS = [
	{
		key: "bold",
		title: __("Fett ausblenden", "ud-settings"),
		description: __(
			"Blendet die Fett-Formatierung in der Block-Werkzeugleiste aus.",
			"ud-settings"
		),
	},
	{
		key: "italic",
		title: __("Kursiv ausblenden", "ud-settings"),
		description: __(
			"Blendet die Kursiv-Formatierung in der Block-Werkzeugleiste aus.",
			"ud-settings"
		),
	},
	{
		key: "link",
		title: __("Link ausblenden", "ud-settings"),
		description: __(
			"Blendet die Link-Funktion in der Block-Werkzeugleiste aus.",
			"ud-settings"
		),
	},
	{
		key: "more",
		title: __("Weitere Formatierungen ausblenden", "ud-settings"),
		description: __(
			"Blendet das Menü für weitere Inline-Formatierungen aus.",
			"ud-settings"
		),
	},
];

function normalizeSettings(settings = {}) {
	const normalized = {
		...DEFAULT_SETTINGS,
		...settings,
		disableCoreBlockPatterns: Object.prototype.hasOwnProperty.call(
			settings,
			"disableCoreBlockPatterns"
		)
			? !!settings.disableCoreBlockPatterns
			: DEFAULT_SETTINGS.disableCoreBlockPatterns,
		disableRemoteBlockPatterns: Object.prototype.hasOwnProperty.call(
			settings,
			"disableRemoteBlockPatterns"
		)
			? !!settings.disableRemoteBlockPatterns
			: DEFAULT_SETTINGS.disableRemoteBlockPatterns,
		hiddenFormatting: {
			...DEFAULT_SETTINGS.hiddenFormatting,
			...(settings.hiddenFormatting || {}),
		},
	};

	FORMATTING_BLOCKS.forEach((block) => {
		normalized.hiddenFormatting[block.name] = {
			...DEFAULT_SETTINGS.hiddenFormatting[block.name],
			...(settings.hiddenFormatting?.[block.name] || {}),
		};

		FORMAT_OPTIONS.forEach((format) => {
			normalized.hiddenFormatting[block.name][format.key] =
				!!normalized.hiddenFormatting[block.name][format.key];
		});
	});

	return normalized;
}

function getHiddenFormattingCount(settings) {
	return FORMATTING_BLOCKS.reduce((total, block) => {
		const blockSettings = settings.hiddenFormatting?.[block.name] || {};

		return (
			total +
			FORMAT_OPTIONS.filter((format) => !!blockSettings[format.key]).length
		);
	}, 0);
}

function getHiddenPatternCount(settings) {
	return [
		settings.disableCoreBlockPatterns,
		settings.disableRemoteBlockPatterns,
	].filter(Boolean).length;
}

export default function EditorCleanupOption() {
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
						"Die Editor-Bereinigung konnte nicht geladen werden.",
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

	const updateFormattingSetting = (blockName, formatKey, value) => {
		setSettings((currentSettings) => ({
			...currentSettings,
			hiddenFormatting: {
				...currentSettings.hiddenFormatting,
				[blockName]: {
					...(currentSettings.hiddenFormatting?.[blockName] || {}),
					[formatKey]: value,
				},
			},
		}));
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
					"Die Editor-Bereinigung wurde gespeichert.",
					"ud-settings"
				),
			});
		} catch (error) {
			setNotice({
				status: "error",
				message:
					error?.message ||
					__(
						"Die Editor-Bereinigung konnte nicht gespeichert werden.",
						"ud-settings"
					),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const hiddenFormattingCount = getHiddenFormattingCount(settings);
	const hiddenPatternCount = getHiddenPatternCount(settings);
	const hiddenTotalCount = hiddenFormattingCount + hiddenPatternCount;

	if (isLoading) {
		return (
			<Card className="ud-settings-card">
				<CardBody>
					<div className="ud-settings-option ud-settings-option--editor-cleanup">
						<div className="option-loading">
							<Spinner />

							<p>
								{__(
									"Editor-Bereinigung wird geladen ...",
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
				<div className="ud-settings-option ud-settings-option--editor-cleanup">
					<header className="option-header">
						<div className="option-intro">
							<h2 className="option-title">
								{__("Editor-Bereinigung", "ud-settings")}
							</h2>

							<p className="option-description">
								{__(
									"Hier können Werkzeuge, Formatierungsoptionen und Vorlagen im Block Editor gezielt ausgeblendet werden.",
									"ud-settings"
								)}
							</p>
						</div>

						<span className="option-meta">
							{sprintf(
								__("%d ausgeblendet", "ud-settings"),
								hiddenTotalCount
							)}
						</span>
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
										{__("Vorlagen", "ud-settings")}
									</h3>

									<p className="section-description">
										{__(
											"Steuert, welche Vorlagen im Inserter angeboten werden. Eigene Vorlagen bleiben verfügbar.",
											"ud-settings"
										)}
									</p>
								</div>

								<span className="section-meta">
									{sprintf(
										__("%d ausgeblendet", "ud-settings"),
										hiddenPatternCount
									)}
								</span>
							</div>

							<div className="section-body">
								<label
									className={
										settings.disableCoreBlockPatterns
											? "setting-row setting-row--checkbox is-active"
											: "setting-row setting-row--checkbox"
									}
								>
									<div className="setting-control">
										<CheckboxControl
											checked={
												settings.disableCoreBlockPatterns
											}
											onChange={(value) =>
												updateSetting(
													"disableCoreBlockPatterns",
													value
												)
											}
											__next40pxDefaultSize={true}
											__nextHasNoMarginBottom={true}
										/>
									</div>

									<div className="setting-content">
										<h4 className="setting-title">
											{__(
												"WordPress-Standardvorlagen ausblenden",
												"ud-settings"
											)}
										</h4>

										<p className="setting-description">
											{__(
												"Entfernt die von WordPress mitgelieferten Standardvorlagen aus dem Inserter.",
												"ud-settings"
											)}
										</p>
									</div>

									<span className="setting-meta">
										{settings.disableCoreBlockPatterns
											? __("Ausgeblendet", "ud-settings")
											: __("Angezeigt", "ud-settings")}
									</span>
								</label>

								<label
									className={
										settings.disableRemoteBlockPatterns
											? "setting-row setting-row--checkbox is-active"
											: "setting-row setting-row--checkbox"
									}
								>
									<div className="setting-control">
										<CheckboxControl
											checked={
												settings.disableRemoteBlockPatterns
											}
											onChange={(value) =>
												updateSetting(
													"disableRemoteBlockPatterns",
													value
												)
											}
											__next40pxDefaultSize={true}
											__nextHasNoMarginBottom={true}
										/>
									</div>

									<div className="setting-content">
										<h4 className="setting-title">
											{__(
												"Externe Vorlagen ausblenden",
												"ud-settings"
											)}
										</h4>

										<p className="setting-description">
											{__(
												"Verhindert Vorlagen aus dem externen WordPress Pattern Directory.",
												"ud-settings"
											)}
										</p>
									</div>

									<span className="setting-meta">
										{settings.disableRemoteBlockPatterns
											? __("Ausgeblendet", "ud-settings")
											: __("Angezeigt", "ud-settings")}
									</span>
								</label>
							</div>
						</section>

						{FORMATTING_BLOCKS.map((block) => {
							const blockSettings =
								settings.hiddenFormatting?.[block.name] || {};

							const blockHiddenCount = FORMAT_OPTIONS.filter(
								(format) => !!blockSettings[format.key]
							).length;

							return (
								<section
									className="option-section"
									key={block.name}
								>
									<div className="section-header">
										<div className="section-intro">
											<h3 className="section-title">
												{block.title}
											</h3>

											<p className="section-description">
												{block.description}
											</p>
										</div>

										<span className="section-meta">
											{sprintf(
												__(
													"%d ausgeblendet",
													"ud-settings"
												),
												blockHiddenCount
											)}
										</span>
									</div>

									<div className="section-body">
										{FORMAT_OPTIONS.map((format) => {
											const isHidden =
												!!blockSettings[format.key];

											return (
												<label
													className={
														isHidden
															? "setting-row setting-row--checkbox is-active"
															: "setting-row setting-row--checkbox"
													}
													key={format.key}
												>
													<div className="setting-control">
														<CheckboxControl
															checked={isHidden}
															onChange={(value) =>
																updateFormattingSetting(
																	block.name,
																	format.key,
																	value
																)
															}
															__next40pxDefaultSize={true}
															__nextHasNoMarginBottom={true}
														/>
													</div>

													<div className="setting-content">
														<h4 className="setting-title">
															{format.title}
														</h4>

														<p className="setting-description">
															{format.description}
														</p>
													</div>

													<span className="setting-meta">
														{isHidden
															? __(
																	"Ausgeblendet",
																	"ud-settings"
															  )
															: __(
																	"Angezeigt",
																	"ud-settings"
															  )}
													</span>
												</label>
											);
										})}
									</div>
								</section>
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