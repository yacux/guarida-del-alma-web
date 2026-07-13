"use client";

import { useContext } from "react";
import { TimezoneContext } from "./TimezoneContext";

export function useTimezone() {
  return useContext(TimezoneContext);
}
