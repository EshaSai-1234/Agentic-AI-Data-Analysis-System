import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

class VisualizationAgent:
    """
    Agent for generating interactive, production-grade Plotly chart configurations.
    """

    @classmethod
    def generate_chart_config(
        cls,
        df: pd.DataFrame,
        chart_type: str,
        x_col: Optional[str] = None,
        y_col: Optional[str] = None,
        color_col: Optional[str] = None,
        title: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates Plotly data + layout JSON structure.
        """
        chart_type = (chart_type or "bar").lower().strip()
        clean_df = df.head(500).copy()

        cols = list(clean_df.columns)
        if not cols:
            return {"data": [], "layout": {"title": "Empty Dataset"}}

        if not x_col and cols:
            x_col = cols[0]
        if not y_col and len(cols) > 1:
            y_col = cols[1]
        elif not y_col:
            y_col = x_col

        default_theme_layout = {
            "template": "plotly_white",
            "paper_bgcolor": "rgba(0,0,0,0)",
            "plot_bgcolor": "rgba(0,0,0,0)",
            "font": {"family": "Inter, sans-serif", "color": "#1e293b"},
            "margin": {"l": 50, "r": 30, "t": 60, "b": 50},
            "autosize": True,
            "hovermode": "closest"
        }

        palette = [
            "#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ec4899",
            "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6", "#a855f7"
        ]

        # 1. Column Chart (Vertical Bar / Column Visualization)
        if chart_type in ["column", "column_chart"]:
            traces = []
            if color_col and color_col in clean_df.columns:
                unique_grps = clean_df[color_col].unique()
                for i, grp_val in enumerate(unique_grps):
                    grp_df = clean_df[clean_df[color_col] == grp_val]
                    traces.append({
                        "type": "bar",
                        "x": grp_df[x_col].astype(str).tolist(),
                        "y": pd.to_numeric(grp_df[y_col], errors="coerce").fillna(0).tolist(),
                        "name": str(grp_val),
                        "marker": {"color": palette[i % len(palette)], "opacity": 0.9}
                    })
            else:
                y_series = pd.to_numeric(clean_df[y_col], errors="coerce").fillna(0)
                traces.append({
                    "type": "bar",
                    "x": clean_df[x_col].astype(str).tolist(),
                    "y": y_series.tolist(),
                    "name": y_col,
                    "text": [f"{v:,.2f}" for v in y_series],
                    "textposition": "auto",
                    "marker": {
                        "color": y_series.tolist(),
                        "colorscale": "Viridis",
                        "opacity": 0.9,
                        "line": {"width": 1, "color": "#4338ca"}
                    }
                })

            layout = {
                **default_theme_layout,
                "title": {"text": title or f"Column Breakdown: {y_col} by {x_col}"},
                "xaxis": {"title": x_col, "gridcolor": "#f1f5f9"},
                "yaxis": {"title": y_col, "gridcolor": "#f1f5f9"},
                "barmode": "group"
            }
            return {"data": traces, "layout": layout}

        # 2. Line Graph (Spline & Multi-Line Trend Analysis)
        elif chart_type in ["line", "line_graph", "area"]:
            traces = []
            is_area = chart_type == "area"
            if color_col and color_col in clean_df.columns:
                unique_grps = clean_df[color_col].unique()
                for i, grp_val in enumerate(unique_grps):
                    grp_df = clean_df[clean_df[color_col] == grp_val]
                    traces.append({
                        "type": "scatter",
                        "mode": "lines+markers",
                        "x": grp_df[x_col].tolist(),
                        "y": pd.to_numeric(grp_df[y_col], errors="coerce").fillna(0).tolist(),
                        "name": str(grp_val),
                        "line": {"shape": "spline", "smoothing": 1.2, "width": 3, "color": palette[i % len(palette)]},
                        "fill": "tozeroy" if is_area else "none"
                    })
            else:
                y_series = pd.to_numeric(clean_df[y_col], errors="coerce").fillna(0)
                traces.append({
                    "type": "scatter",
                    "mode": "lines+markers",
                    "x": clean_df[x_col].tolist(),
                    "y": y_series.tolist(),
                    "name": y_col,
                    "line": {"color": "#6366f1", "shape": "spline", "smoothing": 1.2, "width": 3.5},
                    "marker": {"size": 7, "color": "#4f46e5", "symbol": "circle"},
                    "fill": "tozeroy" if is_area else "none",
                    "fillcolor": "rgba(99, 102, 241, 0.15)" if is_area else None
                })

            layout = {
                **default_theme_layout,
                "title": {"text": title or f"Line Graph Analysis: {y_col} over {x_col}"},
                "xaxis": {"title": x_col, "gridcolor": "#f1f5f9"},
                "yaxis": {"title": y_col, "gridcolor": "#f1f5f9"}
            }
            return {"data": traces, "layout": layout}

        # 3. Pie Chart & Donut Chart
        elif chart_type in ["pie", "pie_chart", "donut"]:
            labels = clean_df[x_col].astype(str).tolist()
            values = pd.to_numeric(clean_df[y_col], errors="coerce").fillna(1).tolist()
            
            hole_size = 0.45 if chart_type == "donut" or "donut" in str(title).lower() else 0.35
            traces = [{
                "type": "pie",
                "labels": labels,
                "values": values,
                "hole": hole_size,
                "textinfo": "percent+label",
                "insidetextorientation": "radial",
                "hoverinfo": "label+percent+value",
                "marker": {
                    "colors": palette[:len(labels)],
                    "line": {"color": "#ffffff", "width": 2}
                }
            }]
            layout = {
                **default_theme_layout,
                "title": {"text": title or f"Proportional Share: {y_col} by {x_col}"},
                "showlegend": True,
                "legend": {"orientation": "h", "y": -0.15}
            }
            return {"data": traces, "layout": layout}

        # 4. Maps (Geographic Scattergeo / Map / Choropleth)
        elif chart_type in ["map", "scattergeo", "choropleth", "geo"]:
            # Auto-detect latitude & longitude
            lat_col, lon_col = None, None
            for c in cols:
                cl = c.lower()
                if not lat_col and any(k in cl for k in ["lat", "latitude", "y_coord"]):
                    lat_col = c
                if not lon_col and any(k in cl for k in ["lon", "lng", "longitude", "x_coord"]):
                    lon_col = c

            if lat_col and lon_col:
                lat_vals = pd.to_numeric(clean_df[lat_col], errors="coerce").tolist()
                lon_vals = pd.to_numeric(clean_df[lon_col], errors="coerce").tolist()
                hover_text = clean_df[x_col].astype(str).tolist() if x_col else [f"Point {i+1}" for i in range(len(clean_df))]
                marker_size = pd.to_numeric(clean_df[y_col], errors="coerce").fillna(10).tolist() if y_col and y_col != x_col else 10

                traces = [{
                    "type": "scattergeo",
                    "mode": "markers",
                    "lat": lat_vals,
                    "lon": lon_vals,
                    "text": hover_text,
                    "marker": {
                        "size": 12,
                        "color": marker_size if isinstance(marker_size, list) else 12,
                        "colorscale": "Viridis",
                        "reversescale": False,
                        "colorbar": {"title": y_col if y_col else "Value", "len": 0.8},
                        "line": {"width": 1.5, "color": "#ffffff"}
                    }
                }]
                layout = {
                    **default_theme_layout,
                    "title": {"text": title or f"Geographic Map Analysis ({lat_col}, {lon_col})"},
                    "geo": {
                        "scope": "world",
                        "showland": True,
                        "landcolor": "#f8fafc",
                        "countrycolor": "#94a3b8",
                        "showocean": True,
                        "oceancolor": "#e0f2fe",
                        "showlakes": True,
                        "lakecolor": "#e0f2fe",
                        "subunitcolor": "#cbd5e1"
                    }
                }
                return {"data": traces, "layout": layout}

            else:
                loc_col = x_col
                values = pd.to_numeric(clean_df[y_col], errors="coerce").fillna(0).tolist()
                traces = [{
                    "type": "choropleth",
                    "locations": clean_df[loc_col].astype(str).tolist(),
                    "locationmode": "country names",
                    "z": values,
                    "colorscale": "Viridis",
                    "colorbar": {"title": y_col}
                }]
                layout = {
                    **default_theme_layout,
                    "title": {"text": title or f"Geographic Regional Distribution: {y_col} by {loc_col}"},
                    "geo": {
                        "showframe": False,
                        "showcoastlines": True,
                        "coastlinecolor": "#94a3b8",
                        "showland": True,
                        "landcolor": "#f8fafc",
                        "showocean": True,
                        "oceancolor": "#e0f2fe",
                    }
                }
                return {"data": traces, "layout": layout}

        # 5. Scatter Plot
        elif chart_type == "scatter":
            x_vals = clean_df[x_col].tolist()
            y_vals = clean_df[y_col].tolist()
            
            trace = {
                "type": "scatter",
                "mode": "markers",
                "x": x_vals,
                "y": y_vals,
                "name": f"{y_col} vs {x_col}",
                "marker": {
                    "size": 9,
                    "color": "#3b82f6",
                    "opacity": 0.8,
                    "line": {"width": 1, "color": "#1d4ed8"}
                }
            }

            traces = [trace]
            try:
                valid_mask = ~clean_df[x_col].isna() & ~clean_df[y_col].isna()
                x_num = pd.to_numeric(clean_df.loc[valid_mask, x_col], errors="coerce").dropna()
                y_num = pd.to_numeric(clean_df.loc[x_num.index, y_col], errors="coerce").dropna()
                common_idx = x_num.index.intersection(y_num.index)
                if len(common_idx) >= 2:
                    slope, intercept = np.polyfit(x_num.loc[common_idx], y_num.loc[common_idx], 1)
                    sorted_x = np.sort(x_num.loc[common_idx])
                    trend_y = slope * sorted_x + intercept
                    traces.append({
                        "type": "scatter",
                        "mode": "lines",
                        "x": sorted_x.tolist(),
                        "y": trend_y.tolist(),
                        "name": f"Linear Trend (m={round(slope, 3)})",
                        "line": {"color": "#ef4444", "dash": "dash", "width": 2}
                    })
            except Exception:
                pass

            layout = {
                **default_theme_layout,
                "title": {"text": title or f"Scatter Analysis: {y_col} vs {x_col}"},
                "xaxis": {"title": x_col, "gridcolor": "#f1f5f9"},
                "yaxis": {"title": y_col, "gridcolor": "#f1f5f9"}
            }
            return {"data": traces, "layout": layout}

        # 6. Bar Chart
        elif chart_type == "bar":
            traces = [{
                "type": "bar",
                "x": clean_df[x_col].astype(str).tolist(),
                "y": pd.to_numeric(clean_df[y_col], errors="coerce").fillna(0).tolist(),
                "name": y_col,
                "marker": {
                    "color": "#3b82f6",
                    "opacity": 0.85,
                    "line": {"width": 1, "color": "#2563eb"}
                }
            }]
            layout = {
                **default_theme_layout,
                "title": {"text": title or f"{y_col} by {x_col}"},
                "xaxis": {"title": x_col, "gridcolor": "#f1f5f9"},
                "yaxis": {"title": y_col, "gridcolor": "#f1f5f9"}
            }
            return {"data": traces, "layout": layout}

        # 7. Box Plot
        elif chart_type == "box":
            traces = [{
                "type": "box",
                "x": clean_df[x_col].astype(str).tolist() if x_col and x_col != y_col else None,
                "y": pd.to_numeric(clean_df[y_col], errors="coerce").dropna().tolist(),
                "name": y_col,
                "boxpoints": "outliers",
                "marker": {"color": "#8b5cf6"}
            }]
            layout = {
                **default_theme_layout,
                "title": {"text": title or f"Box Plot & Quartile Spread: {y_col}"},
                "yaxis": {"title": y_col, "gridcolor": "#f1f5f9"}
            }
            return {"data": traces, "layout": layout}

        # 8. Histogram
        elif chart_type == "histogram":
            traces = [{
                "type": "histogram",
                "x": pd.to_numeric(clean_df[x_col], errors="coerce").dropna().tolist(),
                "name": x_col,
                "marker": {"color": "#06b6d4", "opacity": 0.8}
            }]
            layout = {
                **default_theme_layout,
                "title": {"text": title or f"Frequency Distribution: {x_col}"},
                "xaxis": {"title": x_col, "gridcolor": "#f1f5f9"},
                "yaxis": {"title": "Count", "gridcolor": "#f1f5f9"}
            }
            return {"data": traces, "layout": layout}

        # 9. Heatmap
        elif chart_type == "heatmap":
            numeric_df = clean_df.select_dtypes(include=[np.number])
            corr = numeric_df.corr().round(2).fillna(0)
            cols = list(corr.columns)
            z_vals = corr.values.tolist()

            traces = [{
                "type": "heatmap",
                "z": z_vals,
                "x": cols,
                "y": cols,
                "colorscale": "Blues",
                "zmin": -1,
                "zmax": 1,
                "hoverongaps": False
            }]
            layout = {
                **default_theme_layout,
                "title": {"text": title or "Correlation Heatmap"}
            }
            return {"data": traces, "layout": layout}

        # Fallback default bar
        return cls.generate_chart_config(df, "bar", x_col, y_col, color_col, title)

viz_agent = VisualizationAgent()
