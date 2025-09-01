
from google.adk.agents import Agent,SequentialAgent
from .filter_agent import filter_agent
from .refiner_agent import refiner_agent

homestay_filter_pipeline = SequentialAgent(
    sub_agents=[filter_agent, refiner_agent],
    name="homestay_filter_pipeline", 
    description="Pipeline to filter homestays based on user queries then after refining the results.",
)

