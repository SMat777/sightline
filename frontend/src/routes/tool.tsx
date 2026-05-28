import { createFileRoute } from "@tanstack/react-router";
import ToolView from "../features/tool/ToolView";

export const Route = createFileRoute("/tool")({ component: ToolView });
