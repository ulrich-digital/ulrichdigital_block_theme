import { createRoot, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";

import AdminCleanupOption from "./options/admin-cleanup/edit";
import BlockVisibilityOption from "./options/block-visibility/edit";
import CommentsOption from "./options/comments/edit";
import MediaSettingsOption from "./options/media-settings/edit";
import RevisionsOption from "./options/revisions/edit";

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
		description: __(
			"Alte WordPress-Revisionen bereinigen.",
			"ud-settings"
		),
		component: RevisionsOption,
	},
	{
		id: "media-settings",
		label: __("Medien", "ud-settings"),
		description: __("Uploads und Bildverarbeitung steuern.", "ud-settings"),
		component: MediaSettingsOption,
	},{
		id: "block-visibility",
		label: __("Block-Sichtbarkeit", "ud-settings"),
		description: __(
			"Blöcke und Block-Variationen im Editor ausblenden.",
			"ud-settings"
		),
		component: BlockVisibilityOption,
	},


];

function AdminApp() {
	const [activeOption, setActiveOption] = useState("admin-cleanup");

	const currentOption =
		OPTIONS.find((option) => option.id === activeOption) || OPTIONS[0];

	const CurrentComponent = currentOption.component;

	return (
		<div className="ud-settings-app">
			<div className="ud-settings-app__header">
				<p className="ud-settings-app__eyebrow">
					{__("WordPress", "ud-settings")}
				</p>

				<h1 className="ud-settings-app__title">
					{__("UD Settings", "ud-settings")}
				</h1>

				<p className="ud-settings-app__intro">
					{__(
						"Zentrale Einstellungen für WordPress-Projekte.",
						"ud-settings"
					)}
				</p>
			</div>

			<div className="ud-settings-app__layout">
				<nav
					className="ud-settings-app__nav"
					aria-label={__("UD Settings Navigation", "ud-settings")}
				>
					{OPTIONS.map((option) => {
						const isActive = option.id === activeOption;

						return (
							<button
								className={
									isActive
										? "ud-settings-app__nav-item is-active"
										: "ud-settings-app__nav-item"
								}
								type="button"
								onClick={() => setActiveOption(option.id)}
								key={option.id}
							>
								<span className="ud-settings-app__nav-title">
									{option.label}
								</span>

								<span className="ud-settings-app__nav-description">
									{option.description}
								</span>
							</button>
						);
					})}
				</nav>

				<main className="ud-settings-app__content">
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