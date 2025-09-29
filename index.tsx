/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";


let hiddenCss = "";
let style: HTMLStyleElement;

const settings = definePluginSettings({
    groupList: {
        type: OptionType.COMPONENT,
        description: "Enable hiding group DMs",
        component: () => {

            const groupDMs = document.querySelectorAll('a[aria-label*="(group message)"]');
            const groupDMFiltered = Array.from(groupDMs).map(dm => {
                const id = dm.getAttribute("href")?.split("/").pop() ?? "";
                const label = dm.getAttribute("aria-label") ?? "";
                const name = label.replace(" (group message)", "");
                return { id, name };
            });
            applyCss();

            return (
                <div>
                    {groupDMFiltered.map((dm, i) => (
                        <label key={i} style={{ color: "#FFFFFF" }}>
                            <input
                                type="checkbox"
                                onChange={e => handleDMList(dm.id, e.currentTarget.checked)}
                            />
                            {dm.name}
                            <br/>
                        </label>
                    ))}
                </div>
            );
        }
    },
});

function applyCss () {
    style = document.createElement("style");
    style.id = "hide-group-dm-style";
    document.head.appendChild(style);
    style.textContent = hiddenCss;
}

function handleDMList(dm, checked) {
    if (checked) {
        hiddenCss += `li:has(a[href="/channels/@me/${dm}"]) { display: none !important; }\n`;
        console.log(hiddenCss);
    }
}

export default definePlugin({
    name: "HideGroupDM",
    description: "Hides group DMs from your Direct Messages",
    authors: [{ name: "You", id: 444319970122530818n }],
    settings,
});
