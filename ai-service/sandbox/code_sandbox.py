import ast
import math
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

# Forbidden AST node types and names to prevent code execution breaches
FORBIDDEN_NAMES = {
    "eval", "exec", "compile", "open", "input", "print", "exit", "quit",
    "__import__", "importlib", "os", "sys", "subprocess", "shutil", "posix",
    "socket", "ctypes", "pickle", "shelve", "builtins", "__builtins__",
    "globals", "locals", "vars", "dir", "getattr", "setattr", "delattr",
    "hasattr", "classmethod", "staticmethod", "type", "object", "super",
    "memoryview", "bytearray", "bytes", "format", "breakpoint"
}

FORBIDDEN_ATTRS = {
    "__class__", "__bases__", "__subclasses__", "__mro__", "__globals__",
    "__code__", "__closure__", "__func__", "__self__", "__module__",
    "__dict__", "__init__", "__new__", "__del__", "__getattribute__",
    "to_pickle", "to_sql", "to_hdf", "to_feather", "to_parquet", "read_pickle"
}

class SecurityVisitor(ast.NodeVisitor):
    def __init__(self):
        self.errors = []

    def visit_Import(self, node):
        self.errors.append("Explicit import statements are strictly forbidden in sandboxed queries.")
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        self.errors.append("Explicit import statements are strictly forbidden in sandboxed queries.")
        self.generic_visit(node)

    def visit_Name(self, node):
        if node.id in FORBIDDEN_NAMES:
            self.errors.append(f"Use of restricted identifier '{node.id}' is blocked.")
        self.generic_visit(node)

    def visit_Attribute(self, node):
        if node.attr in FORBIDDEN_ATTRS or node.attr.startswith("__"):
            self.errors.append(f"Access to sensitive attribute or dunder method '{node.attr}' is forbidden.")
        self.generic_visit(node)

    def visit_Call(self, node):
        # Inspect function call target
        if isinstance(node.func, ast.Name) and node.func.id in FORBIDDEN_NAMES:
            self.errors.append(f"Calling restricted function '{node.func.id}' is forbidden.")
        self.generic_visit(node)


class CodeSandbox:
    """
    Sandboxed Execution Engine for Data Analysis.
    Validates AST structure and executes strictly within an isolated dictionary environment.
    """

    @staticmethod
    def validate_code(code: str) -> Tuple[bool, list]:
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return False, [f"Syntax error in generated analysis code: {str(e)}"]

        visitor = SecurityVisitor()
        visitor.visit(tree)
        if visitor.errors:
            return False, visitor.errors
        return True, []

    @classmethod
    def execute_safe_query(cls, df: pd.DataFrame, code_snippet: str) -> Dict[str, Any]:
        """
        Executes a safe data transformation or aggregation snippet on a pandas DataFrame copy.
        Returns the result, execution summary, and status.
        """
        is_valid, errors = cls.validate_code(code_snippet)
        if not is_valid:
            return {
                "success": False,
                "error": f"Security validation failed: {'; '.join(errors)}",
                "result": None,
                "result_type": None
            }

        # Provide a strictly controlled namespace
        # We give a fresh copy of df so the original isn't mutated unintentionally
        df_local = df.copy()
        
        safe_globals = {
            "__builtins__": {
                "abs": abs,
                "round": round,
                "min": min,
                "max": max,
                "sum": sum,
                "len": len,
                "range": range,
                "enumerate": enumerate,
                "zip": zip,
                "int": int,
                "float": float,
                "str": str,
                "bool": bool,
                "list": list,
                "dict": dict,
                "set": set,
                "tuple": tuple,
            },
            "pd": pd,
            "np": np,
            "math": math,
        }

        safe_locals = {
            "df": df_local,
            "result": None
        }

        try:
            # Check if code is a single expression (e.g. `df.groupby('Region')['Revenue'].sum()`)
            # or a block with statements
            stripped = code_snippet.strip()
            
            # If it's an assignment or multiline, execute as exec; otherwise evaluate as eval or result = ...
            if "\n" in stripped or "=" in stripped:
                # If code doesn't assign to 'result', wrap the last line if possible or assign
                exec_code = stripped
                if not ("result =" in exec_code or "result=" in exec_code):
                    lines = exec_code.split("\n")
                    last_line = lines[-1].strip()
                    if not last_line.startswith(("import", "for", "while", "if", "def", "class", "with")):
                        lines[-1] = f"result = {last_line}"
                        exec_code = "\n".join(lines)
                
                exec(exec_code, safe_globals, safe_locals)
                raw_result = safe_locals.get("result")
            else:
                # Direct expression
                raw_result = eval(stripped, safe_globals, safe_locals)

            # Format the output cleanly
            formatted_data, result_type = cls._format_result(raw_result)
            return {
                "success": True,
                "error": None,
                "raw_result": raw_result,
                "formatted_data": formatted_data,
                "result_type": result_type
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Execution error: {type(e).__name__}: {str(e)}",
                "result": None,
                "result_type": None
            }

    @staticmethod
    def _format_result(raw_result: Any) -> Tuple[Any, str]:
        if raw_result is None:
            return None, "none"
        if isinstance(raw_result, pd.DataFrame):
            # Limit rows to prevent memory explosion
            limited_df = raw_result.head(1000).replace({np.nan: None})
            return limited_df.to_dict(orient="records"), "dataframe"
        elif isinstance(raw_result, pd.Series):
            df_from_series = raw_result.reset_index()
            # If Series has name, use it, else default
            if df_from_series.columns[-1] == 0:
                df_from_series.rename(columns={0: "value"}, inplace=True)
            limited = df_from_series.head(1000).replace({np.nan: None})
            return limited.to_dict(orient="records"), "series"
        elif isinstance(raw_result, (np.integer, int)):
            return int(raw_result), "scalar_int"
        elif isinstance(raw_result, (np.floating, float)):
            if math.isnan(raw_result) or math.isinf(raw_result):
                return None, "scalar_float"
            return round(float(raw_result), 4), "scalar_float"
        elif isinstance(raw_result, (list, tuple)):
            return list(raw_result)[:500], "list"
        elif isinstance(raw_result, dict):
            return {str(k): v for k, v in raw_result.items()}, "dict"
        else:
            return str(raw_result), "string"
