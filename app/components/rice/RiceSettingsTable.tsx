"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { CheckIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { ReachCategoryModal } from "./modals/ReachCategoryModal";
import { ImpactKpiModal } from "./modals/ImpactKpiModal";
import { ConfidenceSourceModal } from "./modals/ConfidenceSourceModal";
import { EffortSizeModal } from "./modals/EffortSizeModal";
import { 
  ReachCategory, 
  ImpactKPI, 
  ConfidenceSource, 
  EffortSize 
} from "../../types/RiceServiceTypes";
import riceSettingsService from "../../services/RiceSettingsService";
import supabaseRiceSettingsService from "../../services/db/SupabaseRiceSettingsService";

interface ColumnDefinition {
  header: string;
  key: string;
  type?: "text" | "number"; 
  min?: number;
  max?: number;
  step?: number;
}

interface RiceSettingsTableProps {
  title: string;
  description: string;
  items: ReachCategory[] | ImpactKPI[] | ConfidenceSource[] | EffortSize[];
  onAdd: (item: any) => void;
  onEdit: (id: string, item: any) => void;
  onDelete: (id: string) => void;
  type: "reach" | "impact" | "confidence" | "effort";
}

// Utiliser le service Supabase au lieu du service localStorage
const settingsService = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true' 
  ? supabaseRiceSettingsService 
  : riceSettingsService;

