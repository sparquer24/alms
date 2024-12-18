import React from 'react';
import { Stepper, Step, StepLabel } from '@mui/material';

interface StepperComponentProps {
    steps: string[]; // Array of step names
    activeStep: number; // Current active step index
}

const StepperComponent: React.FC<StepperComponentProps> = ({ steps, activeStep }) => {
    return (
        <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step, index) => (
                <Step key={index}>
                    <StepLabel>{step}</StepLabel>
                </Step>
            ))}
        </Stepper>
    );
};

export default StepperComponent;
