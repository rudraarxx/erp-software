-- ============================================================
-- SolidStonne Platform — Complete Schema v3.0
-- Run this in your Supabase SQL Editor (idempotent-safe sections marked)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- CORE
-- ============================================================

create table if not exists public.companies (
  id         uuid default uuid_generate_v4() primary key,
  name       text not null,
  address    text,
  phone      text,
  gstin      text,
  created_at timestamptz default now() not null
);

-- Roles: admin | project_manager | supervisor | accountant | storekeeper
create table if not exists public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  company_id uuid references public.companies(id) on delete set null,
  name       text,
  email      text not null,
  role       text not null default 'supervisor'
               check (role in ('admin','project_manager','supervisor','accountant','storekeeper')),
  phone      text,
  created_at timestamptz default now() not null
);

create table if not exists public.projects (
  id             uuid default uuid_generate_v4() primary key,
  company_id     uuid references public.companies(id) on delete cascade not null,
  name           text not null,
  client_name    text,
  contract_value numeric,
  start_date     date,
  end_date       date,
  status         text default 'planned'
                   check (status in ('planned','active','on_hold','completed')),
  description    text,
  created_at     timestamptz default now() not null
);

-- ============================================================
-- ATTENDANCE
-- ============================================================

create table if not exists public.labor (
  id           uuid default uuid_generate_v4() primary key,
  company_id   uuid references public.companies(id) on delete cascade not null,
  name         text not null,
  trade        text,            -- mason, carpenter, helper, etc.
  rate_per_day numeric,
  contact      text,
  is_active    boolean default true,
  created_at   timestamptz default now() not null
);

create table if not exists public.labor_attendance (
  id          uuid default uuid_generate_v4() primary key,
  project_id  uuid references public.projects(id) on delete cascade not null,
  labor_id    uuid references public.labor(id) on delete cascade not null,
  date        date not null,
  present     boolean default true,
  hours_worked numeric default 8,
  notes       text,
  created_at  timestamptz default now() not null,
  unique (project_id, labor_id, date)
);

-- type: engineer | supervisor
create table if not exists public.staff_attendance (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  project_id  uuid references public.projects(id) on delete cascade not null,
  date        date not null,
  type        text not null check (type in ('engineer','supervisor')),
  status      text default 'present' check (status in ('present','absent','half_day','leave')),
  check_in    time,
  check_out   time,
  notes       text,
  created_at  timestamptz default now() not null,
  unique (user_id, project_id, date)
);

-- ============================================================
-- SUBCONTRACTORS
-- ============================================================

create table if not exists public.subcontractors (
  id             uuid default uuid_generate_v4() primary key,
  company_id     uuid references public.companies(id) on delete cascade not null,
  name           text not null,
  contact_person text,
  phone          text,
  pan            text,
  gst            text,
  bank_name      text,
  bank_account   text,
  bank_ifsc      text,
  skill_category text,
  is_active      boolean default true,
  created_at     timestamptz default now() not null
);

-- billing_type: lumpsum | measurement | upload
create table if not exists public.work_orders (
  id                uuid default uuid_generate_v4() primary key,
  project_id        uuid references public.projects(id) on delete cascade not null,
  subcontractor_id  uuid references public.subcontractors(id) on delete cascade not null,
  title             text not null,
  scope             text,
  billing_type      text not null default 'lumpsum'
                      check (billing_type in ('lumpsum','measurement','upload')),
  total_value       numeric,
  start_date        date,
  end_date          date,
  penalty_clause    text,
  status            text default 'draft'
                      check (status in ('draft','approved','issued','completed','cancelled')),
  pdf_url           text,
  created_by        uuid references public.profiles(id),
  created_at        timestamptz default now() not null
);

create table if not exists public.work_order_items (
  id              uuid default uuid_generate_v4() primary key,
  work_order_id   uuid references public.work_orders(id) on delete cascade not null,
  description     text not null,
  unit            text,
  rate            numeric,
  quantity        numeric,
  completed_qty   numeric default 0,
  amount          numeric generated always as (rate * quantity) stored,
  created_at      timestamptz default now() not null
);

-- mode: percentage | quantity
create table if not exists public.work_order_progress (
  id              uuid default uuid_generate_v4() primary key,
  work_order_id   uuid references public.work_orders(id) on delete cascade not null,
  date            date not null,
  mode            text not null check (mode in ('percentage','quantity')),
  value           numeric not null,   -- % value or actual qty
  item_id         uuid references public.work_order_items(id),  -- null for overall progress
  reason          text,
  photos          text[],             -- array of Supabase Storage URLs
  submitted_by    uuid references public.profiles(id),
  created_at      timestamptz default now() not null
);

