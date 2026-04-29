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

interface AddConnectionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  facilityId: string;
}

const steps = [
  { id: 'details', title: 'Details', description: 'Connection information' },
  { id: 'capacity', title: 'Capacity', description: 'Load and demand' },
  { id: 'meter', title: 'Meter', description: 'Meter details' },
];

export function AddConnectionWizard({
  open,
  onOpenChange,
  onComplete,
  facilityId,
}: AddConnectionWizardProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    supplyVoltage: '',
    sanctionedLoad: '',
    contractDemand: '',
    connectedLoad: '',
    meterNumber: '',
    accountNumber: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleComplete = () => {
    console.log('Creating connection for facility:', facilityId, formData);
    onComplete();
    setFormData({
      name: '',
      type: '',
      supplyVoltage: '',
      sanctionedLoad: '',
      contractDemand: '',
      connectedLoad: '',
      meterNumber: '',
      accountNumber: '',
    });
  };

  return (
    <WizardModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Connection"
      steps={steps}
      onComplete={handleComplete}
    >
      {/* Step 1: Connection Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="connName" className="text-foreground">Connection Name</Label>
          <Input
            id="connName"
            placeholder="e.g., Main HT Connection"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="bg-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="connType" className="text-foreground">Connection Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => updateField('type', value)}
          >
            <SelectTrigger className="bg-input">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HT">HT (High Tension)</SelectItem>
              <SelectItem value="LT">LT (Low Tension)</SelectItem>
              <SelectItem value="Industrial">Industrial</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Residential">Residential</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="voltage" className="text-foreground">Supply Voltage (V)</Label>
          <Select
            value={formData.supplyVoltage}
            onValueChange={(value) => updateField('supplyVoltage', value)}
          >
            <SelectTrigger className="bg-input">
              <SelectValue placeholder="Select voltage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="415">415V</SelectItem>
              <SelectItem value="11000">11kV</SelectItem>
              <SelectItem value="33000">33kV</SelectItem>
              <SelectItem value="66000">66kV</SelectItem>
              <SelectItem value="132000">132kV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Step 2: Capacity Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sanctioned" className="text-foreground">Sanctioned Load (kW)</Label>
          <Input
            id="sanctioned"
            type="number"
            placeholder="Enter sanctioned load"
            value={formData.sanctionedLoad}
            onChange={(e) => updateField('sanctionedLoad', e.target.value)}
            className="bg-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contract" className="text-foreground">Contract Demand (kVA)</Label>
          <Input
            id="contract"
            type="number"
            placeholder="Enter contract demand"
            value={formData.contractDemand}
            onChange={(e) => updateField('contractDemand', e.target.value)}
            className="bg-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="connected" className="text-foreground">Connected Load (kW)</Label>
          <Input
            id="connected"
            type="number"
            placeholder="Enter connected load"
            value={formData.connectedLoad}
            onChange={(e) => updateField('connectedLoad', e.target.value)}
            className="bg-input"
          />
        </div>
      </div>

      {/* Step 3: Meter Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="meterNum" className="text-foreground">Meter Number</Label>
          <Input
            id="meterNum"
            placeholder="Enter meter number"
            value={formData.meterNumber}
            onChange={(e) => updateField('meterNumber', e.target.value)}
            className="bg-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountNum" className="text-foreground">Account Number</Label>
          <Input
            id="accountNum"
            placeholder="Enter account number"
            value={formData.accountNumber}
            onChange={(e) => updateField('accountNumber', e.target.value)}
            className="bg-input"
          />
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-sm font-medium text-foreground">Summary</h4>
          <div className="mt-2 grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connection:</span>
              <span className="text-foreground">{formData.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="text-foreground">{formData.type || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sanctioned Load:</span>
              <span className="text-foreground">
                {formData.sanctionedLoad ? `${formData.sanctionedLoad} kW` : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </WizardModal>
  );
}
