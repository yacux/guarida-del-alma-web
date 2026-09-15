CREATE POLICY "announcements: admin gestiona" ON public.announcements USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "announcements: ver autenticados" ON public.announcements FOR SELECT USING ((public.fn_clerk_user_id() <> ''::text));
CREATE POLICY "enrollments: admin gestiona" ON public.enrollments USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "enrollments: ver propias o admin" ON public.enrollments FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));
CREATE POLICY "entitlements: admin gestiona" ON public.user_entitlements USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "entitlements: ver propios o admin" ON public.user_entitlements FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));
CREATE POLICY "feedback: admin gestiona" ON public.assignment_feedback USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "feedback: ver propias o admin" ON public.assignment_feedback FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR (EXISTS ( SELECT 1
   FROM public.assignment_submissions s
  WHERE ((s.id = assignment_feedback.submission_id) AND (s.student_id = public.fn_clerk_user_id()))))));
CREATE POLICY "final_activities: admin gestiona" ON public.final_activities USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "final_activities: ver con acceso o admin" ON public.final_activities FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR public.fn_has_access_to_product(public.fn_clerk_user_id(), product_id)));
CREATE POLICY "final_feedback: admin gestiona" ON public.final_activity_feedback USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "final_feedback: ver propias o admin" ON public.final_activity_feedback FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR (EXISTS ( SELECT 1
   FROM public.final_activity_submissions s
  WHERE ((s.id = final_activity_feedback.submission_id) AND (s.student_id = public.fn_clerk_user_id()))))));
CREATE POLICY "final_sub: admin gestiona" ON public.final_activity_submissions USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "final_sub: alumna inserta" ON public.final_activity_submissions FOR INSERT WITH CHECK ((student_id = public.fn_clerk_user_id()));
CREATE POLICY "final_sub: ver propias o admin" ON public.final_activity_submissions FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));
CREATE POLICY "historial: admin gestiona" ON public.historial_reservas USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "historial: ver propio o admin" ON public.historial_reservas FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));
CREATE POLICY "intents: admin gestiona" ON public.meeting_attendance_intents USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "intents: alumna cancela" ON public.meeting_attendance_intents FOR DELETE USING ((student_id = public.fn_clerk_user_id()));
CREATE POLICY "intents: alumna registra" ON public.meeting_attendance_intents FOR INSERT WITH CHECK ((student_id = public.fn_clerk_user_id()));
CREATE POLICY "intents: ver propias o admin" ON public.meeting_attendance_intents FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));
CREATE POLICY "meetings: admin gestiona" ON public.meetings USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "meetings: ver autenticados" ON public.meetings FOR SELECT USING ((public.fn_clerk_user_id() <> ''::text));
CREATE POLICY "module_assignments: admin gestiona" ON public.module_assignments USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "module_assignments: ver con acceso o admin" ON public.module_assignments FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR (EXISTS ( SELECT 1
   FROM public.modules m
  WHERE ((m.id = module_assignments.module_id) AND public.fn_has_access_to_product(public.fn_clerk_user_id(), m.product_id))))));
CREATE POLICY "module_learning_resources: admin gestiona" ON public.module_learning_resources USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "module_learning_resources: ver con acceso o admin" ON public.module_learning_resources FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR (EXISTS ( SELECT 1
   FROM public.modules m
  WHERE ((m.id = module_learning_resources.module_id) AND public.fn_has_access_to_product(public.fn_clerk_user_id(), m.product_id))))));
CREATE POLICY "modules: admin gestiona" ON public.modules USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "modules: ver con acceso o admin" ON public.modules FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR public.fn_has_access_to_product(public.fn_clerk_user_id(), product_id)));
CREATE POLICY "orders: admin gestiona" ON public.orders USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "orders: alumna crea" ON public.orders FOR INSERT WITH CHECK ((student_id = public.fn_clerk_user_id()));
CREATE POLICY "orders: ver propias o admin" ON public.orders FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));
CREATE POLICY "payments: admin gestiona" ON public.payments USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "payments: alumna inserta" ON public.payments FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = payments.order_id) AND (o.student_id = public.fn_clerk_user_id())))));
CREATE POLICY "payments: alumna sube comprobante" ON public.payments FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = payments.order_id) AND (o.student_id = public.fn_clerk_user_id()))))) WITH CHECK ((status = 'awaiting_approval'::public.payment_status));
CREATE POLICY "payments: ver propias o admin" ON public.payments FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR (EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = payments.order_id) AND (o.student_id = public.fn_clerk_user_id()))))));
CREATE POLICY "product_courses: admin gestiona" ON public.product_courses USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "product_courses: ver siempre" ON public.product_courses FOR SELECT USING (true);
CREATE POLICY "product_programs: admin gestiona" ON public.product_programs USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "product_programs: ver siempre" ON public.product_programs FOR SELECT USING (true);
CREATE POLICY "product_workshops: admin gestiona" ON public.product_workshops USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "product_workshops: ver siempre" ON public.product_workshops FOR SELECT USING (true);
CREATE POLICY "products: admin gestiona" ON public.products USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "products: ver activos o admin" ON public.products FOR SELECT USING (((is_active = true) OR (public.fn_my_role() = 'admin'::public.user_role)));
CREATE POLICY "profiles: actualizar propio" ON public.profiles FOR UPDATE USING ((id = public.fn_clerk_user_id()));
CREATE POLICY "profiles: admin gestiona" ON public.profiles USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "profiles: ver propio o admin" ON public.profiles FOR SELECT USING (((id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));
CREATE POLICY "program_products: admin gestiona" ON public.program_included_products USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "program_products: ver siempre" ON public.program_included_products FOR SELECT USING (true);
CREATE POLICY "progress: admin gestiona" ON public.student_module_progress USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "progress: ver propio o admin" ON public.student_module_progress FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));
CREATE POLICY "submissions: admin gestiona" ON public.assignment_submissions USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "submissions: alumna inserta" ON public.assignment_submissions FOR INSERT WITH CHECK ((student_id = public.fn_clerk_user_id()));
CREATE POLICY "submissions: ver propias o admin" ON public.assignment_submissions FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));
CREATE POLICY "workshop_learning_resources: admin gestiona" ON public.workshop_learning_resources USING ((public.fn_my_role() = 'admin'::public.user_role));
CREATE POLICY "workshop_learning_resources: ver con acceso o admin" ON public.workshop_learning_resources FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR public.fn_has_access_to_product(public.fn_clerk_user_id(), product_id)));
