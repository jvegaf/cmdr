/**
 * Application Menu
 *
 * AIDEV-NOTE: Defines the native application menu for the Electron app.
 * Sends IPC events to renderer for most actions.
 * Menu structure: File, Edit, View, Help
 */

import {
	app,
	BrowserWindow,
	Menu,
	type MenuItemConstructorOptions,
	shell,
} from "electron";

// ============================================================================
// Menu Actions (sent to renderer via IPC)
// ============================================================================

/**
 * Send a menu action to the focused window's renderer
 */
function sendMenuAction(action: string, payload?: unknown): void {
	const focusedWindow = BrowserWindow.getFocusedWindow();
	if (focusedWindow) {
		focusedWindow.webContents.send("menu:action", { action, payload });
	}
}

// ============================================================================
// Menu Template
// ============================================================================

const isMac = process.platform === "darwin";

function buildMenuTemplate(): MenuItemConstructorOptions[] {
	const template: MenuItemConstructorOptions[] = [];

	// macOS app menu
	if (isMac) {
		template.push({
			label: app.name,
			submenu: [
				{ role: "about" },
				{ type: "separator" },
				{
					label: "Settings...",
					accelerator: "Cmd+,",
					click: () => sendMenuAction("settings"),
				},
				{ type: "separator" },
				{ role: "services" },
				{ type: "separator" },
				{ role: "hide" },
				{ role: "hideOthers" },
				{ role: "unhide" },
				{ type: "separator" },
				{ role: "quit" },
			],
		});
	}

	// File menu
	template.push({
		label: "File",
		submenu: [
			{
				label: "New",
				accelerator: "CmdOrCtrl+N",
				click: () => sendMenuAction("new"),
			},
			{
				label: "Open...",
				accelerator: "CmdOrCtrl+O",
				click: () => sendMenuAction("open"),
			},
			{ type: "separator" },
			{
				label: "Save",
				accelerator: "CmdOrCtrl+S",
				click: () => sendMenuAction("save"),
			},
			{
				label: "Save As...",
				accelerator: "CmdOrCtrl+Shift+S",
				click: () => sendMenuAction("saveAs"),
			},
			{ type: "separator" },
			{
				label: "Export to CSV...",
				click: () => sendMenuAction("exportCsv"),
			},
			{ type: "separator" },
			{
				label: "Close",
				accelerator: "CmdOrCtrl+W",
				click: () => sendMenuAction("close"),
			},
			...(isMac
				? []
				: [
						{ type: "separator" as const },
						{
							label: "Settings...",
							accelerator: "Ctrl+,",
							click: () => sendMenuAction("settings"),
						},
						{ type: "separator" as const },
						{ role: "quit" as const },
					]),
		],
	});

	// Edit menu
	template.push({
		label: "Edit",
		submenu: [
			{
				label: "Undo",
				accelerator: "CmdOrCtrl+Z",
				click: () => sendMenuAction("undo"),
			},
			{
				label: "Redo",
				accelerator: isMac ? "Cmd+Shift+Z" : "Ctrl+Y",
				click: () => sendMenuAction("redo"),
			},
			{ type: "separator" },
			{
				label: "Cut",
				accelerator: "CmdOrCtrl+X",
				click: () => sendMenuAction("cut"),
			},
			{
				label: "Copy",
				accelerator: "CmdOrCtrl+C",
				click: () => sendMenuAction("copy"),
			},
			{
				label: "Paste",
				accelerator: "CmdOrCtrl+V",
				click: () => sendMenuAction("paste"),
			},
			{
				label: "Duplicate",
				accelerator: "CmdOrCtrl+D",
				click: () => sendMenuAction("duplicate"),
			},
			{ type: "separator" },
			{
				label: "Delete",
				accelerator: "Delete",
				click: () => sendMenuAction("delete"),
			},
			{ type: "separator" },
			{
				label: "Select All",
				accelerator: "CmdOrCtrl+A",
				click: () => sendMenuAction("selectAll"),
			},
		],
	});

	// View menu
	template.push({
		label: "View",
		submenu: [
			{
				label: "Theme",
				submenu: [
					{
						label: "Light",
						type: "radio",
						click: () => sendMenuAction("theme", "light"),
					},
					{
						label: "Dark",
						type: "radio",
						click: () => sendMenuAction("theme", "dark"),
					},
					{
						label: "System",
						type: "radio",
						click: () => sendMenuAction("theme", "system"),
					},
				],
			},
			{ type: "separator" },
			{
				label: "Commands Report",
				click: () => sendMenuAction("showCommandsReport"),
			},
			{
				label: "Conditions Summary",
				click: () => sendMenuAction("showConditionsSummary"),
			},
			{ type: "separator" },
			{ role: "reload" },
			{ role: "forceReload" },
			{ role: "toggleDevTools" },
			{ type: "separator" },
			{ role: "resetZoom" },
			{ role: "zoomIn" },
			{ role: "zoomOut" },
			{ type: "separator" },
			{ role: "togglefullscreen" },
		],
	});

	// Window menu (macOS)
	if (isMac) {
		template.push({
			label: "Window",
			submenu: [
				{ role: "minimize" },
				{ role: "zoom" },
				{ type: "separator" },
				{ role: "front" },
				{ type: "separator" },
				{ role: "window" },
			],
		});
	}

	// Help menu
	template.push({
		label: "Help",
		submenu: [
			{
				label: "Keyboard Shortcuts",
				accelerator: "CmdOrCtrl+/",
				click: () => sendMenuAction("shortcuts"),
			},
			{ type: "separator" },
			{
				label: "Documentation",
				click: () => {
					shell.openExternal(
						"https://github.com/cmdr-editor/cmdr/blob/main/docs/README.md",
					);
				},
			},
			{
				label: "Report Issue",
				click: () => {
					shell.openExternal("https://github.com/cmdr-editor/cmdr/issues");
				},
			},
			{
				label: "GitHub Repository",
				click: () => {
					shell.openExternal("https://github.com/cmdr-editor/cmdr");
				},
			},
			{ type: "separator" },
			{
				label: "About CMDR",
				click: () => sendMenuAction("about"),
			},
		],
	});

	return template;
}

// ============================================================================
// Setup Menu
// ============================================================================

/**
 * Build and set the application menu
 */
export function setupApplicationMenu(): void {
	const template = buildMenuTemplate();
	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
}

/**
 * Update the theme radio buttons in the View menu
 * Call this when the theme changes to keep menu state in sync
 */
export function updateThemeMenuState(theme: "light" | "dark" | "system"): void {
	const menu = Menu.getApplicationMenu();
	if (!menu) return;

	const viewMenu = menu.items.find((item) => item.label === "View");
	if (!viewMenu?.submenu) return;

	const themeMenu = viewMenu.submenu.items.find(
		(item) => item.label === "Theme",
	);
	if (!themeMenu?.submenu) return;

	for (const item of themeMenu.submenu.items) {
		if (item.label?.toLowerCase() === theme) {
			item.checked = true;
		}
	}
}
