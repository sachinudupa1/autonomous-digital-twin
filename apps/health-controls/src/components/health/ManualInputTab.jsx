import { useState } from 'react';
import ParameterInput from './ParameterInput';
import MachineWearInput from './MachineWearInput';
import HealthResult from './HealthResult';
import SharedControls from './SharedControls';
import ConfirmationModal from './ConfirmationModal';
import { PARAMETER_CONFIG, NORMAL_VALUES } from '../../config/constants';

function ManualInputTab() {
  const [values, setValues] = useState({
    temperature: '',
    vibration: '',
    operatingDuration: '',
    machineWear: 0,
  });

  // These will be populated by healthService.calculateHealth()
  // once Teammate 5's health calculation is integrated.
  const [healthScore, setHealthScore] = useState(null);
  const [healthClassification, setHealthClassification] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Populated after a successful apply; shown as source + timestamp.
  // The setter will be added when healthService.applyConditions() is wired.
  const [lastApplied] = useState(null);

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

  // Populate normal baseline values without applying them.
  const handleReset = () => {
    const normalValues = {
      temperature: NORMAL_VALUES.temperature ?? '',
      vibration: NORMAL_VALUES.vibration ?? '',
      operatingDuration: NORMAL_VALUES.operatingDuration ?? '',
      machineWear: NORMAL_VALUES.machineWear,
    };

    setValues(normalValues);

    // Recalculate health after the health service is integrated.
  };

  const handleApply = () => {
    setShowModal(true);
  };

  const handleConfirmApply = async () => {
    setIsApplying(true);

    try {
      // Integration point:
      // const result = await healthService.applyConditions(values, 'manual');
      // setLastApplied({
      //   source: 'Manual Input',
      //   timestamp: result.timestamp,
      // });

      console.warn(
        '[ManualInputTab] Apply Conditions is awaiting health service integration.'
      );

      setShowModal(false);
    } catch (error) {
      console.error(
        '[ManualInputTab] Failed to apply conditions:',
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
        <h3 className="section-title">Manual Condition Entry</h3>

        <p className="section-description">
          Enter the simulated operating conditions for the packaging line.
          The health result will be calculated using the configured health
          assessment logic.
        </p>
      </div>

      {/* Health parameters */}
      <div className="flex flex-col gap-5">
        <ParameterInput
          label="Temperature"
          unit={PARAMETER_CONFIG.temperature.unit}
          value={values.temperature}
          onChange={handleChange('temperature')}
        />

        <ParameterInput
          label="Vibration"
          unit={PARAMETER_CONFIG.vibration.unit}
          value={values.vibration}
          onChange={handleChange('vibration')}
        />

        <ParameterInput
          label="Operating Duration"
          unit={PARAMETER_CONFIG.operatingDuration.unit}
          value={values.operatingDuration}
          onChange={handleChange('operatingDuration')}
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

      {/* Last successfully applied conditions */}
      {lastApplied && (
        <p className="form-hint" style={{ marginTop: '17px' }}>
          <strong>Source:</strong> {lastApplied.source}
          {' · '}
          <strong>Last applied:</strong>{' '}
          {lastApplied.timestamp?.toLocaleString()}
        </p>
      )}

      {/* Reset and apply controls */}
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
          source="Manual"
          isRunning={false}
          onConfirm={handleConfirmApply}
          onCancel={handleCancelApply}
        />
      )}
    </div>
  );
}

export default ManualInputTab;