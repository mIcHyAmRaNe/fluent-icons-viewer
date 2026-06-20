import { useSignal, useSignalEffect } from "@preact/signals";
import {
    currentTab,
    searchQuery,
    theme,
    setTab,
    setSearchQuery,
    toggleTheme,
} from "../lib/store";
import SvgIcon from "./SvgIcon";

export default function Navbar() {
    const tab = useSignal(currentTab.value);
    const q = useSignal(searchQuery.value);
    const isDark = useSignal(theme.value === "dark");
    let debounce: ReturnType<typeof setTimeout> | null = null;

    useSignalEffect(() => {
        tab.value = currentTab.value;
    });
    useSignalEffect(() => {
        isDark.value = theme.value === "dark";
    });

    const pageTitle =
        tab.value === "filled" ? "Filled Icons" : "Outlined Icons";
    const pageSub = tab.value === "filled" ? "(2 px filled)" : "(2 px stroked)";

    const handleSearch = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        q.value = val;
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(() => setSearchQuery(val), 300);
    };

    return (
        <div class="h-[75px] border-t border-b sticky top-0 z-50 border-surface1 bg-base/80 flex items-center justify-between px-8 navbar-frosted">
            <p>
                <span class="text-lg font-medium">{pageTitle}</span>
                <span class="text-overlay2"> {pageSub}</span>
            </p>
            <div class="flex items-center space-x-4">
                <div class="relative flex items-center overflow-hidden rounded-full bg-mantle focus-within:bg-surface0">
                    <input
                        type="text"
                        value={q}
                        onInput={handleSearch}
                        class="focus:outline-none bg-transparent z-10 h-full rounded-l-full px-6 text-sm"
                        placeholder="Search (Press / to focus)"
                        autocomplete="new-password"
                    />
                    <button
                        class="h-10 w-10 flex-center bg-mantle hover:bg-surface0 z-20 focus:outline-none focus:bg-surface0 cursor-pointer transition-colors duration-200"
                        aria-label="Search"
                    >
                        <SvgIcon
                            path="fluent/ic_fluent_search_24_filled.svg"
                            class="text-overlay1"
                        />
                    </button>
                </div>
                <div class="flex rounded-full bg-mantle p-1">
                    {(["outlined", "filled"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            class={`tab-btn ${tab.value === t ? "tab-btn-active" : ""}`}
                        >
                            {t === "filled" ? "Filled" : "Outlined"}
                        </button>
                    ))}
                </div>
                <button
                    onClick={toggleTheme}
                    class="navbar-btn cursor-pointer transition-colors duration-200"
                    aria-label="Dark Mode"
                >
                    {isDark.value ? (
                        <SvgIcon
                            path="fluent/ic_fluent_weather_sunny_24_filled.svg"
                            class="h-5 w-5"
                        />
                    ) : (
                        <SvgIcon
                            path="fluent/ic_fluent_weather_moon_24_regular.svg"
                            class="h-5 w-5"
                        />
                    )}
                    <p class="text-sm">
                        {isDark.value ? "Light" : "Dark"} Mode
                    </p>
                </button>
            </div>
        </div>
    );
}
