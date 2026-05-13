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

export default function CommentsOption() {
	const [disableComments, setDisableComments] = useState(false);
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

			setDisableComments(!!response.disableComments);
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
				data: {
					disableComments,
				},
			});

			setDisableComments(!!response.disableComments);

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

	if (isLoading) {
		return (
			<Card className="ud-settings-card">
				<CardBody>
					<div className="ud-settings-comments__loading">
						<Spinner />
						<p>
							{__(
								"Kommentar-Einstellung wird geladen ...",
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
						<h2>{__("Kommentare", "ud-settings")}</h2>
						<p>
							{__(
								"Hier kann die Kommentar-Funktion global deaktiviert und die Admin-Oberfläche entsprechend bereinigt werden.",
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

				<label
					className={
						disableComments
							? "ud-settings-choice is-active"
							: "ud-settings-choice"
					}
				>
					<CheckboxControl
						checked={disableComments}
						onChange={setDisableComments}
						__nextHasNoMarginBottom={true}
					/>

					<span className="ud-settings-choice__content">
						<span className="ud-settings-choice__title">
							{__(
								"Kommentar-Funktion deaktivieren",
								"ud-settings"
							)}
						</span>

						<span className="ud-settings-choice__description">
							{__(
								"Deaktiviert Kommentare und Trackbacks im Frontend, entfernt Kommentarbereiche aus Post Types, blendet bestehende Kommentare aus und entfernt Kommentar-Menüs aus dem WordPress-Admin.",
								"ud-settings"
							)}
						</span>
					</span>

					<span className="ud-settings-status">
						{disableComments
							? __("Aktiv", "ud-settings")
							: __("Inaktiv", "ud-settings")}
					</span>
				</label>
			</CardBody>
		</Card>
	);
}