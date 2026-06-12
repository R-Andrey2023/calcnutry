import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { UtensilsCrossed, X, Activity, Flame, Wheat, Droplet, Sparkles, Check, Pencil, Plus, ChevronDown, Heart } from "lucide-react";
import { type Food, type PlateItem, type Meal, type DailyGoal, loadFoods, loadDailyGoal, loadMeals, saveMeals, loadFavorites, saveFavorites, macrosForGrams } from "../components/lib/storage";

function optimizePortions(items: PlateItem[], goal: DailyGoal): number[] {
  if (!goal || items.length === 0) return items.map(i => i.grams);
  const goalCarb = goal.carb / 4;
  const goalProt = goal.prot / 4;
  const goalFat  = goal.lip  / 9;
  const x = items.map(i => i.grams);
  const lr = 0.05;
  for (let iter = 0; iter < 8000; iter++) {
    let sumCarb = 0, sumProt = 0, sumFat = 0;
    for (let i = 0; i < items.length; i++) {
      sumCarb += items[i].food.carbPer100g * x[i] / 100;
      sumProt += items[i].food.protPer100g * x[i] / 100;
      sumFat  += items[i].food.fatPer100g  * x[i] / 100;
    }
    const errCarb = sumCarb - goalCarb;
    const errProt = sumProt - goalProt;
    const errFat  = sumFat  - goalFat;
    for (let j = 0; j < items.length; j++) {
      const grad =
        2 * errCarb * items[j].food.carbPer100g / 100 +
        2 * errProt * items[j].food.protPer100g / 100 +
        2 * errFat  * items[j].food.fatPer100g  / 100;
      x[j] = Math.max(1, x[j] - lr * grad);
    }
  }
  return x.map(v => Math.round(v));
}

