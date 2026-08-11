function extractBalancedJson(output, start) {
  const stack = [];
  let escaped = false;
  let inString = false;

  for (let index = start; index < output.length; index += 1) {
    const character = output[index];

    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "{" || character === "[") {
      stack.push(character);
      continue;
    }

    if (character !== "}" && character !== "]") continue;

    const opening = stack.pop();
    const matches =
      (opening === "{" && character === "}") ||
      (opening === "[" && character === "]");
    if (!matches) return null;
    if (stack.length === 0) return output.slice(start, index + 1);
  }

  return null;
}

export function parseSupabaseCliJsonValues(output) {
  const values = [];

  for (let start = 0; start < output.length; start += 1) {
    if (output[start] !== "{" && output[start] !== "[") continue;

    const candidate = extractBalancedJson(output, start);
    if (!candidate) continue;

    try {
      values.push(JSON.parse(candidate));
      start += candidate.length - 1;
    } catch {
      // CLI warnings may contain JSON-like fragments before the real payload.
    }
  }

  return values;
}
