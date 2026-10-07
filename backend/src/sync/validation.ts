import { OPERATIONS, type Mutation, type Operation, type PullRequest } from "./types.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const operationSet = new Set<string>(OPERATIONS);

const payloadKeys: Record<Operation, readonly string[]> = {
  CREATE_SPACE:["type","name"], UPDATE_SPACE:["type","name"], DELETE_SPACE:[],
  CREATE_ACCOUNT:["name","type","currency","opening_balance","opening_balance_date","status"],
  UPDATE_ACCOUNT:["name","type","currency","opening_balance","opening_balance_date","status"], DELETE_ACCOUNT:[],
  CREATE_ACCOUNT_PARTICIPATION:["space_id","account_id","status","visibility_policy"],
  UPDATE_ACCOUNT_PARTICIPATION:["space_id","account_id","status","visibility_policy"], DELETE_ACCOUNT_PARTICIPATION:[],
  CREATE_BUDGET:["space_id","name","start_date","end_date","status"],
  UPDATE_BUDGET:["space_id","name","start_date","end_date","status"], DELETE_BUDGET:[],
  CREATE_BUDGET_ACCOUNT_SELECTION:["budget_id","account_participation_id"], DELETE_BUDGET_ACCOUNT_SELECTION:[],
  CREATE_TRANSACTION:["account_id","type","transaction_date","amount","currency","description","note","visibility_override","lines","transfer"],
  UPDATE_TRANSACTION:["account_id","type","transaction_date","amount","currency","description","note","visibility_override","lines","transfer"],
  DELETE_TRANSACTION:[],
  CREATE_CATEGORY:["parent_id","name","type","status"], UPDATE_CATEGORY:["parent_id","name","type","status"], DELETE_CATEGORY:[],
  CREATE_BUDGET_ALLOCATION:["budget_id","category_id","amount"],
  UPDATE_BUDGET_ALLOCATION:["budget_id","category_id","amount"], DELETE_BUDGET_ALLOCATION:[],
};

export class ValidationError extends Error {
  constructor(message: string) { super(message); this.name = "ValidationError"; }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError("Invalid request");
  return value as Record<string, unknown>;
}
function string(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length === 0) throw new ValidationError(`Invalid ${name}`);
  return value;
}
function integer(value: unknown, name: string, min = 0): number {
  if (!Number.isInteger(value) || (value as number) < min) throw new ValidationError(`Invalid ${name}`);
  return value as number;
}
function uuid(value: unknown, name: string): string {
  const v = string(value, name);
  if (!UUID.test(v)) throw new ValidationError(`Invalid ${name}`);
  return v;
}

export function validatePushBody(body: unknown): Mutation[] {
  const root = object(body);
  if (Object.keys(root).length !== 1 || !Array.isArray(root.mutations) || root.mutations.length < 1 || root.mutations.length > 100) {
    throw new ValidationError("Invalid request");
  }
  const ids = new Set<string>();
  return root.mutations.map((raw) => {
    const m = object(raw);
    const allowed = new Set(["mutation_id","operation","entity_id","base_version","payload"]);
    if (Object.keys(m).some((key) => !allowed.has(key))) throw new ValidationError("Invalid request");
    const mutationId = uuid(m.mutation_id, "mutation_id");
    if (ids.has(mutationId)) throw new ValidationError("Invalid request");
    ids.add(mutationId);
    const operation = string(m.operation, "operation");
    if (!operationSet.has(operation)) throw new ValidationError("Invalid operation");
    const op = operation as Operation;
    const creating = op.startsWith("CREATE_");
    const deleting = op.startsWith("DELETE_");
    if (creating && "base_version" in m) throw new ValidationError("Invalid base_version");
    if (!creating && !("base_version" in m)) throw new ValidationError("Invalid base_version");
    if (!creating) integer(m.base_version, "base_version", 1);
    if (deleting) {
      if ("payload" in m) throw new ValidationError("Invalid payload");
    } else {
      const payload = object(m.payload);
      const keys = new Set(payloadKeys[op]);
      if (Object.keys(payload).some((key) => !keys.has(key))) throw new ValidationError("Invalid payload");
      if (Object.keys(payload).length === 0 && op !== "UPDATE_TRANSACTION") throw new ValidationError("Invalid payload");
      if ("space_id" in payload) uuid(payload.space_id, "space_id");
      if ("account_id" in payload) uuid(payload.account_id, "account_id");
      if ("budget_id" in payload) uuid(payload.budget_id, "budget_id");
      if ("account_participation_id" in payload) uuid(payload.account_participation_id, "account_participation_id");
      if ("category_id" in payload) uuid(payload.category_id, "category_id");
      if ("parent_id" in payload && payload.parent_id !== null) uuid(payload.parent_id, "parent_id");
      for (const key of ["name","type","status","currency","visibility_policy","visibility_override","description","note"]) {
        if (key in payload && payload[key] !== null) string(payload[key], key);
      }
      for (const key of ["opening_balance","amount"]) {
        if (key in payload) integer(payload[key], key, Number.MIN_SAFE_INTEGER);
      }
      for (const key of ["opening_balance_date","transaction_date","start_date","end_date"]) {
        if (key in payload && payload[key] !== null && (typeof payload[key] !== "string" || !DATE.test(payload[key]))) throw new ValidationError(`Invalid ${key}`);
      }
      if ("lines" in payload) {
        if (!Array.isArray(payload.lines)) throw new ValidationError("Invalid lines");
        for (const line of payload.lines) {
          const l = object(line);
          if (Object.keys(l).some((k) => !["id","category_id","amount"].includes(k))) throw new ValidationError("Invalid lines");
          uuid(l.id, "line id"); uuid(l.category_id, "line category_id"); integer(l.amount, "line amount", Number.MIN_SAFE_INTEGER);
        }
      }
      if ("transfer" in payload && payload.transfer !== null) {
        const t = object(payload.transfer);
        if (Object.keys(t).length !== 1 || !t.transfer_group_id) throw new ValidationError("Invalid transfer");
        uuid(t.transfer_group_id, "transfer_group_id");
      }
    }
    return {
      mutation_id: mutationId,
      operation: op,
      entity_id: uuid(m.entity_id, "entity_id"),
      ...(m.base_version !== undefined ? { base_version: m.base_version as number } : {}),
      ...(m.payload !== undefined ? { payload: m.payload as Record<string, unknown> } : {}),
    };
  });
}

export function validatePullBody(body: unknown): PullRequest {
  const root = object(body);
  if (Object.keys(root).some((k) => !["cursor","limit"].includes(k))) throw new ValidationError("Invalid request");
  const cursor = integer(root.cursor, "cursor", 0);
  const limit = integer(root.limit, "limit", 1);
  if (limit > 100) throw new ValidationError("Invalid limit");
  return { cursor, limit };
}
