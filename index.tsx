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

function applyCss() {
    if (style) return;
    style = document.createElement("style");
    style.id = "hide-group-dm-style";
    document.head.appendChild(style);
    style.textContent = settings.store.hiddenDMs;
}

function interceptCloseIcons() {
    document.querySelectorAll("svg.closeIcon__972a0").forEach(icon => {
        const el = icon as HTMLElement;
        if (el.dataset.hideGroupBound) return;
        el.dataset.hideGroupBound = "true";

        el.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            const dmLink = el.closest("li")?.querySelector<HTMLAnchorElement>('a[href*="/channels/@me/"]');
            const dmId = dmLink?.getAttribute("href")?.split("/").pop();
            const label = dmLink?.getAttribute("aria-label") ?? "";

            if (!dmId || !label.includes("(group message)")) return;

            settings.store.hiddenDMs += `li:has(a[href="/channels/@me/${dmId}"]) { display: none !important; }\n`;

            if (style) {
                style.textContent = settings.store.hiddenDMs;
            }
        });
    });
}

function observeSidebar() {
    if (observer) return;
    observer = new MutationObserver(interceptCloseIcons);
    observer.observe(document.body, { childList: true, subtree: true });
}

export default definePlugin({
    name: "HideGroupChats",
    description: "Remaps the X icon on group DMs to hide them instead of leaving.",
    authors: [{ name: "You", id: 444319970122530818n }],
    settings,
    start() {
        applyCss();
        interceptCloseIcons();
        observeSidebar();
    },
    stop() {
        observer?.disconnect();
        observer = null;
        style?.remove();
        style = null;
    }
});
