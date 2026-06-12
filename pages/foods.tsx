import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Apple, Pencil, X } from "lucide-react";
import { type Food, loadFoods, saveFoods, caloriesPer100g } from "../components/lib/storage";

export default function Foods() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [name, setName] = useState("");
  const [carb, setCarb] = useState("");
  const [prot, setProt] = useState("");
  const [fat, setFat] = useState("");
  const [macroError, setMacroError] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFoods(loadFoods());
  }, []);

  const resetForm = () => {
    setName("");
    setCarb("");
    setProt("");
    setFat("");
    setMacroError(false);
    setEditingId(null);
  };

  const handleEdit = (food: Food) => {
    setEditingId(food.id);
    setName(food.name);
    setCarb(String(food.carbPer100g));
    setProt(String(food.protPer100g));
    setFat(String(food.fatPer100g));
    setMacroError(false);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseFloat(carb.replace(",", ".")) || 0;
    const p = parseFloat(prot.replace(",", ".")) || 0;
    const f = parseFloat(fat.replace(",", ".")) || 0;

    if (!name.trim()) return;

    if (!carb.trim() && !prot.trim() && !fat.trim()) {
      setMacroError(true);
      return;
    }
    setMacroError(false);

    if (editingId) {
      const updated = foods.map((food) =>
        food.id === editingId
          ? { ...food, name: name.trim(), carbPer100g: c, protPer100g: p, fatPer100g: f }
          : food
      );
      setFoods(updated);
      saveFoods(updated);
    } else {
      const newFood: Food = {
        id: crypto.randomUUID(),
        name: name.trim(),
        carbPer100g: c,
        protPer100g: p,
        fatPer100g: f,
      };
      const newFoods = [...foods, newFood];
      setFoods(newFoods);
      saveFoods(newFoods);
    }

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (editingId === id) resetForm();
    const newFoods = foods.filter((f) => f.id !== id);
    setFoods(newFoods);
    saveFoods(newFoods);
  };

  const cVal = parseFloat(carb.replace(",", ".")) || 0;
  const pVal = parseFloat(prot.replace(",", ".")) || 0;
  const fVal = parseFloat(fat.replace(",", ".")) || 0;

  const totalKcal = Math.round(cVal * 4 + pVal * 4 + fVal * 9);

  return (
    <div className="w-full flex flex-col items-center p-4 md:p-8 relative overflow-hidden bg-background">
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 -skew-y-6 transform origin-top-left -z-10" />

      <div className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-2 pt-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <Apple className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Alimentos</h1>
          <p className="text-muted-foreground text-lg">Cadastre alimentos para usar no seu prato</p>
        </div>

        <div ref={formRef}>
          <Card className={`border-border/50 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/90 transition-all ${editingId ? "border-primary/40 ring-1 ring-primary/20" : ""}`}>
            <CardHeader>
              <CardTitle className="text-xl">
                {editingId ? "Editar Alimento" : "Adicionar Alimento"}
              </CardTitle>
              <CardDescription>Preencha os macronutrientes por 100g.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do alimento</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Arroz branco cozido"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carb">Carboidratos (g)</Label>
                    <Input
                      id="carb"
                      value={carb}
                      onChange={(e) => setCarb(e.target.value)}
                      placeholder="0.0"
                      type="text"
                      inputMode="decimal"
                    />
                    <p className="text-xs text-muted-foreground text-right">= {Math.round(cVal * 4)} kcal</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prot">Proteína (g)</Label>
                    <Input
                      id="prot"
                      value={prot}
                      onChange={(e) => setProt(e.target.value)}
                      placeholder="0.0"
                      type="text"
                      inputMode="decimal"
                    />
                    <p className="text-xs text-muted-foreground text-right">= {Math.round(pVal * 4)} kcal</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fat">Gordura (g)</Label>
                    <Input
                      id="fat"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      placeholder="0.0"
                      type="text"
                      inputMode="decimal"
                    />
                    <p className="text-xs text-muted-foreground text-right">= {Math.round(fVal * 9)} kcal</p>
                  </div>
                </div>

                {macroError && (
                  <p className="text-sm text-destructive font-medium">Preencha pelo menos um campo de macronutriente.</p>
                )}

                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <span className="font-medium">Total por 100g: </span>
                  <span className="text-xl font-bold text-primary ml-2">{totalKcal} kcal</span>
                </div>

                <div className="flex gap-3">
                  {editingId && (
                    <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={resetForm}>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit" className="flex-1 h-12 rounded-xl">
                    {editingId ? "Salvar alterações" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Seus Alimentos</h2>

          {foods.length === 0 ? (
            <div className="text-center p-8 bg-muted/20 border border-dashed rounded-xl">
              <p className="text-muted-foreground">Nenhum alimento cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {foods.map((food) => (
                <div
                  key={food.id}
                  className={`flex items-center justify-between p-4 bg-card border rounded-xl shadow-sm animate-in fade-in transition-all ${editingId === food.id ? "border-primary/40 bg-primary/5" : ""}`}
                >
                  <div className="space-y-1.5">
                    <p className="font-semibold">{food.name}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">Carb {food.carbPer100g}g</Badge>
                      <Badge variant="secondary" className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Prot {food.protPer100g}g</Badge>
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Gord {food.fatPer100g}g</Badge>
                      <Badge variant="outline" className="ml-1 border-primary/20 text-primary">
                        {Math.round(caloriesPer100g(food))} kcal/100g
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => handleEdit(food)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(food.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}