create table if not exists public.subcontractor_bills (
  id              uuid default uuid_generate_v4() primary key,
  work_order_id   uuid references public.work_orders(id) on delete cascade not null,
  bill_type       text not null check (bill_type in ('lumpsum','measurement','upload')),
  amount          numeric,
  bill_url        text,               -- uploaded bill PDF URL
  status          text default 'submitted'
                    check (status in ('submitted','approved','paid','rejected')),
  submitted_at    timestamptz default now(),
  approved_by     uuid references public.profiles(id),
  notes           text,
  created_at      timestamptz default now() not null
);

create table if not exists public.material_issued_to_sub (
  id              uuid default uuid_generate_v4() primary key,
  work_order_id   uuid references public.work_orders(id) on delete cascade not null,
  material_id     uuid,               -- references materials(id), added after materials table
  quantity        numeric not null,
  unit            text,
  issued_date     date not null,
  issued_by       uuid references public.profiles(id),
  notes           text,
  created_at      timestamptz default now() not null
);

-- ============================================================
-- MATERIALS & INVENTORY
-- ============================================================

create table if not exists public.materials (
  id          uuid default uuid_generate_v4() primary key,
  company_id  uuid references public.companies(id) on delete cascade not null,
  name        text not null,
  unit        text not null,           -- kg, bag, cu.m, nos, etc.
  category    text,                    -- cement, steel, aggregates, fittings, etc.
  created_at  timestamptz default now() not null
);

-- Add FK now that materials table exists
alter table public.material_issued_to_sub
  add constraint material_issued_to_sub_material_id_fkey
  foreign key (material_id) references public.materials(id) on delete set null
  not valid;

create table if not exists public.warehouse_stock (
  id             uuid default uuid_generate_v4() primary key,
  company_id     uuid references public.companies(id) on delete cascade not null,
  material_id    uuid references public.materials(id) on delete cascade not null,
  stock_qty      numeric not null default 0,
  last_updated   timestamptz default now(),
  unique (company_id, material_id)
);

create table if not exists public.site_inventory (
  id           uuid default uuid_generate_v4() primary key,
  project_id   uuid references public.projects(id) on delete cascade not null,
  material_id  uuid references public.materials(id) on delete cascade not null,
  stock_qty    numeric not null default 0,
  last_updated timestamptz default now(),
  unique (project_id, material_id)
);

-- from_type / to_type: site | warehouse
create table if not exists public.material_transfers (
  id            uuid default uuid_generate_v4() primary key,
  company_id    uuid references public.companies(id) on delete cascade not null,
  from_type     text not null check (from_type in ('site','warehouse')),
  from_id       uuid not null,   -- project_id or company_id depending on from_type
  to_type       text not null check (to_type in ('site','warehouse')),
  to_id         uuid not null,
  material_id   uuid references public.materials(id) on delete cascade not null,
  quantity      numeric not null,
  authorized_by uuid references public.profiles(id),
  status        text default 'pending' check (status in ('pending','in_transit','received','cancelled')),
  notes         text,
  transfer_date date not null default current_date,
  created_at    timestamptz default now() not null
);

-- GRN: goods receipt note — on material arrival at site or warehouse
create table if not exists public.grn (
  id              uuid default uuid_generate_v4() primary key,
  company_id      uuid references public.companies(id) on delete cascade not null,
  location_type   text not null check (location_type in ('site','warehouse')),
  location_id     uuid not null,        -- project_id or company_id
  vendor_name     text,
  po_reference    text,
  date            date not null default current_date,
  status          text default 'pending' check (status in ('pending','accepted','rejected')),
  received_by     uuid references public.profiles(id),
  created_at      timestamptz default now() not null
);

create table if not exists public.grn_items (
  id           uuid default uuid_generate_v4() primary key,
  grn_id       uuid references public.grn(id) on delete cascade not null,
  material_id  uuid references public.materials(id) on delete cascade not null,
  received_qty numeric not null,
  accepted_qty numeric,
  rate         numeric,
  unit         text,
  notes        text
);

-- Material return to vendor
create table if not exists public.material_returns (
  id           uuid default uuid_generate_v4() primary key,
  project_id   uuid references public.projects(id) on delete cascade,
  company_id   uuid references public.companies(id) on delete cascade not null,
  vendor_name  text,
  reason       text check (reason in ('defective','surplus','wrong_spec','other')),
  status       text default 'pending' check (status in ('pending','dispatched','credited')),
  date         date not null default current_date,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz default now() not null
);

create table if not exists public.material_return_items (
  id           uuid default uuid_generate_v4() primary key,
  return_id    uuid references public.material_returns(id) on delete cascade not null,
  material_id  uuid references public.materials(id) on delete cascade not null,
  quantity     numeric not null,
  unit         text
);

