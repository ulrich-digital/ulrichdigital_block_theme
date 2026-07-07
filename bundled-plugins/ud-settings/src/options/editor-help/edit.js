import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Card,
	CardBody,
	CheckboxControl,
	Notice,
	Spinner,
	TextControl,
	TextareaControl,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const REST_ENDPOINT = '/ud-settings/v1/editor-help';
const UPLOAD_ENDPOINT = '/ud-settings/v1/editor-help/upload';
const DELETE_IMAGE_ENDPOINT = '/ud-settings/v1/editor-help/delete-image';

const DEFAULT_SETTINGS = {
	enableEditorHelp: false,
	title: __( 'Kurzanleitung für die Redaktion', 'ud-settings' ),
	sections: [],
	content: '',
};

const createSectionId = () => {
	if ( window.crypto?.randomUUID ) {
		return `section-${ window.crypto.randomUUID() }`;
	}

	return `section-${ Date.now() }-${ Math.floor( Math.random() * 100000 ) }`;
};

const createEmptySection = () => {
	return {
		id: createSectionId(),
		title: '',
		content: '<p></p>',
		imageUrl: '',
		imageFile: '',
	};
};

export default function EditorHelpOption() {
	const [ settings, setSettings ] = useState( DEFAULT_SETTINGS );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ uploadingSectionId, setUploadingSectionId ] = useState( null );
	const [ notice, setNotice ] = useState( null );
	const fileInputRefs = useRef( {} );

	useEffect( () => {
		loadSettings();
	}, [] );

	const normalizeSettings = ( incomingSettings = {} ) => {
		let sections = Array.isArray( incomingSettings.sections )
			? incomingSettings.sections
			: [];

		if ( ! sections.length && incomingSettings.content ) {
			sections = [
				{
					id: 'section-legacy',
					title: '',
					content: incomingSettings.content,
					imageUrl: '',
					imageFile: '',
				},
			];
		}

		if ( ! sections.length ) {
			sections = [ createEmptySection() ];
		}

		return {
			...DEFAULT_SETTINGS,
			...incomingSettings,
			sections,
		};
	};

	const loadSettings = async () => {
		setIsLoading( true );
		setNotice( null );

		try {
			const response = await apiFetch( {
				path: REST_ENDPOINT,
			} );

			setSettings( normalizeSettings( response.settings || {} ) );
		} catch ( error ) {
			setNotice( {
				status: 'error',
				message:
					error?.message ||
					__(
						'Die Redaktionshilfe konnte nicht geladen werden.',
						'ud-settings'
					),
			} );
		} finally {
			setIsLoading( false );
		}
	};

	const updateSetting = ( key, value ) => {
		setSettings( ( currentSettings ) => {
			return {
				...currentSettings,
				[ key ]: value,
			};
		} );
	};

	const updateSection = ( sectionId, key, value ) => {
		setSettings( ( currentSettings ) => {
			return {
				...currentSettings,
				sections: currentSettings.sections.map( ( section ) => {
					if ( section.id !== sectionId ) {
						return section;
					}

					return {
						...section,
						[ key ]: value,
					};
				} ),
			};
		} );
	};

	const addSection = () => {
		setSettings( ( currentSettings ) => {
			return {
				...currentSettings,
				sections: [ ...currentSettings.sections, createEmptySection() ],
			};
		} );
	};

	const removeSection = ( sectionId ) => {
		setSettings( ( currentSettings ) => {
			const newSections = currentSettings.sections.filter(
				( section ) => {
					return section.id !== sectionId;
				}
			);

			return {
				...currentSettings,
				sections: newSections.length
					? newSections
					: [ createEmptySection() ],
			};
		} );
	};

	const moveSection = ( sectionId, direction ) => {
		setSettings( ( currentSettings ) => {
			const currentIndex = currentSettings.sections.findIndex(
				( section ) => {
					return section.id === sectionId;
				}
			);

			if ( currentIndex < 0 ) {
				return currentSettings;
			}

			const targetIndex = currentIndex + direction;

			if (
				targetIndex < 0 ||
				targetIndex >= currentSettings.sections.length
			) {
				return currentSettings;
			}

			const newSections = [ ...currentSettings.sections ];
			const [ section ] = newSections.splice( currentIndex, 1 );

			newSections.splice( targetIndex, 0, section );

			return {
				...currentSettings,
				sections: newSections,
			};
		} );
	};

	const uploadImage = async ( sectionId, file ) => {
		if ( ! file ) {
			return;
		}

		setUploadingSectionId( sectionId );
		setNotice( null );

		const formData = new window.FormData();
		formData.append( 'file', file );

		try {
			const response = await apiFetch( {
				path: UPLOAD_ENDPOINT,
				method: 'POST',
				body: formData,
			} );

			updateSection( sectionId, 'imageUrl', response.url || '' );
			updateSection( sectionId, 'imageFile', response.imageFile || '' );

			setNotice( {
				status: 'success',
				message: __(
					'Der Screenshot wurde hochgeladen.',
					'ud-settings'
				),
			} );
		} catch ( error ) {
			setNotice( {
				status: 'error',
				message:
					error?.message ||
					__(
						'Der Screenshot konnte nicht hochgeladen werden.',
						'ud-settings'
					),
			} );
		} finally {
			setUploadingSectionId( null );

			if ( fileInputRefs.current[ sectionId ] ) {
				fileInputRefs.current[ sectionId ].value = '';
			}
		}
	};

	const removeImage = async ( section ) => {
		if ( section.imageFile ) {
			try {
				await apiFetch( {
					path: DELETE_IMAGE_ENDPOINT,
					method: 'POST',
					data: {
						imageFile: section.imageFile,
					},
				} );
			} catch ( error ) {
				setNotice( {
					status: 'error',
					message:
						error?.message ||
						__(
							'Der Screenshot konnte nicht gelöscht werden.',
							'ud-settings'
						),
				} );

				return;
			}
		}

		updateSection( section.id, 'imageUrl', '' );
		updateSection( section.id, 'imageFile', '' );
	};

	const saveSettings = async () => {
		setIsSaving( true );
		setNotice( null );

		try {
			const response = await apiFetch( {
				path: REST_ENDPOINT,
				method: 'POST',
				data: {
					settings,
				},
			} );

			setSettings( normalizeSettings( response.settings || {} ) );

			setNotice( {
				status: 'success',
				message: __(
					'Die Redaktionshilfe wurde gespeichert. Die Seite wird neu geladen.',
					'ud-settings'
				),
			} );

			window.setTimeout( () => {
				window.location.reload();
			}, 700 );
		} catch ( error ) {
			setNotice( {
				status: 'error',
				message:
					error?.message ||
					__(
						'Die Redaktionshilfe konnte nicht gespeichert werden.',
						'ud-settings'
					),
			} );
		} finally {
			setIsSaving( false );
		}
	};

	if ( isLoading ) {
		return (
			<Card className="ud-settings-card">
				<CardBody>
					<div className="ud-settings-option ud-settings-option--editor-help">
						<div className="option-loading">
							<Spinner />
							<p>
								{ __(
									'Redaktionshilfe wird geladen ...',
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
				<div className="ud-settings-option ud-settings-option--editor-help">
					<header className="option-header">
						<div className="option-intro">
							<h2 className="option-title">
								{ __( 'Redaktionshilfe', 'ud-settings' ) }
							</h2>

							<p className="option-description">
								{ __(
									'Hier kann eine kurze Anleitung für Redaktoren im WordPress-Dashboard hinterlegt werden.',
									'ud-settings'
								) }
							</p>
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
											'Dashboard-Widget',
											'ud-settings'
										) }
									</h3>

									<p className="section-description">
										{ __(
											'Redaktionshilfe im WordPress-Dashboard anzeigen und benennen.',
											'ud-settings'
										) }
									</p>
								</div>

								<span className="section-meta">
									{ settings.enableEditorHelp
										? __( 'Aktiv', 'ud-settings' )
										: __( 'Inaktiv', 'ud-settings' ) }
								</span>
							</div>

							<div className="section-body">
								<label
									className={
										settings.enableEditorHelp
											? 'setting-row setting-row--checkbox is-active'
											: 'setting-row setting-row--checkbox'
									}
								>
									<div className="setting-control">
										<CheckboxControl
											checked={
												settings.enableEditorHelp
											}
											onChange={ ( value ) =>
												updateSetting(
													'enableEditorHelp',
													value
												)
											}
											__next40pxDefaultSize={ true }
											__nextHasNoMarginBottom={ true }
										/>
									</div>

									<div className="setting-content">
										<h4 className="setting-title">
											{ __(
												'Redaktionshilfe im Dashboard anzeigen',
												'ud-settings'
											) }
										</h4>

										<p className="setting-description">
											{ __(
												'Zeigt die hinterlegte Kurzanleitung als Dashboard-Widget im WordPress-Admin an.',
												'ud-settings'
											) }
										</p>
									</div>

									<span className="setting-meta">
										{ settings.enableEditorHelp
											? __( 'Aktiv', 'ud-settings' )
											: __( 'Inaktiv', 'ud-settings' ) }
									</span>
								</label>

								<div className="setting-fields">
									<TextControl
										label={ __(
											'Widget-Titel',
											'ud-settings'
										) }
										value={ settings.title }
										onChange={ ( value ) =>
											updateSetting( 'title', value )
										}
										__next40pxDefaultSize={ true }
										__nextHasNoMarginBottom={ true }
									/>
								</div>
							</div>
						</section>

						<section className="option-section">
							<div className="section-header">
								<div className="section-intro">
									<h3 className="section-title">
										{ __( 'Abschnitte', 'ud-settings' ) }
									</h3>

									<p className="section-description">
										{ __(
											'Inhalte und Screenshots für die Redaktionshilfe verwalten.',
											'ud-settings'
										) }
									</p>
								</div>

								<span className="section-meta">
									{ settings.sections.length }
								</span>
							</div>

							<div className="ud-settings-editor-help__sections">
								{ settings.sections.map( ( section, index ) => {
									const isUploading =
										uploadingSectionId === section.id;

									return (
										<div
											className="ud-settings-editor-help__section"
											key={ section.id }
										>
											<div className="ud-settings-editor-help__section-header">
												<h3>
													{ section.title ||
														__(
															'Neuer Abschnitt',
															'ud-settings'
														) }
												</h3>

												<div className="ud-settings-editor-help__section-actions">
													<Button
														variant="tertiary"
														onClick={ () =>
															moveSection(
																section.id,
																-1
															)
														}
														disabled={ index === 0 }
														__next40pxDefaultSize={
															true
														}
													>
														{ __(
															'Nach oben',
															'ud-settings'
														) }
													</Button>

													<Button
														variant="tertiary"
														onClick={ () =>
															moveSection(
																section.id,
																1
															)
														}
														disabled={
															index ===
															settings.sections
																.length -
																1
														}
														__next40pxDefaultSize={
															true
														}
													>
														{ __(
															'Nach unten',
															'ud-settings'
														) }
													</Button>

													<Button
														variant="secondary"
														isDestructive={ true }
														onClick={ () =>
															removeSection(
																section.id
															)
														}
														__next40pxDefaultSize={
															true
														}
													>
														{ __(
															'Entfernen',
															'ud-settings'
														) }
													</Button>
												</div>
											</div>

											<div className="ud-settings-editor-help__section-fields">
												<TextControl
													label={ __(
														'Abschnittstitel',
														'ud-settings'
													) }
													value={ section.title }
													onChange={ ( value ) =>
														updateSection(
															section.id,
															'title',
															value
														)
													}
													__next40pxDefaultSize={
														true
													}
													__nextHasNoMarginBottom={
														true
													}
												/>

												<TextareaControl
													label={ __(
														'Inhalt',
														'ud-settings'
													) }
													help={ __(
														'HTML ist erlaubt. Unsichere HTML-Tags werden beim Speichern entfernt.',
														'ud-settings'
													) }
													value={ section.content }
													onChange={ ( value ) =>
														updateSection(
															section.id,
															'content',
															value
														)
													}
													rows={ 10 }
													__nextHasNoMarginBottom={
														true
													}
												/>

												<div className="ud-settings-editor-help__image-field">
													<p className="ud-settings-editor-help__image-label">
														{ __(
															'Screenshot',
															'ud-settings'
														) }
													</p>

													{ section.imageUrl && (
														<figure className="ud-settings-editor-help__image-preview">
															<img
																src={
																	section.imageUrl
																}
																alt=""
															/>
														</figure>
													) }

													<div className="ud-settings-editor-help__image-actions">
														<input
															type="file"
															accept="image/jpeg,image/png,image/webp"
															ref={ (
																element
															) => {
																fileInputRefs.current[
																	section.id
																] = element;
															} }
															onChange={ (
																event
															) =>
																uploadImage(
																	section.id,
																	event.target
																		.files?.[ 0 ]
																)
															}
														/>

														<Button
															variant="secondary"
															onClick={ () =>
																fileInputRefs.current[
																	section.id
																]?.click()
															}
															isBusy={
																isUploading
															}
															disabled={
																isUploading
															}
															__next40pxDefaultSize={
																true
															}
														>
															{ section.imageUrl
																? __(
																		'Screenshot ersetzen',
																		'ud-settings'
																  )
																: __(
																		'Screenshot hochladen',
																		'ud-settings'
																  ) }
														</Button>

														{ section.imageUrl && (
															<Button
																variant="tertiary"
																isDestructive={
																	true
																}
																onClick={ () =>
																	removeImage(
																		section
																	)
																}
																disabled={
																	isUploading
																}
																__next40pxDefaultSize={
																	true
																}
															>
																{ __(
																	'Screenshot entfernen',
																	'ud-settings'
																) }
															</Button>
														) }
													</div>
												</div>
											</div>
										</div>
									);
								} ) }
							</div>
						</section>
					</div>

					<div className="option-actions">
						<Button
							variant="secondary"
							onClick={ addSection }
							disabled={ isSaving }
							__next40pxDefaultSize={ true }
							__nextHasNoMarginBottom={ true }
						>
							{ __( 'Abschnitt hinzufügen', 'ud-settings' ) }
						</Button>

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
