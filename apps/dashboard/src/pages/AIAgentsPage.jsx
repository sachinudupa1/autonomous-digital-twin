import { useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import PlaceholderSection from '../components/common/PlaceholderSection';
import Modal from '../components/common/Modal';
import InternalTabs from '../components/common/InternalTabs';

/* =====================================================
   AGENT DEFINITIONS
===================================================== */

const INDIVIDUAL_AGENTS = [
  {
    id: 'rl-agent',
    label: 'RL Agent',
    description: 'Reinforcement Learning Agent',
  },
  {
    id: 'ml-agent',
    label: 'ML Agent',
    description: 'Machine Learning Agent',
  },
  {
    id: 'rule-based-agent',
    label: 'Rule-Based Agent',
    description: 'Deterministic Rule-Based Agent',
  },
];

const MAIN_AGENT = {
  id: 'main-agent',
  label: 'Main Agent',
  description: 'Orchestration & Final Decision Agent',
};

/* =====================================================
   INDIVIDUAL AGENT TABS
===================================================== */

const INDIVIDUAL_AGENT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'approach', label: 'Approach' },
  { id: 'mistake-verify', label: 'Mistake Verification' },
  { id: 'exec-history', label: 'Execution History' },
  { id: 'plan-history', label: 'Selected Plan History' },
];

/* =====================================================
   MAIN AGENT TABS
===================================================== */

const MAIN_AGENT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'received-plans', label: 'Received Plans' },
  { id: 'plan-eval', label: 'Plan Evaluation' },
  { id: 'mistake-verify', label: 'Mistake Verification' },
  { id: 'final-plan', label: 'Final Plan' },
  { id: 'exec-history', label: 'Execution History' },
];

/* =====================================================
   INDIVIDUAL AGENT TAB CONTENT STRUCTURE
===================================================== */

const INDIVIDUAL_TAB_CONTENT = {
  overview: [
    {
      title: 'Agent Status & Overview',
      note: 'Live agent status, current execution state and latest update will appear here.',
      height: '110px',
    },
    {
      title: 'Current Selected Plan',
      note: 'The agent’s independently selected plan for its current order evaluation will appear here. This is a proposal, not the final production decision.',
      height: '130px',
    },
    {
      title: 'Latest Execution Summary',
      note: 'Latest execution result, associated order and simulation evaluation status will appear here.',
      height: '110px',
    },
  ],

  approach: [
    {
      title: 'Agent Decision Approach',
      note: 'The agent’s actual implemented approach, decision methodology and selection criteria will be displayed here.',
      height: '140px',
    },
    {
      title: 'Input Conditions Considered',
      note: 'Order requirements, machine-health conditions, queue workload, production constraints and other inputs considered by the agent will appear here.',
      height: '140px',
    },
    {
      title: 'Selected Production Approach',
      note: 'The agent’s proposed production approach, including its proposed Line A or Line B allocation, will appear here.',
      height: '130px',
    },
    {
      title: 'Predicted Outcomes',
      note: 'The predictions associated with this agent’s selected plan will appear here.',
      height: '120px',
    },
  ],

  'mistake-verify': [
    {
      title: 'Mistakes & Previous Issues',
      note: 'Recorded mistakes, failures or previous issues associated with this agent will appear here.',
      height: '130px',
    },
    {
      title: 'Verification Records',
      note: 'Actual verification checks and their recorded results will appear here.',
      height: '130px',
    },
    {
      title: 'Verification History',
      note: 'Historical mistake-verification records and relevant feedback will appear here.',
      height: '120px',
    },
  ],

  'exec-history': [
    {
      title: 'Execution History',
      note: 'All recorded executions by this agent will appear here, including associated Order IDs and timestamps.',
      height: '150px',
    },
    {
      title: 'Simulation Evaluation Results',
      note: 'Results returned from the corresponding simulation evaluations will appear here, clearly associated with the relevant plan and run.',
      height: '140px',
    },
    {
      title: 'Execution Feedback',
      note: 'Recorded feedback, execution outcomes and revisions resulting from earlier attempts will appear here.',
      height: '120px',
    },
  ],

  'plan-history': [
    {
      title: 'Complete Selected Plan History',
      note: 'Every plan independently selected by this agent will be retained and listed here.',
      height: '150px',
    },
    {
      title: 'Plan Versions & Revisions',
      note: 'Previous plan versions, revisions, associated timestamps and the reason for each recorded change will appear here. Previous versions must not be overwritten.',
      height: '140px',
    },
    {
      title: 'Proposed Line Allocation',
      note: 'Historical proposed Line A and Line B allocations for individual orders will appear here.',
      height: '120px',
    },
    {
      title: 'Plan Evaluation Feedback',
      note: 'Corresponding simulation evaluation results and feedback for each selected plan will appear here.',
      height: '130px',
    },
  ],
};

