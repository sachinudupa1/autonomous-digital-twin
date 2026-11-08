import { useState } from 'react';
import ParameterInput from './ParameterInput';
import MachineWearInput from './MachineWearInput';
import HealthResult from './HealthResult';
import SharedControls from './SharedControls';
import ConfirmationModal from './ConfirmationModal';
import { PARAMETER_CONFIG, NORMAL_VALUES } from '../../config/constants';

function SyntheticInputTab({ lineId }) {
  const [values, setValues] = useState({
    temperature: '',
    vibration: '',
    operatingDuration: '',
    machineWear: 0,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [healthScore, setHealthScore] = useState(null);
  const [healthClassification, setHealthClassification] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const [lastApplied] = useState(null);

  // Integration point:
  // Request fresh synthetic data for this specific line.
  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      // TODO:
      // Pass lineId to the synthetic data service.
      // Example payload: { lineId }
      // Update values and setHasGenerated(true) from the service response.

      console.warn(
        `[SyntheticInputTab] Synthetic generation for ${lineId} is not yet connected.`
      );
    } catch (error) {
      console.error(
        `[SyntheticInputTab] Failed to generate data for ${lineId}:`,
        error
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Allow the operator to edit generated values.
  const handleChange = (field) => (value) => {
    const updatedValues = {
      ...values,
      [field]: value,
    };

    setValues(updatedValues);

    // Integration point:
    // Include lineId with the updated values when requesting
    // a health calculation. Update the result from the service response.

    void setHealthScore;
    void setHealthClassification;
  };

  // Display normal baseline values without submitting them.
  const handleReset = () => {
    setValues({
      temperature: NORMAL_VALUES.temperature ?? '',
      vibration: NORMAL_VALUES.vibration ?? '',
      operatingDuration: NORMAL_VALUES.operatingDuration ?? '',
      machineWear: NORMAL_VALUES.machineWear,
    });

    setHasGenerated(false);

    // Recalculate health after health service integration.
  };

  const handleApply = () => {
    setShowModal(true);
  };

  // Integration point:
  // Apply conditions with both lineId and source='synthetic'.
  const handleConfirmApply = async () => {
    setIsApplying(true);

    try {
      // TODO:
      // Include lineId, values, and source in the apply request.
      // Example payload: { lineId, source: 'synthetic', values }

      console.warn(
        `[SyntheticInputTab] Applying conditions to ${lineId} is not yet connected.`
      );

      setShowModal(false);
    } catch (error) {
      console.error(
        `[SyntheticInputTab] Failed to apply conditions to ${lineId}:`,
        error
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleCancelApply = () => {
    setShowModal(false);
  };

  return (
    <div className="content-panel" data-line-id={lineId}>
      {/* Section heading */}
      <div className="section-heading">
        <h3 className="section-title">
          Synthetic Condition Generation
        </h3>

        <p className="section-description">
          Generate a fresh set of simulated operating conditions for this
          packaging line. Review and edit the values before applying.
        </p>
      </div>

      {/* Generation controls */}
      <div className="hc-generation-panel">
        <div className="hc-generation-panel__copy">
          <p className="hc-generation-panel__title">
            Generate operating conditions
          </p>

          <p className="hc-generation-panel__description">
            Each generation requests a fresh set of synthetic values for
            {` ${lineId.replace('_', ' ')}.`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="primary-button hc-generation-button"
        >
          {isGenerating ? (
            <>
              <span
                className="hc-generation-spinner"
                aria-hidden="true"
              />
              Generating...
            </>
          ) : (
            <>
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M20 7v5h-5M4 17v-5h5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.8 9a7 7 0 0 1 11.6-2L20 12M4 12l2.6 5a7 7 0 0 0 11.6-2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              Generate Synthetic Data
            </>
          )}
        </button>
      </div>

      {/* Generation status */}
      {hasGenerated && (
        <div className="hc-generation-status" role="status">
          <span
            className="hc-generation-status__icon"
            aria-hidden="true"
          >
            ✓
          </span>

          <span>
            Synthetic values generated. You can edit them before applying.
          </span>
        </div>
      )}

      {/* Editable health parameters */}
      <div className="section-heading hc-parameters-heading">
        <h4 className="section-title hc-parameters-title">
          Operating Parameters
        </h4>

        <p className="section-description">
          All values represent {lineId.replace('_', ' ')} only.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <ParameterInput
          label="Temperature"
          unit={PARAMETER_CONFIG.temperature.unit}
          value={values.temperature}
          onChange={handleChange('temperature')}
          placeholder={
            hasGenerated ? 'Enter value' : 'Waiting for data generation'
          }
        />

        <ParameterInput
          label="Vibration"
          unit={PARAMETER_CONFIG.vibration.unit}
          value={values.vibration}
          onChange={handleChange('vibration')}
          placeholder={
            hasGenerated ? 'Enter value' : 'Waiting for data generation'
          }
        />

        <ParameterInput
          label="Operating Duration"
          unit={PARAMETER_CONFIG.operatingDuration.unit}
          value={values.operatingDuration}
          onChange={handleChange('operatingDuration')}
          placeholder={
            hasGenerated ? 'Enter value' : 'Waiting for data generation'
          }
        />

        <MachineWearInput
          value={values.machineWear}
          onChange={handleChange('machineWear')}
        />
      </div>

      {/* Calculated health result */}
      <div className="hc-health-result">
        <HealthResult
          score={healthScore}
          classification={healthClassification}
        />
      </div>

      {/* Last applied information */}
      {lastApplied && (
        <p className="form-hint hc-last-applied">
          <strong>Source:</strong> {lastApplied.source}
          {' · '}
          <strong>Last applied:</strong>{' '}
          {lastApplied.timestamp?.toLocaleString()}
        </p>
      )}

      {/* Reset and apply */}
      <div className="hc-shared-controls">
        <SharedControls
          onReset={handleReset}
          onApply={handleApply}
          isApplying={isApplying}
        />
      </div>

      {/* Confirmation popup */}
      {showModal && (
        <ConfirmationModal
          conditions={values}
          source="Synthetic"
          isRunning={false}
          onConfirm={handleConfirmApply}
          onCancel={handleCancelApply}
        />
      )}
    </div>
  );
}

export default SyntheticInputTab;