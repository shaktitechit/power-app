"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

interface WizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  steps: WizardStep[];
  children: React.ReactNode[];
  onComplete: () => void;
}

export function WizardModal({
  open,
  onOpenChange,
  title,
  steps,
  children,
  onComplete,
}: WizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      setCurrentStep(0);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[100vh] w-[100vw] max-w-2xl overflow-y-auto border-border bg-card p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-card-foreground sm:text-xl">
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="my-4 sm:my-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors sm:h-10 sm:w-10 sm:text-sm",
                      index < currentStep
                        ? "border-primary bg-primary text-primary-foreground"
                        : index === currentStep
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {index < currentStep ? (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-1.5 max-w-[60px] truncate text-center text-[10px] font-medium sm:mt-2 sm:max-w-none sm:text-xs",
                      index <= currentStep
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-1 h-0.5 flex-1 sm:mx-4",
                      index < currentStep ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[200px] py-2 sm:min-h-[300px] sm:py-4">
          {children[currentStep]}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isFirstStep}
            className="w-full sm:w-auto"
          >
            Back
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={handleNext} className="w-full sm:w-auto">
              {isLastStep ? "Complete" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
