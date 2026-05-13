import apiFetch from "@wordpress/api-fetch";
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	CheckboxControl,
	Notice,
	SearchControl,
	Spinner,
} from "@wordpress/components";
import { useEffect, useMemo, useState } from "@wordpress/element";
import { __, sprintf } from "@wordpress/i18n";

const REST_ENDPOINT = "/ud-settings/v1/block-visibility";

export default function BlockVisibilityOption() {
	const [blocks, setBlocks] = useState([]);
	const [excludedBlocks, setExcludedBlocks] = useState([]);
	const [variations, setVariations] = useState([]);
	const [excludedVariations, setExcludedVariations] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
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

			setBlocks(response.blocks || []);
			setExcludedBlocks(response.excludedBlocks || []);
			setVariations(response.variations || []);
			setExcludedVariations(response.excludedVariations || []);
		} catch (error) {
			setNotice({
				status: "error",
				message:
					error?.message ||
					__(
						"Die Blockliste konnte nicht geladen werden.",
						"ud-settings"
					),
			});
		} finally {
			setIsLoading(false);
		}
	};

	const filteredBlocks = useMemo(() => {
		const normalizedSearchTerm = searchTerm.trim().toLowerCase();

		if (!normalizedSearchTerm) {
			return blocks;
		}

		return blocks.filter((block) => {
			return [block.title, block.name, block.category, block.description]
				.filter(Boolean)
				.join(" ")
				.toLowerCase()
				.includes(normalizedSearchTerm);
		});
	}, [blocks, searchTerm]);

	const filteredVariations = useMemo(() => {
		const normalizedSearchTerm = searchTerm.trim().toLowerCase();

		if (!normalizedSearchTerm) {
			return variations;
		}

		return variations.filter((variation) => {
			return [
				variation.title,
				variation.id,
				variation.blockName,
				variation.variationName,
				variation.description,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase()
				.includes(normalizedSearchTerm);
		});
	}, [variations, searchTerm]);

	const groupedBlocks = useMemo(() => {
		return filteredBlocks.reduce((groups, block) => {
			const category =
				block.category || __("Ohne Kategorie", "ud-settings");

			if (!groups[category]) {
				groups[category] = [];
			}

			groups[category].push(block);

			return groups;
		}, {});
	}, [filteredBlocks]);

	const toggleExcludedBlock = (blockName) => {
		setExcludedBlocks((currentExcludedBlocks) => {
			if (currentExcludedBlocks.includes(blockName)) {
				return currentExcludedBlocks.filter(
					(name) => name !== blockName
				);
			}

			return [...currentExcludedBlocks, blockName];
		});
	};

	const toggleExcludedVariation = (variationId) => {
		setExcludedVariations((currentExcludedVariations) => {
			if (currentExcludedVariations.includes(variationId)) {
				return currentExcludedVariations.filter(
					(id) => id !== variationId
				);
			}

			return [...currentExcludedVariations, variationId];
		});
	};

	const excludeVisibleBlocks = () => {
		const visibleBlockNames = filteredBlocks.map((block) => block.name);
		const visibleVariationIds = filteredVariations.map(
			(variation) => variation.id
		);

		setExcludedBlocks((currentExcludedBlocks) => {
			return Array.from(
				new Set([...currentExcludedBlocks, ...visibleBlockNames])
			);
		});

		setExcludedVariations((currentExcludedVariations) => {
			return Array.from(
				new Set([...currentExcludedVariations, ...visibleVariationIds])
			);
		});
	};

	const allowVisibleBlocks = () => {
		const visibleBlockNames = filteredBlocks.map((block) => block.name);
		const visibleVariationIds = filteredVariations.map(
			(variation) => variation.id
		);

		setExcludedBlocks((currentExcludedBlocks) => {
			return currentExcludedBlocks.filter((blockName) => {
				return !visibleBlockNames.includes(blockName);
			});
		});

		setExcludedVariations((currentExcludedVariations) => {
			return currentExcludedVariations.filter((variationId) => {
				return !visibleVariationIds.includes(variationId);
			});
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
					excludedBlocks,
					excludedVariations,
				},
			});

			setExcludedBlocks(response.excludedBlocks || []);
			setExcludedVariations(response.excludedVariations || []);

			setNotice({
				status: "success",
				message: __(
					"Die Einstellungen wurden gespeichert.",
					"ud-settings"
				),
			});
		} catch (error) {
			setNotice({
				status: "error",
				message:
					error?.message ||
					__(
						"Die Einstellungen konnten nicht gespeichert werden.",
						"ud-settings"
					),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const resetSelection = () => {
		setExcludedBlocks([]);
		setExcludedVariations([]);
	};

	const hasFilteredItems =
		filteredBlocks.length > 0 || filteredVariations.length > 0;

	const totalItemsCount = blocks.length + variations.length;

	const excludedItemsCount =
		excludedBlocks.length + excludedVariations.length;

	const availableItemsCount = totalItemsCount - excludedItemsCount;

	if (isLoading) {
		return (
			<Card className="ud-settings-card">
				<CardBody>
					<div className="ud-settings-block-visibility__loading">
						<Spinner />
						<p>{__("Blockliste wird geladen ...", "ud-settings")}</p>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<>
			<Card className="ud-settings-card ud-settings-block-visibility__summary">
				<CardBody>
					<div className="ud-settings-block-visibility__summary-grid">
						<div>
							<span className="ud-settings-block-visibility__summary-number">
								{totalItemsCount}
							</span>
							<span className="ud-settings-block-visibility__summary-label">
								{__("Einträge", "ud-settings")}
							</span>
						</div>

						<div>
							<span className="ud-settings-block-visibility__summary-number">
								{excludedItemsCount}
							</span>
							<span className="ud-settings-block-visibility__summary-label">
								{__("ausgeschlossen", "ud-settings")}
							</span>
						</div>

						<div>
							<span className="ud-settings-block-visibility__summary-number">
								{availableItemsCount}
							</span>
							<span className="ud-settings-block-visibility__summary-label">
								{__("verfügbar", "ud-settings")}
							</span>
						</div>
					</div>
				</CardBody>
			</Card>

			<Card className="ud-settings-card">
				<CardHeader>
					<div className="ud-settings-block-visibility__panel-header">
						<div>
							<h2>{__("Block-Sichtbarkeit", "ud-settings")}</h2>
							<p>
								{__(
									"Aktivierte Checkboxen bedeuten: Dieser Block oder diese Block-Variation wird im Editor nicht angeboten.",
									"ud-settings"
								)}
							</p>
						</div>

						<div className="ud-settings-block-visibility__panel-tools">
							<SearchControl
								label={__("Blöcke suchen", "ud-settings")}
								value={searchTerm}
								onChange={setSearchTerm}
								placeholder={__(
									"Block suchen …",
									"ud-settings"
								)}
								__next40pxDefaultSize={true}
								__nextHasNoMarginBottom={true}
							/>

							<div className="ud-settings-block-visibility__panel-actions">
								<Button
									variant="secondary"
									onClick={excludeVisibleBlocks}
									disabled={isSaving || !hasFilteredItems}
									__next40pxDefaultSize={true}
								>
									{__("Alle ausschliessen", "ud-settings")}
								</Button>

								<Button
									variant="secondary"
									onClick={allowVisibleBlocks}
									disabled={isSaving || !hasFilteredItems}
									__next40pxDefaultSize={true}
								>
									{__("Alle freigeben", "ud-settings")}
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

								<Button
									variant="tertiary"
									onClick={resetSelection}
									disabled={isSaving || excludedItemsCount === 0}
									__next40pxDefaultSize={true}
								>
									{__("Auswahl zurücksetzen", "ud-settings")}
								</Button>
							</div>

							{searchTerm && (
								<p className="ud-settings-block-visibility__panel-hint">
									{__(
										"Bei aktiver Suche gilt die Aktion nur für die gefilterten Einträge.",
										"ud-settings"
									)}
								</p>
							)}
						</div>
					</div>
				</CardHeader>

				<CardBody>
					{notice && (
						<Notice
							status={notice.status}
							onRemove={() => setNotice(null)}
						>
							{notice.message}
						</Notice>
					)}

					{Object.entries(groupedBlocks).map(
						([category, categoryBlocks]) => (
							<div
								className="ud-settings-block-visibility__group"
								key={category}
							>
								<h3 className="ud-settings-block-visibility__group-title">
									{category}
								</h3>

								<div className="ud-settings-block-visibility__list">
									{categoryBlocks.map((block) => {
										const isExcluded =
											excludedBlocks.includes(block.name);

										return (
											<label
												className={
													isExcluded
														? "ud-settings-choice is-excluded"
														: "ud-settings-choice"
												}
												key={block.name}
											>
												<CheckboxControl
													checked={isExcluded}
													onChange={() =>
														toggleExcludedBlock(
															block.name
														)
													}
													__nextHasNoMarginBottom={
														true
													}
												/>

												<span className="ud-settings-choice__content">
													<span className="ud-settings-choice__title">
														{block.title}
													</span>

													<code className="ud-settings-choice__code">
														{block.name}
													</code>

													{block.description && (
														<span className="ud-settings-choice__description">
															{block.description}
														</span>
													)}
												</span>

												<span className="ud-settings-status">
													{isExcluded
														? __(
																"Ausgeschlossen",
																"ud-settings"
														  )
														: __(
																"Verfügbar",
																"ud-settings"
														  )}
												</span>
											</label>
										);
									})}
								</div>
							</div>
						)
					)}

					{filteredVariations.length > 0 && (
						<div className="ud-settings-block-visibility__group">
							<h3 className="ud-settings-block-visibility__group-title">
								{__("Block-Variationen", "ud-settings")}
							</h3>

							<div className="ud-settings-block-visibility__list">
								{filteredVariations.map((variation) => {
									const isExcluded =
										excludedVariations.includes(
											variation.id
										);

									return (
										<label
											className={
												isExcluded
													? "ud-settings-choice is-excluded"
													: "ud-settings-choice"
											}
											key={variation.id}
										>
											<CheckboxControl
												checked={isExcluded}
												onChange={() =>
													toggleExcludedVariation(
														variation.id
													)
												}
												__nextHasNoMarginBottom={true}
											/>

											<span className="ud-settings-choice__content">
												<span className="ud-settings-choice__title">
													{variation.title}
												</span>

												<code className="ud-settings-choice__code">
													{variation.blockName}::
													{variation.variationName}
												</code>

												{variation.description && (
													<span className="ud-settings-choice__description">
														{variation.description}
													</span>
												)}
											</span>

											<span className="ud-settings-status">
												{isExcluded
													? __(
															"Ausgeschlossen",
															"ud-settings"
													  )
													: __(
															"Verfügbar",
															"ud-settings"
													  )}
											</span>
										</label>
									);
								})}
							</div>
						</div>
					)}

					{!hasFilteredItems && (
						<p className="ud-settings-block-visibility__empty">
							{sprintf(
								__(
									"Keine Einträge für '%s' gefunden.",
									"ud-settings"
								),
								searchTerm
							)}
						</p>
					)}
				</CardBody>
			</Card>
		</>
	);
}