create table if not exists public.site_visits (
  id uuid primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_active_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.site_visits enable row level security;

-- Create policy to allow anonymous inserts
create policy "Allow anonymous inserts on site_visits"
  on public.site_visits for insert
  with check (true);

-- Create policy to allow anonymous updates
create policy "Allow anonymous updates on site_visits"
  on public.site_visits for update
  using (true);

-- Create policy to allow anonymous selects (needed for upsert/checking)
create policy "Allow anonymous selects on site_visits"
  on public.site_visits for select
  using (true);
