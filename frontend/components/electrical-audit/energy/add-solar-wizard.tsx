'use client';

import { useState } from 'react';
import { WizardModal } from '@/components/ui/wizard-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddSolarWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  connectionId: string;
}

const steps = [
  { id: 'panel', title: 'Panel Details', description: 'Solar panel information' },
  { id: 'inverter', title: 'Inverter', description: 'Inverter configuration' },
  { id: 'capacity', title: 'Capacity', description: 'System capacity' },
];

export function AddSolarWizard({
  open,
  onOpenChange,
  onComplete,
  connectionId,
}: AddSolarWizardProps) {
  const [formData, setFormData] = useState({
    panelMake: '',
    panelModel: '',
    panelCapacity: '',
    numberOfPanels: '',
    panelType: '',
    inverterMake: '',
    inverterModel: '',
    inverterCapacity: '',
    inverterType: '',
    totalCapacity: '',
    installationDate: '',
    roofArea: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleComplete = () => {
    console.log('Creating solar system for connection:', connectionId, formData);
    onComplete();
    setFormData({
      panelMake: '',
      panelModel: '',
      panelCapacity: '',
      numberOfPanels: '',
      panelType: '',
      inverterMake: '',
      inverterModel: '',
      inverterCapacity: '',
      inverterType: '',
      totalCapacity: '',
      installationDate: '',
      roofArea: '',
    });
  };

  return (
    <WizardModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Solar System"
      steps={steps}
      onComplete={handleComplete}
    >
      {/* Step 1: Panel Details */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="panelMake" className="text-foreground">Panel Make</Label>
            <Select
              value={formData.panelMake}
              onValueChange={(value) => updateField('panelMake', value)}
            >
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="Select make" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tata Solar">Tata Solar</SelectItem>
                <SelectItem value="Vikram Solar">Vikram Solar</SelectItem>
                <SelectItem value="Adani Solar">Adani Solar</SelectItem>
                <SelectItem value="Waaree">Waaree</SelectItem>
                <SelectItem value="Luminous">Luminous</SelectItem>
                <SelectItem value="Renewsys">Renewsys</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="panelModel" className="text-foreground">Panel Model</Label>
            <Input
              id="panelModel"
              placeholder="Enter model number"
              value={formData.panelModel}
              onChange={(e) => updateField('panelModel', e.target.value)}
              className="bg-input"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="panelCapacity" className="text-foreground">Panel Capacity (Wp)</Label>
            <Input
              id="panelCapacity"
              type="number"
              placeholder="e.g., 400"
              value={formData.panelCapacity}
              onChange={(e) => updateField('panelCapacity', e.target.value)}
              className="bg-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="panelType" className="text-foreground">Panel Type</Label>
            <Select
              value={formData.panelType}
              onValueChange={(value) => updateField('panelType', value)}
            >
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monocrystalline">Monocrystalline</SelectItem>
                <SelectItem value="Polycrystalline">Polycrystalline</SelectItem>
                <SelectItem value="Thin Film">Thin Film</SelectItem>
                <SelectItem value="Bifacial">Bifacial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="numberOfPanels" className="text-foreground">Number of Panels</Label>
          <Input
            id="numberOfPanels"
            type="number"
            placeholder="Enter number of panels"
            value={formData.numberOfPanels}
            onChange={(e) => updateField('numberOfPanels', e.target.value)}
            className="bg-input"
          />
        </div>
      </div>

      {/* Step 2: Inverter Details */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inverterMake" className="text-foreground">Inverter Make</Label>
            <Select
              value={formData.inverterMake}
              onValueChange={(value) => updateField('inverterMake', value)}
            >
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="Select make" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ABB">ABB</SelectItem>
                <SelectItem value="SMA">SMA</SelectItem>
                <SelectItem value="Fronius">Fronius</SelectItem>
                <SelectItem value="Huawei">Huawei</SelectItem>
                <SelectItem value="Delta">Delta</SelectItem>
                <SelectItem value="Sungrow">Sungrow</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inverterModel" className="text-foreground">Inverter Model</Label>
            <Input
              id="inverterModel"
              placeholder="Enter model"
              value={formData.inverterModel}
              onChange={(e) => updateField('inverterModel', e.target.value)}
              className="bg-input"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inverterCapacity" className="text-foreground">Inverter Capacity (kW)</Label>
            <Input
              id="inverterCapacity"
              type="number"
              placeholder="Enter capacity"
              value={formData.inverterCapacity}
              onChange={(e) => updateField('inverterCapacity', e.target.value)}
              className="bg-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inverterType" className="text-foreground">Inverter Type</Label>
            <Select
              value={formData.inverterType}
              onValueChange={(value) => updateField('inverterType', value)}
            >
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="String">String Inverter</SelectItem>
                <SelectItem value="Central">Central Inverter</SelectItem>
                <SelectItem value="Micro">Micro Inverter</SelectItem>
                <SelectItem value="Hybrid">Hybrid Inverter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Step 3: System Capacity */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="totalCapacity" className="text-foreground">Total System Capacity (kWp)</Label>
            <Input
              id="totalCapacity"
              type="number"
              placeholder="Enter total capacity"
              value={formData.totalCapacity}
              onChange={(e) => updateField('totalCapacity', e.target.value)}
              className="bg-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installationDate" className="text-foreground">Installation Date</Label>
            <Input
              id="installationDate"
              type="date"
              value={formData.installationDate}
              onChange={(e) => updateField('installationDate', e.target.value)}
              className="bg-input"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="roofArea" className="text-foreground">Roof Area Used (sq. m)</Label>
          <Input
            id="roofArea"
            type="number"
            placeholder="Enter roof area"
            value={formData.roofArea}
            onChange={(e) => updateField('roofArea', e.target.value)}
            className="bg-input"
          />
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-sm font-medium text-foreground">Estimated Generation</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {formData.totalCapacity
              ? `Approximately ${(parseFloat(formData.totalCapacity) * 4 * 365 / 1000).toFixed(0)} MWh/year (based on 4 peak sun hours)`
              : 'Enter capacity to see estimated annual generation'}
          </p>
        </div>
      </div>
    </WizardModal>
  );
}
