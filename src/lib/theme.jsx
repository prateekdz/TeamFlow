import { createContext, useContext, useEffect, useState } from "react";
const ThemeContext = createContext({
    theme: "dark",
    toggleTheme: () => { },
});
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem("tf-theme");
        return (stored === "light" || stored === "dark") ? stored : "dark";
    });
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "light") {
            root.classList.add("light");
            root.classList.remove("dark");
        }
        else {
            root.classList.add("dark");
            root.classList.remove("light");
        }
        localStorage.setItem("tf-theme", theme);
    }, [theme]);
    const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
    return (<ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>);
}
export function useTheme() {
    return useContext(ThemeContext);
}
