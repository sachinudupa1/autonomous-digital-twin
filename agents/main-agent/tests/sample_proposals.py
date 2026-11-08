sample_proposals = [
    {
        "proposal_id": "RULE-PROP-001",
        "agent_id": "rule_based",
        "state_id": "STATE-001",
        "state_version": 1,
        "schedule": {
            "order_sequence": [
                "ORDER-001",
                "ORDER-002",
                "ORDER-003",
            ]
        },
    },

    {
        "proposal_id": "ML-PROP-001",
        "agent_id": "ml",
        "state_id": "STATE-001",
        "state_version": 1,
        "schedule": {
            "order_sequence": [
                "ORDER-002",
                "ORDER-001",
                "ORDER-003",
            ]
        },
    },

    {
        "proposal_id": "RL-PROP-001",
        "agent_id": "rl",
        "state_id": "STATE-001",
        "state_version": 1,
        "schedule": {
            "order_sequence": [
                "ORDER-003",
                "ORDER-002",
                "ORDER-001",
            ]
        },
    },
]