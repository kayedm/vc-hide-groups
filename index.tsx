/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin, { OptionType } from "@utils/types";

const css = `
li:has(a[aria-label*="(group message)"]) {
    display: none !important;
}
`;

export default definePlugin({
    name: "HideGroupDM",
    description: "Hides group DMs from your Direct Messages",
    authors: [{ name: "Kayed", id: 444319970122530818n }],

    applyStyle: css

});
