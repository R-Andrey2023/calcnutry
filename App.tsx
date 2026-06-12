import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Foods from "@/pages/foods";
import Prato from "@/pages/prato";
import Favorites from "@/pages/favorites";
import NavBar from "@/components/NavBar";

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="pb-20 min-h-screen">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/alimentos" component={Foods} />
        <Route path="/prato" component={Prato} />
        <Route path="/favoritos" component={Favorites} />
        <Route component={NotFound} />
      </Switch>
      <NavBar />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