export function RiceSettingsTable({
  title,
  description,
  items,
  onAdd,
  onEdit,
  onDelete,
  type
}: RiceSettingsTableProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

  // Définir les colonnes en fonction du type
  const getColumns = (): ColumnDefinition[] => {
    switch (type) {
      case "reach":
        return [
          { header: "Name", key: "name" },
          { header: "Min (%)", key: "minReach" },
          { header: "Max (%)", key: "maxReach" },
          { header: "Points", key: "points", type: "number", min: 0, max: 10, step: 0.1 },
          { header: "Example", key: "example" },
        ];
      case "impact":
        return [
          { header: "Name", key: "name" },
          { header: "Min", key: "minDelta", type: "text" },
          { header: "Max", key: "maxDelta", type: "text" },
          { header: "Points/Unit", key: "pointsPerUnit", type: "text" },
          { header: "Example", key: "example" },
        ];
      case "confidence":
        return [
          { header: "Name", key: "name" },
          { header: "Points", key: "points", type: "number", min: 0, max: 5, step: 0.1 },
          { header: "Example", key: "example" },
        ];
      case "effort":
        return [
          { header: "Name", key: "name" },
          { header: "Duration", key: "duration", type: "text" },
          { header: "Dev Effort", key: "devEffort", type: "number", min: 0, max: 5, step: 0.1 },
          { header: "Design Effort", key: "designEffort", type: "number", min: 0, max: 5, step: 0.1 },
          { header: "Example", key: "example" },
        ];
      default:
        return [];
    }
  };

  const columns = getColumns();

  const handleAdd = (newItem: any) => {
    onAdd(newItem);
    setIsAddModalOpen(false);
  };

  const handleEdit = (editedItem: any) => {
    if (currentItem) {
      onEdit(currentItem.id, { ...editedItem, id: currentItem.id });
      setIsEditModalOpen(false);
      setCurrentItem(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      console.log('RiceSettingsTable: handleDelete appelé', { id, type });
      onDelete(id);
    }
  };

  const openEditModal = (item: any) => {
    setCurrentItem(item);
    setIsEditModalOpen(true);
  };

  // Rendre le modal approprié en fonction du type
  const renderModal = () => {
    switch (type) {
      case "reach":
        return (
          <>
            <ReachCategoryModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSave={handleAdd}
            />
            <ReachCategoryModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleEdit}
              category={currentItem as ReachCategory}
            />
          </>
        );
      case "impact":
        return (
          <>
            <ImpactKpiModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSave={handleAdd}
            />
            <ImpactKpiModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleEdit}
              kpi={currentItem as ImpactKPI}
            />
          </>
        );
      case "confidence":
        return (
          <>
            <ConfidenceSourceModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSave={handleAdd}
            />
            <ConfidenceSourceModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleEdit}
              source={currentItem as ConfidenceSource}
            />
          </>
        );
      case "effort":
        return (
          <>
            <EffortSizeModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSave={handleAdd}
            />
            <EffortSizeModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleEdit}
              size={currentItem as EffortSize}
            />
          </>
        );
      default:
        return null;
    }
  };

  const renderValue = (item: any, column: ColumnDefinition) => {
    // Mise en évidence des KPIs principaux
    const isMainKPI = type === 'impact' && (item.name.includes('CVR') || item.name.includes('Revenue'));
    
    // Gestion spéciale pour les cellules avec unités
    if (column.key === "points") {
      return (
        <div className="flex items-center space-x-1">
          <span className={isMainKPI ? "font-medium" : ""}>{item[column.key].toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">pts</span>
        </div>
      );
    } else if (column.key === "minReach" || column.key === "maxReach") {
      return (
        <div className="flex items-center space-x-1">
          <span className={isMainKPI ? "font-medium" : ""}>{item[column.key]}</span>
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      );
    } else if (column.key === "minDelta" || column.key === "maxDelta") {
      if (type === 'impact') {
        // Extraire la valeur numérique et l'unité
        const valueMatch = String(item[column.key]).match(/^([+-]?\d*\.?\d*)\s*(.*)$/);
        if (valueMatch && valueMatch.length >= 3) {
          const [_, value, unit] = valueMatch;
          return (
            <div className="flex items-center space-x-1">
              <span className={isMainKPI ? "font-medium" : ""}>{value}</span>
              <span className="text-xs text-muted-foreground">{unit}</span>
            </div>
          );
        }
      }
      return <span className={isMainKPI ? "font-medium" : ""}>{item[column.key]}</span>;
    } else if (column.key === "pointsPerUnit") {
      // Extraire la valeur numérique et l'unité pour pointsPerUnit
      if (type === 'impact') {
        const valueMatch = String(item[column.key]).match(/^([+-]?\d*\.?\d*)\/(.*)$/);
        if (valueMatch && valueMatch.length >= 3) {
          const [_, value, unit] = valueMatch;
          return (
            <div className="flex items-baseline space-x-1">
              <span className={isMainKPI ? "font-medium" : ""}>{value}</span>
              <span className="text-xs text-muted-foreground">/{unit}</span>
            </div>
          );
        }
      }
      return <span className={isMainKPI ? "font-medium" : ""}>{item[column.key]}</span>;
    } else if (column.key === "devEffort" || column.key === "designEffort") {
      return (
        <div className="flex items-center space-x-1">
          <span className={isMainKPI ? "font-medium" : ""}>{item[column.key].toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">pts</span>
        </div>
      );
    } else if (column.key === "name" && type === 'impact') {
      if (item.name.includes('CVR') || item.name.includes('Revenue')) {
        return <span className="font-medium">{item[column.key]}</span>;
      }
    } else if (column.key === "example" && type === 'impact') {
      // Traiter les exemples du format "Δ +X% → Y"
      const exampleMatch = String(item[column.key]).match(/^Δ\s+([+-]?\d+\.?\d*%?k?€?)\s+→\s+(\d+\.?\d*)$/);
      if (exampleMatch && exampleMatch.length >= 3) {
        const [_, delta, result] = exampleMatch;
        return (
          <div className="flex items-center space-x-1">
            <span className="text-xs text-muted-foreground">Δ</span>
            <span className={isMainKPI ? "font-medium" : ""}>{delta}</span>
            <span className="text-xs text-muted-foreground">→</span>
            <span className={isMainKPI ? "font-medium" : ""}>{result}</span>
          </div>
        );
      }
      return <span className={isMainKPI ? "font-medium" : ""}>{item[column.key]}</span>;
    }
    
    return item[column.key];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          size="sm"
          variant="default"
          className="flex items-center gap-1.5"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add {type === "reach" ? "Category" : type === "impact" ? "KPI" : type === "confidence" ? "Source" : "Size"}</span>
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/10">
            {columns.map(column => (
              <TableHead key={column.key} className="font-medium text-sm">
                {column.header}
              </TableHead>
            ))}
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Sort items to group behavior sub-metrics under their parent */}
          {items.sort((a: any, b: any) => {
            // Impact KPIs spécifiques: CVR et Revenue toujours en premier
            if (type === 'impact') {
              if (a.name.includes('CVR') && !b.name.includes('CVR')) return -1;
              if (!a.name.includes('CVR') && b.name.includes('CVR')) return 1;
              if (a.name.includes('Revenue') && !b.name.includes('Revenue') && !b.name.includes('CVR')) return -1;
              if (!a.name.includes('Revenue') && b.name.includes('Revenue') && !a.name.includes('CVR')) return 1;
              
              // Behavior doit venir après CVR et Revenue, mais avant les métriques de comportement
              if (a.name === "Behavior" && !b.name.includes('CVR') && !b.name.includes('Revenue')) return -1;
              if (b.name === "Behavior" && !a.name.includes('CVR') && !a.name.includes('Revenue')) return 1;
              
              // Les métriques de comportement doivent venir après Behavior
              if (a.isBehaviorMetric && !b.isBehaviorMetric && b.name !== "Behavior") return 1;
              if (!a.isBehaviorMetric && b.isBehaviorMetric && a.name !== "Behavior") return -1;
              
              // Ordre alphabétique pour le reste
              return a.name.localeCompare(b.name);
            } 
            // Pour les autres types, conserver le tri précédent
            else {
              // Si a est Behavior et b n'est pas Behavior, a doit venir en premier
              if (a.name === "Behavior" && b.name !== "Behavior") return -1;
              // Si b est Behavior et a n'est pas Behavior, b doit venir en premier
              if (b.name === "Behavior" && a.name !== "Behavior") return 1;
              // Si a est un sous-metric de Behavior et b ne l'est pas, a doit venir après
              if (a.isBehaviorMetric && !b.isBehaviorMetric) return 1;
              // Si b est un sous-metric de Behavior et a ne l'est pas, b doit venir après
              if (!a.isBehaviorMetric && b.isBehaviorMetric) return -1;
              // Tri alphabétique pour le reste
              return a.name.localeCompare(b.name);
            }
          }).map((item: any) => (
            <TableRow 
              key={item.id} 
              className={`group hover:bg-muted/5 
                ${item.isBehaviorMetric ? "bg-muted/5 border-l-2 border-l-muted-foreground/20" : ""}
                ${item.name === "Behavior" ? "border-b border-dashed border-muted-foreground/20 bg-muted/10" : ""}
                ${(type === 'impact' && (item.name.includes('CVR') || item.name.includes('Revenue'))) ? "bg-accent/5" : ""}
              `}
            >
              {columns.map(column => (
                <TableCell 
                  key={`${item.id}-${column.key}`} 
                  className={`group ${item.isBehaviorMetric ? "pl-8 py-1.5 text-muted-foreground" : ""}`}
                >
                  {column.key === "name" && item.isBehaviorMetric && (
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground mr-2">├─</span>
                      <span className="text-sm font-medium">{item[column.key]}</span>
                    </div>
                  )}
                  {!(column.key === "name" && item.isBehaviorMetric) && (
                    item.isBehaviorMetric ? (
                      <span className="text-sm">{renderValue(item, column)}</span>
                    ) : (
                      column.key === "name" && item.name === "Behavior" ? (
                        <div className="flex items-center">
                          <span className="font-semibold">{renderValue(item, column)}</span>
                          <span className="text-xs ml-2 text-muted-foreground">(parent)</span>
                        </div>
                      ) : (
                        renderValue(item, column)
                      )
                    )
                  )}
                </TableCell>
              ))}
              <TableCell className={`${item.isBehaviorMetric ? "py-1.5" : ""} text-right`}>
                <div className="flex items-center justify-end gap-2">
                  {item.name !== "Behavior" && (
                    <>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => openEditModal(item)}
                        className={`${item.isBehaviorMetric ? "h-6 w-6" : "h-8 w-8"}`}
                      >
                        <PencilIcon className={`${item.isBehaviorMetric ? "h-3 w-3" : "h-4 w-4"}`} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDelete(item.id)}
                        className={`${item.isBehaviorMetric ? "h-6 w-6" : "h-8 w-8"} text-destructive`}
                      >
                        <TrashIcon className={`${item.isBehaviorMetric ? "h-3 w-3" : "h-4 w-4"}`} />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {renderModal()}
    </div>
  );
} 