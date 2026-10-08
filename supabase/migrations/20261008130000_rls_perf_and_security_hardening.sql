-- Immo Tunisia — RLS performance + security hardening
-- Follow-up to 20261008120000_init_schema.sql, based on Supabase's own
-- advisors (mcp__Supabase__get_advisors) run right after that migration.
--
-- What this fixes, and what it deliberately leaves alone:
--
-- FIXED here:
--   - auth_rls_initplan (11 findings): bare auth.uid() calls inside RLS
--     policies get re-evaluated per row; wrapping them as
--     `(select auth.uid())` lets Postgres evaluate them once per query
--     instead. Pure performance, no behavior change. See
--     https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--   - unindexed_foreign_keys (5 findings): add the missing covering
--     indexes so joins/cascades on these FK columns don't full-scan.
--   - anon/authenticated could call handle_new_user() directly via
--     PostgREST RPC (/rest/v1/rpc/handle_new_user). It's a trigger
--     function with no legitimate direct-call use, so the fix is to
--     revoke that exposure. (NOT applied to is_admin(): RLS policies on
--     every other table call public.is_admin(), and that evaluation runs
--     under the anon/authenticated role's own privileges — revoking
--     EXECUTE there would break every policy that uses it. Confirmed
--     unaffected by the smoke test after this migration.)
--
-- Deliberately NOT fixed, left for the user to decide / a later pass:
--   - rls_disabled_in_public on public.spatial_ref_sys: this table is
--     created by the postgis extension itself (EPSG spatial-reference
--     metadata — not application data, nothing user- or listing-specific).
--     Supabase's advisor explicitly says not to auto-apply this one:
--     enabling RLS with no policy would block ALL reads of it, including
--     PostGIS's own internal lookups. Remediation, if ever wanted:
--       ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
--       CREATE POLICY "spatial_ref_sys_public_read" ON public.spatial_ref_sys FOR SELECT USING (true);
--   - extension_in_public (postgis installed in the public schema, not a
--     dedicated one): the standard, low-risk default; moving it risks
--     breaking the `geography` type already used by properties.location
--     for no real security benefit at this stage.
--   - multiple_permissive_policies (60 findings): each table intentionally
--     has several narrow, separately-named policies per action (published
--     OR own OR admin) rather than one big OR'd expression, for
--     readability/auditability. It's a real (small, at near-zero current
--     row counts) performance cost, not a correctness or security issue —
--     worth consolidating in a dedicated performance pass once there's
--     real traffic to measure against, not speculatively now.
--   - unused_index (9 findings): expected noise on tables with zero rows
--     and no query history yet; these indexes exist for known upcoming
--     query patterns (the filter bar, the map, owner lookups).

-- ============================================================================
-- Unindexed foreign keys
-- ============================================================================

create index admin_users_granted_by_idx on public.admin_users (granted_by);
create index favorites_property_id_idx on public.favorites (property_id);
create index properties_category_id_idx on public.properties (category_id);
create index property_views_viewer_id_idx on public.property_views (viewer_id);
create index reports_reporter_id_idx on public.reports (reporter_id);

-- ============================================================================
-- RLS: wrap auth.uid() so it's evaluated once per query, not once per row
-- ============================================================================

alter policy "profiles_select_own" on public.profiles
  using ((select auth.uid()) = id);

alter policy "profiles_update_own" on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy "properties_select_own" on public.properties
  using ((select auth.uid()) = owner_id);

alter policy "properties_insert_own" on public.properties
  with check ((select auth.uid()) = owner_id and status in ('draft', 'pending'));

alter policy "properties_update_own" on public.properties
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id and status in ('draft', 'pending', 'archived'));

alter policy "properties_delete_own" on public.properties
  using ((select auth.uid()) = owner_id);

alter policy "property_images_select_own" on public.property_images
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id and p.owner_id = (select auth.uid())
    )
  );

alter policy "property_images_write_own" on public.property_images
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id and p.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id and p.owner_id = (select auth.uid())
    )
  );

alter policy "favorites_owner_only" on public.favorites
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "contact_requests_select_owner" on public.contact_requests
  using (
    exists (
      select 1 from public.properties p
      where p.id = contact_requests.property_id and p.owner_id = (select auth.uid())
    )
  );

alter policy "property_views_select_owner" on public.property_views
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_views.property_id and p.owner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- Close the direct-RPC path to the signup trigger function
-- ============================================================================

revoke execute on function public.handle_new_user() from anon, authenticated;