-- Material indent (request from site)
create table if not exists public.material_indents (
  id           uuid default uuid_generate_v4() primary key,
  project_id   uuid references public.projects(id) on delete cascade not null,
  raised_by    uuid references public.profiles(id),
  status       text default 'pending'
                 check (status in ('pending','approved','rejected','fulfilled','partial')),
  urgency      text default 'normal' check (urgency in ('low','normal','high','urgent')),
  notes        text,
  created_at   timestamptz default now() not null
);

create table if not exists public.material_indent_items (
  id              uuid default uuid_generate_v4() primary key,
  indent_id       uuid references public.material_indents(id) on delete cascade not null,
  material_id     uuid references public.materials(id) on delete cascade not null,
  quantity        numeric not null,
  unit            text,
  specification   text,
  fulfilled_qty   numeric default 0
);

-- ============================================================
-- FINANCE & ACCOUNTS
-- ============================================================

create table if not exists public.project_budgets (
  id               uuid default uuid_generate_v4() primary key,
  project_id       uuid references public.projects(id) on delete cascade not null,
  cost_head        text not null,
  budgeted_amount  numeric not null,
  created_at       timestamptz default now() not null
);

-- direction: in | out | party_to_party
create table if not exists public.payments (
  id           uuid default uuid_generate_v4() primary key,
  company_id   uuid references public.companies(id) on delete cascade not null,
  project_id   uuid references public.projects(id) on delete set null,
  party_name   text,
  party_type   text check (party_type in ('vendor','subcontractor','client','employee','other')),
  direction    text not null check (direction in ('in','out','party_to_party')),
  amount       numeric not null,
  mode         text check (mode in ('cash','cheque','bank_transfer','upi','other')),
  reference    text,
  date         date not null default current_date,
  notes        text,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz default now() not null
);

create table if not exists public.material_purchases (
  id           uuid default uuid_generate_v4() primary key,
  project_id   uuid references public.projects(id) on delete cascade,
  company_id   uuid references public.companies(id) on delete cascade not null,
  vendor_name  text,
  po_reference text,
  grn_id       uuid references public.grn(id) on delete set null,
  amount       numeric not null,
  gst_amount   numeric default 0,
  date         date not null default current_date,
  status       text default 'pending' check (status in ('pending','approved','paid')),
  created_by   uuid references public.profiles(id),
  created_at   timestamptz default now() not null
);

create table if not exists public.site_expenses (
  id           uuid default uuid_generate_v4() primary key,
  project_id   uuid references public.projects(id) on delete cascade not null,
  category     text,                   -- fuel, tools, local purchase, etc.
  amount       numeric not null,
  date         date not null default current_date,
  description  text,
  receipt_url  text,
  submitted_by uuid references public.profiles(id),
  approved_by  uuid references public.profiles(id),
  status       text default 'pending' check (status in ('pending','approved','rejected')),
  created_at   timestamptz default now() not null
);

-- ============================================================
-- TOOLS & EQUIPMENT
-- ============================================================

create table if not exists public.equipment (
  id               uuid default uuid_generate_v4() primary key,
  company_id       uuid references public.companies(id) on delete cascade not null,
  name             text not null,
  type             text,               -- earthmoving, lifting, concrete, compaction, hand_tool
  make             text,
  model            text,
  serial_no        text,
  purchase_date    date,
  value            numeric,
  insurance_expiry date,
  is_owned         boolean default true,  -- false = hired
  is_active        boolean default true,
  created_at       timestamptz default now() not null
);

create table if not exists public.equipment_deployments (
  id           uuid default uuid_generate_v4() primary key,
  equipment_id uuid references public.equipment(id) on delete cascade not null,
  project_id   uuid references public.projects(id) on delete cascade not null,
  from_date    date not null,
  to_date      date,
  status       text default 'active' check (status in ('active','returned','transferred')),
  notes        text,
  created_at   timestamptz default now() not null
);

create table if not exists public.equipment_usage_logs (
  id           uuid default uuid_generate_v4() primary key,
  equipment_id uuid references public.equipment(id) on delete cascade not null,
  project_id   uuid references public.projects(id) on delete cascade not null,
  date         date not null,
  hours        numeric,
  operator_id  uuid references public.profiles(id),
  notes        text,
  created_at   timestamptz default now() not null
);

create table if not exists public.equipment_maintenance (
  id           uuid default uuid_generate_v4() primary key,
  equipment_id uuid references public.equipment(id) on delete cascade not null,
  type         text check (type in ('preventive','breakdown','inspection')),
  date         date not null,
  cost         numeric,
  downtime_hrs numeric,
  notes        text,
  next_due     date,
  created_at   timestamptz default now() not null
);

create table if not exists public.equipment_hire (
  id             uuid default uuid_generate_v4() primary key,
  company_id     uuid references public.companies(id) on delete cascade not null,
  project_id     uuid references public.projects(id) on delete set null,
  equipment_name text not null,
  vendor_name    text,
  daily_rate     numeric,
  from_date      date,
  to_date        date,
  total_cost     numeric,
  notes          text,
  created_at     timestamptz default now() not null
);

