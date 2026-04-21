/**
 * Templates Library Route
 * Add this to your App.tsx routes
 */

import { Route } from "wouter";
import TemplatesLibrary from "./TemplatesLibrary";

export function TemplatesLibraryRoute() {
  return <Route path="/templates" component={TemplatesLibrary} />;
}
