import { createFileRoute } from "@tanstack/react-router";
import LandingView from "../features/landing/LandingView";

export const Route = createFileRoute("/")({ component: LandingView });
