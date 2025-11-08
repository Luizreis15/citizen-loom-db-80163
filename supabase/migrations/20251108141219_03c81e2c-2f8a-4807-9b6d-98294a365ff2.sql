-- Create client_requests table
CREATE TABLE public.client_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  product_id INTEGER REFERENCES public.products(id) NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Urgente')),
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em análise', 'Aprovado', 'Recusado')),
  requested_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create request_attachments table
CREATE TABLE public.request_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.client_requests(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create financial_transactions table
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Mensalidade', 'Adicional', 'Ajuste')),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method TEXT CHECK (payment_method IN ('PIX', 'Boleto', 'Cartão', 'Transferência')),
  payment_proof_url TEXT,
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago', 'Atrasado', 'Cancelado')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create activity_log table
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('upload', 'comment', 'approval', 'request', 'payment', 'status_change')),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create storage bucket for client uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-uploads', 'client-uploads', false);

-- Enable RLS on all tables
ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_requests
CREATE POLICY "Clients can view own requests"
ON public.client_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.client_id = client_requests.client_id
  )
);

CREATE POLICY "Clients can create own requests"
ON public.client_requests FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.client_id = client_requests.client_id
  )
  AND requested_by = auth.uid()
);

CREATE POLICY "Admins can view all requests"
ON public.client_requests FOR SELECT
USING (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admins can update all requests"
ON public.client_requests FOR UPDATE
USING (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'));

-- RLS Policies for request_attachments
CREATE POLICY "Clients can view own attachments"
ON public.request_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.client_requests cr
    JOIN public.profiles p ON p.client_id = cr.client_id
    WHERE cr.id = request_attachments.request_id
    AND p.id = auth.uid()
  )
);

CREATE POLICY "Clients can create own attachments"
ON public.request_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.client_requests cr
    JOIN public.profiles p ON p.client_id = cr.client_id
    WHERE cr.id = request_attachments.request_id
    AND p.id = auth.uid()
  )
  AND uploaded_by = auth.uid()
);

CREATE POLICY "Admins can view all attachments"
ON public.request_attachments FOR SELECT
USING (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'));

-- RLS Policies for financial_transactions
CREATE POLICY "Clients can view own transactions"
ON public.financial_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.client_id = financial_transactions.client_id
  )
);

CREATE POLICY "Clients can update own transactions"
ON public.financial_transactions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.client_id = financial_transactions.client_id
  )
);

CREATE POLICY "Admins can manage all transactions"
ON public.financial_transactions FOR ALL
USING (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'));

-- RLS Policies for activity_log
CREATE POLICY "Clients can view own activity"
ON public.activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.client_id = activity_log.client_id
  )
);

CREATE POLICY "Users can create activity logs"
ON public.activity_log FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all activity"
ON public.activity_log FOR SELECT
USING (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'));

-- Storage policies for client-uploads
CREATE POLICY "Clients can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-uploads' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT client_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Clients can view own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-uploads' AND
  (storage.foldername(name))[1] IN (
    SELECT client_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can view all client files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-uploads' AND
  (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'))
);

-- Triggers for updated_at
CREATE TRIGGER update_client_requests_updated_at
BEFORE UPDATE ON public.client_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
BEFORE UPDATE ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();