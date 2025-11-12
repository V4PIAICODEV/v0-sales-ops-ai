-- Add device field to cliente table
alter table cliente add column if not exists device text;

-- Add comment to explain the field
comment on column cliente.device is 'Device type of the client: iOS, Android, or other';
