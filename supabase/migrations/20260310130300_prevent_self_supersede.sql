
ALTER TABLE acceptance_protocols
ADD CONSTRAINT no_self_supersede CHECK (supersedes_id IS NULL OR supersedes_id != id);
;
