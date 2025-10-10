/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    hiddenDMs: {
        type: OptionType.STRING,
        default: "",
        description: "Stored CSS rules hiding group DMs",
    },
});

let style: HTMLStyleElement | null = null;
let observer: MutationObserver | null = null;
let lastPath = window.location.pathname;
let urlWatcher: number | null = null;

/** Create and attach a <style> tag for hiding DMs */
function applyCss() {
    if (style) return;
    style = document.createElement("style");
    style.id = "hide-group-dm-style";
    document.head.appendChild(style);
    style.textContent = settings.store.hiddenDMs;
}

/** Removes styling **/
function removeCss() {
    style?.remove();
    style = null;
}

/** Update the <style> tag's text */
function updateCss() {
    if (style) style.textContent = settings.store.hiddenDMs;
}

/** Add a DM to the hidden list */
function hideDM(dmId: string) {
    if (!dmId) return;
    const rule = `li:has(a[href="/channels/@me/${dmId}"]) { display: none !important; }\n`;
    if (!settings.store.hiddenDMs.includes(rule)) {
        settings.store.hiddenDMs += rule;
        //updates css with the added channel id
        updateCss();
        console.log(`[HideGroupChats] Hidden group DM: ${dmId}`);
    }
}

/** Remove a DM from the hidden list */
function unhideDM(dmId: string) {
    if (!dmId) return;
    const regex = new RegExp(
        `li:has\\(a\\[href="/channels/@me/${dmId}"]\\) \\{ display: none !important; }\\n?`,
        "g"
    );
    settings.store.hiddenDMs = settings.store.hiddenDMs.replace(regex, "");
    // Updates the css to unhide the selected DM's
    updateCss();
    console.log(`[HideGroupChats] Unhidden group DM: ${dmId}`);
}

/** Intercept the close X icon to hide group DMs instead of leaving them */
function interceptCloseIcons() {
    document.querySelectorAll("svg.closeIcon__972a0").forEach(icon => {
        const el = icon as HTMLElement;
        if (el.dataset.hideGroupBound) return;
        el.dataset.hideGroupBound = "true";

        el.addEventListener("click", e => {
            const dmLink = el.closest("li")?.querySelector<HTMLAnchorElement>('a[href*="/channels/@me/"]');
            const dmId = dmLink?.getAttribute("href")?.split("/").pop();
            const label = dmLink?.getAttribute("aria-label") ?? "";

            // Only target group DMs
            if (!label.includes("(group message)")) return;

            e.stopPropagation();
            e.preventDefault();

            hideDM(dmId!);
        });
    });
}

/** Detect when a group DM is actually opened */
function detectOpenedGroupDM() {
    const path = window.location.pathname;
    if (path === lastPath) return;
    lastPath = path;

    const match = path.match(/\/channels\/@me\/(\d+)/);
    const dmId = match?.[1];
    if (!dmId) return;

    // Check if the current DM is a group message
    const dmLink = document.querySelector(`a[href="/channels/@me/${dmId}"]`);
    const label = dmLink?.getAttribute("aria-label") ?? "";

    // Only unhide if it's a group DM
    if (label.includes("(group message)")) {
        unhideDM(dmId);
    }
}

/** Observe DOM for new icons and watch for URL changes */
function observeSidebar() {
    if (observer) return;

    observer = new MutationObserver(() => {
        // Only handle new icons here
        interceptCloseIcons();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Watch for navigation changes (every 500ms)
    urlWatcher = window.setInterval(detectOpenedGroupDM, 500);
}

/** Clean up observers and event listeners */
function cleanupObservers() {
    observer?.disconnect();
    observer = null;

    if (urlWatcher) {
        clearInterval(urlWatcher);
        urlWatcher = null;
    }
}

export default definePlugin({
    name: "HideGroupChats",
    description: "Hide group DMs via the X icon.",
    authors: [{ name: "You", id: 444319970122530818n }],
    settings,
    start() {
        applyCss();
        interceptCloseIcons();
        observeSidebar();
    },
    stop() {
        cleanupObservers();
        removeCss();
    },
});