-- ============================================================
-- SITE ACTIVITY (DPR, SNAGS, PHOTOS)
-- ============================================================

create table if not exists public.dpr (
  id              uuid default uuid_generate_v4() primary key,
  project_id      uuid references public.projects(id) on delete cascade not null,
  date            date not null default current_date,
  weather         text check (weather in ('sunny', 'cloudy', 'rainy', 'windy')),
  manpower_count  jsonb, -- e.g. {"mason": 5, "helper": 10}
  equipment_notes text,
  material_notes  text,
  delays          text,
  submitted_by    uuid references public.profiles(id),
  created_at      timestamptz default now() not null,
  unique (project_id, date)
);

create table if not exists public.dpr_activities (
  id              uuid default uuid_generate_v4() primary key,
  dpr_id          uuid references public.dpr(id) on delete cascade not null,
  description     text not null,
  uom             text, -- Unit of measure
  qty_done        numeric not null default 0,
  created_at      timestamptz default now() not null
);

create table if not exists public.snags (
  id              uuid default uuid_generate_v4() primary key,
  project_id      uuid references public.projects(id) on delete cascade not null,
  location        text not null,
  description     text not null,
  photo_url       text,
  priority        text default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status          text default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to     text, -- Name or trade of assignee
  reported_by     uuid references public.profiles(id),
  reported_date   date not null default current_date,
  resolved_date   date,
  created_at      timestamptz default now() not null
);

create table if not exists public.site_photos (
  id              uuid default uuid_generate_v4() primary key,
  project_id      uuid references public.projects(id) on delete cascade not null,
  date            date not null default current_date,
  photo_url       text not null,
  description     text,
  uploaded_by     uuid references public.profiles(id),
  created_at      timestamptz default now() not null
);

-- Note: RLS for Sprint 3 tables (dpr, snags, site_photos) is enabled
-- in the main RLS block below, after helper functions are defined.

-- ============================================================
-- INVOICES
-- ============================================================

create table if not exists public.client_invoices (
  id             uuid default uuid_generate_v4() primary key,
  project_id     uuid references public.projects(id) on delete cascade not null,
  ra_bill_no     text,
  claim_amount   numeric,
  deductions     numeric default 0,
  gst_amount     numeric default 0,
  net_amount     numeric,
  status         text default 'draft'
                   check (status in ('draft','submitted','under_review','certified','paid')),
  invoice_date   date default current_date,
  pdf_url        text,
  notes          text,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz default now() not null
);

create table if not exists public.client_invoice_items (
  id           uuid default uuid_generate_v4() primary key,
  invoice_id   uuid references public.client_invoices(id) on delete cascade not null,
  boq_item     text,
  description  text,
  quantity     numeric,
  rate         numeric,
  amount       numeric,
  created_at   timestamptz default now() not null
);

