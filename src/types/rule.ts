export type RuleStatus =
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "TRIGGERED"
  | "SUCCESS"
  | "FAILED";

export interface AuditLog {
  id: string;
  ruleId: string;
  action: string;
  timestamp: Date | string;
  pravaSessionId?: string | null;
  receiptUrl?: string | null;
  uiIcon: string;
}

export interface Rule {
  id: string;
  userId: string;
  naturalLanguageQuery: string;
  targetItem: string;
  maxBudget: number;
  status: RuleStatus;
  auditLogs?: AuditLog[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateRuleInput {
  userId: string;
  naturalLanguageQuery: string;
  targetItem: string;
  maxBudget: number;
}
