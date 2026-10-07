-- Budget V1 PostgreSQL schema.
-- Business authorization remains in the Fastify backend.

create table public.users (
  id uuid primary key references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0)
);

create table public.spaces (
  id uuid primary key,
  type text not null check (type in ('PERSONAL', 'SHARED')),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0)
);

create table public.space_members (
  id uuid primary key,
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0),
  unique (space_id, user_id),
  unique (id, space_id)
);

create table public.accounts (
  id uuid primary key,
  owner_user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  type text not null,
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  opening_balance bigint not null default 0,
  opening_balance_date date,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0)
);

create table public.account_participations (
  id uuid primary key,
  account_id uuid not null references public.accounts(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  status text not null,
  visibility_policy text not null default 'INHERIT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0),
  unique (account_id, space_id),
  unique (id, space_id)
);

create table public.categories (
  id uuid primary key,
  space_id uuid references public.spaces(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete restrict,
  name text not null,
  type text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0)
);

create table public.budgets (
  id uuid primary key,
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0),
  unique (id, space_id),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.budget_account_selections (
  id uuid primary key,
  budget_id uuid not null,
  account_participation_id uuid not null,
  space_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0),
  unique (budget_id, account_participation_id),
  foreign key (budget_id, space_id)
    references public.budgets(id, space_id) on delete cascade,
  foreign key (account_participation_id, space_id)
    references public.account_participations(id, space_id) on delete cascade
);

create table public.transfer_groups (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0)
);

create table public.transactions (
  id uuid primary key,
  account_id uuid not null references public.accounts(id) on delete cascade,
  type text not null check (type in ('EXPENSE', 'INCOME', 'TRANSFER')),
  transaction_date date not null,
  amount bigint not null,
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  description text,
  note text,
  visibility_override text,
  transfer_group_id uuid references public.transfer_groups(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0)
);

create table public.transaction_lines (
  id uuid primary key,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  amount bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0)
);

create table public.budget_allocations (
  id uuid primary key,
  budget_id uuid not null references public.budgets(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  amount bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0),
  unique (budget_id, category_id)
);

create table public.change_journal (
  server_revision bigint generated always as identity primary key,
  entity_type text not null,
  entity_id uuid not null,
  operation text not null check (operation in ('CREATE', 'UPDATE', 'DELETE')),
  entity_version bigint,
  actor_user_id uuid references public.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table public.tombstones (
  entity_type text not null,
  entity_id uuid not null,
  server_revision bigint not null references public.change_journal(server_revision) on delete restrict,
  entity_version bigint,
  deleted_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create table public.mutation_results (
  user_id uuid not null references public.users(id) on delete cascade,
  mutation_id uuid not null,
  status text not null check (status in ('APPLIED', 'ALREADY_PROCESSED', 'CONFLICT', 'REJECTED', 'RETRYABLE_ERROR')),
  entity_type text,
  entity_id uuid,
  resulting_version bigint,
  server_revision bigint references public.change_journal(server_revision) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, mutation_id)
);

create index idx_space_members_user on public.space_members(user_id);
create index idx_accounts_owner on public.accounts(owner_user_id);
create index idx_account_participations_space on public.account_participations(space_id);
create index idx_account_participations_account on public.account_participations(account_id);
create index idx_categories_space on public.categories(space_id);
create index idx_categories_parent on public.categories(parent_id);
create index idx_budgets_space on public.budgets(space_id);
create index idx_budget_account_selections_participation on public.budget_account_selections(account_participation_id);
create index idx_transactions_account_date on public.transactions(account_id, transaction_date, id);
create index idx_transactions_transfer_group on public.transactions(transfer_group_id);
create index idx_transaction_lines_transaction on public.transaction_lines(transaction_id);
create index idx_transaction_lines_category on public.transaction_lines(category_id);
create index idx_budget_allocations_category on public.budget_allocations(category_id);
create index idx_change_journal_entity on public.change_journal(entity_type, entity_id, server_revision);
create index idx_change_journal_revision on public.change_journal(server_revision);
create index idx_change_journal_actor on public.change_journal(actor_user_id, server_revision);
create index idx_tombstones_revision on public.tombstones(server_revision);
create index idx_mutation_results_revision on public.mutation_results(server_revision);

-- Defense in depth: the public schema is not a client authorization boundary.
-- Backend access is privileged; direct client roles remain blocked by RLS until explicit policies are designed.
alter table public.users enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.accounts enable row level security;
alter table public.account_participations enable row level security;
alter table public.categories enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_account_selections enable row level security;
alter table public.transfer_groups enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_lines enable row level security;
alter table public.budget_allocations enable row level security;
alter table public.change_journal enable row level security;
alter table public.tombstones enable row level security;
alter table public.mutation_results enable row level security;
