import { useEffect, useState } from "react";
import { checkBackend } from "./api/api";

import {
    BrowserRouter,
    Routes,
    Route,
    useLocation,
    Navigate
} from "react-router-dom";

import Header from "./components/layout/Header"
import Sidebar from './components/layout/Sidebar';
import MobileDrawer from "./components/layout/MobileDrawer";
import Dashboard from './pages/Dashboard';
import Mentor from "./pages/Mentor";
import Exercise from "./pages/Exercise";
import Progress from "./pages/Progress";
import Knowledge from "./pages/Knowledge";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import KnowledgeArticle from "./pages/KnowledgeArticle";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";

import "./styles/theme.css";
import "./App.css"

function AppLayout({ backendMessage, theme, setTheme, accent, setAccent }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // закрываем drawer при смене страницы
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const pageTitles = {
    "/": "Главная",
    "/mentor": "AI-наставник",
    "/exercise": "Тренажёр",
    "/progress": "Мой прогресс",
    "/knowledge": "База знаний",
    "/profile": "Профиль",
    "/settings": "Настройки"
  };

  return (
    <div className="app-layout">
      <Sidebar/>

      <div className="app-main">
        <Header
          title={pageTitles[location.pathname] || "MentorAI"}
          theme={theme}
          setTheme={setTheme}
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((open) => !open)}
        />

        <MobileDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />

      <main className="app-content">
        <p className="backend-status">{backendMessage}</p>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mentor" element={<Mentor/>} />
          <Route path="/exercise" element={<Exercise/>} />
          <Route path="/progress" element={<Progress/>} />
          <Route path="/knowledge" element={<Knowledge/>} />
          <Route path="/knowledge/:id" element={<KnowledgeArticle/>} />
          <Route path="/profile" element={<Profile/>} />
          <Route
              path="/settings"
              element={<Settings theme={theme} setTheme={setTheme} accent={accent} setAccent={setAccent} />}
          />
        </Routes>
      </main>
      </div>
    </div>
  )
}

function RequireAuth({ children }) {
  const token = sessionStorage.getItem("mentorai-token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {

  const [backendMessage, setBackendMessage] = useState("Проверяем соединение...");

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("mentorai-theme") || "dark";
});

  const [accent, setAccent] = useState(() => {
    const valid = ["blue", "purple", "green", "orange", "pink"];
    const saved = localStorage.getItem("mentorai-accent");
    return valid.includes(saved) ? saved : "blue";
  });

useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
        const isLight =
            theme === "light" ||
            (theme === "system" &&
                window.matchMedia("(prefers-color-scheme: light)").matches);

        root.setAttribute("data-theme", isLight ? "light" : "dark");
    };

    applyTheme();
    localStorage.setItem("mentorai-theme", theme);
}, [theme]);

useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem("mentorai-accent", accent);
}, [accent]);

  useEffect(() => {
    checkBackend()
      .then((data) => {
        setBackendMessage(data.message);
      })
      .catch(() => {
        setBackendMessage("Backend недоступен");
      });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register/>} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppLayout
              backendMessage={backendMessage}
              theme={theme}
              setTheme={setTheme}
              accent={accent}
              setAccent={setAccent}
              />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