create table if not exists public.vendor_invoices (
  id           uuid default uuid_generate_v4() primary key,
  company_id   uuid references public.companies(id) on delete cascade not null,
  project_id   uuid references public.projects(id) on delete set null,
  vendor_name  text,
  invoice_no   text,
  amount       numeric not null,
  gst_amount   numeric default 0,
  grn_id       uuid references public.grn(id) on delete set null,
  status       text default 'received'
                 check (status in ('received','verified','approved','paid','rejected')),
  due_date     date,
  invoice_date date,
  notes        text,
  created_at   timestamptz default now() not null
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.companies              enable row level security;
alter table public.profiles               enable row level security;
alter table public.projects               enable row level security;
alter table public.labor                  enable row level security;
alter table public.labor_attendance       enable row level security;
alter table public.staff_attendance       enable row level security;
alter table public.subcontractors         enable row level security;
alter table public.work_orders            enable row level security;
alter table public.work_order_items       enable row level security;
alter table public.work_order_progress    enable row level security;
alter table public.subcontractor_bills    enable row level security;
alter table public.material_issued_to_sub enable row level security;
alter table public.materials              enable row level security;
alter table public.warehouse_stock        enable row level security;
alter table public.site_inventory         enable row level security;
alter table public.material_transfers     enable row level security;
alter table public.grn                    enable row level security;
alter table public.grn_items              enable row level security;
alter table public.material_returns       enable row level security;
alter table public.material_return_items  enable row level security;
alter table public.material_indents       enable row level security;
alter table public.material_indent_items  enable row level security;
alter table public.project_budgets        enable row level security;
alter table public.payments               enable row level security;
alter table public.material_purchases     enable row level security;
alter table public.site_expenses          enable row level security;
alter table public.equipment              enable row level security;
alter table public.equipment_deployments  enable row level security;
alter table public.equipment_usage_logs   enable row level security;
alter table public.equipment_maintenance  enable row level security;
alter table public.equipment_hire         enable row level security;
alter table public.client_invoices        enable row level security;
alter table public.client_invoice_items   enable row level security;
alter table public.vendor_invoices        enable row level security;
alter table public.dpr                    enable row level security;
alter table public.dpr_activities         enable row level security;
alter table public.snags                  enable row level security;
alter table public.site_photos            enable row level security;

-- Helper: get current user's company_id
create or replace function public.my_company_id()
returns uuid language sql stable security definer as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- Helper: get current user's role
create or replace function public.my_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid()
$$;

-- RLS Policies (same-company access for all tables)
-- Site Activity (Sprint 3)
create policy "dpr_select" on public.dpr for select
  using ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "dpr_insert" on public.dpr for insert
  with check ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "dpr_update" on public.dpr for update
  using ((select company_id from public.projects where id = project_id) = public.my_company_id());

create policy "dpr_act_select" on public.dpr_activities for select
  using ((select company_id from public.projects p join public.dpr d on d.project_id = p.id where d.id = dpr_id) = public.my_company_id());
create policy "dpr_act_insert" on public.dpr_activities for insert
  with check ((select company_id from public.projects p join public.dpr d on d.project_id = p.id where d.id = dpr_id) = public.my_company_id());

create policy "snags_select" on public.snags for select
  using ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "snags_insert" on public.snags for insert
  with check ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "snags_update" on public.snags for update
  using ((select company_id from public.projects where id = project_id) = public.my_company_id());

create policy "site_photos_select" on public.site_photos for select
  using ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "site_photos_insert" on public.site_photos for insert
  with check ((select company_id from public.projects where id = project_id) = public.my_company_id());

-- Companies
create policy "company_select" on public.companies for select
  using (id = public.my_company_id());

create policy "company_update_admin" on public.companies for update
  using (id = public.my_company_id() and public.my_role() = 'admin');

-- Profiles
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or company_id = public.my_company_id());

create policy "profiles_update_own" on public.profiles for update
  using (id = auth.uid());

create policy "profiles_update_admin" on public.profiles for update
  using (company_id = public.my_company_id() and public.my_role() = 'admin');

-- Projects
create policy "projects_select" on public.projects for select
  using (company_id = public.my_company_id());

create policy "projects_insert" on public.projects for insert
  with check (company_id = public.my_company_id()
    and public.my_role() in ('admin','project_manager'));

create policy "projects_update" on public.projects for update
  using (company_id = public.my_company_id()
    and public.my_role() in ('admin','project_manager'));

-- Generic same-company SELECT for all other tables (project-linked)
-- labor
create policy "labor_select" on public.labor for select
  using (company_id = public.my_company_id());
create policy "labor_insert" on public.labor for insert
  with check (company_id = public.my_company_id());
create policy "labor_update" on public.labor for update
  using (company_id = public.my_company_id());

-- labor_attendance
create policy "labor_attendance_select" on public.labor_attendance for select
  using ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "labor_attendance_insert" on public.labor_attendance for insert
  with check ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "labor_attendance_update" on public.labor_attendance for update
  using ((select company_id from public.projects where id = project_id) = public.my_company_id());

-- staff_attendance
create policy "staff_attendance_select" on public.staff_attendance for select
  using ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "staff_attendance_insert" on public.staff_attendance for insert
  with check ((select company_id from public.projects where id = project_id) = public.my_company_id());

-- subcontractors
create policy "subcontractors_select" on public.subcontractors for select
  using (company_id = public.my_company_id());
create policy "subcontractors_insert" on public.subcontractors for insert
  with check (company_id = public.my_company_id()
    and public.my_role() in ('admin','project_manager'));
create policy "subcontractors_update" on public.subcontractors for update
  using (company_id = public.my_company_id()
    and public.my_role() in ('admin','project_manager'));

-- work_orders
create policy "work_orders_select" on public.work_orders for select
  using ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "work_orders_insert" on public.work_orders for insert
  with check ((select company_id from public.projects where id = project_id) = public.my_company_id()
    and public.my_role() in ('admin','project_manager'));
create policy "work_orders_update" on public.work_orders for update
  using ((select company_id from public.projects where id = project_id) = public.my_company_id()
    and public.my_role() in ('admin','project_manager'));

-- work_order_items, work_order_progress, subcontractor_bills, material_issued_to_sub
create policy "wo_items_select" on public.work_order_items for select
  using ((select company_id from public.projects p join public.work_orders w on w.project_id = p.id where w.id = work_order_id) = public.my_company_id());
create policy "wo_items_insert" on public.work_order_items for insert
  with check ((select company_id from public.projects p join public.work_orders w on w.project_id = p.id where w.id = work_order_id) = public.my_company_id());

