"""
Test suite for the SpendWise AI ML service.

Covers spending prediction (regression vs. moving-average fallback) and
anomaly detection (z-score and IQR methods), including the outlier-masking
edge case that was caught and fixed during development: a single large
outlier can inflate a naive mean/std enough to mask its own z-score, so
anomaly detection uses a median/MAD-based modified z-score instead.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_prediction_with_trending_history_uses_regression():
    r = client.post(
        "/predict/monthly-spending",
        json={
            "monthly_history": [
                {"month": "2026-03", "total": 20000},
                {"month": "2026-04", "total": 21500},
                {"month": "2026-05", "total": 23000},
                {"month": "2026-06", "total": 24200},
                {"month": "2026-07", "total": 25800},
                {"month": "2026-08", "total": 26840},
            ]
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["method"] == "ordinary-least-squares"
    assert data["predictedAmount"] > 26840
    assert data["confidenceRange"]["lower"] < data["predictedAmount"] < data["confidenceRange"]["upper"]


def test_prediction_with_sparse_history_falls_back_to_moving_average():
    r = client.post("/predict/monthly-spending", json={"monthly_history": [{"month": "2026-08", "total": 15000}]})
    assert r.status_code == 200
    data = r.json()
    assert data["method"] == "insufficient-data-for-regression"
    assert data["predictedAmount"] == 15000.0


def test_prediction_rejects_empty_history():
    r = client.post("/predict/monthly-spending", json={"monthly_history": []})
    assert r.status_code == 400


def test_anomaly_detection_catches_masked_outlier_with_zscore():
    """
    Regression test for a real bug: a ₹8,000 charge among four ₹450-600
    charges scored only 2.0 under a naive mean/std z-score (below a 2.5
    threshold), because the outlier itself inflated the standard deviation
    enough to mask its own score. The fix (median/MAD-based modified
    z-score) must catch this.
    """
    transactions = [
        {"id": "1", "amount": 500, "category": "Shopping", "date": "2026-08-01"},
        {"id": "2", "amount": 600, "category": "Shopping", "date": "2026-08-05"},
        {"id": "3", "amount": 450, "category": "Shopping", "date": "2026-08-10"},
        {"id": "4", "amount": 550, "category": "Shopping", "date": "2026-08-15"},
        {"id": "5", "amount": 8000, "category": "Shopping", "date": "2026-08-20"},
        {"id": "6", "amount": 300, "category": "Food", "date": "2026-08-01"},
        {"id": "7", "amount": 320, "category": "Food", "date": "2026-08-05"},
    ]
    r = client.post("/detect/anomalies", json={"transactions": transactions, "method": "zscore"})
    assert r.status_code == 200
    anomalies = r.json()["anomalies"]
    assert len(anomalies) == 1
    assert anomalies[0]["id"] == "5"
    assert "Shopping" in anomalies[0]["reason"]


def test_anomaly_detection_iqr_method_agrees():
    transactions = [
        {"id": "1", "amount": 500, "category": "Shopping", "date": "2026-08-01"},
        {"id": "2", "amount": 600, "category": "Shopping", "date": "2026-08-05"},
        {"id": "3", "amount": 450, "category": "Shopping", "date": "2026-08-10"},
        {"id": "4", "amount": 550, "category": "Shopping", "date": "2026-08-15"},
        {"id": "5", "amount": 8000, "category": "Shopping", "date": "2026-08-20"},
    ]
    r = client.post("/detect/anomalies", json={"transactions": transactions, "method": "iqr"})
    assert r.status_code == 200
    anomalies = r.json()["anomalies"]
    assert len(anomalies) == 1
    assert anomalies[0]["id"] == "5"


def test_anomaly_detection_skips_categories_with_too_few_transactions():
    transactions = [
        {"id": "1", "amount": 500, "category": "Shopping", "date": "2026-08-01"},
        {"id": "2", "amount": 600, "category": "Shopping", "date": "2026-08-05"},
        {"id": "3", "amount": 450, "category": "Shopping", "date": "2026-08-10"},
        {"id": "4", "amount": 550, "category": "Shopping", "date": "2026-08-15"},
        {"id": "5", "amount": 8000, "category": "Shopping", "date": "2026-08-20"},
        {"id": "6", "amount": 300, "category": "Food", "date": "2026-08-01"},
        {"id": "7", "amount": 5000, "category": "Food", "date": "2026-08-05"},
    ]
    r = client.post("/detect/anomalies", json={"transactions": transactions})
    assert r.status_code == 200
    food_anomalies = [a for a in r.json()["anomalies"] if a["category"] == "Food"]
    assert len(food_anomalies) == 0


def test_anomaly_detection_identical_amounts_does_not_crash():
    transactions = [{"id": str(i), "amount": 100, "category": "Bills", "date": "2026-08-01"} for i in range(5)]
    r = client.post("/detect/anomalies", json={"transactions": transactions})
    assert r.status_code == 200
    assert r.json()["anomalies"] == []


def test_anomaly_detection_realistic_groceries_stockup():
    transactions = [
        {"id": "g1", "amount": 800, "category": "Groceries", "date": "2026-08-01"},
        {"id": "g2", "amount": 750, "category": "Groceries", "date": "2026-08-05"},
        {"id": "g3", "amount": 820, "category": "Groceries", "date": "2026-08-10"},
        {"id": "g4", "amount": 790, "category": "Groceries", "date": "2026-08-15"},
        {"id": "g5", "amount": 810, "category": "Groceries", "date": "2026-08-20"},
        {"id": "g6", "amount": 4500, "category": "Groceries", "date": "2026-08-25"},
    ]
    r = client.post("/detect/anomalies", json={"transactions": transactions})
    assert r.status_code == 200
    anomalies = r.json()["anomalies"]
    assert len(anomalies) == 1
    assert anomalies[0]["id"] == "g6"


def test_anomaly_detection_empty_transactions():
    r = client.post("/detect/anomalies", json={"transactions": []})
    assert r.status_code == 200
    assert r.json()["anomalies"] == []
    assert r.json()["transactionsAnalyzed"] == 0
