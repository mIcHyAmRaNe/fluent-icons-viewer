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
        <div class="navbar-inner h-[75px] border-t border-b sticky top-0 z-50 border-surface1 bg-base/80 flex items-center justify-between px-4 md:px-8 navbar-frosted">
            <p class="hidden sm:block">
                <span class="text-base md:text-lg font-medium">{pageTitle}</span>
                <span class="text-overlay2 text-xs md:text-sm"> {pageSub}</span>
            </p>
            <div class="flex items-center gap-2 md:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                <div class="search-wrap relative flex items-center overflow-hidden rounded-full bg-mantle focus-within:bg-surface0 flex-1 sm:flex-none max-w-[240px] md:max-w-none">
                    <input
                        type="text"
                        value={q}
                        onInput={handleSearch}
                        class="focus:outline-none bg-transparent z-10 h-full rounded-l-full px-4 md:px-6 text-xs md:text-sm w-full min-w-0"
                        placeholder="Search"
                        autocomplete="new-password"
                    />
                    <button
                        class="h-9 md:h-10 w-9 md:w-10 flex-center bg-mantle hover:bg-surface0 z-20 focus:outline-none focus:bg-surface0 cursor-pointer transition-colors duration-200 flex-shrink-0"
                        aria-label="Search"
                    >
                        <SvgIcon
                            path="fluent/ic_fluent_search_24_filled.svg"
                            class="h-4 w-4 md:h-5 md:w-5 text-overlay1"
                        />
                    </button>
                </div>
                <div class="flex rounded-full bg-mantle p-1 flex-shrink-0">
                    {(["outlined", "filled"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            class={`tab-btn px-2 md:px-4 text-xs md:text-sm ${tab.value === t ? "tab-btn-active" : ""}`}
                        >
                            {t === "filled" ? "Filled" : "Outlined"}
                        </button>
                    ))}
                </div>
                <button
                    onClick={toggleTheme}
                    class="navbar-btn h-9 md:h-10 px-2 md:px-4 cursor-pointer transition-colors duration-200 flex-shrink-0"
                    aria-label="Dark Mode"
                >
                    {isDark.value ? (
                        <SvgIcon
                            path="fluent/ic_fluent_weather_sunny_24_filled.svg"
                            class="h-4 w-4 md:h-5 md:w-5"
                        />
                    ) : (
                        <SvgIcon
                            path="fluent/ic_fluent_weather_moon_24_regular.svg"
                            class="h-4 w-4 md:h-5 md:w-5"
                        />
                    )}
                    <p class="text-xs md:text-sm hidden md:inline">
                        {isDark.value ? "Light" : "Dark"} Mode
                    </p>
                </button>
            </div>
        </div>
    );
}
