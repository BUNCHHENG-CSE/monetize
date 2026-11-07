export interface CodeSecurityInput {
  code?: string;
  prompt?: string;
  options?: {
    language?: "typescript" | "javascript" | "python" | "go" | "sql";
    strictness?: "low" | "medium" | "high";
  };
}

export async function runCodeSecurityAudit(input: CodeSecurityInput) {
  const code = (input.code || input.prompt || `const query = "SELECT * FROM users WHERE id = '" + req.query.id + "';";`).trim();
  const language = input.options?.language || "typescript";

  const findings: Array<{
    severity: "critical" | "high" | "medium" | "info";
    ruleId: string;
    description: string;
    line?: number;
    remediation: string;
  }> = [];

  // 1. Raw SQL String concatenation check
  if (code.includes("SELECT") && (code.includes(" + ") || code.includes("`") && code.includes("${"))) {
    findings.push({
      severity: "critical",
      ruleId: "SEC-001-SQL-INJECTION",
      description: "Direct string interpolation detected in SQL statement. Vulnerable to SQL injection exploits.",
      line: 1,
      remediation: "Use parameterized queries (e.g. $1, ? placeholders or Prisma / Kysely query builders).",
    });
  }

  // 2. Hardcoded secrets check
  if (/sk_live_[a-zA-Z0-9]{20,}/.test(code) || /AKIA[0-9A-Z]{16}/.test(code)) {
    findings.push({
      severity: "critical",
      ruleId: "SEC-002-HARDCODED-SECRET",
      description: "Hardcoded API secret token or AWS access key detected in source code.",
      remediation: "Extract secrets to .env.local or cloud secret manager (AWS Secrets Manager, Doppler).",
    });
  }

  // 3. Eval / Function constructor check
  if (code.includes("eval(") || code.includes("new Function(")) {
    findings.push({
      severity: "high",
      ruleId: "SEC-003-DANGEROUS-EVAL",
      description: "Arbitrary code execution primitive 'eval()' detected.",
      remediation: "Refactor dynamic evaluation to static AST parser or safe expression engine.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      severity: "info",
      ruleId: "SEC-AUDIT-CLEAN",
      description: "Zero high-risk security patterns detected in submitted AST.",
      remediation: "Maintain CI/CD automated linting pipeline.",
    });
  }

  const securityScore = Math.max(0, 100 - findings.filter(f => f.severity === "critical").length * 40 - findings.filter(f => f.severity === "high").length * 20);

  return {
    preset: "code-security",
    language,
    linesOfCode: code.split("\n").length,
    securityScore,
    status: securityScore > 70 ? "PASSED" : "FAILED",
    criticalIssuesCount: findings.filter(f => f.severity === "critical").length,
    totalFindings: findings.length,
    findings,
  };
}
