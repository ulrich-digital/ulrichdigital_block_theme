import { createRoot, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";

import AdminCleanupOption from "./options/admin-cleanup/edit";
import BlockVisibilityOption from "./options/block-visibility/edit";
import CommentsOption from "./options/comments/edit";
import MediaSettingsOption from "./options/media-settings/edit";
import RevisionsOption from "./options/revisions/edit";
import EditorCleanupOption from "./options/editor-cleanup/edit";

const OPTIONS = [
	{
		id: "admin-cleanup",
		label: __("Admin-Oberfläche", "ud-settings"),
		description: __("Admin-Bar und Dashboard vereinfachen.", "ud-settings"),
		component: AdminCleanupOption,
	},
	{
		id: "comments",
		label: __("Kommentare", "ud-settings"),
		description: __(
			"Kommentar-Funktion deaktivieren und Admin-Oberfläche bereinigen.",
			"ud-settings"
		),
		component: CommentsOption,
	},
	{
		id: "revisions",
		label: __("Revisionen", "ud-settings"),
		description: __("Alte WordPress-Revisionen bereinigen.", "ud-settings"),
		component: RevisionsOption,
	},
	{
		id: "media-settings",
		label: __("Medien", "ud-settings"),
		description: __("Uploads und Bildverarbeitung steuern.", "ud-settings"),
		component: MediaSettingsOption,
	},
	{
		id: "block-visibility",
		label: __("Block-Sichtbarkeit", "ud-settings"),
		description: __(
			"Blöcke und Block-Variationen im Editor ausblenden.",
			"ud-settings"
		),
		component: BlockVisibilityOption,
	},
	{
	id: "editor-cleanup",
	label: __("Editor-Bereinigung", "ud-settings"),
	description: __(
		"Werkzeuge und Formatierungsoptionen im Editor ausblenden.",
		"ud-settings"
	),
	component: EditorCleanupOption,
},
];

function getInitialActiveOption() {
	const hash = window.location.hash.replace("#", "");

	if (OPTIONS.some((option) => option.id === hash)) {
		return hash;
	}

	return "admin-cleanup";
}

function AdminApp() {
	const [activeOption, setActiveOption] = useState(getInitialActiveOption);

	const changeActiveOption = (optionId) => {
		setActiveOption(optionId);
		window.history.replaceState(null, "", `#${optionId}`);
	};

	const currentOption =
		OPTIONS.find((option) => option.id === activeOption) || OPTIONS[0];

	const CurrentComponent = currentOption.component;

	return (
		<div className="ud-settings-app">
			<div className="app-header">
				<p className="app-eyebrow">{__("WordPress", "ud-settings")}</p>

				<h1 className="app-title">{__("UD Settings", "ud-settings")}</h1>

				<p className="app-intro">
					{__(
						"Zentrale Einstellungen für WordPress-Projekte.",
						"ud-settings"
					)}
				</p>
			</div>

			<div className="app-layout">
				<nav
					className="app-nav"
					aria-label={__("UD Settings Navigation", "ud-settings")}
				>
					{OPTIONS.map((option) => {
						const isActive = option.id === activeOption;

						return (
							<button
								className={isActive ? "nav-item is-active" : "nav-item"}
								type="button"
								onClick={() => changeActiveOption(option.id)}
								key={option.id}
							>
								<span className="nav-title">{option.label}</span>

								<span className="nav-description">
									{option.description}
								</span>
							</button>
						);
					})}
				</nav>

				<main className="app-content">
					<CurrentComponent />
				</main>
			</div>
		</div>
	);
}

const app = document.getElementById("ud-settings-app");

if (app) {
	createRoot(app).render(<AdminApp />);
}