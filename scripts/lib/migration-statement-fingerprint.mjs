import { createHash } from "node:crypto";

const DOLLAR_QUOTE_PATTERN = /^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/;

function normalizeLineEndings(value) {
  return value.replace(/\r\n?/g, "\n");
}

export function splitSqlStatements(sql) {
  const source = normalizeLineEndings(sql);
  const statements = [];
  let current = "";
  let state = "normal";
  let dollarTag = "";
  let blockCommentDepth = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1] ?? "";

    if (state === "single") {
      current += char;
      if (char === "'" && next === "'") {
        current += next;
        index += 1;
      } else if (char === "'") {
        state = "normal";
      }
      continue;
    }

    if (state === "double") {
      current += char;
      if (char === '"' && next === '"') {
        current += next;
        index += 1;
      } else if (char === '"') {
        state = "normal";
      }
      continue;
    }

    if (state === "dollar") {
      if (source.startsWith(dollarTag, index)) {
        current += dollarTag;
        index += dollarTag.length - 1;
        state = "normal";
      } else {
        current += char;
      }
      continue;
    }

    if (state === "line-comment") {
      current += char;
      if (char === "\n") state = "normal";
      continue;
    }

    if (state === "block-comment") {
      current += char;
      if (char === "/" && next === "*") {
        current += next;
        index += 1;
        blockCommentDepth += 1;
      } else if (char === "*" && next === "/") {
        current += next;
        index += 1;
        blockCommentDepth -= 1;
        if (blockCommentDepth === 0) state = "normal";
      }
      continue;
    }

    if (char === "-" && next === "-") {
      current += char + next;
      index += 1;
      state = "line-comment";
      continue;
    }

    if (char === "/" && next === "*") {
      current += char + next;
      index += 1;
      blockCommentDepth = 1;
      state = "block-comment";
      continue;
    }

    if (char === "'") {
      current += char;
      state = "single";
      continue;
    }

    if (char === '"') {
      current += char;
      state = "double";
      continue;
    }

    if (char === "$") {
      const match = source.slice(index).match(DOLLAR_QUOTE_PATTERN);
      if (match) {
        dollarTag = match[0];
        current += dollarTag;
        index += dollarTag.length - 1;
        state = "dollar";
        continue;
      }
    }

    if (char === ";") {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
      continue;
    }

    current += char;
  }

  const trailing = current.trim();
  if (trailing) statements.push(trailing);
  return statements;
}

export function stripOperationallyIrrelevantComments(statement) {
  const source = normalizeLineEndings(statement);
  let result = "";
  let state = "normal";
  let dollarTag = "";
  let blockCommentDepth = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1] ?? "";

    if (state === "single" || state === "double") {
      result += char;
      const quote = state === "single" ? "'" : '"';
      if (char === quote && next === quote) {
        result += next;
        index += 1;
      } else if (char === quote) {
        state = "normal";
      }
      continue;
    }

    if (state === "dollar") {
      if (source.startsWith(dollarTag, index)) {
        result += dollarTag;
        index += dollarTag.length - 1;
        state = "normal";
      } else {
        result += char;
      }
      continue;
    }

    if (state === "line-comment") {
      if (char === "\n") {
        result += "\n";
        state = "normal";
      }
      continue;
    }

    if (state === "block-comment") {
      if (char === "/" && next === "*") {
        index += 1;
        blockCommentDepth += 1;
      } else if (char === "*" && next === "/") {
        index += 1;
        blockCommentDepth -= 1;
        if (blockCommentDepth === 0) {
          result += " ";
          state = "normal";
        }
      }
      continue;
    }

    if (char === "-" && next === "-") {
      index += 1;
      state = "line-comment";
    } else if (char === "/" && next === "*") {
      index += 1;
      blockCommentDepth = 1;
      state = "block-comment";
    } else if (char === "'") {
      result += char;
      state = "single";
    } else if (char === '"') {
      result += char;
      state = "double";
    } else if (char === "$") {
      const match = source.slice(index).match(DOLLAR_QUOTE_PATTERN);
      if (match) {
        dollarTag = match[0];
        result += dollarTag;
        index += dollarTag.length - 1;
        state = "dollar";
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }

  return result.trim();
}

export function fingerprintStatements(statements, { operational = false } = {}) {
  const normalized = statements
    .map((statement) => {
      const value = normalizeLineEndings(statement).trim();
      return operational ? stripOperationallyIrrelevantComments(value) : value;
    })
    .filter((statement) => !operational || statement.length > 0);
  const payload = normalized.join("\u001f");

  return {
    statementCount: normalized.length,
    byteLength: Buffer.byteLength(payload, "utf8"),
    md5: createHash("md5").update(payload, "utf8").digest("hex"),
    sha256: createHash("sha256").update(payload, "utf8").digest("hex"),
  };
}

export function fingerprintMigrationSql(sql) {
  const statements = splitSqlStatements(sql);
  return {
    raw: fingerprintStatements(statements),
    operational: fingerprintStatements(statements, { operational: true }),
  };
}
