import assert from "node:assert/strict";
import { test } from "node:test";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants.js";
import config from "../next.config.mjs";

test("development and production builds use separate output directories", () => {
  const development = config(PHASE_DEVELOPMENT_SERVER).distDir;
  const build = config(PHASE_PRODUCTION_BUILD).distDir;
  const production = config(PHASE_PRODUCTION_SERVER).distDir;
  assert.notEqual(development, build);
  assert.equal(production, build);
});