create policy "wo_progress_select" on public.work_order_progress for select
  using ((select company_id from public.projects p join public.work_orders w on w.project_id = p.id where w.id = work_order_id) = public.my_company_id());
create policy "wo_progress_insert" on public.work_order_progress for insert
  with check ((select company_id from public.projects p join public.work_orders w on w.project_id = p.id where w.id = work_order_id) = public.my_company_id());

create policy "sub_bills_select" on public.subcontractor_bills for select
  using ((select company_id from public.projects p join public.work_orders w on w.project_id = p.id where w.id = work_order_id) = public.my_company_id());
create policy "sub_bills_insert" on public.subcontractor_bills for insert
  with check ((select company_id from public.projects p join public.work_orders w on w.project_id = p.id where w.id = work_order_id) = public.my_company_id());

create policy "mat_issued_select" on public.material_issued_to_sub for select
  using ((select company_id from public.projects p join public.work_orders w on w.project_id = p.id where w.id = work_order_id) = public.my_company_id());
create policy "mat_issued_insert" on public.material_issued_to_sub for insert
  with check ((select company_id from public.projects p join public.work_orders w on w.project_id = p.id where w.id = work_order_id) = public.my_company_id());

-- materials, warehouse_stock
create policy "materials_select" on public.materials for select
  using (company_id = public.my_company_id());
create policy "materials_insert" on public.materials for insert
  with check (company_id = public.my_company_id()
    and public.my_role() in ('admin','project_manager','storekeeper'));
create policy "materials_update" on public.materials for update
  using (company_id = public.my_company_id()
    and public.my_role() in ('admin','project_manager','storekeeper'));

create policy "warehouse_stock_select" on public.warehouse_stock for select
  using (company_id = public.my_company_id());
create policy "warehouse_stock_insert" on public.warehouse_stock for insert
  with check (company_id = public.my_company_id());
create policy "warehouse_stock_update" on public.warehouse_stock for update
  using (company_id = public.my_company_id());

-- site_inventory
create policy "site_inventory_select" on public.site_inventory for select
  using ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "site_inventory_update" on public.site_inventory for update
  using ((select company_id from public.projects where id = project_id) = public.my_company_id());

-- material_transfers, grn, material_returns, material_indents (company-scoped)
create policy "mat_transfers_select" on public.material_transfers for select
  using (company_id = public.my_company_id());
create policy "mat_transfers_insert" on public.material_transfers for insert
  with check (company_id = public.my_company_id());
create policy "mat_transfers_update" on public.material_transfers for update
  using (company_id = public.my_company_id());

create policy "grn_select" on public.grn for select
  using (company_id = public.my_company_id());
create policy "grn_insert" on public.grn for insert
  with check (company_id = public.my_company_id());

create policy "grn_items_select" on public.grn_items for select
  using ((select company_id from public.grn where id = grn_id) = public.my_company_id());
create policy "grn_items_insert" on public.grn_items for insert
  with check ((select company_id from public.grn where id = grn_id) = public.my_company_id());

create policy "mat_returns_select" on public.material_returns for select
  using (company_id = public.my_company_id());
create policy "mat_returns_insert" on public.material_returns for insert
  with check (company_id = public.my_company_id());

create policy "mat_return_items_select" on public.material_return_items for select
  using ((select company_id from public.material_returns where id = return_id) = public.my_company_id());
create policy "mat_return_items_insert" on public.material_return_items for insert
  with check ((select company_id from public.material_returns where id = return_id) = public.my_company_id());

create policy "mat_indents_select" on public.material_indents for select
  using ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "mat_indents_insert" on public.material_indents for insert
  with check ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "mat_indents_update" on public.material_indents for update
  using ((select company_id from public.projects where id = project_id) = public.my_company_id()
    and public.my_role() in ('admin','project_manager','accountant'));

create policy "mat_indent_items_select" on public.material_indent_items for select
  using ((select company_id from public.projects p join public.material_indents mi on mi.project_id = p.id where mi.id = indent_id) = public.my_company_id());
create policy "mat_indent_items_insert" on public.material_indent_items for insert
  with check ((select company_id from public.projects p join public.material_indents mi on mi.project_id = p.id where mi.id = indent_id) = public.my_company_id());

-- Finance
create policy "budgets_select" on public.project_budgets for select
  using ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "budgets_insert" on public.project_budgets for insert
  with check ((select company_id from public.projects where id = project_id) = public.my_company_id()
    and public.my_role() in ('admin','accountant'));

create policy "payments_select" on public.payments for select
  using (company_id = public.my_company_id()
    and public.my_role() in ('admin','project_manager','accountant'));
create policy "payments_insert" on public.payments for insert
  with check (company_id = public.my_company_id()
    and public.my_role() in ('admin','accountant'));

