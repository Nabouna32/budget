export const OPERATIONS = [
  "CREATE_SPACE","UPDATE_SPACE","DELETE_SPACE",
  "CREATE_ACCOUNT","UPDATE_ACCOUNT","DELETE_ACCOUNT",
  "CREATE_ACCOUNT_PARTICIPATION","UPDATE_ACCOUNT_PARTICIPATION","DELETE_ACCOUNT_PARTICIPATION",
  "CREATE_BUDGET","UPDATE_BUDGET","DELETE_BUDGET",
  "CREATE_BUDGET_ACCOUNT_SELECTION","DELETE_BUDGET_ACCOUNT_SELECTION",
  "CREATE_TRANSACTION","UPDATE_TRANSACTION","DELETE_TRANSACTION",
  "CREATE_CATEGORY","UPDATE_CATEGORY","DELETE_CATEGORY",
  "CREATE_BUDGET_ALLOCATION","UPDATE_BUDGET_ALLOCATION","DELETE_BUDGET_ALLOCATION",
] as const;

export type Operation = typeof OPERATIONS[number];
export type MutationStatus = "APPLIED"|"ALREADY_PROCESSED"|"CONFLICT"|"REJECTED"|"RETRYABLE_ERROR";

export interface Mutation {
  mutation_id: string;
  operation: Operation;
  entity_id: string;
  base_version?: number;
  payload?: Record<string, unknown>;
}

export interface MutationResult {
  mutation_id: string;
  status: MutationStatus;
  entity_id?: string;
  version?: number;
  server_revision?: number;
  reason?: "UNSUPPORTED"|"FORBIDDEN"|"INTEGRITY"|"VALIDATION";
}

export interface PushRequest { mutations: Mutation[]; }
export interface PushResponse { results: MutationResult[]; }

export interface PullRequest { cursor: number; limit: number; }
export interface PullChange {
  server_revision: number;
  entity: string;
  operation: "CREATE"|"UPDATE"|"DELETE";
  entity_id: string;
  version?: number;
  payload?: Record<string, unknown>;
}
export interface PullResponse { changes: PullChange[]; next_cursor: number; has_more: boolean; }

export interface SyncService {
  push(userId: string, mutations: Mutation[]): Promise<PushResponse>;
  pull(userId: string, request: PullRequest): Promise<PullResponse>;
}
