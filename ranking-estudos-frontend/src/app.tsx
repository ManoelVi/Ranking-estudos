import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { LoginPage } from "./pages/LoginPage";
import { GroupsPage } from "./pages/GroupsPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";

export const App: React.FC = () => {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:groupId" element={<GroupDetailPage />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
};
