-- Support ticket system for admin-user communication

CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  category TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Users can create their own tickets
CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own tickets, admins can read all
CREATE POLICY "Users can read own tickets"
  ON support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Only admins can update tickets
CREATE POLICY "Admins can update tickets"
  ON support_tickets FOR UPDATE TO authenticated
  USING (public.is_admin());

-- Only admins can delete tickets
CREATE POLICY "Admins can delete tickets"
  ON support_tickets FOR DELETE TO authenticated
  USING (public.is_admin());

-- Users can create messages on their own tickets, admins on any
CREATE POLICY "Users can create messages on own tickets"
  ON support_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid())
    OR public.is_admin()
  );

-- Users can read messages on their own tickets, admins on any
CREATE POLICY "Users can read messages on own tickets"
  ON support_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid())
    OR public.is_admin()
  );

-- Admins can manage all messages
CREATE POLICY "Admins can manage messages"
  ON support_messages FOR DELETE TO authenticated
  USING (public.is_admin());
