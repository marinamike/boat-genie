import { useState, useEffect, useCallback } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useEquipmentSpecs } from "@/hooks/useEquipmentSpecs";
import { UseFormReturn } from "react-hook-form";

const ENGINE_POSITION_LABELS = [
  "Port",
  "Port Center",
  "Center",
  "Starboard Center",
  "Starboard",
];

interface EngineEntry {
  id: string;
  brand: string;
  model: string;
  serial_number: string;
  hours: number | "";
  position_label: string;
}

interface EquipmentSectionProps {
  form: UseFormReturn<any>;
  onEquipmentMatch: (
    type: "engine" | "generator" | "seakeeper",
    specId: string | null,
    manualUrl: string | null
  ) => void;
  onEnginesChange?: (engines: EngineEntry[]) => void;
}

export function EquipmentSection({ form, onEquipmentMatch, onEnginesChange }: EquipmentSectionProps) {
  const { specs, loading, getEngineBrands, getGeneratorBrands, getSeakeeperModels, getModelsForBrand, findSpec } =
    useEquipmentSpecs();

  // Multiple engines state
  const [engines, setEngines] = useState<EngineEntry[]>([
    { id: crypto.randomUUID(), brand: "", model: "", serial_number: "", hours: "", position_label: "Port" }
  ]);

  const [generatorMatch, setGeneratorMatch] = useState<boolean | null>(null);
  const [seakeeperMatch, setSeakeeperMatch] = useState<boolean | null>(null);

  const generatorBrand = form.watch("generator_brand");
  const generatorModel = form.watch("generator_model");
  const seakeeperModel = form.watch("seakeeper_model");

  // Notify parent of engines changes
  useEffect(() => {
    onEnginesChange?.(engines);
    
    // Also update the legacy form fields with the first engine for backwards compatibility
    if (engines.length > 0) {
      const firstEngine = engines[0];
      form.setValue("engine_brand", firstEngine.brand);
      form.setValue("engine_model", firstEngine.model);
      form.setValue("engine_hours", firstEngine.hours);
    }
  }, [engines, onEnginesChange, form]);

  // Check for generator match
  useEffect(() => {
    if (generatorBrand && generatorModel) {
      const spec = findSpec("generator", generatorBrand, generatorModel);
      setGeneratorMatch(!!spec);
      onEquipmentMatch("generator", spec?.id || null, spec?.manual_url || null);
    } else {
      setGeneratorMatch(null);
      onEquipmentMatch("generator", null, null);
    }
  }, [generatorBrand, generatorModel, findSpec, onEquipmentMatch]);

  // Check for seakeeper match
  useEffect(() => {
    if (seakeeperModel) {
      const spec = findSpec("seakeeper", "Seakeeper", seakeeperModel);
      setSeakeeperMatch(!!spec);
      onEquipmentMatch("seakeeper", spec?.id || null, spec?.manual_url || null);
    } else {
      setSeakeeperMatch(null);
      onEquipmentMatch("seakeeper", null, null);
    }
  }, [seakeeperModel, findSpec, onEquipmentMatch]);

  const engineBrands = getEngineBrands();
  const generatorBrands = getGeneratorBrands();
  const seakeeperModels = getSeakeeperModels();
  const generatorModels = generatorBrand ? getModelsForBrand("generator", generatorBrand) : [];

  const getAvailablePositions = (currentId: string) => {
    const usedPositions = engines
      .filter(e => e.id !== currentId)
      .map(e => e.position_label);
    return ENGINE_POSITION_LABELS.filter(p => !usedPositions.includes(p));
  };

  const handleAddEngine = () => {
    if (engines.length >= 5) return;
    const availablePositions = getAvailablePositions("");
    const newPosition = availablePositions[0] || `Engine ${engines.length + 1}`;
    setEngines(prev => [...prev, {
      id: crypto.randomUUID(),
      brand: "",
      model: "",
      serial_number: "",
      hours: "",
      position_label: newPosition
    }]);
  };

  const handleRemoveEngine = (id: string) => {
    if (engines.length <= 1) return;
    setEngines(prev => prev.filter(e => e.id !== id));
  };

  const handleEngineChange = (id: string, field: keyof EngineEntry, value: any) => {
    setEngines(prev => prev.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const getEngineMatch = (brand: string, model: string): boolean | null => {
    if (!brand || !model) return null;
    const spec = findSpec("engine", brand, model);
    return !!spec;
  };

  const MatchIndicator = ({ match }: { match: boolean | null }) => {
    if (match === null) return null;
    return match ? (
      <Badge variant="secondary" className="ml-2 text-xs bg-green-500/10 text-green-600">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Manual Found
      </Badge>
    ) : (
      <Badge variant="secondary" className="ml-2 text-xs bg-amber-500/10 text-amber-600">
        <AlertCircle className="w-3 h-3 mr-1" />
        Upload Manual
      </Badge>
    );
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-muted-foreground">Equipment</h4>

      {/* Multiple Engines */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Engines</span>
          {engines.length < 5 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddEngine}
              className="h-7 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Engine
            </Button>
          )}
        </div>

        {engines.map((engine, index) => {
          const engineModels = engine.brand ? getModelsForBrand("engine", engine.brand) : [];
          const engineMatch = getEngineMatch(engine.brand, engine.model);
          const availablePositions = getAvailablePositions(engine.id);

          return (
            <div key={engine.id} className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Select
                    value={engine.position_label}
                    onValueChange={(val) => handleEngineChange(engine.id, "position_label", val)}
                  >
                    <SelectTrigger className="h-7 w-auto text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={engine.position_label}>{engine.position_label}</SelectItem>
                      {availablePositions
                        .filter(p => p !== engine.position_label)
                        .map(pos => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <MatchIndicator match={engineMatch} />
                </div>
                {engines.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveEngine(engine.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Brand</label>
                  <Select
                    value={engine.brand || "none"}
                    onValueChange={(val) => {
                      handleEngineChange(engine.id, "brand", val === "none" ? "" : val);
                      handleEngineChange(engine.id, "model", ""); // Reset model when brand changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select brand</SelectItem>
                      {engineBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Model</label>
                  {engine.brand && engine.brand !== "other" && engineModels.length > 0 ? (
                    <Select
                      value={engine.model || "none"}
                      onValueChange={(val) => handleEngineChange(engine.id, "model", val === "none" ? "" : val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select model</SelectItem>
                        {engineModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="e.g. F250"
                      value={engine.model}
                      onChange={(e) => handleEngineChange(engine.id, "model", e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Serial Number</label>
                  <Input
                    placeholder="e.g. YAM-2024-12345"
                    value={engine.serial_number}
                    onChange={(e) => handleEngineChange(engine.id, "serial_number", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Current Hours</label>
                  <Input
                    type="number"
                    placeholder="e.g. 450"
                    value={engine.hours}
                    onChange={(e) => handleEngineChange(engine.id, "hours", e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generator */}
      <div className="space-y-3">
        <div className="flex items-center">
          <span className="text-sm font-medium">Generator</span>
          <MatchIndicator match={generatorMatch} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="generator_brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Brand</FormLabel>
                <Select onValueChange={(val) => field.onChange(val === "none" ? "" : val)} value={field.value || "none"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Select brand</SelectItem>
                    {generatorBrands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="generator_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Model</FormLabel>
                {generatorBrand && generatorBrand !== "other" && generatorModels.length > 0 ? (
                  <Select onValueChange={(val) => field.onChange(val === "none" ? "" : val)} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Select model</SelectItem>
                      {generatorModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input placeholder="e.g. 7.3E" {...field} value={field.value || ""} />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="generator_serial"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Serial Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. GEN-2024-12345"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="generator_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Current Hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g. 200"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Seakeeper */}
      <div className="space-y-3">
        <div className="flex items-center">
          <span className="text-sm font-medium">Seakeeper</span>
          <MatchIndicator match={seakeeperMatch} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="seakeeper_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Model</FormLabel>
                <Select 
                  onValueChange={(val) => field.onChange(val === "none" ? "" : val)} 
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {seakeeperModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        Seakeeper {model}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seakeeper_serial"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Serial Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. SK-2024-12345"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <FormField
            control={form.control}
            name="seakeeper_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Current Hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g. 500"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {(generatorMatch === false || seakeeperMatch === false) && (
        <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          💡 We couldn't find a digital manual for some of your equipment. You can upload your own
          manuals in the Digital Locker after saving.
        </p>
      )}
    </div>
  );
}
