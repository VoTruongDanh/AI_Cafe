"""
Temperature Classifier - Rule-based and ML-based classification
"""
import json
import re
import unicodedata
import datetime
from pathlib import Path
from typing import Optional, List
import joblib


class TemperatureClassifier:
    """Temperature classifier using rule-based and ML model"""
    
    def __init__(self, dataset_path: Optional[Path] = None, model_path: Optional[Path] = None):
        """
        Initialize temperature classifier
        
        Args:
            dataset_path: Path to dataset.jsonl file
            model_path: Path to model.joblib file
        """
        self.dataset_path = dataset_path or Path("dataset.jsonl")
        self.model_path = model_path or Path("model.joblib")
        self.model = self._load_model()
    
    def _load_model(self):
        """Load ML model if exists"""
        if self.model_path.exists():
            try:
                return joblib.load(self.model_path)
            except Exception as e:
                print(f"Error loading model: {e}")
                return None
        return None
    
    def reload_model(self):
        """Reload ML model"""
        self.model = self._load_model()
        return self.model is not None
    
    @staticmethod
    def normalize_vi(s: str) -> str:
        """Normalize Vietnamese text"""
        if not s:
            return ""
        s = str(s).strip().lower()
        s = s.replace("đ", "d").replace("Đ", "d")
        s = unicodedata.normalize("NFD", s)
        s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
        s = re.sub(r"\s+", " ", s).strip()
        return s
    
    @staticmethod
    def contains_any(text: str, keywords: List[str]) -> bool:
        """Check if text contains any keyword"""
        for kw in keywords:
            kw = kw.strip()
            if not kw:
                continue
            if ' ' in kw:
                if kw in text:
                    return True
                continue
            pattern = r'(^|\W)' + re.escape(kw) + r'(\W|$)'
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
    
    def classify_rule_based(self, name: str, category_name: Optional[str] = None) -> dict:
        """Classify using rule-based keyword matching"""
        cold_keywords = [
            'da', 'iced', 'ice', 'lanh', 'frozen', 'smoothie', 'sinh to',
            'kem', 'tra sua', 'nuoc ep', 'juice', 'cold', 'freeze',
            'ca phe da', 'tra da', 'nuoc ngot', 'soft drink', 'soda'
        ]
        hot_keywords = [
            'nong', 'hot', 'am', 'warm', 'steaming', 'boiling',
            'ca phe nong', 'tra nong', 'soup', 'lau', 'sup',
            'pho', 'bun', 'mi', 'noodle soup'
        ]
        
        text = self.normalize_vi(f"{name} | {category_name or ''}")
        
        if self.contains_any(text, cold_keywords):
            return {'temperature': 'COLD', 'confidence': 0.95, 'source': 'RULE', 'reason': 'Keyword lạnh'}
        
        if self.contains_any(text, hot_keywords):
            return {'temperature': 'HOT', 'confidence': 0.90, 'source': 'RULE', 'reason': 'Keyword nóng'}
        
        category_lower = (category_name or '').lower()
        text_lower = text.lower()
        
        if 'ca phe' in category_lower or 'coffee' in category_lower or 'ca phe' in text_lower or 'coffee' in text_lower:
            if 'da' in text_lower or 'ice' in text_lower or 'iced' in text_lower:
                return {'temperature': 'COLD', 'confidence': 0.85, 'source': 'RULE', 'reason': 'Cà phê đá'}
            return {'temperature': 'HOT', 'confidence': 0.50, 'source': 'RULE', 'reason': 'Cà phê mặc định nóng'}
        
        if any(kw in text for kw in ['lau', 'sup', 'pho', 'bun']):
            return {'temperature': 'HOT', 'confidence': 0.70, 'source': 'RULE', 'reason': 'Món ăn nóng'}
        
        return {'temperature': 'UNKNOWN', 'confidence': 0.50, 'source': 'UNKNOWN', 'reason': 'Không xác định'}
    
    def predict(self, name: str, category_name: Optional[str] = None) -> dict:
        """
        Predict temperature using hybrid approach (rule-based + ML)
        
        Args:
            name: Product name
            category_name: Category name
            
        Returns:
            dict with temperature, confidence, source, reason
        """
        rule_result = self.classify_rule_based(name, category_name)
        
        # If rule-based is confident enough, return it
        if rule_result['confidence'] >= 0.8 and rule_result['temperature'] in ['HOT', 'COLD']:
            return rule_result
        
        # If no model, return rule-based result
        if self.model is None:
            return {**rule_result, "source": "NO_MODEL"}
        
        # Use ML model
        text = self.normalize_vi(f"{name} | {category_name or ''}")
        try:
            proba = self.model.predict_proba([text])[0]
            classes = self.model.classes_
            best = int(proba.argmax())
            label = str(classes[best])
            conf = float(proba[best])
            
            if conf < 0.60:
                return rule_result
            elif conf > rule_result['confidence'] or rule_result['temperature'] == 'UNKNOWN':
                return {
                    "temperature": label,
                    "confidence": conf,
                    "source": "MODEL",
                    "reason": f"Model: {conf:.2f}"
                }
            else:
                return rule_result
        except Exception as e:
            return {**rule_result, "source": "MODEL_ERROR", "error": str(e)}
    
    def collect_sample(self, name: str, category_name: Optional[str], label: Optional[str],
                       source: str = "UNKNOWN", confidence: Optional[float] = None):
        """
        Collect training sample
        
        Args:
            name: Product name
            category_name: Category name
            label: Temperature label (HOT/COLD)
            source: Source of label
            confidence: Confidence score
        """
        text = self.normalize_vi(f"{name} | {category_name or ''}")
        row = {
            "text": text,
            "label": label,
            "source": source,
            "confidence": confidence,
            "ts": datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).isoformat()
        }
        self.dataset_path.parent.mkdir(parents=True, exist_ok=True)
        with self.dataset_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    
    def get_stats(self) -> dict:
        """Get dataset statistics"""
        count = 0
        labeled_count = 0
        hot_count = 0
        cold_count = 0
        
        if self.dataset_path.exists():
            for line in self.dataset_path.read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                try:
                    row = json.loads(line)
                    count += 1
                    label = row.get("label")
                    if label:
                        labeled_count += 1
                        if label == "HOT":
                            hot_count += 1
                        elif label == "COLD":
                            cold_count += 1
                except:
                    continue
        
        return {
            "total_samples": count,
            "labeled_samples": labeled_count,
            "hot_samples": hot_count,
            "cold_samples": cold_count,
            "has_model": self.model is not None
        }
