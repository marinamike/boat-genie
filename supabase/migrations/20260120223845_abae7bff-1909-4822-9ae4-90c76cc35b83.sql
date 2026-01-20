-- Create enums for roles and membership tiers
CREATE TYPE public.app_role AS ENUM ('boat_owner', 'provider', 'admin');
CREATE TYPE public.membership_tier AS ENUM ('standard', 'genie');
CREATE TYPE public.work_order_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.wish_form_status AS ENUM ('submitted', 'reviewed', 'approved', 'rejected', 'converted');

-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    membership_tier membership_tier NOT NULL DEFAULT 'standard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create boats table
CREATE TABLE public.boats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    make TEXT,
    model TEXT,
    year INTEGER,
    length_ft DECIMAL(5,1),
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create boat_profiles table with sensitive data
CREATE TABLE public.boat_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boat_id UUID REFERENCES public.boats(id) ON DELETE CASCADE NOT NULL UNIQUE,
    slip_number TEXT,
    gate_code TEXT,
    marina_name TEXT,
    marina_address TEXT,
    special_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create work_orders table
CREATE TABLE public.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boat_id UUID REFERENCES public.boats(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status work_order_status NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    scheduled_date DATE,
    completed_at TIMESTAMPTZ,
    wholesale_price DECIMAL(10,2),
    retail_price DECIMAL(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create boat_logs table (The Boat Log - permanent timeline)
CREATE TABLE public.boat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boat_id UUID REFERENCES public.boats(id) ON DELETE CASCADE NOT NULL,
    work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    log_type TEXT NOT NULL DEFAULT 'service',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create boat_log_photos table
CREATE TABLE public.boat_log_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boat_log_id UUID REFERENCES public.boat_logs(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    caption TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create wish_forms table (The Wish Form)
CREATE TABLE public.wish_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    boat_id UUID REFERENCES public.boats(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    description TEXT NOT NULL,
    urgency TEXT DEFAULT 'normal',
    preferred_date DATE,
    status wish_form_status NOT NULL DEFAULT 'submitted',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_boats_updated_at BEFORE UPDATE ON public.boats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_boat_profiles_updated_at BEFORE UPDATE ON public.boat_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wish_forms_updated_at BEFORE UPDATE ON public.wish_forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    
    -- Default new users to boat_owner role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'boat_owner');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.owns_boat(_boat_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.boats
        WHERE id = _boat_id AND owner_id = auth.uid()
    )
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_provider(_work_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.work_orders
        WHERE id = _work_order_id AND provider_id = auth.uid()
    )
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boat_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boat_log_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_forms ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies (only admins can modify, users can view their own)
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- Boats policies
CREATE POLICY "Owners can view their boats" ON public.boats FOR SELECT USING (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "Owners can create boats" ON public.boats FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update their boats" ON public.boats FOR UPDATE USING (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "Owners can delete their boats" ON public.boats FOR DELETE USING (owner_id = auth.uid() OR public.is_admin());

-- Boat profiles policies
CREATE POLICY "Owners can view their boat profiles" ON public.boat_profiles FOR SELECT USING (public.owns_boat(boat_id) OR public.is_admin());
CREATE POLICY "Owners can create boat profiles" ON public.boat_profiles FOR INSERT WITH CHECK (public.owns_boat(boat_id));
CREATE POLICY "Owners can update their boat profiles" ON public.boat_profiles FOR UPDATE USING (public.owns_boat(boat_id) OR public.is_admin());
CREATE POLICY "Owners can delete their boat profiles" ON public.boat_profiles FOR DELETE USING (public.owns_boat(boat_id) OR public.is_admin());

-- Work orders policies
CREATE POLICY "Owners and providers can view work orders" ON public.work_orders FOR SELECT USING (
    public.owns_boat(boat_id) OR provider_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "Owners can create work orders" ON public.work_orders FOR INSERT WITH CHECK (public.owns_boat(boat_id) OR public.is_admin());
CREATE POLICY "Owners and admins can update work orders" ON public.work_orders FOR UPDATE USING (
    public.owns_boat(boat_id) OR provider_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "Only admins can delete work orders" ON public.work_orders FOR DELETE USING (public.is_admin());

-- Boat logs policies
CREATE POLICY "Owners and providers can view boat logs" ON public.boat_logs FOR SELECT USING (
    public.owns_boat(boat_id) OR 
    EXISTS (SELECT 1 FROM public.work_orders WHERE id = work_order_id AND provider_id = auth.uid()) OR 
    public.is_admin()
);
CREATE POLICY "Owners and providers can create boat logs" ON public.boat_logs FOR INSERT WITH CHECK (
    public.owns_boat(boat_id) OR public.is_admin()
);
CREATE POLICY "Owners can update boat logs" ON public.boat_logs FOR UPDATE USING (public.owns_boat(boat_id) OR public.is_admin());
CREATE POLICY "Owners can delete boat logs" ON public.boat_logs FOR DELETE USING (public.owns_boat(boat_id) OR public.is_admin());

-- Boat log photos policies
CREATE POLICY "Users can view photos for accessible logs" ON public.boat_log_photos FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.boat_logs bl
        WHERE bl.id = boat_log_id AND (
            public.owns_boat(bl.boat_id) OR
            EXISTS (SELECT 1 FROM public.work_orders wo WHERE wo.id = bl.work_order_id AND wo.provider_id = auth.uid()) OR
            public.is_admin()
        )
    )
);
CREATE POLICY "Owners can manage photos" ON public.boat_log_photos FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.boat_logs bl
        WHERE bl.id = boat_log_id AND (public.owns_boat(bl.boat_id) OR public.is_admin())
    )
);

-- Wish forms policies
CREATE POLICY "Requesters and providers can view wish forms" ON public.wish_forms FOR SELECT USING (
    requester_id = auth.uid() OR public.has_role(auth.uid(), 'provider') OR public.is_admin()
);
CREATE POLICY "Users can create wish forms" ON public.wish_forms FOR INSERT WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Requesters and admins can update wish forms" ON public.wish_forms FOR UPDATE USING (requester_id = auth.uid() OR public.is_admin());
CREATE POLICY "Only admins can delete wish forms" ON public.wish_forms FOR DELETE USING (public.is_admin());