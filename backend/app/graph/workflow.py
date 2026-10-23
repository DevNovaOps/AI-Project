from langgraph.graph import END, START, StateGraph

from app.agents.code_analysis import code_analysis_node
from app.agents.diagnosis import diagnosis_node
from app.agents.fix_and_test import fix_and_test_node
from app.agents.planner import planner_node
from app.agents.validation_reporting import final_report_node, validation_node
from app.graph.routing import should_retry_or_finish
from app.graph.state import WorkflowState


def create_workflow_graph():
    """
    Constructs the 5-Agent stateful LangGraph workflow for AutonomusAI:
    START -> Planner -> Code Analysis -> Diagnosis -> Fix & Test -> Validation
    Conditional:
      Validation passed or retries exhausted -> Final Report -> END
      Validation failed and retries remain -> Diagnosis
    """
    workflow = StateGraph(WorkflowState)

    # Register Agent Nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("code_analysis", code_analysis_node)
    workflow.add_node("diagnosis", diagnosis_node)
    workflow.add_node("fix_and_test", fix_and_test_node)
    workflow.add_node("validation", validation_node)
    workflow.add_node("final_report", final_report_node)

    # Linear Transitions
    workflow.add_edge(START, "planner")
    workflow.add_edge("planner", "code_analysis")
    workflow.add_edge("code_analysis", "diagnosis")
    workflow.add_edge("diagnosis", "fix_and_test")
    workflow.add_edge("fix_and_test", "validation")

    # Conditional Routing on Validation Outcome
    workflow.add_conditional_edges(
        "validation",
        should_retry_or_finish,
        {
            "diagnosis": "diagnosis",
            "final_report": "final_report",
        },
    )

    workflow.add_edge("final_report", END)

    return workflow.compile()


autonomous_workflow = create_workflow_graph()
