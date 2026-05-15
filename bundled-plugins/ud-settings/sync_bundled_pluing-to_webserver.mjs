#!/usr/bin/env node

/* =============================================================== *\
	Bundled-Plugin-Sync-Skript
	Quelle: bundled-plugins/ud-settings
	Ziele:
	1. Theme-Bundle
	2. aktiv installiertes Plugin
\* =============================================================== */

import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import chokidar from "chokidar";
import ftp from "basic-ftp";
import glob from "fast-glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPT_NAME = path.basename(__filename);

const PLUGIN_ROOT = __dirname;
const PLUGIN_NAME = path.basename(PLUGIN_ROOT);
const THEME_ROOT = path.resolve(PLUGIN_ROOT, "../..");
const THEME_NAME = path.basename(THEME_ROOT);

const IGNORED_GLOB_PATTERNS = [
	"node_modules/**",
	".git/**",
	".DS_Store",
	"**/.DS_Store",
	SCRIPT_NAME,
];

const IGNORED_WATCH_PATTERNS = [
	/node_modules/,
	/\.git/,
	/\.DS_Store$/,
	new RegExp(`${SCRIPT_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
];

/* =============================================================== *\
	SFTP-Konfiguration suchen
\* =============================================================== */

function findSftpConfig(startDir, maxLevels = 8) {
	let currentDir = startDir;

	for (let level = 0; level <= maxLevels; level++) {
		const candidate = path.join(currentDir, ".vscode", "sftp.json");

		if (fs.existsSync(candidate)) {
			return candidate;
		}

		const parentDir = path.dirname(currentDir);

		if (parentDir === currentDir) {
			break;
		}

		currentDir = parentDir;
	}

	throw new Error(
		`Keine .vscode/sftp.json gefunden. Gesucht wurde ab: ${startDir}`
	);
}

function loadSftpConfig() {
	const sftpPath = findSftpConfig(PLUGIN_ROOT);

	console.log(`SFTP-Konfiguration gefunden: ${sftpPath}`);

	const config = JSON.parse(fs.readFileSync(sftpPath, "utf8"));

	if (!config.host || !config.username || !config.password || !config.remotePath) {
		throw new Error(
			"Die sftp.json ist unvollständig. Benötigt werden host, username, password und remotePath."
		);
	}

	return config;
}

/* =============================================================== *\
	Pfade bestimmen
\* =============================================================== */

function normalizeRemoteBasePath(remotePath) {
	return remotePath.replace(/\/+$/, "");
}

function toPosixPath(value) {
	return value.split(path.sep).join(path.posix.sep);
}

function getRemoteTargets(config) {
	const remoteBasePath = normalizeRemoteBasePath(config.remotePath);

	const bundledPluginBase = path.posix.join(
		remoteBasePath,
		"themes",
		THEME_NAME,
		"bundled-plugins",
		PLUGIN_NAME
	);

	const activePluginBase = path.posix.join(
		remoteBasePath,
		"plugins",
		PLUGIN_NAME
	);

	return [
		{
			label: "Theme-Bundle",
			basePath: bundledPluginBase,
		},
		{
			label: "Aktives Plugin",
			basePath: activePluginBase,
		},
	];
}

/* =============================================================== *\
	FTP-Verbindung
\* =============================================================== */

async function createFtpClient(config) {
	const client = new ftp.Client();
	client.ftp.verbose = false;

	await client.access({
		host: config.host,
		user: config.username,
		password: config.password,
		secure: false,
	});

	return client;
}

/* =============================================================== *\
	Upload / Delete
\* =============================================================== */

async function uploadFileToTarget(client, target, relPath, localFile) {
	const relPathPosix = toPosixPath(relPath);
	const remoteDir = path.posix.join(
		target.basePath,
		path.posix.dirname(relPathPosix)
	);
	const remoteFile = path.posix.join(target.basePath, relPathPosix);

	await client.cd("/");
	await client.ensureDir(remoteDir);
	await client.cd("/");

	console.log(`Upload [${target.label}]: ${relPathPosix}`);
	await client.uploadFrom(localFile, remoteFile);
}

async function uploadFileToAllTargets(config, targets, relPath, localFile) {
	const client = await createFtpClient(config);

	try {
		for (const target of targets) {
			await uploadFileToTarget(client, target, relPath, localFile);
		}
	} catch (error) {
		console.error("FTP-Fehler beim Upload:", error);
	} finally {
		client.close();
	}
}

async function deleteRemotePathFromTarget(client, target, relPath, isDirectory) {
	const relPathPosix = toPosixPath(relPath);
	const remotePath = path.posix.join(target.basePath, relPathPosix);

	if (isDirectory) {
		console.log(`Remote-Ordner löschen [${target.label}]: ${relPathPosix}`);
		await client.removeDir(remotePath);
		return;
	}

	console.log(`Remote-Datei löschen [${target.label}]: ${relPathPosix}`);
	await client.remove(remotePath);
}

async function deleteRemotePathFromAllTargets(config, targets, relPath, isDirectory) {
	const client = await createFtpClient(config);

	try {
		for (const target of targets) {
			await deleteRemotePathFromTarget(client, target, relPath, isDirectory);
		}
	} catch (error) {
		console.error("FTP-Fehler beim Löschen:", error);
	} finally {
		client.close();
	}
}

/* =============================================================== *\
	Initialer Upload
\* =============================================================== */

async function uploadAllFiles(config, targets) {
	console.log("Starte initiale Aktualisierung ...");

	const files = await glob("**/*", {
		cwd: PLUGIN_ROOT,
		dot: true,
		onlyFiles: true,
		ignore: IGNORED_GLOB_PATTERNS,
	});

	const client = await createFtpClient(config);

	try {
		for (const file of files) {
			const localFile = path.join(PLUGIN_ROOT, file);

			for (const target of targets) {
				await uploadFileToTarget(client, target, file, localFile);
			}
		}

		console.log("Initiale Aktualisierung abgeschlossen.");
	} catch (error) {
		console.error("FTP-Fehler bei der initialen Aktualisierung:", error);
	} finally {
		client.close();
	}
}

/* =============================================================== *\
	Eingabe-Helfer
\* =============================================================== */

async function askYesNo(question) {
	return new Promise((resolve) => {
		process.stdin.resume();
		process.stdin.setEncoding("utf8");
		process.stdout.write(`${question} (j/n): `);

		process.stdin.once("data", (data) => {
			resolve(data.trim().toLowerCase() === "j");
		});
	});
}

/* =============================================================== *\
	Start
\* =============================================================== */

const config = loadSftpConfig();
const targets = getRemoteTargets(config);

console.log(`Theme: ${THEME_NAME}`);
console.log(`Plugin: ${PLUGIN_NAME}`);
console.log(`Lokales Plugin: ${PLUGIN_ROOT}`);

for (const target of targets) {
	console.log(`Remote-Ziel [${target.label}]: ${target.basePath}`);
}

const updateAll = await askYesNo(
	`Jetzt ${PLUGIN_NAME} initial vollständig an beide Ziele hochladen?`
);

if (updateAll) {
	await uploadAllFiles(config, targets);
} else {
	console.log("Initiale Aktualisierung übersprungen.");
}

/* =============================================================== *\
	Watcher
\* =============================================================== */

console.log(`Watcher gestartet für: ${PLUGIN_NAME}`);

const watcher = chokidar.watch(PLUGIN_ROOT, {
	ignored: IGNORED_WATCH_PATTERNS,
	persistent: true,
	usePolling: true,
	interval: 300,
	depth: 20,
	ignoreInitial: true,
});

watcher.on("all", async (event, changedPath) => {
	const relPath = path.relative(PLUGIN_ROOT, changedPath);

	if (!relPath || relPath.startsWith("..")) {
		return;
	}

	if (relPath === SCRIPT_NAME) {
		return;
	}

	if (event === "unlink") {
		await deleteRemotePathFromAllTargets(config, targets, relPath, false);
		return;
	}

	if (event === "unlinkDir") {
		await deleteRemotePathFromAllTargets(config, targets, relPath, true);
		return;
	}

	if (!fs.existsSync(changedPath)) {
		return;
	}

	const stat = fs.statSync(changedPath);

	if (!stat.isFile()) {
		return;
	}

	console.log(`Änderung erkannt: [${event}] ${relPath}`);

	await uploadFileToAllTargets(config, targets, relPath, changedPath);
});