export default function Prato() {
  const { toast } = useToast();
  const [foods, setFoods]               = useState<Food[]>([]);
  const [goal, setGoal]                 = useState<DailyGoal>(null);
  const [meals, setMeals]               = useState<Meal[]>([]);
  const [openMealId, setOpenMealId]     = useState<string | null>(null);
  const [renamingMealId, setRenamingMealId] = useState<string | null>(null);
  const [renamingText, setRenamingText]     = useState<string>("");
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [grams, setGrams]               = useState<string>("100");
  const [editingItemId, setEditingItemId]   = useState<string | null>(null);
  const [editingGrams, setEditingGrams]     = useState<string>("");
  const [suggestion, setSuggestion] = useState<{ mealId: string; values: number[] } | null>(null);
  const [chartFilter, setChartFilter] = useState<string>("geral");
  const [favorites, setFavorites] = useState<Meal[]>([]);
  const [showFavPicker, setShowFavPicker] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFoods(loadFoods());
    setGoal(loadDailyGoal());
    const saved = loadMeals();
    setMeals(saved);
    if (saved.length > 0) setOpenMealId(saved[0].id);
    setFavorites(loadFavorites());
  }, []);

  const updateMeals = (updated: Meal[]) => {
    setMeals(updated);
    saveMeals(updated);
  };

  const handleToggleFavorite = (meal: Meal) => {
    const isFav = favorites.some(f => f.id === meal.id);
    if (!isFav) {
      const nameExists = favorites.some(
        f => f.name.trim().toLowerCase() === meal.name.trim().toLowerCase()
      );
      if (nameExists) {
        toast({
          title: "Nome já existe nos favoritos",
          description: `Já existe um favorito chamado "${meal.name}". Renomeie o prato antes de favoritar.`,
          variant: "destructive",
        });
        return;
      }
    }
    const updated = isFav
      ? favorites.filter(f => f.id !== meal.id)
      : [...favorites, { ...meal, items: meal.items.map(i => ({ ...i })) }];
    setFavorites(updated);
    saveFavorites(updated);
  };

  const handleAddFromFavorite = (fav: Meal) => {
    if (meals.length >= 5) return;
    const newMeal: Meal = {
      id: crypto.randomUUID(),
      name: fav.name,
      items: fav.items.map(item => ({ ...item, id: crypto.randomUUID() })),
    };
    const updated = [...meals, newMeal];
    updateMeals(updated);
    setOpenMealId(newMeal.id);
    setShowFavPicker(false);
    setSuggestion(null);
  };

  const handleAddMeal = () => {
    if (meals.length >= 5) return;
    const newMeal: Meal = { id: crypto.randomUUID(), name: `Refeição ${meals.length + 1}`, items: [] };
    const updated = [...meals, newMeal];
    updateMeals(updated);
    setOpenMealId(newMeal.id);
    setSuggestion(null);
    setSelectedFoodId("");
    setGrams("100");
  };

  const handleDeleteMeal = (mealId: string) => {
    const updated = meals.filter(m => m.id !== mealId);
    updateMeals(updated);
    if (openMealId === mealId) setOpenMealId(updated[0]?.id ?? null);
    if (suggestion?.mealId === mealId) setSuggestion(null);
  };

  const handleToggleMeal = (mealId: string) => {
    setOpenMealId(prev => prev === mealId ? null : mealId);
    setSuggestion(null);
    setEditingItemId(null);
    setSelectedFoodId("");
    setGrams("100");
  };

  const handleStartRename = (meal: Meal) => {
    setRenamingMealId(meal.id);
    setRenamingText(meal.name);
  };

  const handleSaveRename = (mealId: string) => {
    const name = renamingText.trim() || "Refeição";
    updateMeals(meals.map(m => m.id === mealId ? { ...m, name } : m));
    setRenamingMealId(null);
  };

  const handleAddItem = (mealId: string) => {
    const g = parseInt(grams, 10);
    const food = foods.find(f => f.id === selectedFoodId);
    if (!food || isNaN(g) || g <= 0) return;
    const newItem: PlateItem = { id: crypto.randomUUID(), food, grams: g };
    updateMeals(meals.map(m => m.id === mealId ? { ...m, items: [...m.items, newItem] } : m));
    setSuggestion(null);
    setSelectedFoodId("");
    setGrams("100");
  };

  const handleRemoveItem = (mealId: string, itemId: string) => {
    updateMeals(meals.map(m => m.id === mealId ? { ...m, items: m.items.filter(i => i.id !== itemId) } : m));
    if (suggestion?.mealId === mealId) setSuggestion(null);
  };

  const handleEditItem = (item: PlateItem) => {
    setEditingItemId(item.id);
    setEditingGrams(String(item.grams));
  };

  const handleSaveItem = (mealId: string, itemId: string) => {
    const g = parseInt(editingGrams, 10);
    if (!isNaN(g) && g > 0) {
      updateMeals(meals.map(m => m.id === mealId
        ? { ...m, items: m.items.map(i => i.id === itemId ? { ...i, grams: g } : i) }
        : m
      ));
      if (suggestion?.mealId === mealId) setSuggestion(null);
    }
    setEditingItemId(null);
    setEditingGrams("");
  };

  const handleSuggest = (mealId: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (!meal) return;
    setSuggestion({ mealId, values: optimizePortions(meal.items, goal) });
    setTimeout(() => suggestionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleApplySuggestion = () => {
    if (!suggestion) return;
    updateMeals(meals.map(m => m.id === suggestion.mealId
      ? { ...m, items: m.items.map((item, i) => ({ ...item, grams: suggestion.values[i] })) }
      : m
    ));
    setSuggestion(null);
  };

  // Combined totals from all meals
  let totalCal = 0, totalCarb = 0, totalProt = 0, totalFat = 0;
  meals.forEach(meal => {
    meal.items.forEach(item => {
      const m = macrosForGrams(item.food, item.grams);
      totalCal  += m.cal;
      totalCarb += m.carb;
      totalProt += m.prot;
      totalFat  += m.fat;
    });
  });

  // Display totals based on filter
  let displayCal = totalCal, displayCarb = totalCarb, displayProt = totalProt, displayFat = totalFat;
  if (chartFilter !== "geral") {
    const filtered = meals.find(m => m.id === chartFilter);
    displayCal = 0; displayCarb = 0; displayProt = 0; displayFat = 0;
    filtered?.items.forEach(item => {
      const m = macrosForGrams(item.food, item.grams);
      displayCal += m.cal; displayCarb += m.carb; displayProt += m.prot; displayFat += m.fat;
    });
  }

  // Suggestion preview totals
  let sugCal = 0, sugCarb = 0, sugProt = 0, sugFat = 0;
  if (suggestion) {
    const meal = meals.find(m => m.id === suggestion.mealId);
    meal?.items.forEach((item, i) => {
      const m = macrosForGrams(item.food, suggestion.values[i]);
      sugCal += m.cal; sugCarb += m.carb; sugProt += m.prot; sugFat += m.fat;
    });
  }

  const allItemsCount = meals.reduce((s, m) => s + m.items.length, 0);

  return (
    <div className="w-full flex flex-col items-center p-4 md:p-8 relative overflow-hidden bg-background">
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 -skew-y-6 transform origin-top-left -z-10" />

      <div className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

        {/* Header */}
        <div className="text-center space-y-2 pt-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Monte seu Prato</h1>
          <p className="text-muted-foreground text-lg">Organize suas refeições do dia</p>
        </div>

        {/* Daily goal banner */}
        {goal ? (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-primary font-semibold uppercase tracking-wide">Meta Diária</p>
                <p className="text-xl font-bold text-foreground">{Math.round(goal.cal)} kcal</p>
              </div>
            </div>
            <div className="flex gap-4 text-sm font-medium">
              <span className="text-amber-600">Carb {Math.round(goal.carb / 4)}g</span>
              <span className="text-red-600">Prot {Math.round(goal.prot / 4)}g</span>
              <span className="text-yellow-600">Gord {Math.round(goal.lip / 9)}g</span>
            </div>
          </div>
        ) : (
          <div className="bg-muted border rounded-xl p-4 text-center">
            <p className="text-muted-foreground">Calcule sua meta na aba Início primeiro.</p>
            <Link href="/" className="text-primary font-medium hover:underline mt-2 inline-block">Ir para Início</Link>
          </div>
        )}

        {/* Totals card — only when there's food */}
        {allItemsCount > 0 && (
          <Card className="border-primary/20 shadow-xl overflow-hidden relative">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mb-16" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-xl">
                  {chartFilter === "geral" ? "Total do Dia" : (meals.find(m => m.id === chartFilter)?.name ?? "Total do Dia")}
                </CardTitle>
                {/* Filter pills */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setChartFilter("geral")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${chartFilter === "geral" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    Geral
                  </button>
                  {meals.filter(m => m.items.length > 0).map(m => (
                    <button
                      key={m.id}
                      onClick={() => setChartFilter(m.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors truncate max-w-[120px] ${chartFilter === m.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="text-center py-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-3xl font-bold text-foreground">
                  {Math.round(displayCal).toLocaleString('pt-BR')} <span className="text-lg text-muted-foreground font-medium">kcal</span>
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="flex items-center gap-1"><Wheat className="w-4 h-4 text-amber-500" /> Carboidratos</span>
                    <span>{Math.round(displayCarb)}g {goal ? `/ ${Math.round(goal.carb/4)}g` : ''}</span>
                  </div>
                  <Progress value={goal ? Math.min(100, (displayCarb / (goal.carb/4)) * 100) : 0} className={goal && displayCarb > goal.carb/4 ? "[&>div]:bg-red-500" : "[&>div]:bg-amber-500"} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="flex items-center gap-1"><Activity className="w-4 h-4 text-red-500" /> Proteínas</span>
                    <span>{Math.round(displayProt)}g {goal ? `/ ${Math.round(goal.prot/4)}g` : ''}</span>
                  </div>
                  <Progress value={goal ? Math.min(100, (displayProt / (goal.prot/4)) * 100) : 0} className={goal && displayProt > goal.prot/4 ? "[&>div]:bg-destructive" : "[&>div]:bg-red-500"} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="flex items-center gap-1"><Droplet className="w-4 h-4 text-yellow-500" /> Gorduras</span>
                    <span>{Math.round(displayFat)}g {goal ? `/ ${Math.round(goal.lip/9)}g` : ''}</span>
                  </div>
                  <Progress value={goal ? Math.min(100, (displayFat / (goal.lip/9)) * 100) : 0} className={goal && displayFat > goal.lip/9 ? "[&>div]:bg-red-500" : "[&>div]:bg-yellow-500"} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meals list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Refeições</h2>
            <span className="text-sm text-muted-foreground">{meals.length}/5</span>
          </div>

          {meals.length === 0 && (
            <div className="text-center p-8 bg-muted/20 border border-dashed rounded-xl">
              <p className="text-muted-foreground">Nenhuma refeição ainda. Adicione seu primeiro prato!</p>
            </div>
          )}

          {meals.map(meal => {
            const isOpen = openMealId === meal.id;
            const isRenaming = renamingMealId === meal.id;
            let mCalTotal = 0;
            meal.items.forEach(item => { mCalTotal += macrosForGrams(item.food, item.grams).cal; });

            return (
              <Card key={meal.id} className={`border shadow-sm transition-all overflow-hidden ${isOpen ? "border-primary/30 shadow-primary/10" : "border-border/50"}`}>
                {/* Meal header */}
                <div
                  className={`flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-muted/30 transition-colors ${isOpen ? "border-b border-border/50" : ""}`}
                  onClick={() => !isRenaming && handleToggleMeal(meal.id)}
                >
                  <div className="flex-1 min-w-0">
                    {isRenaming ? (
                      <Input
                        autoFocus
                        value={renamingText}
                        onChange={e => setRenamingText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleSaveRename(meal.id);
                          if (e.key === "Escape") setRenamingMealId(null);
                        }}
                        onClick={e => e.stopPropagation()}
                        className="h-8 text-base font-semibold"
                      />
                    ) : (
                      <div>
                        <p className="font-semibold text-base truncate">{meal.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {meal.items.length === 0
                            ? "Vazio"
                            : `${meal.items.length} alimento${meal.items.length > 1 ? "s" : ""} · ${Math.round(mCalTotal)} kcal`}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {isRenaming ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setRenamingMealId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleSaveRename(meal.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 transition-colors ${favorites.some(f => f.id === meal.id) ? "text-rose-500 hover:text-rose-600 hover:bg-rose-50" : "text-muted-foreground hover:text-rose-500 hover:bg-rose-50"}`}
                          onClick={() => handleToggleFavorite(meal)}
                          title={favorites.some(f => f.id === meal.id) ? "Remover dos favoritos" : "Marcar como favorito"}
                        >
                          <Heart className={`w-4 h-4 ${favorites.some(f => f.id === meal.id) ? "fill-rose-500" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleStartRename(meal)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteMeal(meal.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {!isRenaming && (
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                  )}
                </div>

                {/* Meal body */}
                {isOpen && (
                  <CardContent className="pt-4 space-y-4">
                    {/* Items list */}
                    {meal.items.length > 0 && (
                      <div className="grid gap-2">
                        {meal.items.map(item => {
                          const isEditingItem = editingItemId === item.id;
                          return (
                            <div key={item.id} className={`flex flex-col p-3 bg-muted/20 border rounded-xl gap-2 transition-all ${isEditingItem ? "border-primary/40 ring-1 ring-primary/20" : ""}`}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium">{item.food.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {isEditingItem ? (parseInt(editingGrams) || item.grams) : item.grams}g
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  {!isEditingItem && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditItem(item)}>
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveItem(meal.id, item.id)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              {isEditingItem && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Label className="shrink-0 text-sm">Quantidade (g)</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={editingGrams}
                                    onChange={e => setEditingGrams(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === "Enter") handleSaveItem(meal.id, item.id);
                                      if (e.key === "Escape") setEditingItemId(null);
                                    }}
                                    className="h-8 w-24"
                                    autoFocus
                                  />
                                  <Button variant="outline" size="sm" onClick={() => setEditingItemId(null)}>Cancelar</Button>
                                  <Button size="sm" onClick={() => handleSaveItem(meal.id, item.id)}>
                                    <Check className="w-3.5 h-3.5 mr-1" />
                                    Salvar
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add food form */}
                    {foods.length === 0 ? (
                      <div className="text-center p-3 text-sm text-muted-foreground border border-dashed rounded-xl">
                        <Link href="/alimentos" className="text-primary hover:underline">Cadastre alimentos</Link> antes de montar o prato.
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-3 items-end pt-2 border-t border-border/40">
                        <div className="space-y-1.5 flex-1 w-full">
                          <Label className="text-xs text-muted-foreground">Alimento</Label>
                          <Select value={selectedFoodId} onValueChange={setSelectedFoodId}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {foods.map(f => (
                                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5 w-full md:w-28">
                          <Label className="text-xs text-muted-foreground">Quantidade (g)</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="100"
                            value={grams}
                            onChange={e => setGrams(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <Button onClick={() => handleAddItem(meal.id)} disabled={!selectedFoodId || !grams} className="w-full md:w-auto h-9">
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    )}

                    {/* Suggest button */}
                    {goal && meal.items.length > 0 && (
                      <Button onClick={() => handleSuggest(meal.id)} variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/5 hover:text-primary">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Sugerir porções
                      </Button>
                    )}

                    {/* Suggestion card */}
                    {suggestion?.mealId === meal.id && (
                      <Card ref={suggestionRef} className="border-primary/30 bg-primary/5 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2 text-primary">
                            <Sparkles className="w-4 h-4" />
                            Porções sugeridas
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">Quantidades ajustadas para aproximar da sua meta diária.</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid gap-2">
                            {meal.items.map((item, i) => {
                              const m = macrosForGrams(item.food, suggestion.values[i]);
                              return (
                                <div key={item.id} className="flex items-center justify-between p-2.5 bg-card rounded-xl border text-sm">
                                  <span className="font-medium">{item.food.name}</span>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="text-xs">Carb {m.carb.toFixed(1)}g · Prot {m.prot.toFixed(1)}g · Gord {m.fat.toFixed(1)}g</span>
                                    <span className="font-bold text-foreground">{suggestion.values[i]}g</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="p-3 bg-card rounded-xl border text-sm space-y-1">
                            <p className="font-semibold mb-2">Total sugerido</p>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Calorias</span>
                              <span className="font-medium text-foreground">{Math.round(sugCal)} kcal {goal ? `/ ${Math.round(goal.cal)} kcal` : ''}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span className="text-amber-600">Carboidratos</span>
                              <span>{Math.round(sugCarb)}g {goal ? `/ ${Math.round(goal.carb/4)}g` : ''}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span className="text-red-600">Proteínas</span>
                              <span>{Math.round(sugProt)}g {goal ? `/ ${Math.round(goal.prot/4)}g` : ''}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span className="text-yellow-600">Gorduras</span>
                              <span>{Math.round(sugFat)}g {goal ? `/ ${Math.round(goal.lip/9)}g` : ''}</span>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setSuggestion(null)}>Descartar</Button>
                            <Button className="flex-1" onClick={handleApplySuggestion}>
                              <Check className="w-4 h-4 mr-2" />
                              Aplicar sugestão
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* Favorites picker */}
          {favorites.length > 0 && meals.length < 5 && (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full border-dashed border-rose-300 text-rose-500 hover:bg-rose-50 hover:text-rose-600 h-11"
                onClick={() => setShowFavPicker(v => !v)}
              >
                <Heart className={`w-4 h-4 mr-2 ${showFavPicker ? "fill-rose-500" : ""}`} />
                {showFavPicker ? "Fechar favoritos" : "Inserir prato favorito"}
              </Button>
              {showFavPicker && (
                <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {favorites.map(fav => {
                    let favCal = 0;
                    fav.items.forEach(item => { favCal += macrosForGrams(item.food, item.grams).cal; });
                    return (
                      <button
                        key={fav.id}
                        onClick={() => handleAddFromFavorite(fav)}
                        className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors text-left"
                      >
                        <div>
                          <p className="font-semibold text-sm text-foreground">{fav.name}</p>
                          <p className="text-xs text-muted-foreground">{fav.items.length} alimento{fav.items.length !== 1 ? "s" : ""} · {Math.round(favCal)} kcal</p>
                        </div>
                        <Plus className="w-4 h-4 text-rose-500 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Add meal button */}
          <Button
            variant="outline"
            className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:text-primary h-12"
            onClick={handleAddMeal}
            disabled={meals.length >= 5}
          >
            <Plus className="w-5 h-5 mr-2" />
            {meals.length >= 5 ? "Limite de 5 pratos atingido" : "Adicionar prato"}
          </Button>
        </div>

      </div>
    </div>
  );
}
