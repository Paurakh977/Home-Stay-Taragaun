
import contextlib
from fastapi import FastAPI
import os
from src.officer import officer_mcp
from src.homestay import homestay_mcp
from dotenv import load_dotenv

load_dotenv()
# Prefer HOST/PORT for alignment with common envs; fall back to MCP_HOST/MCP_PORT for backward compatibility
HOST = os.getenv("HOST") or os.getenv("MCP_HOST", "0.0.0.0")
PORT = int(os.getenv("PORT") or os.getenv("MCP_PORT", "8080"))


# Create a combined lifespan to manage both session managers
@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    async with contextlib.AsyncExitStack() as stack:
        await stack.enter_async_context(officer_mcp.session_manager.run())
        await stack.enter_async_context(homestay_mcp.session_manager.run())
        yield

app = FastAPI(lifespan=lifespan)
app.mount("/officer", officer_mcp.streamable_http_app())
app.mount("/homestay", homestay_mcp.streamable_http_app())



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
