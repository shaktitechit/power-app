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

interface AddDGWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  connectionId: string;
}

const steps = [
  { id: 'info', title: 'DG Info', description: 'Basic information' },
  { id: 'fuel', title: 'Fuel Type', description: 'Fuel configuration' },
  { id: 'capacity', title: 'Capacity', description: 'Power details' },
];

export function AddDGWizard({
  open,
  onOpenChange,
  onComplete,
  connectionId,
}: AddDGWizardProps) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    serialNumber: '',
    yearOfInstallation: '',
    fuelType: '',
    tankCapacity: '',
    capacity: '',
    voltage: '',
    runningHours: '',
    lastServiceDate: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleComplete = () => {
    console.log('Creating DG system for connection:', connectionId, formData);
    onComplete();
    setFormData({
      make: '',
      model: '',
      serialNumber: '',
      yearOfInstallation: '',
      fuelType: '',
      tankCapacity: '',
      capacity: '',
      voltage: '',
      runningHours: '',
      lastServiceDate: '',
    });
  };

  return (
    <WizardModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add DG System"
      steps={steps}
      onComplete={handleComplete}
    >
      {/* Step 1: DG Information */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dgMake" className="text-foreground">Make</Label>
            <Select
              value={formData.make}
              onValueChange={(value) => updateField('make', value)}
            >
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="Select make" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cummins">Cummins</SelectItem>
                <SelectItem value="Caterpillar">Caterpillar</SelectItem>
                <SelectItem value="Kirloskar">Kirloskar</SelectItem>
                <SelectItem value="Mahindra">Mahindra</SelectItem>
                <SelectItem value="Ashok Leyland">Ashok Leyland</SelectItem>
                <SelectItem value="Greaves">Greaves</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dgModel" className="text-foreground">Model</Label>
            <Input
              id="dgModel"
              placeholder="Enter model number"
              value={formData.model}
              onChange={(e) => updateField('model', e.target.value)}
              className="bg-input"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="serial" className="text-foreground">Serial Number</Label>
            <Input
              id="serial"
              placeholder="Enter serial number"
              value={formData.serialNumber}
              onChange={(e) => updateField('serialNumber', e.target.value)}
              className="bg-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year" className="text-foreground">Year of Installation</Label>
            <Select
              value={formData.yearOfInstallation}
              onValueChange={(value) => updateField('yearOfInstallation', value)}
            >
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 20 }, (_, i) => 2025 - i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Step 2: Fuel Type */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fuelType" className="text-foreground">Fuel Type</Label>
          <Select
            value={formData.fuelType}
            onValueChange={(value) => updateField('fuelType', value)}
          >
            <SelectTrigger className="bg-input">
              <SelectValue placeholder="Select fuel type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Diesel">Diesel</SelectItem>
              <SelectItem value="Natural Gas">Natural Gas</SelectItem>
              <SelectItem value="Dual Fuel">Dual Fuel</SelectItem>
              <SelectItem value="Bio-diesel">Bio-diesel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tankCapacity" className="text-foreground">Fuel Tank Capacity (Liters)</Label>
          <Input
            id="tankCapacity"
            type="number"
            placeholder="Enter tank capacity"
            value={formData.tankCapacity}
            onChange={(e) => updateField('tankCapacity', e.target.value)}
            className="bg-input"
          />
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-sm font-medium text-foreground">Fuel Information</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Ensure the fuel type matches the generator specifications for optimal performance and warranty compliance.
          </p>
        </div>
      </div>

      {/* Step 3: Capacity */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="capacity" className="text-foreground">Capacity (kVA)</Label>
            <Input
              id="capacity"
              type="number"
              placeholder="Enter capacity"
              value={formData.capacity}
              onChange={(e) => updateField('capacity', e.target.value)}
              className="bg-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voltage" className="text-foreground">Output Voltage (V)</Label>
            <Select
              value={formData.voltage}
              onValueChange={(value) => updateField('voltage', value)}
            >
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="Select voltage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="230">230V (Single Phase)</SelectItem>
                <SelectItem value="415">415V (Three Phase)</SelectItem>
                <SelectItem value="11000">11kV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="runningHours" className="text-foreground">Current Running Hours</Label>
            <Input
              id="runningHours"
              type="number"
              placeholder="Enter running hours"
              value={formData.runningHours}
              onChange={(e) => updateField('runningHours', e.target.value)}
              className="bg-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastService" className="text-foreground">Last Service Date</Label>
            <Input
              id="lastService"
              type="date"
              value={formData.lastServiceDate}
              onChange={(e) => updateField('lastServiceDate', e.target.value)}
              className="bg-input"
            />
          </div>
        </div>
      </div>
    </WizardModal>
  );
}
