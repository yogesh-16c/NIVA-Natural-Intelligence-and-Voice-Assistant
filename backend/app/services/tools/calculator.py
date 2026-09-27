import ast
import operator
from typing import Any


class CalculatorToolService:
    _ALLOWED_BIN_OPS = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.FloorDiv: operator.floordiv,
        ast.Mod: operator.mod,
        ast.Pow: operator.pow,
    }

    _ALLOWED_UNARY_OPS = {
        ast.UAdd: operator.pos,
        ast.USub: operator.neg,
    }

    @staticmethod
    def _safe_eval(node: ast.AST) -> Any:
        if isinstance(node, ast.Constant) and isinstance(
            node.value,
            (int, float)
        ):
            return node.value

        if isinstance(node, ast.BinOp):
            left = CalculatorToolService._safe_eval(
                node.left
            )

            right = CalculatorToolService._safe_eval(
                node.right
            )

            op = CalculatorToolService._ALLOWED_BIN_OPS.get(
                type(node.op)
            )

            if op is None:
                raise ValueError(
                    "Unsupported binary operator."
                )

            # Prevent extremely large exponentiation.
            if isinstance(node.op, ast.Pow):
                if abs(right) > 100:
                    raise ValueError(
                        "Exponent is too large."
                    )

            return op(left, right)

        if isinstance(node, ast.UnaryOp):
            operand = CalculatorToolService._safe_eval(
                node.operand
            )

            op = CalculatorToolService._ALLOWED_UNARY_OPS.get(
                type(node.op)
            )

            if op is None:
                raise ValueError(
                    "Unsupported unary operator."
                )

            return op(operand)

        if isinstance(node, ast.Expression):
            return CalculatorToolService._safe_eval(
                node.body
            )

        raise ValueError(
            "Unsupported expression."
        )

    @staticmethod
    def evaluate(expression: str) -> float:
        if not expression or not expression.strip():
            raise ValueError(
                "Expression is required."
            )

        expression = expression.strip()

        # Prevent unnecessarily huge inputs.
        if len(expression) > 200:
            raise ValueError(
                "Expression is too long."
            )

        tree = ast.parse(
            expression,
            mode="eval"
        )

        result = CalculatorToolService._safe_eval(
            tree
        )

        if isinstance(result, bool):
            raise ValueError(
                "Boolean values are not valid calculator results."
            )

        return float(result)