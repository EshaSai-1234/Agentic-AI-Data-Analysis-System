import pytest
import pandas as pd
from sandbox.code_sandbox import CodeSandbox

def test_safe_pandas_execution():
    df = pd.DataFrame({
        "Region": ["North", "South", "North", "South"],
        "Sales": [100, 200, 150, 250]
    })
    
    code = "df.groupby('Region')['Sales'].sum().reset_index()"
    res = CodeSandbox.execute_safe_query(df, code)
    
    assert res["success"] is True
    assert res["error"] is None
    assert len(res["formatted_data"]) == 2

def test_blocked_import():
    df = pd.DataFrame({"A": [1, 2, 3]})
    code = "import os; os.system('echo hacked')"
    res = CodeSandbox.execute_safe_query(df, code)
    assert res["success"] is False
    assert "forbidden" in res["error"].lower() or "blocked" in res["error"].lower() or "validation failed" in res["error"].lower()

def test_blocked_eval_and_dunder():
    df = pd.DataFrame({"A": [1, 2, 3]})
    code = "df.__class__.__bases__[0].__subclasses__()"
    res = CodeSandbox.execute_safe_query(df, code)
    assert res["success"] is False
    assert "forbidden" in res["error"].lower() or "blocked" in res["error"].lower() or "validation failed" in res["error"].lower()

def test_blocked_open():
    df = pd.DataFrame({"A": [1, 2, 3]})
    code = "open('/etc/passwd', 'r').read()"
    res = CodeSandbox.execute_safe_query(df, code)
    assert res["success"] is False
