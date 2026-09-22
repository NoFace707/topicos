import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AccountsPage from "./pages/AccountsPage";
import BudgetPage from "./pages/BudgetPage";
import TransactionsPage from "./pages/TransactionsPage";
import { navigate, usePath } from "./lib/router";

const routes = {
  "/": DashboardPage,
  "/dashboard": DashboardPage,
  "/accounts": AccountsPage,
  "/categories": BudgetPage,
  "/budget": BudgetPage,
  "/transactions": TransactionsPage,
};

function Application() {
  const { user, loading } = useAuth();
  const path = usePath();

  useEffect(() => {
    if (user && !routes[path]) navigate("/dashboard");
  }, [path, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 grid place-items-center text-slate-300">
        Preparando tu presupuesto...
      </div>
    );
  }
  if (!user) return <LoginPage />;

  const Page = routes[path] || DashboardPage;
  return <AppShell currentPath={path}><Page /></AppShell>;
}

export default function App() {
  return <AuthProvider><Application /></AuthProvider>;
}
