from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmRequest, LlmResponse
from typing import Optional



async def after_model_callback(
    callback_context: CallbackContext, llm_response: LlmResponse
) -> Optional[LlmResponse]:
    print("##" * 22)

    # Get user input text from callback_context if available
    user_input = getattr(callback_context, "user_input", None)
    if user_input is None:
        user_input = "<No input text available>"
    print(f"User input text: {user_input}")

    response_dump = llm_response.model_dump()
    print(f"LLM Response: response_dump={response_dump}")

    content = response_dump.get("content")
    if not content:
        print("No content in LLM response.")
        return llm_response

    parts = content.get("parts", [])
    if not parts:
        print("No parts in content.")
        return llm_response

    any_function_call_found = False

    for idx, part in enumerate(parts):
        function_call = part.get("function_call")
        function_response = part.get("function_response")
        text = part.get("text")

        print(f"\nPart #{idx + 1} Text: {text}")

        if function_call:
            any_function_call_found = True
            print(f"Function call made: {function_call.get('name', '<no name>')}")
            print(f"Function call args: {function_call.get('args', {})}")
        else:
            print("No function call in this part.")

        if function_response:
            print(f"Function response: {function_response}")
        else:
            print("No function response in this part.")

    if not any_function_call_found:
        print("\nNo function call found in any part of the response.")

    print("##" * 22)
    return llm_response

