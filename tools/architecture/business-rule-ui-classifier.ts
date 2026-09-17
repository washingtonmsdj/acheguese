import * as ts from "typescript";

const BUSINESS_CONTEXT_IDENTIFIER_RE = /^(?:profile|activeProfile|user|account|business|driver|subscription|verification)(?:[A-Z_]|$)/;
const BUSINESS_STATE_FIELDS = new Set([
  "verified",
  "is_verified",
  "isVerified",
  "is_suspended",
  "isSuspended",
  "plan",
  "role",
  "profile_type",
  "profileType",
  "status",
  "type",
]);

function isBusinessRuleCondition(expression: ts.Expression): boolean {
  let hasBusinessContext = false;
  let hasBusinessStateField = false;

  const visit = (node: ts.Node) => {
    if (ts.isIdentifier(node) && BUSINESS_CONTEXT_IDENTIFIER_RE.test(node.text)) {
      hasBusinessContext = true;
    }
    if (
      ts.isPropertyAccessExpression(node) &&
      BUSINESS_STATE_FIELDS.has(node.name.text)
    ) {
      hasBusinessStateField = true;
    }
    if (
      ts.isElementAccessExpression(node) &&
      node.argumentExpression &&
      ts.isStringLiteral(node.argumentExpression)
    ) {
      hasBusinessStateField ||= BUSINESS_STATE_FIELDS.has(
        node.argumentExpression.text,
      );
    }
    ts.forEachChild(node, visit);
  };

  visit(expression);
  return hasBusinessContext && hasBusinessStateField;
}

function isPresentationConditional(node: ts.ConditionalExpression): boolean {
  let parent = node.parent;
  while (parent) {
    if (ts.isJsxExpression(parent)) return true;
    if (ts.isFunctionLike(parent)) return false;
    parent = parent.parent;
  }
  return false;
}

export function findBusinessRuleConditions(
  source: string,
  fileName: string,
): string[] {
  const scriptKind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const conditions: string[] = [];

  const visit = (node: ts.Node) => {
    const condition = ts.isIfStatement(node)
      ? node.expression
      : ts.isConditionalExpression(node) && !isPresentationConditional(node)
        ? node.condition
        : null;
    if (condition && isBusinessRuleCondition(condition)) {
      conditions.push(condition.getText(sourceFile).replace(/\s+/g, " "));
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return conditions;
}
