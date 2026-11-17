import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/shell';
import { Skeleton } from './components/ui';
import { AuthProvider } from './context/auth';
import { CartProvider } from './context/cart';
import { CityProvider } from './context/city';
import { UiProvider } from './context/ui';
import Home from './pages/Home';

const CategoryPage = lazy(() => import('./pages/Category'));
const Explore = lazy(() => import('./pages/Explore'));
const CartPage = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Bookings = lazy(() => import('./pages/Bookings'));
const BookingDetail = lazy(() => import('./pages/BookingDetail'));
const Account = lazy(() => import('./pages/Account'));
const BecomePro = lazy(() => import('./pages/BecomePro'));
const Help = lazy(() => import('./pages/Help'));
const Terms = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Terms })));
const Privacy = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Privacy })));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function PageFallback() {
  return (
    // Full-height so nothing below (like the sign-off ticket) is in view and shifts when the page arrives.
    <div className="mx-auto min-h-[100dvh] max-w-[1240px] space-y-4 px-4 pt-8 md:px-8">
      <Skeleton className="h-14 w-2/3 max-w-md" />
      <Skeleton className="h-64" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UiProvider>
          <CityProvider>
            <AuthProvider>
              <CartProvider>
                <AppShell>
                  <Suspense fallback={<PageFallback />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/explore" element={<Explore />} />
                      <Route path="/c/:slug" element={<CategoryPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/bookings" element={<Bookings />} />
                      <Route path="/bookings/:id" element={<BookingDetail />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/pro" element={<BecomePro />} />
                      <Route path="/help" element={<Help />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </AppShell>
              </CartProvider>
            </AuthProvider>
          </CityProvider>
        </UiProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
