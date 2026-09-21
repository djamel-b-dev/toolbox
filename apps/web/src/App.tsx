import { Route, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import ToolPage from "./pages/ToolPage";
import CreateTool from "./pages/CreateTool";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="favoris" element={<Favorites />} />
        <Route path="creer-outil" element={<CreateTool />} />
        <Route path="tools/:id" element={<ToolPage />} />
      </Route>
    </Routes>
  );
}
