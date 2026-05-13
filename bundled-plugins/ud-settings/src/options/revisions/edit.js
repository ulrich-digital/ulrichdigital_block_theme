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
				keepRevisions: Number.isFinite(keepRevisions)
					? keepRevisions
					: "",
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
					__(
						"Die Revisionen konnten nicht gelöscht werden.",
						"ud-settings"
					),
			});
		} finally {
			setIsCleaning(false);
		}
	};

	if (isLoading) {
		return (
			<Card className="ud-settings-card">
				<CardBody>
					<div className="ud-settings-revisions__loading">
						<Spinner />
						<p>
							{__(
								"Revisionen-Einstellung wird geladen ...",
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
						<h2>{__("Revisionen", "ud-settings")}</h2>
						<p>
							{__(
								"Hier können alte WordPress-Revisionen bereinigt werden. Pro Inhalt bleibt nur die gewünschte Anzahl der neuesten Revisionen erhalten.",
								"ud-settings"
							)}
						</p>
					</div>

					<div className="ud-settings-revisions__actions">
						<Button
							variant="secondary"
							onClick={saveSettings}
							isBusy={isSaving}
							disabled={isSaving || isCleaning}
							__next40pxDefaultSize={true}
						>
							{__("Speichern", "ud-settings")}
						</Button>

						<Button
							variant="primary"
							onClick={cleanupRevisions}
							isBusy={isCleaning}
							disabled={isSaving || isCleaning}
							__next40pxDefaultSize={true}
						>
							{__("Revisionen jetzt löschen", "ud-settings")}
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

				<div className="ud-settings-revisions__summary">
					<span className="ud-settings-revisions__summary-number">
						{revisionCount}
					</span>
					<span className="ud-settings-revisions__summary-label">
						{__("vorhandene Revisionen", "ud-settings")}
					</span>
				</div>

				<div className="ud-settings-choice ud-settings-revisions__setting">
					<div className="ud-settings-revisions__spacer" />

					<div className="ud-settings-choice__content">
						<span className="ud-settings-choice__title">
							{__("Revisionen pro Inhalt behalten", "ud-settings")}
						</span>

						<span className="ud-settings-choice__description">
							{__(
								"Beim Löschen bleiben pro Beitrag, Seite oder individuellem Inhaltstyp die neuesten Revisionen in dieser Anzahl erhalten. Ältere Revisionen werden dauerhaft gelöscht.",
								"ud-settings"
							)}
						</span>

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

					<span className="ud-settings-status">
						{sprintf(
							__("%d behalten", "ud-settings"),
							getSanitizedKeepRevisions()
						)}
					</span>
				</div>
			</CardBody>
		</Card>
	);
}