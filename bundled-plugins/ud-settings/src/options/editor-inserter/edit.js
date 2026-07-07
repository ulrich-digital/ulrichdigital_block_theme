import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Card,
	CardBody,
	CheckboxControl,
	Notice,
	Spinner,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

const REST_ENDPOINT = '/ud-settings/v1/editor-inserter';

const DEFAULT_SETTINGS = {
	onlyOwnPatterns: false,
	onlyLocalMedia: false,
};

const INSERTER_OPTIONS = [
	{
		key: 'onlyOwnPatterns',
		title: __( 'Nur eigene Vorlagen anzeigen', 'ud-settings' ),
		description: __(
			'Entfernt Core-, Theme-, Plugin- und Remote-Vorlagen aus dem Inserter. Selbst im Editor erstellte Vorlagen bleiben sichtbar.',
			'ud-settings'
		),
	},
	{
		key: 'onlyLocalMedia',
		title: __( 'Nur lokale Mediathek anzeigen', 'ud-settings' ),
		description: __(
			'Entfernt externe Medienquellen wie Openverse aus dem Medien-Tab des Inserters.',
			'ud-settings'
		),
	},
];

export default function EditorInserterOption() {
	const [ settings, setSettings ] = useState( DEFAULT_SETTINGS );
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

			setSettings( {
				...DEFAULT_SETTINGS,
				...( response.settings || {} ),
			} );
		} catch ( error ) {
			setNotice( {
				status: 'error',
				message:
					error?.message ||
					__(
						'Die Inserter-Einstellungen konnten nicht geladen werden.',
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

	const enableAll = () => {
		setSettings(
			Object.keys( DEFAULT_SETTINGS ).reduce( ( newSettings, key ) => {
				return {
					...newSettings,
					[ key ]: true,
				};
			}, {} )
		);
	};

	const disableAll = () => {
		setSettings( DEFAULT_SETTINGS );
	};

	const activeCount = INSERTER_OPTIONS.filter( ( option ) => {
		return !! settings[ option.key ];
	} ).length;

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

			setSettings( {
				...DEFAULT_SETTINGS,
				...( response.settings || {} ),
			} );

			setNotice( {
				status: 'success',
				message: __(
					'Die Inserter-Einstellungen wurden gespeichert. Die Seite wird neu geladen.',
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
						'Die Inserter-Einstellungen konnten nicht gespeichert werden.',
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
					<div className="ud-settings-option ud-settings-option--editor-inserter">
						<div className="option-loading">
							<Spinner />
							<p>
								{ __(
									'Inserter-Einstellungen werden geladen ...',
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
				<div className="ud-settings-option ud-settings-option--editor-inserter">
					<header className="option-header">
						<div className="option-intro">
							<h2 className="option-title">
								{ __( 'Editor-Inserter', 'ud-settings' ) }
							</h2>

							<p className="option-description">
								{ __(
									'Hier können Vorlagen und Medienquellen im Block-Inserter vereinfacht werden.',
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
										{ __( 'Inserter', 'ud-settings' ) }
									</h3>

									<p className="section-description">
										{ __(
											'Vorlagen und externe Medienquellen im Block-Inserter steuern.',
											'ud-settings'
										) }
									</p>
								</div>

								<span className="section-meta">
									{ sprintf(
										__( '%d aktiv', 'ud-settings' ),
										activeCount
									) }
								</span>
							</div>

							<div className="section-body">
								{ INSERTER_OPTIONS.map( ( option ) => {
									const isActive = !! settings[ option.key ];

									return (
										<label
											className={
												isActive
													? 'setting-row setting-row--checkbox is-active'
													: 'setting-row setting-row--checkbox'
											}
											key={ option.key }
										>
											<div className="setting-control">
												<CheckboxControl
													checked={ isActive }
													onChange={ ( value ) =>
														updateSetting(
															option.key,
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
											</div>

											<div className="setting-content">
												<h4 className="setting-title">
													{ option.title }
												</h4>

												<p className="setting-description">
													{ option.description }
												</p>
											</div>

											<span className="setting-meta">
												{ isActive
													? __(
															'Aktiv',
															'ud-settings'
													  )
													: __(
															'Inaktiv',
															'ud-settings'
													  ) }
											</span>
										</label>
									);
								} ) }
							</div>
						</section>
					</div>

					<div className="option-actions">
						<Button
							variant="secondary"
							onClick={ enableAll }
							disabled={ isSaving }
							__next40pxDefaultSize={ true }
							__nextHasNoMarginBottom={ true }
						>
							{ __( 'Alle aktivieren', 'ud-settings' ) }
						</Button>

						<Button
							variant="secondary"
							onClick={ disableAll }
							disabled={ isSaving }
							__next40pxDefaultSize={ true }
							__nextHasNoMarginBottom={ true }
						>
							{ __( 'Alle deaktivieren', 'ud-settings' ) }
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
