create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  rating integer not null check (rating >= 1 and rating <= 5),
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.feedback enable row level security;

-- Create policy to allow anonymous inserts
create policy "Allow anonymous inserts on feedback"
  on public.feedback
  for insert
  with check (true); 

-- No select policy because only admins (via dashboard) should read feedback.