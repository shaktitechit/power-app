const fs = require("fs");
const path = require("path");

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      walk(p);
    } else if (name.endsWith(".tsx")) {
      let c = fs.readFileSync(p, "utf8");
      const orig = c;
      c = c.replace(
        /import \{ AuditStepLockedOverlay \} from "@\/components\/electrical-audit\/utility-audit\/audit-step-locked-overlay";\r?\n/g,
        "",
      );
      c = c.replace(
        /\s*\{auditStepLocked \? <AuditStepLockedOverlay \/> : null\}\r?\n/g,
        "\n",
      );
      if (c !== orig) {
        fs.writeFileSync(p, c);
        console.log("updated", p);
      }
    }
  }
}

walk(path.join(__dirname, "..", "frontend", "components"));
