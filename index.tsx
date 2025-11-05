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
let sidebarObserver: MutationObserver | null = null;
let urlObserver: MutationObserver | null = null;

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
        updateCss();
        console.log(`[HideGroupChats] Hidden group DM: ${dmId}`);
    }
}

/** Remove a DM from the hidden list */
function unhideDM(dmId: string) {
    if (!dmId) return;
    const rule = `li:has(a[href="/channels/@me/${dmId}"]) { display: none !important; }\n`;
    settings.store.hiddenDMs = settings.store.hiddenDMs.replace(rule, "");
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

/** Detects when a group DM is opened */
function detectOpenedGroupDM() {
    const path = window.location.pathname;
    const match = path.match(/\/channels\/@me\/(\d+)/);
    const dmId = match?.[1];
    if (!dmId) return;

    // Check if the current DM is a group message
    const dmLink = document.querySelector(`a[href="/channels/@me/${dmId}"]`);
    const label = dmLink?.getAttribute("aria-label") ?? "";

    if (label.includes("(group message)")) {
        unhideDM(dmId);
    }
}

/** Watches for changes in the windows pathname URL*/
function startUrlWatcher() {
    // Check immediately in case Discord opens in a group DM
    detectOpenedGroupDM();

    let lastPath = window.location.pathname;

    const checkPath = () => {
        const newPath = window.location.pathname;
        if (newPath !== lastPath) {
            lastPath = newPath;
            detectOpenedGroupDM();
        }
    };

    urlObserver = new MutationObserver(checkPath);
    urlObserver.observe(document.body, { childList: true, subtree: true });
}

/** Observe DOM for new icons and watch for URL changes */
function observeSidebar() {
    if (sidebarObserver) return;

    sidebarObserver = new MutationObserver(interceptCloseIcons);
    sidebarObserver.observe(document.body, { childList: true, subtree: true });

    startUrlWatcher();
}

/** Clean up observers and event listeners */
function cleanupObservers() {
    sidebarObserver?.disconnect();
    sidebarObserver = null;

    urlObserver?.disconnect();
    urlObserver = null;
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
