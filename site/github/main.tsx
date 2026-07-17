import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { YiExperience } from "../components/yi/YiExperience";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><YiExperience /></StrictMode>,
);
