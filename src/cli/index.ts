#!/usr/bin/env node
import { Command } from "commander";
import { registerClone } from "./commands/clone";

// Re-export registration helper for use in main CLI entrypoint
export { registerClone };

// This file is intentionally minimal — the main CLI wiring lives in the
// root entrypoint (bin/envault.ts or similar). Each command registers
// itself via a registerXxx(program) convention.

const program = new Command();

program
  .name("envault")
  .description("Securely manage and sync environment variables using encrypted local vaults")
  .version("1.0.0");

// Dynamically register all commands
import { registerClone as _clone } from "./commands/clone";
_clone(program);

// Additional commands are registered in their respective files and
// imported in the main entrypoint. See src/cli/commands/*/

program.parse(process.argv);
