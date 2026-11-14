import { createContext, useContext, useEffect, useState } from "react";

import { getAnnouncementsAccess } from "../api/api";

// Контекст прав администратора. Загружается один раз при входе в layout
// и переиспользуется Sidebar (скрытие пункта меню) и страницей анонсов.
// Это только UX-подсказка: настоящая проверка прав — на backend.
const AdminAccessContext = createContext({ isAdmin: false, loading: true });

export function AdminAccessProvider({ children }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        getAnnouncementsAccess()
            .then((data) => {
                if (!cancelled) setIsAdmin(Boolean(data?.isAdmin));
            })
            .catch(() => {
                if (!cancelled) setIsAdmin(false);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <AdminAccessContext.Provider value={{ isAdmin, loading }}>
            {children}
        </AdminAccessContext.Provider>
    );
}

export function useAdminAccess() {
    return useContext(AdminAccessContext);
}
