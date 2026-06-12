import { useState, useEffect, useRef } from "react";
import { saveDailyGoal, saveProfile, loadProfile } from "../components/lib/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Activity, Flame, Droplet, Wheat, Dumbbell } from "lucide-react";

type Goal = "emagrecer" | "manter" | "crescer";

const COEFFICIENTS = { emagrecer: 26, manter: 31, crescer: 36 };

function calcular_calorias(peso: number, goal: Goal) {
  const calorias = COEFFICIENTS[goal] * peso;
  return {
    cal: calorias,
    carb: 0.4 * calorias,
    prot: 0.25 * calorias,
    lip: 0.35 * calorias,
  };
}

export default function Home() {
  const [peso, setPeso] = useState<string>("");
  const [goal, setGoal] = useState<Goal>("manter");
  const [result, setResult] = useState<ReturnType<typeof calcular_calorias> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const profile = loadProfile();
    if (profile) {
      setPeso(profile.peso);
      setGoal(profile.goal);
      const pesoNum = parseFloat(profile.peso.replace(",", "."));
      if (!isNaN(pesoNum) && pesoNum > 0) {
        setResult(calcular_calorias(pesoNum, profile.goal));
      }
    }
  }, []);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const pesoNum = parseFloat(peso.replace(",", "."));
    if (!isNaN(pesoNum) && pesoNum > 0) {
      const res = calcular_calorias(pesoNum, goal);
      setResult(res);
      saveDailyGoal(res);
      saveProfile({ peso, goal });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden bg-background">
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 -skew-y-6 transform origin-top-left -z-10" />
      
      <div className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">CalcNutri</h1>
          <p className="text-muted-foreground text-lg">Descubra sua necessidade calórica diária</p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/90">
          <CardHeader>
            <CardTitle className="text-xl">Seus Dados</CardTitle>
            <CardDescription>Preencha as informações para calcular seus macronutrientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCalculate} className="space-y-8">
              <div className="space-y-4">
                <Label htmlFor="peso" className="text-base">Peso (kg)</Label>
                <Input
                  id="peso"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 75.5"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className="h-14 text-lg bg-background"
                  required
                />
              </div>

              <div className="space-y-4">
                <Label className="text-base">Objetivo</Label>
                <RadioGroup 
                  value={goal} 
                  onValueChange={(val: unknown) => setGoal(val as Goal)}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem value="emagrecer" id="emagrecer" className="peer sr-only" />
                    <Label
                      htmlFor="emagrecer"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <Droplet className="mb-2 h-6 w-6 text-blue-500" />
                      Emagrecer
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="manter" id="manter" className="peer sr-only" />
                    <Label
                      htmlFor="manter"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <Activity className="mb-2 h-6 w-6 text-green-500" />
                      Manter peso
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="crescer" id="crescer" className="peer sr-only" />
                    <Label
                      htmlFor="crescer"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <Dumbbell className="mb-2 h-6 w-6 text-orange-500" />
                      Ganhar massa
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full h-14 text-lg font-semibold rounded-xl" size="lg">
                Calcular
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <div ref={resultRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Flame className="w-6 h-6 text-primary" />
                  Resultado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="text-center p-6 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Calorias Diárias</p>
                  <p className="text-5xl font-bold text-foreground">
                    {Math.round(result.cal).toLocaleString('pt-BR')} <span className="text-2xl text-muted-foreground font-medium">kcal</span>
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <Wheat className="w-5 h-5 text-amber-500" />
                        <span className="font-semibold">Carboidratos</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{Math.round(result.carb).toLocaleString('pt-BR')} kcal</span>
                        <span className="text-muted-foreground text-sm ml-2">40%</span>
                      </div>
                    </div>
                    <Progress value={40} className="h-3 [&>div]:bg-amber-500 bg-amber-500/20" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-red-500" />
                        <span className="font-semibold">Proteína</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{Math.round(result.prot).toLocaleString('pt-BR')} kcal</span>
                        <span className="text-muted-foreground text-sm ml-2">25%</span>
                      </div>
                    </div>
                    <Progress value={25} className="h-3 [&>div]:bg-red-500 bg-red-500/20" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-5 h-5 text-yellow-500" />
                        <span className="font-semibold">Lipídeos</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{Math.round(result.lip).toLocaleString('pt-BR')} kcal</span>
                        <span className="text-muted-foreground text-sm ml-2">35%</span>
                      </div>
                    </div>
                    <Progress value={35} className="h-3 [&>div]:bg-yellow-500 bg-yellow-500/20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}