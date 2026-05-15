import apiFetch from "@wordpress/api-fetch";
import {
	Button,
	Card,
	CardBody,
	Notice,
	Spinner,
	TextControl,
} from "@wordpress/components";
import { useEffect, useState } from "@wordpress/element";
import { __, sprintf } from "@wordpress/i18n";

const REST_ENDPOINT = "/ud-settings/v1/revisions";
const CLEANUP_ENDPOINT = "/ud-settings/v1/revisions/cleanup";

const DEFAULT_SETTINGS = {
	keepRevisions: 10,
};

export default function RevisionsOption() {
	const [settings, setSettings] = useState(DEFAULT_SETTINGS);
	const [revisionCount, setRevisionCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isCleaning, setIsCleaning] = useState(false);
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

			setRevisionCount(response.revisionCount || 0);
		} catch (error) {
			setNotice({
				status: "error",
				message:
					error?.message ||
					__(
						"Die Revisionen-Einstellung konnte nicht geladen werden.",
						"ud-settings"
					),
			});
		} finally {
			setIsLoading(false);
		}
	};

	const updateKeepRevisions = (value) => {
		const keepRevisions = parseInt(value, 10);

		setSettings((currentSettings) => {
			return {
				...currentSettings,
				keepRevisions: Number.isFinite(keepRevisions) ? keepRevisions : "",
			};
		});
	};

	const getSanitizedKeepRevisions = () => {
		const keepRevisions = parseInt(settings.keepRevisions, 10);

		if (!Number.isFinite(keepRevisions) || keepRevisions < 1) {
			return 1;
		}

		if (keepRevisions > 100) {
			return 100;
		}

		return keepRevisions;
	};

	const saveSettings = async () => {
		setIsSaving(true);
		setNotice(null);

		const keepRevisions = getSanitizedKeepRevisions();

		try {
			const response = await apiFetch({
				path: REST_ENDPOINT,
				method: "POST",
				data: {
					settings: {
						keepRevisions,
					},
				},
			});

			setSettings({
				...DEFAULT_SETTINGS,
				...(response.settings || {}),
			});

			setNotice({
				status: "success",
				message: __(
					"Die Revisionen-Einstellung wurde gespeichert.",
					"ud-settings"
				),
			});
		} catch (error) {
			setNotice({
				status: "error",
				message:
					error?.message ||
					__(
						"Die Revisionen-Einstellung konnte nicht gespeichert werden.",
						"ud-settings"
					),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const cleanupRevisions = async () => {
		const keepRevisions = getSanitizedKeepRevisions();

		const confirmed = window.confirm(
			sprintf(
				__(
					"Es werden alte Revisionen dauerhaft gelöscht. Pro Inhalt bleiben die letzten %d Revisionen erhalten. Fortfahren?",
					"ud-settings"
				),
				keepRevisions
			)
		);

		if (!confirmed) {
			return;
		}

		setIsCleaning(true);
		setNotice(null);

		try {
			const response = await apiFetch({
				path: CLEANUP_ENDPOINT,
				method: "POST",
				data: {
					keepRevisions,
				},
			});

			setRevisionCount(response.revisionCount || 0);

			setNotice({
				status: "success",
				message: sprintf(
					__(
						"%d Revisionen wurden gelöscht. %d Inhalte waren betroffen.",
						"ud-settings"
					),
					response.deleted || 0,
					response.parents || 0
				),
			});
		} catch (error) {
			setNotice({
				status: "error",
				message:
					error?.message ||
					__("Die Revisionen konnten nicht gelöscht werden.", "ud-settings"),
			});
		} finally {
			setIsCleaning(false);
		}
	};

	if (isLoading) {
		return (
			<Card className="ud-settings-card">
				<CardBody>
					<div className="ud-settings-option ud-settings-option--revisions">
						<div className="option-loading">
							<Spinner />
							<p>
								{__(
									"Revisionen-Einstellung wird geladen ...",
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
				<div className="ud-settings-option ud-settings-option--revisions">
					<header className="option-header">
						<div className="option-intro">
							<h2 className="option-title">
								{__("Revisionen", "ud-settings")}
							</h2>

							<p className="option-description">
								{__(
									"Hier können alte WordPress-Revisionen bereinigt werden. Pro Inhalt bleibt nur die gewünschte Anzahl der neuesten Revisionen erhalten.",
									"ud-settings"
								)}
							</p>
						</div>

						<span className="option-meta">
							{sprintf(__("%d vorhanden", "ud-settings"), revisionCount)}
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
						<div className="setting-row">
							<div className="setting-content">
								<h3 className="setting-title">
									{__("Revisionen pro Inhalt behalten", "ud-settings")}
								</h3>

								<p className="setting-description">
									{__(
										"Beim Löschen bleiben pro Beitrag, Seite oder individuellem Inhaltstyp die neuesten Revisionen in dieser Anzahl erhalten. Ältere Revisionen werden dauerhaft gelöscht.",
										"ud-settings"
									)}
								</p>
							</div>

							<div className="setting-control">
								<TextControl
									type="number"
									min={1}
									max={100}
									step={1}
									value={settings.keepRevisions}
									onChange={updateKeepRevisions}
									__next40pxDefaultSize={true}
									__nextHasNoMarginBottom={true}
								/>
							</div>

							<span className="setting-meta">
								{sprintf(
									__("%d behalten", "ud-settings"),
									getSanitizedKeepRevisions()
								)}
							</span>
						</div>

						<div className="setting-note setting-note--warning">
							<p>
								{__(
									"Technischer Hinweis: Diese Funktion bereinigt bestehende Revisionen nachträglich. Wie viele Revisionen WordPress künftig speichert, kann zusätzlich in der wp-config.php begrenzt werden.",
									"ud-settings"
								)}
							</p>

							<code>define( 'WP_POST_REVISIONS', 10 );</code>
						</div>
					</div>

					<div className="option-actions">
						<Button
							variant="secondary"
							onClick={saveSettings}
							isBusy={isSaving}
							disabled={isSaving || isCleaning}
							__next40pxDefaultSize={true}
							__nextHasNoMarginBottom={true}
						>
							{__("Speichern", "ud-settings")}
						</Button>

						<Button
							variant="primary"
							onClick={cleanupRevisions}
							isBusy={isCleaning}
							disabled={isSaving || isCleaning}
							__next40pxDefaultSize={true}
							__nextHasNoMarginBottom={true}
						>
							{__("Revisionen jetzt löschen", "ud-settings")}
						</Button>
					</div>
				</div>
			</CardBody>
		</Card>
	);
}