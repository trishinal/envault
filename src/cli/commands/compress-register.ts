import { Command } from "commander";
import { registerCompress } from "./compress";

export function applyCompress(program: Command): void {
  registerCompress(program);
}
