import { useState, useEffect } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
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
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEquipmentSpecs } from "@/hooks/useEquipmentSpecs";
import { UseFormReturn } from "react-hook-form";

interface EquipmentSectionProps {
  form: UseFormReturn<any>;
  onEquipmentMatch: (
    type: "engine" | "generator" | "seakeeper",
    specId: string | null,
    manualUrl: string | null
  ) => void;
}

export function EquipmentSection({ form, onEquipmentMatch }: EquipmentSectionProps) {
  const { specs, loading, getEngineBrands, getGeneratorBrands, getSeakeeperModels, getModelsForBrand, findSpec } =
    useEquipmentSpecs();

  const [engineMatch, setEngineMatch] = useState<boolean | null>(null);
  const [generatorMatch, setGeneratorMatch] = useState<boolean | null>(null);
  const [seakeeperMatch, setSeakeeperMatch] = useState<boolean | null>(null);

  const engineBrand = form.watch("engine_brand");
  const engineModel = form.watch("engine_model");
  const generatorBrand = form.watch("generator_brand");
  const generatorModel = form.watch("generator_model");
  const seakeeperModel = form.watch("seakeeper_model");

  // Check for engine match
  useEffect(() => {
    if (engineBrand && engineModel) {
      const spec = findSpec("engine", engineBrand, engineModel);
      setEngineMatch(!!spec);
      onEquipmentMatch("engine", spec?.id || null, spec?.manual_url || null);
    } else {
      setEngineMatch(null);
      onEquipmentMatch("engine", null, null);
    }
  }, [engineBrand, engineModel, findSpec, onEquipmentMatch]);

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
  const engineModels = engineBrand ? getModelsForBrand("engine", engineBrand) : [];
  const generatorModels = generatorBrand ? getModelsForBrand("generator", generatorBrand) : [];

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

      {/* Engine */}
      <div className="space-y-3">
        <div className="flex items-center">
          <span className="text-sm font-medium">Engine</span>
          <MatchIndicator match={engineMatch} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="engine_brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Brand</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {engineBrands.map((brand) => (
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
            name="engine_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Model</FormLabel>
                {engineBrand && engineBrand !== "other" && engineModels.length > 0 ? (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {engineModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input placeholder="e.g. F250" {...field} value={field.value || ""} />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="engine_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Current Hours</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g. 450"
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
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

      {(engineMatch === false || generatorMatch === false || seakeeperMatch === false) && (
        <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          💡 We couldn't find a digital manual for some of your equipment. You can upload your own
          manuals in the Digital Locker after saving.
        </p>
      )}
    </div>
  );
}
