import { useState } from 'react';
import ParameterInput from './ParameterInput';
import MachineWearInput from './MachineWearInput';
import HealthResult from './HealthResult';
import SharedControls from './SharedControls';
import ConfirmationModal from './ConfirmationModal';
import { PARAMETER_CONFIG, NORMAL_VALUES } from '../../config/constants';

function SyntheticInputTab() {
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

  // Populated after a successful apply; shown as source + timestamp.
  // The setter will be added when healthService.applyConditions() is wired.
  const [lastApplied] = useState(null);

  // Integration point:
  // Connect this handler to healthService.generateSyntheticData().
  // Every click must request a fresh set from Teammate 5's generator.
  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      // TODO:
      // const generatedData = await healthService.generateSyntheticData();
      // setValues(generatedData);
      // setHasGenerated(true);
      // Recalculate health using the generated values.

      console.warn(
        '[SyntheticInputTab] Synthetic generation is not yet connected.'
      );
    } catch (error) {
      console.error(
        '[SyntheticInputTab] Failed to generate synthetic data:',
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
    // const result = healthService.calculateHealth(updatedValues);
    // setHealthScore(result.score);
    // setHealthClassification(result.classification);

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
  // Connect to healthService.applyConditions(values, 'synthetic').
  const handleConfirmApply = async () => {
    setIsApplying(true);

    try {
      // TODO:
      // const result = await healthService.applyConditions(
      //   values,
      //   'synthetic'
      // );
      //
      // setLastApplied({
      //   source: 'Synthetic Data',
      //   timestamp: result.timestamp,
      // });

      console.warn(
        '[SyntheticInputTab] Applying conditions is not yet connected.'
      );

      setShowModal(false);
    } catch (error) {
      console.error(
        '[SyntheticInputTab] Failed to apply conditions:',
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
    <div className="content-panel">
      {/* Section heading */}
      <div className="section-heading">
        <h3 className="section-title">Synthetic Condition Generation</h3>

        <p className="section-description">
          Generate a fresh set of simulated operating conditions for the
          entire packaging line. Review and edit the values before applying.
        </p>
      </div>

      {/* Generation controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '15px',
          padding: '17px',
          marginBottom: '25px',
          background: 'var(--surface-hover)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
        }}
      >
        <div style={{ flex: '1 1 180px' }}>
          <p
            style={{
              margin: 0,
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            Generate operating conditions
          </p>

          <p
            style={{
              margin: '5px 0 0',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              lineHeight: 1.5,
            }}
          >
            Each generation requests a fresh set of synthetic values.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="primary-button"
          style={{
            minWidth: '190px',
            background: 'linear-gradient(135deg, #20B65A, #16A34A)',
            boxShadow: '0 7px 18px rgba(22, 163, 74, 0.18)',
          }}
        >
          {isGenerating ? (
            <>
              <span aria-hidden="true">⏳</span>
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '11px 13px',
            marginBottom: '23px',
            color: 'var(--brand-green)',
            background: 'rgba(22, 163, 74, 0.08)',
            border: '1px solid rgba(22, 163, 74, 0.2)',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <span aria-hidden="true">✓</span>
          Synthetic values generated. You can edit them before applying.
        </div>
      )}

      {/* Editable health parameters */}
      <div className="section-heading">
        <h4 className="section-title" style={{ fontSize: '14px' }}>
          Operating Parameters
        </h4>

        <p className="section-description">
          All values represent the overall packaging line.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <ParameterInput
          label="Temperature"
          unit={PARAMETER_CONFIG.temperature.unit}
          value={values.temperature}
          onChange={handleChange('temperature')}
          placeholder={hasGenerated ? 'Enter value' : 'Waiting for data generation'}
        />

        <ParameterInput
          label="Vibration"
          unit={PARAMETER_CONFIG.vibration.unit}
          value={values.vibration}
          onChange={handleChange('vibration')}
          placeholder={hasGenerated ? 'Enter value' : 'Waiting for data generation'}
        />

        <ParameterInput
          label="Operating Duration"
          unit={PARAMETER_CONFIG.operatingDuration.unit}
          value={values.operatingDuration}
          onChange={handleChange('operatingDuration')}
          placeholder={hasGenerated ? 'Enter value' : 'Waiting for data generation'}
        />

        <MachineWearInput
          value={values.machineWear}
          onChange={handleChange('machineWear')}
        />
      </div>

      {/* Calculated health result */}
      <div style={{ marginTop: '30px' }}>
        <HealthResult
          score={healthScore}
          classification={healthClassification}
        />
      </div>

      {/* Last applied information */}
      {lastApplied && (
        <p className="form-hint" style={{ marginTop: '17px' }}>
          <strong>Source:</strong> {lastApplied.source}
          {' · '}
          <strong>Last applied:</strong>{' '}
          {lastApplied.timestamp?.toLocaleString()}
        </p>
      )}

      {/* Reset and apply */}
      <div style={{ marginTop: '28px' }}>
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