create policy "mat_purchases_select" on public.material_purchases for select
  using (company_id = public.my_company_id());
create policy "mat_purchases_insert" on public.material_purchases for insert
  with check (company_id = public.my_company_id()
    and public.my_role() in ('admin','accountant','storekeeper'));

create policy "site_expenses_select" on public.site_expenses for select
  using ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "site_expenses_insert" on public.site_expenses for insert
  with check ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "site_expenses_update" on public.site_expenses for update
  using ((select company_id from public.projects where id = project_id) = public.my_company_id()
    and public.my_role() in ('admin','accountant'));

-- Equipment
create policy "equipment_select" on public.equipment for select
  using (company_id = public.my_company_id());
create policy "equipment_insert" on public.equipment for insert
  with check (company_id = public.my_company_id()
    and public.my_role() in ('admin','project_manager'));
create policy "equipment_update" on public.equipment for update
  using (company_id = public.my_company_id()
    and public.my_role() in ('admin','project_manager'));

create policy "eq_deploy_select" on public.equipment_deployments for select
  using ((select company_id from public.equipment where id = equipment_id) = public.my_company_id());
create policy "eq_deploy_insert" on public.equipment_deployments for insert
  with check ((select company_id from public.equipment where id = equipment_id) = public.my_company_id());

create policy "eq_usage_select" on public.equipment_usage_logs for select
  using ((select company_id from public.equipment where id = equipment_id) = public.my_company_id());
create policy "eq_usage_insert" on public.equipment_usage_logs for insert
  with check ((select company_id from public.equipment where id = equipment_id) = public.my_company_id());

create policy "eq_maint_select" on public.equipment_maintenance for select
  using ((select company_id from public.equipment where id = equipment_id) = public.my_company_id());
create policy "eq_maint_insert" on public.equipment_maintenance for insert
  with check ((select company_id from public.equipment where id = equipment_id) = public.my_company_id());

create policy "eq_hire_select" on public.equipment_hire for select
  using (company_id = public.my_company_id());
create policy "eq_hire_insert" on public.equipment_hire for insert
  with check (company_id = public.my_company_id());

-- Invoices
create policy "client_inv_select" on public.client_invoices for select
  using ((select company_id from public.projects where id = project_id) = public.my_company_id()
    and public.my_role() in ('admin','project_manager','accountant'));
create policy "client_inv_insert" on public.client_invoices for insert
  with check ((select company_id from public.projects where id = project_id) = public.my_company_id()
    and public.my_role() in ('admin','accountant'));
create policy "client_inv_update" on public.client_invoices for update
  using ((select company_id from public.projects where id = project_id) = public.my_company_id()
    and public.my_role() in ('admin','accountant'));

create policy "client_inv_items_select" on public.client_invoice_items for select
  using ((select company_id from public.projects p join public.client_invoices ci on ci.project_id = p.id where ci.id = invoice_id) = public.my_company_id());
create policy "client_inv_items_insert" on public.client_invoice_items for insert
  with check ((select company_id from public.projects p join public.client_invoices ci on ci.project_id = p.id where ci.id = invoice_id) = public.my_company_id());

create policy "vendor_inv_select" on public.vendor_invoices for select
  using (company_id = public.my_company_id()
    and public.my_role() in ('admin','project_manager','accountant'));
create policy "vendor_inv_insert" on public.vendor_invoices for insert
  with check (company_id = public.my_company_id()
    and public.my_role() in ('admin','accountant'));

-- ============================================================
-- SPRINT 5: MATERIAL MANAGEMENT
-- ============================================================