/* =====================================================
   MAIN AGENT TAB CONTENT STRUCTURE
===================================================== */

const MAIN_AGENT_TAB_CONTENT = {
  overview: [
    {
      title: 'Main Agent Status',
      note: 'Live status and current orchestration activity will appear here.',
      height: '110px',
    },
    {
      title: 'Current Order Evaluation',
      note: 'The order currently being evaluated, its received proposals and evaluation progress will appear here.',
      height: '130px',
    },
    {
      title: 'Latest Final Decision',
      note: 'The latest final plan selected by the Main Agent and its associated Order ID will appear here.',
      height: '130px',
    },
  ],

  'received-plans': [
    {
      title: 'RL Agent — Received Proposal',
      note: 'The independently selected RL Agent plan, its version, proposed line allocation and associated order will appear here.',
      height: '140px',
    },
    {
      title: 'ML Agent — Received Proposal',
      note: 'The independently selected ML Agent plan, its version, proposed line allocation and associated order will appear here.',
      height: '140px',
    },
    {
      title: 'Rule-Based Agent — Received Proposal',
      note: 'The independently selected Rule-Based Agent plan, its version, proposed line allocation and associated order will appear here.',
      height: '140px',
    },
  ],

  'plan-eval': [
    {
      title: 'Simulation Evaluation Results',
      note: 'The simulation evaluation results corresponding to all three proposed plans will appear here.',
      height: '150px',
    },
    {
      title: 'Plan Comparison',
      note: 'The three plans will be compared using their simulation evaluation results under comparable input conditions.',
      height: '160px',
    },
    {
      title: 'Recorded Evaluation Reasoning',
      note: 'The Main Agent’s recorded comparison criteria, trade-offs and reasoning will appear here.',
      height: '150px',
    },
  ],

  'mistake-verify': [
    {
      title: 'Mistake Verification Records',
      note: 'Recorded verification checks performed by the Main Agent will appear here.',
      height: '140px',
    },
    {
      title: 'Issues & Alternative Plan Checks',
      note: 'Identified issues, verification outcomes and rejected-plan checks will appear here.',
      height: '140px',
    },
    {
      title: 'Verification History',
      note: 'Historical verification outcomes and associated orders will appear here.',
      height: '120px',
    },
  ],

  'final-plan': [
    {
      title: 'Selected Final Plan',
      note: 'The consolidated plan selected by the Main Agent for the associated order will appear here.',
      height: '160px',
    },
    {
      title: 'Why This Plan Was Selected',
      note: 'The Main Agent’s recorded justification for selecting this plan over the other two alternatives will appear here.',
      height: '150px',
    },
    {
      title: 'Rejected Alternatives',
      note: 'The alternative plans and the recorded reasons for not selecting them will appear here.',
      height: '140px',
    },
    {
      title: 'Line Allocation Reasoning',
      note: 'The reasons for assigning the order to Line A or Line B, including relevant machine health, workload, capacity, order requirements and alternative-line considerations, will appear here.',
      height: '150px',
    },
    {
      title: 'Instructions Issued',
      note: 'The final order-specific instructions sent to the proto replacement model will appear here.',
      height: '140px',
    },
  ],

  'exec-history': [
    {
      title: 'Main Agent Execution History',
      note: 'All recorded Main Agent executions, associated orders and timestamps will appear here.',
      height: '150px',
    },
    {
      title: 'Final Plan Execution Outcomes',
      note: 'Execution outcomes and feedback corresponding to the Main Agent’s selected plans will appear here.',
      height: '140px',
    },
    {
      title: 'Plan Revisions & Re-evaluations',
      note: 'Historical plan changes, re-evaluations and the recorded reasons for those changes will appear here.',
      height: '140px',
    },
  ],
};

/* =====================================================
   AI AGENTS PAGE
===================================================== */

/**
 * AIAgentsPage — Section D
 *
 * Three individual agents independently select their own plans.
 * Main Agent evaluates the three proposals and makes the final selection.
 *
 * The Dashboard displays recorded agent information only.
 * It does not generate, predict or fabricate agent decisions.
 */
