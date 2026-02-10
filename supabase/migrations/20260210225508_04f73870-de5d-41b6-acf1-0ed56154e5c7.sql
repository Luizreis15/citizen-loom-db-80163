
-- Table: expert_onboardings
CREATE TABLE public.expert_onboardings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  expert_name text NOT NULL,
  expert_email text NOT NULL,
  expert_whatsapp text,
  project_name text,
  internal_notes text,
  status text NOT NULL DEFAULT 'created',
  consent_accepted boolean NOT NULL DEFAULT false,
  consent_at timestamptz,
  current_block integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: expert_onboarding_responses
CREATE TABLE public.expert_onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid NOT NULL REFERENCES public.expert_onboardings(id) ON DELETE CASCADE,
  block_id text NOT NULL,
  field_key text NOT NULL,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(onboarding_id, field_key)
);

-- Enable RLS
ALTER TABLE public.expert_onboardings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Updated_at triggers
CREATE TRIGGER update_expert_onboardings_updated_at
  BEFORE UPDATE ON public.expert_onboardings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expert_onboarding_responses_updated_at
  BEFORE UPDATE ON public.expert_onboarding_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function: check if onboarding_id belongs to a valid (non-expired, non-completed) token
CREATE OR REPLACE FUNCTION public.is_valid_expert_onboarding(_onboarding_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.expert_onboardings
    WHERE id = _onboarding_id
      AND expires_at > now()
      AND status != 'completed'
  )
$$;

-- RLS: expert_onboardings
-- Admins/Owners full access
CREATE POLICY "Admins can manage expert onboardings"
  ON public.expert_onboardings FOR ALL
  USING (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'));

-- Public can SELECT valid (non-expired) onboardings by token
CREATE POLICY "Public can view valid expert onboardings"
  ON public.expert_onboardings FOR SELECT
  TO anon, authenticated
  USING (expires_at > now());

-- Public can UPDATE valid onboardings (for consent, status, current_block)
CREATE POLICY "Public can update valid expert onboardings"
  ON public.expert_onboardings FOR UPDATE
  TO anon, authenticated
  USING (expires_at > now() AND status != 'completed')
  WITH CHECK (expires_at > now() AND status != 'completed');

-- RLS: expert_onboarding_responses
-- Admins/Owners full access
CREATE POLICY "Admins can manage expert responses"
  ON public.expert_onboarding_responses FOR ALL
  USING (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'));

-- Public can SELECT responses for valid onboardings
CREATE POLICY "Public can view expert responses"
  ON public.expert_onboarding_responses FOR SELECT
  TO anon, authenticated
  USING (is_valid_expert_onboarding(onboarding_id));

-- Public can INSERT responses for valid onboardings
CREATE POLICY "Public can insert expert responses"
  ON public.expert_onboarding_responses FOR INSERT
  TO anon, authenticated
  WITH CHECK (is_valid_expert_onboarding(onboarding_id));

-- Public can UPDATE responses for valid onboardings
CREATE POLICY "Public can update expert responses"
  ON public.expert_onboarding_responses FOR UPDATE
  TO anon, authenticated
  USING (is_valid_expert_onboarding(onboarding_id))
  WITH CHECK (is_valid_expert_onboarding(onboarding_id));

-- Index for token lookups
CREATE INDEX idx_expert_onboardings_token ON public.expert_onboardings(token);
CREATE INDEX idx_expert_responses_onboarding ON public.expert_onboarding_responses(onboarding_id);
