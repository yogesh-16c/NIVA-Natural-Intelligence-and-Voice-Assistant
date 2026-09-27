import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.api import ToolExecutionRequest, ToolExecutionResponse
from app.services.tools.browser import BrowserToolService
from app.services.tools.calculator import CalculatorToolService
from app.services.tools.web_search import WebSearchToolService
from app.services.auth import get_current_user
logger = logging.getLogger("niva.api")
router = APIRouter(tags=["tools"])


@router.post("/tools/execute", response_model=ToolExecutionResponse)
async def execute_tool(
    payload: ToolExecutionRequest,
    current_user: dict = Depends(get_current_user),
) -> ToolExecutionResponse:
    tool_name = payload.tool

    try:
        if tool_name == "calculator":
            result = CalculatorToolService.evaluate(payload.arguments.get("expression", ""))
            return ToolExecutionResponse(success=True, tool=tool_name, result={"value": result})

        if tool_name == "current_time":
            from datetime import datetime, timezone

            return ToolExecutionResponse(
                success=True,
                tool=tool_name,
                result={"timestamp": datetime.now(timezone.utc).isoformat()},
            )

        if tool_name == "open_website":
            url = payload.arguments.get("url")
            allowed = BrowserToolService.validate_url(url)
            return ToolExecutionResponse(success=allowed["allowed"], tool=tool_name, result=allowed)

        if tool_name == "web_search":
            query = payload.arguments.get("query")
            result = WebSearchToolService.search(query)
            return ToolExecutionResponse(success=True, tool=tool_name, result=result)

        if tool_name == "youtube_search":
            query = payload.arguments.get("query")
            result = WebSearchToolService.youtube_search(query)
            return ToolExecutionResponse(success=True, tool=tool_name, result=result)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "invalid_tool_arguments",
                "message": str(exc),
            },
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "code": "unsupported_tool",
            "message": f"Tool '{tool_name}' is not supported in the current backend phase.",
        },
    )