function AIAgentsPage({ agentStatuses = {} }) {
  const [openAgent, setOpenAgent] = useState(null);
  const [modalTab, setModalTab] = useState('overview');

  const handleOpenAgent = (agent) => {
    setOpenAgent(agent);
    setModalTab('overview');
  };

  const handleCloseAgent = () => {
    setOpenAgent(null);
    setModalTab('overview');
  };

  const isMain = openAgent?.id === 'main-agent';

  const tabs = isMain
    ? MAIN_AGENT_TABS
    : INDIVIDUAL_AGENT_TABS;

  const content = isMain
    ? MAIN_AGENT_TAB_CONTENT
    : INDIVIDUAL_TAB_CONTENT;

  const currentTabSections = content[modalTab] || [];

  return (
    <div className="db-page">
      <PageHeader
        eyebrow="Agents"
        title="AI Agents"
        description="Monitor individual agent activity, inspect independently selected plans and review the Main Agent’s final decisions."
      />

      {/* =================================================
          INDIVIDUAL AGENT CARDS
      ================================================= */}

      <div className="db-agent-row">
        {INDIVIDUAL_AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status={agentStatuses[agent.id]}
            onClick={() => handleOpenAgent(agent)}
          />
        ))}
      </div>

      {/* =================================================
          MAIN AGENT CARD
      ================================================= */}

      <div className="db-agent-main-row">
        <AgentCard
          agent={MAIN_AGENT}
          status={agentStatuses[MAIN_AGENT.id]}
          onClick={() => handleOpenAgent(MAIN_AGENT)}
          isMain
        />
      </div>

      {/* =================================================
          AGENT DETAIL POPUP
      ================================================= */}

      <Modal
        open={openAgent !== null}
        onClose={handleCloseAgent}
        title={openAgent?.label ?? ''}
        wide
      >
        {openAgent && (
          <div className="db-agent-modal">

            <div className="db-agent-modal__intro">
              <p className="section-description">
                {isMain
                  ? 'The Main Agent receives and evaluates the three individual agent proposals and is responsible for selecting the final consolidated plan.'
                  : `${openAgent.label} independently selects its own proposed plans. Final production decisions are made by the Main Agent.`}
              </p>
            </div>

            <InternalTabs
              tabs={tabs}
              activeTab={modalTab}
              onTabChange={setModalTab}
            />

            <div className="db-agent-modal__body">

              <div className="section-heading">
                <h2 className="section-title">
                  {openAgent.label} —{' '}
                  {tabs.find((tab) => tab.id === modalTab)?.label}
                </h2>
              </div>

              {currentTabSections.map((section, index) => (
                <section
                  className="db-agent-detail-section"
                  key={`${modalTab}-${index}`}
                  style={{ marginBottom: '18px' }}
                >
                  <PlaceholderSection
                    title={section.title}
                    note={section.note}
                    height={section.height}
                  />
                </section>
              ))}

            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* =====================================================
   AGENT CARD
===================================================== */

/**
 * AgentCard
 *
 * Displays the agent name, description and actual status
 * when the application supplies one.
 *
 * No sample agent status is fabricated.
 */
function AgentCard({
  agent,
  status,
  onClick,
  isMain = false,
}) {
  const hasStatus =
    status !== null &&
    status !== undefined &&
    String(status).trim() !== '';

  const formattedStatus = hasStatus
    ? String(status).replaceAll('_', ' ')
    : 'Awaiting live status';

  return (
    <button
      type="button"
      className={`db-agent-card${isMain ? ' db-agent-card--main' : ''}`}
      onClick={onClick}
      aria-label={`Open ${agent.label} details`}
    >
      <div className="db-agent-card__icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          width="26"
          height="26"
        >
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
          />

          <rect
            x="9"
            y="9"
            width="6"
            height="6"
            stroke="currentColor"
            strokeWidth="1.8"
          />

          <path
            d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="db-agent-card__info">
        <span className="db-agent-card__name">
          {agent.label}
        </span>

        <span className="db-agent-card__desc">
          {agent.description}
        </span>
      </div>

      <div className="db-agent-card__status">
        <span className="db-placeholder__note">
          {formattedStatus}
        </span>
      </div>

      <span className="db-agent-card__cta" aria-hidden="true">
        View Details →
      </span>
    </button>
  );
}

export default AIAgentsPage;