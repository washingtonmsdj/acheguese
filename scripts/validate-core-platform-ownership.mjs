import { pathToFileURL } from "node:url";
import { main } from "../tools/architecture/validate-core-platform-ownership.mjs";

export * from "../tools/architecture/validate-core-platform-ownership.mjs";

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
