import pandas as pd
import numpy as np
from typing import Dict, Any, List
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

class DataQualityAnalyzer:
    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.total_rows = len(df)
        self.total_cols = len(df.columns)
    
    def calculate_health_score(self) -> float:
        scores = []
        weights = []
        
        missing_pct = (self.df.isnull().sum().sum() / (self.total_rows * self.total_cols)) * 100
        missing_score = max(0, 100 - missing_pct * 2)
        scores.append(missing_score)
        weights.append(0.30)
        
        duplicate_pct = (self.df.duplicated().sum() / self.total_rows) * 100
        duplicate_score = max(0, 100 - duplicate_pct * 3)
        scores.append(duplicate_score)
        weights.append(0.25)
        
        type_issues = 0
        for col in self.df.columns:
            if self.df[col].dtype == 'object':
                try:
                    pd.to_numeric(self.df[col].dropna())
                    type_issues += 1
                except:
                    pass
        type_score = max(0, 100 - (type_issues / self.total_cols) * 100)
        scores.append(type_score)
        weights.append(0.20)
        
        imbalance_scores = []
        for col in self.df.select_dtypes(include=['object', 'category']).columns:
            if self.df[col].nunique() < 20: 
                value_counts = self.df[col].value_counts()
                if len(value_counts) > 1:
                    ratio = value_counts.max() / value_counts.min()
                    imbalance_scores.append(max(0, 100 - (ratio - 1) * 10))
        
        if imbalance_scores:
            scores.append(np.mean(imbalance_scores))
        else:
            scores.append(100)
        weights.append(0.15)
        
        outlier_count = 0
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            Q1 = self.df[col].quantile(0.25)
            Q3 = self.df[col].quantile(0.75)
            IQR = Q3 - Q1
            outliers = ((self.df[col] < (Q1 - 1.5 * IQR)) | (self.df[col] > (Q3 + 1.5 * IQR))).sum()
            outlier_count += outliers
        
        outlier_pct = (outlier_count / (self.total_rows * len(numeric_cols))) * 100 if len(numeric_cols) > 0 else 0
        outlier_score = max(0, 100 - outlier_pct * 2)
        scores.append(outlier_score)
        weights.append(0.10)
        
        health_score = sum(s * w for s, w in zip(scores, weights))
        return round(health_score, 2)
    
    def check_missing_values(self) -> Dict[str, Any]:
        missing_data = []
        total_missing = 0
        
        for col in self.df.columns:
            missing_count = self.df[col].isnull().sum()
            if missing_count > 0:
                missing_pct = (missing_count / self.total_rows) * 100
                missing_data.append({
                    "column": col,
                    "count": int(missing_count),
                    "percentage": round(missing_pct, 2)
                })
                total_missing += missing_count
        
        return {
            "total_missing": int(total_missing),
            "total_cells": self.total_rows * self.total_cols,
            "percentage": round((total_missing / (self.total_rows * self.total_cols)) * 100, 2),
            "columns_affected": len(missing_data),
            "details": sorted(missing_data, key=lambda x: x['percentage'], reverse=True)
        }
    
    def check_duplicates(self):
        import numpy as np
        import pandas as pd
        df_original = self.df.copy().reset_index(drop=True)
        id_cols = [c for c in df_original.columns if 'id' in c.lower()]
        df_clean = df_original.drop(columns=id_cols, errors='ignore').copy()
        for col in df_clean.select_dtypes(include=['object']).columns:
            df_clean[col] = (
                df_clean[col].astype(str)
                .str.strip()
                .str.lower()
                .replace({"nan": np.nan, "none": np.nan, "": np.nan})
                .fillna("__missing__"))

        df_clean = df_clean.reset_index(drop=True)
        df_original = df_original.reset_index(drop=True)

        duplicate_mask = df_clean.duplicated(keep=False)
        duplicate_count = int(df_clean.duplicated().sum())
        duplicate_pct = round((duplicate_count / len(df_clean)) * 100, 2)

        if len(duplicate_mask) == len(df_original):
            duplicate_rows = df_original.loc[duplicate_mask].copy()
        else:
            duplicate_rows = pd.DataFrame()  
        column_duplicates = []
        for col in df_original.columns:
            dup_count = df_original[col].duplicated().sum()
            if dup_count > 0:
                column_duplicates.append({
                    "column": col,"count": int(dup_count),"percentage": round((dup_count / len(df_original)) * 100, 2)})

        return {
            "full_row_duplicates": duplicate_count,
            "percentage": duplicate_pct,
            "duplicate_row_samples": duplicate_rows.to_dict(orient="records"),
            "column_duplicates": sorted(column_duplicates, key=lambda x: x['percentage'], reverse=True)}

    
    def check_data_types(self) -> Dict[str, Any]:
        type_analysis = []
        issues = []
        
        for col in self.df.columns:
            dtype = str(self.df[col].dtype)
            type_info = {
                "column": col,
                "current_type": dtype,
                "unique_values": int(self.df[col].nunique()),
                "null_count": int(self.df[col].isnull().sum())
            }
            
            if dtype == 'object':
                try:
                    pd.to_numeric(self.df[col].dropna())
                    issues.append({
                        "column": col,
                        "issue": "Numeric values stored as text",
                        "suggested_type": "numeric"
                    })
                except:
                    try:
                        pd.to_datetime(self.df[col].dropna())
                        issues.append({
                            "column": col,
                            "issue": "Date values stored as text",
                            "suggested_type": "datetime"
                        })
                    except:
                        pass
            
            type_analysis.append(type_info)
        
        return {
            "type_distribution": type_analysis,
            "type_issues": issues
        }
    
    def check_categorical_consistency(self) -> Dict[str, Any]:
        categorical_analysis = []
        
        for col in self.df.select_dtypes(include=['object', 'category']).columns:
            unique_count = self.df[col].nunique()
            
            if unique_count < 100:
                value_counts = self.df[col].value_counts()
                
                cleaned = self.df[col].str.strip().str.lower() if self.df[col].dtype == 'object' else self.df[col]
                cleaned_unique = cleaned.nunique()
                
                has_inconsistency = unique_count != cleaned_unique
                
                categorical_analysis.append({
                    "column": col,
                    "unique_values": int(unique_count),
                    "most_common": value_counts.head(5).to_dict(),
                    "has_inconsistency": has_inconsistency,
                    "inconsistency_type": "Case or whitespace variations" if has_inconsistency else None
                })
        
        return {
            "categorical_columns": len(categorical_analysis),
            "details": categorical_analysis[:10]
            }
    def check_date_formats(self) -> Dict[str, Any]:
        date_analysis = []
        date_like_keywords = ["date", "time", "timestamp", "dob", "day", "month", "year"]

        for col in self.df.columns:
            col_lower = col.lower()

            if any(keyword in col_lower for keyword in date_like_keywords):
                try:
                    parsed = pd.to_datetime(self.df[col], errors='coerce', infer_datetime_format=True)
                    null_after_parse = parsed.isnull().sum()
                    original_null = self.df[col].isnull().sum()

                    if null_after_parse > original_null:
                        date_analysis.append({
                            "column": col,
                            "status": "Invalid date formats detected",
                            "valid_dates": int(len(parsed) - null_after_parse),
                            "invalid_dates": int(null_after_parse - original_null),
                            "sample_values": self.df[col].dropna().head(3).tolist()
                        })
                    elif null_after_parse == original_null and null_after_parse < len(self.df):
                        date_analysis.append({
                            "column": col,
                            "status": "Valid date column",
                            "valid_dates": int(len(parsed) - null_after_parse),
                            "invalid_dates": 0,
                            "sample_values": self.df[col].dropna().head(3).tolist()
                        })
                except Exception:
                    continue

        return {
        "date_columns_found": len(date_analysis),
        "details": date_analysis
    }

    
    def check_class_imbalance(self) -> Dict[str, Any]:
        imbalance_analysis = []
        
        for col in self.df.select_dtypes(include=['object', 'category']).columns:
            unique_count = self.df[col].nunique()
            
            if 2 <= unique_count <= 20: 
                value_counts = self.df[col].value_counts()
                max_count = value_counts.max()
                min_count = value_counts.min()
                imbalance_ratio = max_count / min_count if min_count > 0 else float('inf')
                
                if imbalance_ratio > 2:
                    imbalance_analysis.append({
                        "column": col,
                        "unique_classes": int(unique_count),
                        "imbalance_ratio": round(imbalance_ratio, 2),
                        "most_common_class": str(value_counts.index[0]),
                        "most_common_count": int(max_count),
                        "least_common_class": str(value_counts.index[-1]),
                        "least_common_count": int(min_count),
                        "severity": "High" if imbalance_ratio > 10 else "Medium"
                    })
        
        return {
            "columns_with_imbalance": len(imbalance_analysis),
            "details": sorted(imbalance_analysis, key=lambda x: x['imbalance_ratio'], reverse=True)
        }
    
    def check_outliers(self) -> Dict[str, Any]:
        outlier_analysis = []
        
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            Q1 = self.df[col].quantile(0.25)
            Q3 = self.df[col].quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outliers = ((self.df[col] < lower_bound) | (self.df[col] > upper_bound)).sum()
            
            if outliers > 0:
                outlier_analysis.append({
                    "column": col,
                    "outlier_count": int(outliers),
                    "percentage": round((outliers / self.total_rows) * 100, 2),
                    "lower_bound": round(float(lower_bound), 2),
                    "upper_bound": round(float(upper_bound), 2),
                    "min_value": round(float(self.df[col].min()), 2),
                    "max_value": round(float(self.df[col].max()), 2)
                })
        
        return {
            "columns_with_outliers": len(outlier_analysis),
            "details": sorted(outlier_analysis, key=lambda x: x['percentage'], reverse=True)
        }
    
    def get_summary_statistics(self) -> Dict[str, Any]:
        numeric_summary = self.df.describe().to_dict()
        
        for col in numeric_summary:
            for stat in numeric_summary[col]:
                value = numeric_summary[col][stat]
                if isinstance(value, (np.integer, np.floating)):
                    numeric_summary[col][stat] = float(value)
        
        return {
            "total_rows": self.total_rows,
            "total_columns": self.total_cols,
            "numeric_columns": len(self.df.select_dtypes(include=[np.number]).columns),
            "categorical_columns": len(self.df.select_dtypes(include=['object', 'category']).columns),
            "numeric_summary": numeric_summary
        }
    
    def generate_full_report(self) -> Dict[str, Any]:
        return {
            "summary": self.get_summary_statistics(),
            "health_score": self.calculate_health_score(),
            "missing_values": self.check_missing_values(),
            "duplicates": self.check_duplicates(),
            "data_types": self.check_data_types(),
            "categorical_consistency": self.check_categorical_consistency(),
            "date_formats": self.check_date_formats(),
            "class_imbalance": self.check_class_imbalance(),
            "outliers": self.check_outliers()
        }