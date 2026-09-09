import { Switch, Route } from "wouter";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Visit from "./pages/Visit";
import Pricing from "./pages/Pricing";
import Cats from "./pages/Cats";
import Access from "./pages/Access";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Reels from "./pages/Reels";
import Facilities from "./pages/Facilities";
import NotFound from "./pages/not-found";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminGuard from "./pages/admin/AdminGuard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCats from "./pages/admin/AdminCats";
import AdminPhotos from "./pages/admin/AdminPhotos";
import AdminHours from "./pages/admin/AdminHours";
import AdminPricing from "./pages/admin/AdminPricing";
import AdminFaqs from "./pages/admin/AdminFaqs";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminGoogle from "./pages/admin/AdminGoogle";
import AdminInstagram from "./pages/admin/AdminInstagram";
import AdminAccounts from "./pages/admin/AdminAccounts";
import AdminEnquiries from "./pages/admin/AdminEnquiries";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminApiAccess from "./pages/admin/AdminApiAccess";
import AdminTraffic from "./pages/admin/AdminTraffic";

function AdminSection() {
  return (
    <AdminGuard>
      <AdminLayout>
        <Switch>
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/traffic" component={AdminTraffic} />
          <Route path="/admin/bookings" component={AdminBookings} />
          <Route path="/admin/enquiries" component={AdminEnquiries} />
          <Route path="/admin/cats" component={AdminCats} />
          <Route path="/admin/photos" component={AdminPhotos} />
          <Route path="/admin/hours" component={AdminHours} />
          <Route path="/admin/pricing" component={AdminPricing} />
          <Route path="/admin/faqs" component={AdminFaqs} />
          <Route path="/admin/events" component={AdminEvents} />
          <Route path="/admin/google" component={AdminGoogle} />
          <Route path="/admin/instagram" component={AdminInstagram} />
          <Route path="/admin/testimonials" component={AdminTestimonials} />
          <Route path="/admin/accounts" component={AdminAccounts} />
          <Route path="/admin/api-access" component={AdminApiAccess} />
        </Switch>
      </AdminLayout>
    </AdminGuard>
  );
}

export default function App() {
  return (
    <Switch>
      {/* Admin routes — outside the public Layout */}
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/:rest*" component={AdminSection} />

      {/* Public routes */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/visit" component={Visit} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/cats" component={Cats} />
            <Route path="/access" component={Access} />
            <Route path="/faq" component={FAQ} />
            <Route path="/contact" component={Contact} />
            <Route path="/reels" component={Reels} />
            <Route path="/facilities" component={Facilities} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}
