import os
import pandas as pd
from typing import Optional

ALLOWED_EXTENSIONS = {".csv", ".tsv", ".xlsx", ".xls"}

class DatasetLoader:
    """
    Secure and resilient dataset loader.
    """

    @staticmethod
    def sanitize_path(file_path: str) -> str:
        """
        Prevents directory traversal and normalizes path.
        """
        normalized = os.path.normpath(file_path)
        # Check forbidden path patterns
        if ".." in normalized.split(os.sep):
            raise ValueError("Path traversal sequence detected.")
        return normalized

    @classmethod
    def load_dataset(cls, file_path: str, nrows: Optional[int] = None) -> pd.DataFrame:
        """
        Loads CSV or Excel dataset into a pandas DataFrame.
        """
        safe_path = cls.sanitize_path(file_path)
        
        if not os.path.exists(safe_path):
            raise FileNotFoundError(f"Dataset file not found at: {safe_path}")

        _, ext = os.path.splitext(safe_path)
        ext = ext.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported file format '{ext}'. Allowed: {ALLOWED_EXTENSIONS}")

        na_values = ["", " ", "NA", "N/A", "null", "NULL", "None", "nan", "NaN", "?", "-"]

        try:
            if ext in [".csv", ".tsv"]:
                sep = "\t" if ext == ".tsv" else ","
                try:
                    df = pd.read_csv(safe_path, sep=sep, nrows=nrows, na_values=na_values, encoding="utf-8")
                except UnicodeDecodeError:
                    df = pd.read_csv(safe_path, sep=sep, nrows=nrows, na_values=na_values, encoding="latin-1")
            elif ext in [".xlsx", ".xls"]:
                df = pd.read_excel(safe_path, nrows=nrows, na_values=na_values)
            else:
                raise ValueError(f"Unsupported extension: {ext}")
            
            # Clean column names (strip whitespace)
            df.columns = [str(col).strip() for col in df.columns]
            return df
        except Exception as e:
            raise RuntimeError(f"Failed to parse dataset '{file_path}': {str(e)}")

    @classmethod
    def save_dataset(cls, df: pd.DataFrame, target_path: str) -> str:
        safe_path = cls.sanitize_path(target_path)
        os.makedirs(os.path.dirname(safe_path) or ".", exist_ok=True)
        _, ext = os.path.splitext(safe_path)
        if ext.lower() in [".xlsx", ".xls"]:
            df.to_excel(safe_path, index=False)
        else:
            df.to_csv(safe_path, index=False)
        return safe_path
