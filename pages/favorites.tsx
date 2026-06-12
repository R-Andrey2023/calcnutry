import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, UtensilsCrossed, Flame, Wheat, Activity, Droplet } from "lucide-react";
import { type Meal, loadFavorites, saveFavorites, loadMeals, saveMeals, macrosForGrams } from "../components/lib/storage";

export default function Favorites() {
  const [favorites, setFavorites] = useState<Meal[]>([]);
  const [, navigate] = useLocation();

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const handleRemove = (favId: string) => {
    const updated = favorites.filter(f => f.id !== favId);
    setFavorites(updated);
    saveFavorites(updated);
  };

  const handleUseInPrato = (fav: Meal) => {
    const currentMeals = loadMeals();
    if (currentMeals.length >= 5) return;
    const newMeal: Meal = {
      id: crypto.randomUUID(),
      name: fav.name,
      items: fav.items.map(item => ({ ...item, id: crypto.randomUUID() })),
    };
    saveMeals([...currentMeals, newMeal]);
    navigate("/prato");
  };

  const getMealTotals = (meal: Meal) => {
    let cal = 0, carb = 0, prot = 0, fat = 0;
    meal.items.forEach(item => {
      const m = macrosForGrams(item.food, item.grams);
      cal += m.cal; carb += m.carb; prot += m.prot; fat += m.fat;
    });
    return { cal, carb, prot, fat };
  };

  return (
    <div className="w-full flex flex-col items-center p-4 md:p-8 relative overflow-hidden bg-background">
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 -skew-y-6 transform origin-top-left -z-10" />

      <div className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

        {/* Header */}
        <div className="text-center space-y-2 pt-8">
          <div className="inline-flex items-center justify-center p-3 bg-rose-500/10 rounded-2xl mb-4">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Favoritos</h1>
          <p className="text-muted-foreground text-lg">Seus pratos salvos para reutilizar rapidamente</p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center p-10 bg-muted/20 border border-dashed rounded-2xl space-y-3">
            <Heart className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground font-medium">Nenhum favorito ainda.</p>
            <p className="text-sm text-muted-foreground">Marque um prato como favorito em <strong>Monte seu Prato</strong> para vê-lo aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map(fav => {
              const t = getMealTotals(fav);
              return (
                <Card key={fav.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{fav.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {fav.items.length} alimento{fav.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => handleRemove(fav.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Macros summary */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-2.5 bg-primary/5 rounded-xl border border-primary/10">
                        <Flame className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Calorias</p>
                          <p className="font-bold text-sm">{Math.round(t.cal)} kcal</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                        <Wheat className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Carboidratos</p>
                          <p className="font-bold text-sm">{Math.round(t.carb)}g</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl border border-red-100">
                        <Activity className="w-4 h-4 text-red-500 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Proteínas</p>
                          <p className="font-bold text-sm">{Math.round(t.prot)}g</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 bg-yellow-50 rounded-xl border border-yellow-100">
                        <Droplet className="w-4 h-4 text-yellow-500 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Gorduras</p>
                          <p className="font-bold text-sm">{Math.round(t.fat)}g</p>
                        </div>
                      </div>
                    </div>

                    {/* Items list */}
                    {fav.items.length > 0 && (
                      <div className="space-y-1.5">
                        {fav.items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm px-1">
                            <span className="text-foreground">{item.food.name}</span>
                            <span className="text-muted-foreground">{item.grams}g</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => handleUseInPrato(fav)}
                    >
                      <UtensilsCrossed className="w-4 h-4 mr-2" />
                      Usar no Prato
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}