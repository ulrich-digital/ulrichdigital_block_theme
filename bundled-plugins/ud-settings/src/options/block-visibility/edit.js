import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Card,
	CardBody,
	CheckboxControl,
	Notice,
	SearchControl,
	Spinner,
} from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

const REST_ENDPOINT = '/ud-settings/v1/block-visibility';

function getVisibilityStatus( isExcluded ) {
	return isExcluded
		? __( 'Ausgeschlossen', 'ud-settings' )
		: __( 'Verfügbar', 'ud-settings' );
}

export default function BlockVisibilityOption() {
	const [ blocks, setBlocks ] = useState( [] );
	const [ excludedBlocks, setExcludedBlocks ] = useState( [] );
	const [ variations, setVariations ] = useState( [] );
	const [ excludedVariations, setExcludedVariations ] = useState( [] );
	const [ searchTerm, setSearchTerm ] = useState( '' );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ notice, setNotice ] = useState( null );

	useEffect( () => {
		loadSettings();
	}, [] );

	const loadSettings = async () => {
		setIsLoading( true );
		setNotice( null );

		try {
			const response = await apiFetch( {
				path: REST_ENDPOINT,
			} );

			setBlocks( response.blocks || [] );
			setExcludedBlocks( response.excludedBlocks || [] );
			setVariations( response.variations || [] );
			setExcludedVariations( response.excludedVariations || [] );
		} catch ( error ) {
			setNotice( {
				status: 'error',
				message:
					error?.message ||
					__(
						'Die Blockliste konnte nicht geladen werden.',
						'ud-settings'
					),
			} );
		} finally {
			setIsLoading( false );
		}
	};

	const filteredBlocks = useMemo( () => {
		const normalizedSearchTerm = searchTerm.trim().toLowerCase();

		if ( ! normalizedSearchTerm ) {
			return blocks;
		}

		return blocks.filter( ( block ) => {
			return [
				block.title,
				block.name,
				block.category,
				block.description,
			]
				.filter( Boolean )
				.join( ' ' )
				.toLowerCase()
				.includes( normalizedSearchTerm );
		} );
	}, [ blocks, searchTerm ] );

	const filteredVariations = useMemo( () => {
		const normalizedSearchTerm = searchTerm.trim().toLowerCase();

		if ( ! normalizedSearchTerm ) {
			return variations;
		}

		return variations.filter( ( variation ) => {
			return [
				variation.title,
				variation.id,
				variation.blockName,
				variation.variationName,
				variation.description,
			]
				.filter( Boolean )
				.join( ' ' )
				.toLowerCase()
				.includes( normalizedSearchTerm );
		} );
	}, [ variations, searchTerm ] );

	const groupedBlocks = useMemo( () => {
		return filteredBlocks.reduce( ( groups, block ) => {
			const category =
				block.category || __( 'Ohne Kategorie', 'ud-settings' );

			if ( ! groups[ category ] ) {
				groups[ category ] = [];
			}

			groups[ category ].push( block );

			return groups;
		}, {} );
	}, [ filteredBlocks ] );

	const toggleExcludedBlock = ( blockName ) => {
		setExcludedBlocks( ( currentExcludedBlocks ) => {
			if ( currentExcludedBlocks.includes( blockName ) ) {
				return currentExcludedBlocks.filter(
					( name ) => name !== blockName
				);
			}

			return [ ...currentExcludedBlocks, blockName ];
		} );
	};

	const toggleExcludedVariation = ( variationId ) => {
		setExcludedVariations( ( currentExcludedVariations ) => {
			if ( currentExcludedVariations.includes( variationId ) ) {
				return currentExcludedVariations.filter(
					( id ) => id !== variationId
				);
			}

			return [ ...currentExcludedVariations, variationId ];
		} );
	};

	const excludeVisibleItems = () => {
		const visibleBlockNames = filteredBlocks.map( ( block ) => block.name );
		const visibleVariationIds = filteredVariations.map(
			( variation ) => variation.id
		);

		setExcludedBlocks( ( currentExcludedBlocks ) => {
			return Array.from(
				new Set( [ ...currentExcludedBlocks, ...visibleBlockNames ] )
			);
		} );

		setExcludedVariations( ( currentExcludedVariations ) => {
			return Array.from(
				new Set( [
					...currentExcludedVariations,
					...visibleVariationIds,
				] )
			);
		} );
	};

	const allowVisibleItems = () => {
		const visibleBlockNames = filteredBlocks.map( ( block ) => block.name );
		const visibleVariationIds = filteredVariations.map(
			( variation ) => variation.id
		);

		setExcludedBlocks( ( currentExcludedBlocks ) => {
			return currentExcludedBlocks.filter( ( blockName ) => {
				return ! visibleBlockNames.includes( blockName );
			} );
		} );

		setExcludedVariations( ( currentExcludedVariations ) => {
			return currentExcludedVariations.filter( ( variationId ) => {
				return ! visibleVariationIds.includes( variationId );
			} );
		} );
	};

	const resetSelection = () => {
		setExcludedBlocks( [] );
		setExcludedVariations( [] );
	};

	const saveSettings = async () => {
		setIsSaving( true );
		setNotice( null );

		try {
			const response = await apiFetch( {
				path: REST_ENDPOINT,
				method: 'POST',
				data: {
					excludedBlocks,
					excludedVariations,
				},
			} );

			setExcludedBlocks( response.excludedBlocks || [] );
			setExcludedVariations( response.excludedVariations || [] );

			setNotice( {
				status: 'success',
				message: __(
					'Die Einstellungen wurden gespeichert.',
					'ud-settings'
				),
			} );
		} catch ( error ) {
			setNotice( {
				status: 'error',
				message:
					error?.message ||
					__(
						'Die Einstellungen konnten nicht gespeichert werden.',
						'ud-settings'
					),
			} );
		} finally {
			setIsSaving( false );
		}
	};

	const hasFilteredItems =
		filteredBlocks.length > 0 || filteredVariations.length > 0;

	const totalItemsCount = blocks.length + variations.length;
	const excludedItemsCount =
		excludedBlocks.length + excludedVariations.length;

	if ( isLoading ) {
		return (
			<Card className="ud-settings-card">
				<CardBody>
					<div className="ud-settings-option ud-settings-option--block-visibility">
						<div className="option-loading">
							<Spinner />
							<p>
								{ __(
									'Blockliste wird geladen ...',
									'ud-settings'
								) }
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
				<div className="ud-settings-option ud-settings-option--block-visibility">
					<header className="option-header">
						<div className="option-intro">
							<h2 className="option-title">
								{ __( 'Block-Sichtbarkeit', 'ud-settings' ) }
							</h2>

							<p className="option-description">
								{ __(
									'Aktivierte Checkboxen bedeuten: Dieser Block oder diese Block-Variation wird im Editor nicht angeboten. Bestehende Inhalte bleiben erhalten.',
									'ud-settings'
								) }
							</p>
						</div>

						<div className="option-stats">
							<span className="option-meta">
								{ sprintf(
									__( '%d ausgeschlossen', 'ud-settings' ),
									excludedItemsCount
								) }
							</span>
						</div>
					</header>

					{ notice && (
						<div className="option-notice">
							<Notice
								status={ notice.status }
								onRemove={ () => setNotice( null ) }
							>
								{ notice.message }
							</Notice>
						</div>
					) }

					<div className="option-body">
						<section className="option-section">
							<div className="section-header">
								<div className="section-intro">
									<h3 className="section-title">
										{ __(
											'Filter und Aktionen',
											'ud-settings'
										) }
									</h3>

									<p className="section-description">
										{ __(
											'Suche nach Blöcken oder Variationen. Bei aktiver Suche gelten Massenaktionen nur für die gefilterten Einträge.',
											'ud-settings'
										) }
									</p>
								</div>
							</div>

							<div className="visibility-toolbar">
								<div className="visibility-search">
									<SearchControl
										label={ __(
											'Blöcke suchen',
											'ud-settings'
										) }
										value={ searchTerm }
										onChange={ setSearchTerm }
										placeholder={ __(
											'Block suchen …',
											'ud-settings'
										) }
										__next40pxDefaultSize={ true }
										__nextHasNoMarginBottom={ true }
									/>
								</div>

								<div className="visibility-actions">
									<Button
										variant="secondary"
										onClick={ excludeVisibleItems }
										disabled={
											isSaving || ! hasFilteredItems
										}
										__next40pxDefaultSize={ true }
										__nextHasNoMarginBottom={ true }
									>
										{ __(
											'Alle ausschliessen',
											'ud-settings'
										) }
									</Button>

									<Button
										variant="secondary"
										onClick={ allowVisibleItems }
										disabled={
											isSaving || ! hasFilteredItems
										}
										__next40pxDefaultSize={ true }
										__nextHasNoMarginBottom={ true }
									>
										{ __(
											'Alle freigeben',
											'ud-settings'
										) }
									</Button>

									<Button
										variant="tertiary"
										onClick={ resetSelection }
										disabled={
											isSaving || excludedItemsCount === 0
										}
										__next40pxDefaultSize={ true }
										__nextHasNoMarginBottom={ true }
									>
										{ __(
											'Auswahl zurücksetzen',
											'ud-settings'
										) }
									</Button>
								</div>
							</div>
						</section>

						{ Object.entries( groupedBlocks ).map(
							( [ category, categoryBlocks ] ) => (
								<section
									className="option-section"
									key={ category }
								>
									<div className="section-header">
										<div className="section-intro">
											<h3 className="section-title">
												{ category }
											</h3>

											<p className="section-description">
												{ sprintf(
													__(
														'%d Blöcke in dieser Kategorie.',
														'ud-settings'
													),
													categoryBlocks.length
												) }
											</p>
										</div>
									</div>

									<div className="visibility-list">
										{ categoryBlocks.map( ( block ) => {
											const isExcluded =
												excludedBlocks.includes(
													block.name
												);

											return (
												<label
													className={
														isExcluded
															? 'visibility-item is-excluded'
															: 'visibility-item'
													}
													key={ block.name }
												>
													<div className="visibility-control">
														<CheckboxControl
															checked={
																isExcluded
															}
															onChange={ () =>
																toggleExcludedBlock(
																	block.name
																)
															}
															__next40pxDefaultSize={
																true
															}
															__nextHasNoMarginBottom={
																true
															}
														/>
													</div>

													<div className="visibility-content">
														<span className="visibility-title">
															{ block.title }
														</span>

														<code className="visibility-code">
															{ block.name }
														</code>

														{ block.description && (
															<span className="visibility-description">
																{
																	block.description
																}
															</span>
														) }
													</div>

													<span className="visibility-meta">
														{ getVisibilityStatus(
															isExcluded
														) }
													</span>
												</label>
											);
										} ) }
									</div>
								</section>
							)
						) }

						{ filteredVariations.length > 0 && (
							<section className="option-section">
								<div className="section-header">
									<div className="section-intro">
										<h3 className="section-title">
											{ __(
												'Block-Variationen',
												'ud-settings'
											) }
										</h3>

										<p className="section-description">
											{ sprintf(
												__(
													'%d Variationen werden aktuell angezeigt.',
													'ud-settings'
												),
												filteredVariations.length
											) }
										</p>
									</div>
								</div>

								<div className="visibility-list">
									{ filteredVariations.map( ( variation ) => {
										const isExcluded =
											excludedVariations.includes(
												variation.id
											);

										return (
											<label
												className={
													isExcluded
														? 'visibility-item is-excluded'
														: 'visibility-item'
												}
												key={ variation.id }
											>
												<div className="visibility-control">
													<CheckboxControl
														checked={ isExcluded }
														onChange={ () =>
															toggleExcludedVariation(
																variation.id
															)
														}
														__next40pxDefaultSize={
															true
														}
														__nextHasNoMarginBottom={
															true
														}
													/>
												</div>

												<div className="visibility-content">
													<span className="visibility-title">
														{ variation.title }
													</span>

													<code className="visibility-code">
														{ variation.blockName }
														::
														{
															variation.variationName
														}
													</code>

													{ variation.description && (
														<span className="visibility-description">
															{
																variation.description
															}
														</span>
													) }
												</div>

												<span className="visibility-meta">
													{ getVisibilityStatus(
														isExcluded
													) }
												</span>
											</label>
										);
									} ) }
								</div>
							</section>
						) }

						{ ! hasFilteredItems && (
							<p className="option-empty">
								{ sprintf(
									__(
										'Keine Einträge für „%s“ gefunden.',
										'ud-settings'
									),
									searchTerm
								) }
							</p>
						) }
					</div>

					<div className="option-actions">
						<Button
							variant="primary"
							onClick={ saveSettings }
							isBusy={ isSaving }
							disabled={ isSaving }
							__next40pxDefaultSize={ true }
							__nextHasNoMarginBottom={ true }
						>
							{ __( 'Speichern', 'ud-settings' ) }
						</Button>
					</div>
				</div>
			</CardBody>
		</Card>
	);
}