create table public.materials (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  name text not null,
  code text,
  unit text not null,
  category text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.materials enable row level security;
create policy "materials_select" on public.materials for select using (company_id = public.my_company_id());
create policy "materials_insert" on public.materials for insert with check (company_id = public.my_company_id());
create policy "materials_update" on public.materials for update using (company_id = public.my_company_id());

create table public.material_indents (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  indent_no text,
  urgency text not null default 'normal',
  notes text,
  status text not null default 'pending',
  requested_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.material_indents enable row level security;
create policy "mi_select" on public.material_indents for select using ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "mi_insert" on public.material_indents for insert with check ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "mi_update" on public.material_indents for update using ((select company_id from public.projects where id = project_id) = public.my_company_id());

create table public.material_indent_items (
  id uuid default gen_random_uuid() primary key,
  indent_id uuid references public.material_indents on delete cascade not null,
  material_id uuid references public.materials on delete restrict not null,
  quantity_requested numeric not null,
  quantity_approved numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.material_indent_items enable row level security;
create policy "mii_select" on public.material_indent_items for select using ((select company_id from public.projects p join public.material_indents i on i.project_id = p.id where i.id = indent_id) = public.my_company_id());
create policy "mii_insert" on public.material_indent_items for insert with check ((select company_id from public.projects p join public.material_indents i on i.project_id = p.id where i.id = indent_id) = public.my_company_id());
create policy "mii_update" on public.material_indent_items for update using ((select company_id from public.projects p join public.material_indents i on i.project_id = p.id where i.id = indent_id) = public.my_company_id());

create table public.grn (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  grn_no text,
  supplier_name text not null,
  invoice_no text,
  delivery_date date not null,
  status text not null default 'received',
  received_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.grn enable row level security;
create policy "grn_select" on public.grn for select using ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "grn_insert" on public.grn for insert with check ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "grn_update" on public.grn for update using ((select company_id from public.projects where id = project_id) = public.my_company_id());

create table public.grn_items (
  id uuid default gen_random_uuid() primary key,
  grn_id uuid references public.grn on delete cascade not null,
  material_id uuid references public.materials on delete restrict not null,
  qty_received numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.grn_items enable row level security;
create policy "grni_select" on public.grn_items for select using ((select company_id from public.projects p join public.grn g on g.project_id = p.id where g.id = grn_id) = public.my_company_id());
create policy "grni_insert" on public.grn_items for insert with check ((select company_id from public.projects p join public.grn g on g.project_id = p.id where g.id = grn_id) = public.my_company_id());

create table public.site_inventory (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  material_id uuid references public.materials on delete restrict not null,
  quantity numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (project_id, material_id)
);
alter table public.site_inventory enable row level security;
create policy "siteinv_select" on public.site_inventory for select using ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "siteinv_insert" on public.site_inventory for insert with check ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "siteinv_update" on public.site_inventory for update using ((select company_id from public.projects where id = project_id) = public.my_company_id());

create table public.material_transfers (
  id uuid default gen_random_uuid() primary key,
  source_project_id uuid references public.projects on delete cascade,
  dest_project_id uuid references public.projects on delete cascade,
  material_id uuid references public.materials on delete restrict not null,
  quantity numeric not null,
  transfer_date date not null,
  transfer_type text not null,
  notes text,
  transferred_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.material_transfers enable row level security;
create policy "mtransf_select" on public.material_transfers for select using (
  ((select company_id from public.projects where id = coalesce(source_project_id, dest_project_id)) = public.my_company_id())
);
create policy "mtransf_insert" on public.material_transfers for insert with check (
  ((select company_id from public.projects where id = coalesce(source_project_id, dest_project_id)) = public.my_company_id())
);

create table public.material_returns (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  material_id uuid references public.materials on delete restrict not null,
  quantity numeric not null,
  return_date date not null,
  supplier_name text,
  reason text,
  returned_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.material_returns enable row level security;
create policy "mret_select" on public.material_returns for select using ((select company_id from public.projects where id = project_id) = public.my_company_id());
create policy "mret_insert" on public.material_returns for insert with check ((select company_id from public.projects where id = project_id) = public.my_company_id());

-- ============================================================
-- SPRINT 6: WAREHOUSE MODULE
-- ============================================================

create table public.warehouse_inventory (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  material_id uuid references public.materials on delete restrict not null,
  quantity numeric not null default 0,
  avg_unit_price numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (company_id, material_id)
);
alter table public.warehouse_inventory enable row level security;
create policy "whinv_select" on public.warehouse_inventory for select using (company_id = public.my_company_id());
create policy "whinv_insert" on public.warehouse_inventory for insert with check (company_id = public.my_company_id());
create policy "whinv_update" on public.warehouse_inventory for update using (company_id = public.my_company_id());

create table public.delivery_challans (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  project_id uuid references public.projects on delete restrict not null,
  challan_no text,
  dispatch_date date not null,
  driver_name text,
  vehicle_no text,
  status text not null default 'dispatched',
  dispatched_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.delivery_challans enable row level security;
create policy "dc_select" on public.delivery_challans for select using (company_id = public.my_company_id());
create policy "dc_insert" on public.delivery_challans for insert with check (company_id = public.my_company_id());
create policy "dc_update" on public.delivery_challans for update using (company_id = public.my_company_id());

create table public.delivery_challan_items (
  id uuid default gen_random_uuid() primary key,
  challan_id uuid references public.delivery_challans on delete cascade not null,
  material_id uuid references public.materials on delete restrict not null,
  quantity numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.delivery_challan_items enable row level security;
create policy "dci_select" on public.delivery_challan_items for select using ((select company_id from public.delivery_challans where id = challan_id) = public.my_company_id());
create policy "dci_insert" on public.delivery_challan_items for insert with check ((select company_id from public.delivery_challans where id = challan_id) = public.my_company_id());

-- ============================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'supervisor')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Re-create trigger (drop first to avoid duplicate)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
