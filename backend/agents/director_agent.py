def _metric_number(metrics: dict, *keys: str, default: float = 0) -> float:
    for key in keys:
        value = metrics.get(key)
        if isinstance(value, int | float):
            return float(value)
    return default


def evaluate_metrics(metrics: dict) -> str:
    time_spent = _metric_number(metrics, "timeSpent", "elapsedSeconds", "elapsed_seconds")
    ask_count = _metric_number(metrics, "askCount", "interrogationCount", "interrogation_count")
    retry_count = _metric_number(metrics, "retryCount", "retry_count")

    if time_spent >= 360 or ask_count >= 6 or retry_count >= 3:
        return "The player is struggling. Loosen your defenses and accidentally slip up with a clue."

    return "Keep your alibi tight."
