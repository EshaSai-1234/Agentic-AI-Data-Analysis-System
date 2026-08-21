import uuid
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor, IsolationForest
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.cluster import KMeans
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix,
    roc_curve, auc, r2_score, mean_squared_error, mean_absolute_error, silhouette_score
)
from models.schemas import MLTrainResponse, MLPredictResponse

# Model Cache for instant inference
MODEL_REGISTRY: Dict[str, Dict[str, Any]] = {}

class MLAgent:
    """
    AutoML and Predictive Analytics Agent:
    - Classification (Gradient Boosting, Random Forest, Logistic Regression)
    - Regression (Gradient Boosting, Random Forest, Ridge)
    - Clustering (K-Means)
    - Anomaly Detection (Isolation Forest)
    - Model evaluation metrics, cross-validation, confusion matrix, ROC curve, feature importances
    - Real-time prediction simulator
    """

    @classmethod
    def train_model(
        cls,
        df: pd.DataFrame,
        target_column: str,
        task_type: str = "auto",
        feature_columns: Optional[List[str]] = None,
        algorithm: str = "auto",
        test_size: float = 0.2
    ) -> MLTrainResponse:
        model_id = str(uuid.uuid4())[:8]

        # 1. Determine Task Type
        if task_type == "auto":
            if target_column not in df.columns:
                task_type = "clustering" if not target_column else "classification"
            else:
                target_series = df[target_column].dropna()
                distinct_vals = target_series.nunique()
                if distinct_vals <= 10 or not pd.api.types.is_numeric_dtype(target_series):
                    task_type = "classification"
                else:
                    task_type = "regression"

        # 2. Select Features
        if not feature_columns:
            feature_columns = [col for col in df.columns if col != target_column]

        # Prepare X and y
        X_df = df[feature_columns].copy()
        
        # Preprocessing: encode categoricals and impute missing values with median/mode
        label_encoders = {}
        for col in X_df.columns:
            if not pd.api.types.is_numeric_dtype(X_df[col]):
                le = LabelEncoder()
                X_df[col] = le.fit_transform(X_df[col].astype(str).fillna("missing"))
                label_encoders[col] = le
            else:
                med_val = X_df[col].dropna().median() if not X_df[col].dropna().empty else 0.0
                X_df[col] = pd.to_numeric(X_df[col], errors="coerce").fillna(med_val)

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_df)

        metrics = {}
        conf_mat = None
        roc_data = None
        feat_importances = []
        model_obj = None
        target_encoder = None
        insights = []

        # 3. Model Training & Evaluation
        if task_type == "classification":
            y_series = df[target_column].astype(str).fillna("unknown")
            target_encoder = LabelEncoder()
            y = target_encoder.fit_transform(y_series)
            classes = [str(c) for c in target_encoder.classes_]

            X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=test_size, random_state=42)

            if algorithm in ["gradient_boosting", "gbm", "boost"]:
                model_obj = GradientBoostingClassifier(n_estimators=150, learning_rate=0.1, max_depth=4, random_state=42)
            elif algorithm in ["logistic_regression", "linear"]:
                model_obj = LogisticRegression(max_iter=1000, random_state=42)
            else:
                # Default high-accuracy ensemble
                model_obj = GradientBoostingClassifier(n_estimators=100, random_state=42)

            model_obj.fit(X_train, y_train)
            y_pred = model_obj.predict(X_test)
            
            acc = float(accuracy_score(y_test, y_pred))
            prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
            rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
            f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

            # 5-fold cross-validation score
            cv_folds = min(5, len(X_train))
            cv_scores = cross_val_score(model_obj, X_scaled, y, cv=cv_folds, scoring="accuracy") if cv_folds >= 2 else [acc]
            cv_acc = float(np.mean(cv_scores))

            metrics = {
                "accuracy": round(acc, 4),
                "cv_accuracy": round(cv_acc, 4),
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "classes": classes,
                "train_samples": len(X_train),
                "test_samples": len(X_test)
            }

            cm = confusion_matrix(y_test, y_pred)
            conf_mat = cm.tolist()

            # ROC curve for binary classification
            if len(classes) == 2 and hasattr(model_obj, "predict_proba"):
                y_proba = model_obj.predict_proba(X_test)[:, 1]
                fpr, tpr, _ = roc_curve(y_test, y_proba)
                roc_auc = auc(fpr, tpr)
                metrics["roc_auc"] = round(float(roc_auc), 4)
                roc_data = {
                    "fpr": [round(float(x), 4) for x in fpr],
                    "tpr": [round(float(y), 4) for y in tpr]
                }

            # Feature importance
            if hasattr(model_obj, "feature_importances_"):
                for col, imp in zip(feature_columns, model_obj.feature_importances_):
                    feat_importances.append({"feature": col, "importance": round(float(imp), 4)})
            elif hasattr(model_obj, "coef_"):
                for col, imp in zip(feature_columns, np.abs(model_obj.coef_[0])):
                    feat_importances.append({"feature": col, "importance": round(float(imp), 4)})

            insights.append(f"Classification model achieved {round(acc * 100, 1)}% hold-out accuracy (5-fold CV: {round(cv_acc * 100, 1)}%) and F1 score of {round(f1, 3)}.")

        elif task_type == "regression":
            y = pd.to_numeric(df[target_column], errors="coerce").fillna(0).values
            X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=test_size, random_state=42)

            if algorithm in ["gradient_boosting", "gbm", "boost"]:
                model_obj = GradientBoostingRegressor(n_estimators=150, learning_rate=0.1, max_depth=4, random_state=42)
            elif algorithm in ["linear_regression", "linear", "ridge"]:
                model_obj = Ridge(random_state=42)
            else:
                model_obj = GradientBoostingRegressor(n_estimators=100, random_state=42)

            model_obj.fit(X_train, y_train)
            y_pred = model_obj.predict(X_test)

            r2_raw = r2_score(y_test, y_pred) if len(y_test) >= 2 else 0.0
            r2 = float(r2_raw) if not np.isnan(r2_raw) else 0.0
            r2_clipped = max(0.0, r2)
            mse = float(mean_squared_error(y_test, y_pred))
            rmse = float(np.sqrt(mse))
            mae = float(mean_absolute_error(y_test, y_pred))

            cv_folds = min(5, len(X_train))
            cv_r2_scores = cross_val_score(model_obj, X_scaled, y, cv=cv_folds, scoring="r2") if cv_folds >= 2 else [r2]
            cv_r2_raw = float(np.mean(cv_r2_scores))
            cv_r2 = cv_r2_raw if not np.isnan(cv_r2_raw) else 0.0

            metrics = {
                "r2_score": round(r2, 4),
                "cv_r2_score": round(cv_r2, 4),
                "rmse": round(rmse, 4),
                "mae": round(mae, 4),
                "mean_target_value": round(float(np.mean(y)), 2),
                "train_samples": len(X_train),
                "test_samples": len(X_test)
            }

            if hasattr(model_obj, "feature_importances_"):
                for col, imp in zip(feature_columns, model_obj.feature_importances_):
                    feat_importances.append({"feature": col, "importance": round(float(imp), 4)})
            elif hasattr(model_obj, "coef_"):
                for col, imp in zip(feature_columns, np.abs(model_obj.coef_)):
                    feat_importances.append({"feature": col, "importance": round(float(imp), 4)})

            insights.append(f"Regression model explains {round(r2_clipped * 100, 1)}% of target variance (R² = {round(r2, 3)}, 5-fold CV R² = {round(cv_r2, 3)}, RMSE = {round(rmse, 2)}).")

        elif task_type == "clustering":
            n_clusters = 3
            model_obj = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            cluster_labels = model_obj.fit_predict(X_scaled)
            sil = float(silhouette_score(X_scaled, cluster_labels)) if len(X_scaled) > n_clusters else 0.0

            metrics = {
                "n_clusters": n_clusters,
                "silhouette_score": round(sil, 4),
                "inertia": round(float(model_obj.inertia_), 2),
                "cluster_counts": {f"Cluster {i}": int(np.sum(cluster_labels == i)) for i in range(n_clusters)}
            }
            insights.append(f"K-Means grouped the data into {n_clusters} distinct clusters with Silhouette Score of {round(sil, 3)}.")

        elif task_type == "anomaly_detection":
            model_obj = IsolationForest(contamination=0.05, random_state=42)
            preds = model_obj.fit_predict(X_scaled)  # -1 for anomaly, 1 for normal
            anomaly_count = int(np.sum(preds == -1))

            metrics = {
                "anomaly_count": anomaly_count,
                "anomaly_percentage": round(anomaly_count / len(X_scaled) * 100, 2),
                "total_records": len(X_scaled)
            }
            insights.append(f"Isolation Forest identified {anomaly_count} anomalous data points ({metrics['anomaly_percentage']}% of dataset).")

        # Sort feature importances
        feat_importances.sort(key=lambda x: x["importance"], reverse=True)
        if feat_importances:
            top_feat = feat_importances[0]["feature"]
            insights.append(f"Primary predictive driver is '{top_feat}' (importance: {feat_importances[0]['importance']}).")

        # Register model for live predictions
        MODEL_REGISTRY[model_id] = {
            "model": model_obj,
            "scaler": scaler,
            "label_encoders": label_encoders,
            "target_encoder": target_encoder,
            "feature_columns": feature_columns,
            "task_type": task_type,
            "target_column": target_column
        }

        algo_name = type(model_obj).__name__ if model_obj else algorithm
        summary = f"Trained {algo_name} for {task_type}. Model ID: {model_id}."

        return MLTrainResponse(
            model_id=model_id,
            task_type=task_type,
            algorithm=algo_name,
            target_column=target_column,
            feature_columns=feature_columns,
            metrics=metrics,
            confusion_matrix=conf_mat,
            roc_curve=roc_data,
            feature_importance=feat_importances,
            model_summary=summary,
            insights=insights
        )

    @classmethod
    def predict(cls, model_id: str, input_data: Dict[str, Any]) -> MLPredictResponse:
        record = MODEL_REGISTRY.get(model_id)
        if not record:
            return MLPredictResponse(
                prediction=None,
                explanation=f"Model '{model_id}' not found in active session cache."
            )

        model = record["model"]
        scaler = record["scaler"]
        label_encoders = record["label_encoders"]
        target_encoder = record["target_encoder"]
        features = record["feature_columns"]
        task_type = record["task_type"]

        # Prepare single input row
        row = []
        for col in features:
            val = input_data.get(col, 0)
            if col in label_encoders:
                le = label_encoders[col]
                try:
                    val = le.transform([str(val)])[0]
                except ValueError:
                    val = 0
            else:
                try:
                    val = float(val)
                except (ValueError, TypeError):
                    val = 0.0
            row.append(val)

        X_in = np.array([row])
        X_scaled = scaler.transform(X_in)

        pred_val = model.predict(X_scaled)[0]
        probabilities = None

        if task_type == "classification":
            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(X_scaled)[0]
                classes = target_encoder.classes_ if target_encoder else [f"Class_{i}" for i in range(len(probs))]
                probabilities = {str(c): round(float(p), 4) for c, p in zip(classes, probs)}
            if target_encoder:
                pred_label = str(target_encoder.inverse_transform([pred_val])[0])
            else:
                pred_label = str(pred_val)
            explanation = f"Model predicts class '{pred_label}' for the provided inputs."
            return MLPredictResponse(prediction=pred_label, probabilities=probabilities, explanation=explanation)

        elif task_type == "regression":
            pred_float = round(float(pred_val), 2)
            explanation = f"Estimated value for '{record['target_column']}' is {pred_float}."
            return MLPredictResponse(prediction=pred_float, explanation=explanation)

        elif task_type == "clustering":
            cluster_name = f"Cluster {int(pred_val)}"
            explanation = f"Sample point is assigned to {cluster_name}."
            return MLPredictResponse(prediction=cluster_name, explanation=explanation)

        elif task_type == "anomaly_detection":
            is_anomaly = (pred_val == -1)
            explanation = "Record flagged as an outlier/anomaly." if is_anomaly else "Record is classified as normal."
            return MLPredictResponse(prediction="Anomaly" if is_anomaly else "Normal", explanation=explanation)

        return MLPredictResponse(prediction=str(pred_val), explanation="Prediction completed.")

ml_agent = MLAgent()
