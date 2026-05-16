#!/usr/bin/env node

/* =============================================================== *\
	Bundled-Plugin-Sync-Skript für UD Settings
\* =============================================================== */

import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import chokidar from "chokidar";
import ftp from "basic-ftp";
import glob from "fast-glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THEME_ROOT = __dirname;
const THEME_NAME = path.basename(THEME_ROOT);

const PLUGIN_NAME = "ud-settings";
const LOCAL_PLUGIN_DIR = path.join(THEME_ROOT, "bundled-plugins", PLUGIN_NAME);

const IGNORED_GLOB_PATTERNS = [
	"node_modules/**",
	".git/**",
	".DS_Store",
	"**/.DS_Store",
];

const IGNORED_WATCH_PATTERNS = [
	/node_modules/,
	/\.git/,
	/\.DS_Store$/,
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
	const sftpPath = findSftpConfig(THEME_ROOT);

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

function getRemoteThemePath(config) {
	const normalizedRemotePath = config.remotePath.replace(/\/+$/, "");

	if (normalizedRemotePath.endsWith(`/${THEME_NAME}`)) {
		return normalizedRemotePath;
	}

	return path.posix.join(normalizedRemotePath, THEME_NAME);
}

function toPosixPath(value) {
	return value.split(path.sep).join(path.posix.sep);
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

async function uploadFileWithClient(client, remotePluginBase, relPath, localFile) {
	const relPathPosix = toPosixPath(relPath);
	const remoteDir = path.posix.join(
		remotePluginBase,
		path.posix.dirname(relPathPosix)
	);
	const remoteFile = path.posix.join(remotePluginBase, relPathPosix);

	await client.cd("/");
	await client.ensureDir(remoteDir);
	await client.cd("/");

	console.log(`Upload: ${relPathPosix}`);
	await client.uploadFrom(localFile, remoteFile);
}

async function uploadFile(config, remotePluginBase, relPath, localFile) {
	const client = await createFtpClient(config);

	try {
		await uploadFileWithClient(client, remotePluginBase, relPath, localFile);
	} catch (error) {
		console.error("FTP-Fehler beim Upload:", error);
	} finally {
		client.close();
	}
}

async function deleteRemotePath(config, remotePluginBase, relPath, isDirectory) {
	const client = await createFtpClient(config);
	const relPathPosix = toPosixPath(relPath);
	const remotePath = path.posix.join(remotePluginBase, relPathPosix);

	try {
		if (isDirectory) {
			console.log(`Remote-Ordner löschen: ${relPathPosix}`);
			await client.removeDir(remotePath);
		} else {
			console.log(`Remote-Datei löschen: ${relPathPosix}`);
			await client.remove(remotePath);
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

async function uploadAllFiles(config, remotePluginBase) {
	console.log("Starte initiale Aktualisierung ...");

	const files = await glob("**/*", {
		cwd: LOCAL_PLUGIN_DIR,
		dot: true,
		onlyFiles: true,
		ignore: IGNORED_GLOB_PATTERNS,
	});

	const client = await createFtpClient(config);

	try {
		for (const file of files) {
			const localFile = path.join(LOCAL_PLUGIN_DIR, file);
			await uploadFileWithClient(client, remotePluginBase, file, localFile);
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

if (!fs.existsSync(LOCAL_PLUGIN_DIR)) {
	console.error(`Plugin-Verzeichnis nicht gefunden: ${LOCAL_PLUGIN_DIR}`);
	process.exit(1);
}

const config = loadSftpConfig();
const remoteThemePath = getRemoteThemePath(config);
const remotePluginBase = path.posix.join(
	remoteThemePath,
	"bundled-plugins",
	PLUGIN_NAME
);

console.log(`Theme: ${THEME_NAME}`);
console.log(`Lokales Plugin: ${LOCAL_PLUGIN_DIR}`);
console.log(`Remote-Ziel: ${remotePluginBase}`);

const updateAll = await askYesNo("Jetzt ud-settings initial vollständig hochladen?");

if (updateAll) {
	await uploadAllFiles(config, remotePluginBase);
} else {
	console.log("Initiale Aktualisierung übersprungen.");
}

/* =============================================================== *\
	Watcher
\* =============================================================== */

console.log(`Watcher gestartet für: bundled-plugins/${PLUGIN_NAME}`);

const watcher = chokidar.watch(LOCAL_PLUGIN_DIR, {
	ignored: IGNORED_WATCH_PATTERNS,
	persistent: true,
	usePolling: true,
	interval: 300,
	depth: 20,
	ignoreInitial: true,
});

watcher.on("all", async (event, changedPath) => {
	const relPath = path.relative(LOCAL_PLUGIN_DIR, changedPath);

	if (!relPath || relPath.startsWith("..")) {
		return;
	}

	if (event === "unlink") {
		await deleteRemotePath(config, remotePluginBase, relPath, false);
		return;
	}

	if (event === "unlinkDir") {
		await deleteRemotePath(config, remotePluginBase, relPath, true);
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

	await uploadFile(config, remotePluginBase, relPath, changedPath);
});