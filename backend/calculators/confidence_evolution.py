import numpy as np
import math
import hashlib
from scipy.stats import norm

def calculate_confidence_evolution(visits, conversions, traffic, variations, improvement, confidence, sample_points=20):
    """
    Calculate the evolution of statistical confidence and confidence interval width
    with a more realistic model of early test behavior.
    
    Parameters:
    -----------
    visits : float
        Daily visits to the website
    conversions : float
        Daily conversions
    traffic : float
        Percentage of traffic to include in the test
    variations : int
        Number of test variations (including control)
    improvement : float
        Expected improvement in conversion rate (percentage)
    confidence : float
        Statistical confidence level (percentage)
    sample_points : int
        Number of data points to generate for the chart
        
    Returns:
    --------
    dict
        Dictionary containing arrays of sample sizes, confidence values, and CI widths
    """
    # Convert percentage values to decimals
    p = conversions / visits  # baseline conversion rate
    traffic_decimal = traffic / 100
    improvement_decimal = improvement / 100
    
    # Calculate z-scores
    alpha = 1 - (confidence / 100)
    z_alpha = norm.ppf(1 - alpha/2)
    z_beta = norm.ppf(0.8)  # power = 80%
    
    # Calculate minimum detectable effect and required sample size
    mde = p * improvement_decimal
    numerator = (z_alpha + z_beta)**2 * 2 * p * (1 - p)
    denominator = mde**2
    
    if denominator == 0:
        sample_size = float('inf')
    else:
        sample_size = math.ceil(numerator / denominator)
    
    total_sample_size = sample_size * variations
    
    # Calculate days needed
    daily_test_visitors = visits * traffic_decimal
    if daily_test_visitors == 0:
        days_needed = float('inf')
    else:
        days_needed = math.ceil(total_sample_size / daily_test_visitors)
    
    # Calculate sample size needed for 99% confidence
    alpha_99 = 1 - (99 / 100)
    z_alpha_99 = norm.ppf(1 - alpha_99/2)
    numerator_99 = (z_alpha_99 + z_beta)**2 * 2 * p * (1 - p)
    sample_size_99 = math.ceil(numerator_99 / denominator)
    total_sample_size_99 = sample_size_99 * variations
    
    # Créer une graine pseudo-aléatoire basée sur les paramètres d'entrée
    seed_str = f"{visits}_{conversions}_{traffic}_{variations}_{improvement}_{confidence}"
    seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16) % (2**32)
    np.random.seed(seed)
    
    # Generate sample sizes from small to 99% confidence size
    max_sample = total_sample_size_99
    min_sample = max(50, math.ceil(max_sample * 0.01))
    
    # Zone d'incertitude réduite, limitée aux tout premiers jours du test
    uncertainty_duration_days = max(2, min(5, days_needed * 0.15))
    
    # Convertir cette durée en jours en progression relative par rapport à la taille d'échantillon totale
    uncertainty_endpoint_sample = min(total_sample_size, uncertainty_duration_days * daily_test_visitors)
    uncertainty_duration = uncertainty_endpoint_sample / total_sample_size
    uncertainty_duration = min(0.15, uncertainty_duration)  # Maximum 15% de la période du test
    
    # Réduire la durée d'incertitude si l'amélioration attendue est élevée
    if improvement_decimal > 0.15:
        uncertainty_duration *= 0.6
        
    # Générer des points d'échantillonnage avec une distribution plus uniforme
    # Pour éviter des écarts trop importants entre les jours à la fin du test
    sample_points_uniform = min(sample_points, days_needed)
    
    # Points plus espacés pour éviter les jours répétés, avec une distribution plus linéaire
    # Mélange d'échelle logarithmique au début et linéaire vers la fin
    alpha = 0.7  # Facteur de mélange (0 = purement logarithmique, 1 = purement linéaire)
    
    # Assurer une distribution plus uniforme des tailles d'échantillon
    sample_sizes = []
    for i in range(1, sample_points + 1):
        # Combiner échelle logarithmique et linéaire pour une meilleure distribution
        log_value = min_sample * np.exp(np.log(max_sample / min_sample) * (i - 1) / (sample_points - 1))
        linear_value = min_sample + (max_sample - min_sample) * (i - 1) / (sample_points - 1)
        
        # Mélange progressif: plus logarithmique au début, plus linéaire vers la fin
        progress = (i - 1) / (sample_points - 1)
        weight = alpha * progress + (1 - alpha) * (1 - progress)
        
        sample = (1 - weight) * log_value + weight * linear_value
        sample_sizes.append(math.ceil(sample))
    
    # Éliminer les doublons de jours
    days_set = set()
    sample_sizes_filtered = []
    
    for size in sample_sizes:
        day = math.ceil(size / daily_test_visitors)
        if day not in days_set and day > 0:
            days_set.add(day)
            sample_sizes_filtered.append(size)
            
    # Si nous avons trop peu de points, ajouter des points intermédiaires avec une distribution plus uniforme
    if len(sample_sizes_filtered) < sample_points * 0.7:  # Si nous avons perdu plus de 30% des points
        # Générer directement des jours uniformes puis les convertir en tailles d'échantillon
        uniform_days = np.linspace(1, days_needed, sample_points)
        sample_sizes = [math.ceil(day * daily_test_visitors) for day in uniform_days]
        sample_sizes = sorted(list(set(sample_sizes)))  # Éliminer les doublons
    else:
        # Sinon utiliser les échantillons filtrés
        sample_sizes = sorted(sample_sizes_filtered)[:sample_points]
        
    # Si nous avons encore trop peu de points, compléter avec des points intermédiaires
    while len(sample_sizes) < min(sample_points, days_needed):
        # Trouver les plus grands écarts entre jours consécutifs
        days = [math.ceil(size / daily_test_visitors) for size in sample_sizes]
        gaps = [(days[i+1] - days[i], i) for i in range(len(days)-1)]
        gaps.sort(reverse=True)  # Trier par taille d'écart décroissante
        
        # Ajouter des points dans les plus grands écarts
        for gap, index in gaps:
            if gap <= 1:  # Si l'écart est de 1 jour ou moins, ne pas ajouter de point
                continue
            
            # Calculer un jour intermédiaire
            mid_day = (days[index] + days[index+1]) // 2
            mid_size = mid_day * daily_test_visitors
            
            if mid_day not in days:
                sample_sizes.append(mid_size)
                if len(sample_sizes) >= min(sample_points, days_needed):
                    break
        
        # Si nous n'avons pas ajouté de nouveaux points, sortir de la boucle
        if len(sample_sizes) == len(days):
            break
            
        # Trier les tailles d'échantillon
        sample_sizes = sorted(sample_sizes)
    
    # Generate corresponding days
    days = []
    for size in sample_sizes:
        days.append(math.ceil(size / daily_test_visitors))
    
    # Calculate confidence interval width at each sample size
    ci_widths = []
    for n in sample_sizes:
        std_error = math.sqrt(p * (1 - p) / (n / variations))
        margin_of_error = z_alpha * std_error
        ci_widths.append(float(margin_of_error))
    
    # Paramètres de variabilité basés sur les données utilisateur
    # Plus l'amélioration attendue est élevée, plus la confiance initiale est élevée
    initial_confidence_factor = 1.2 + (improvement_decimal * 0.5)
    
    # Plus le taux de conversion est faible, plus la volatilité est élevée
    volatility_factor = max(0.8, 1.2 - p)
    
    # Définir les phases basées sur les paramètres d'entrée
    phase1_end = uncertainty_duration * 0.4  # Première phase plus courte
    phase2_end = uncertainty_duration
    
    # Calculate statistical confidence with early test behavior simulation
    confidence_values = []
    for i, n in enumerate(sample_sizes):
        # Base confidence calculation
        std_error = math.sqrt(2 * p * (1 - p) / (n / variations))
        non_centrality = mde / std_error
        base_power = norm.cdf(non_centrality - z_alpha) + norm.cdf(-non_centrality - z_alpha)
        base_confidence = float(base_power * 100)
        
        # Early test behavior simulation
        progress = n / total_sample_size
        
        if progress < phase1_end:  # First phase
            # Confiance initiale beaucoup plus élevée pendant la période d'incertitude
            # Valeurs artificiellement hautes au début du test (effet de petits échantillons)
            confidence_val = min(98, max(70, base_confidence * 2.0 * initial_confidence_factor))
            # Volatilité importante en début de test
            volatility = max(0, 20 * volatility_factor * (1 - progress/phase1_end))
            noise = float(np.random.normal(0, volatility))
            confidence_val = max(min(confidence_val + noise, 100), 60)
            
        elif progress < phase2_end:  # Second phase
            # Chute rapide de confiance influencée par les variations
            drop_rate = 0.6 + (0.1 * (variations - 2))
            drop_rate = min(0.8, drop_rate)
            drop_factor = 1 - ((progress - phase1_end) / (phase2_end - phase1_end)) * drop_rate
            confidence_val = base_confidence * drop_factor
            # Add decreasing volatility
            volatility = max(0, 8 * volatility_factor * (1 - (progress-phase1_end)/(phase2_end-phase1_end)))
            noise = float(np.random.normal(0, volatility))
            confidence_val = max(min(confidence_val + noise, 95), 30)
            
        else:  # Beyond uncertainty phase
            # Gradual increase towards true confidence level
            progress_to_final = (progress - phase2_end) / (1 - phase2_end)
            recovery_rate = 0.3 + (0.1 * improvement_decimal * 10)  # Récupération plus rapide pour les améliorations importantes
            recovery_rate = min(0.7, recovery_rate)
            confidence_val = base_confidence * ((1 - recovery_rate) + recovery_rate * progress_to_final)
            # Add small volatility
            volatility = max(0, 3 * volatility_factor * (1 - progress_to_final))
            noise = float(np.random.normal(0, volatility))
            confidence_val = max(min(confidence_val + noise, 100), base_confidence * (1 - recovery_rate))
        
        confidence_values.append(confidence_val)
    
    # Smooth the confidence values using a moving average
    window_size = min(3, len(confidence_values))
    if window_size > 1:
        smoothed_confidence = np.convolve(confidence_values, np.ones(window_size)/window_size, mode='valid')
        padding = np.array([confidence_values[0]] * (window_size - 1))
        confidence_values = np.concatenate([padding, smoothed_confidence])
    
    # Ensure the confidence reaches exactly the target value at the calculated sample size
    target_index = next((i for i, n in enumerate(sample_sizes) if n >= total_sample_size), len(sample_sizes) - 1)
    if target_index > 0 and target_index < len(confidence_values):
        confidence_values[target_index] = float(confidence)
    
    # Identify key points
    target_index = next((i for i, c in enumerate(confidence_values) if c >= confidence), len(confidence_values) - 1)
    target_99_index = next((i for i, c in enumerate(confidence_values) if c >= 99), len(confidence_values) - 1)
    
    # Format data for frontend display - by sample size
    data_points_by_sample = []
    for i in range(len(sample_sizes)):
        is_uncertainty = bool(i < target_index and confidence_values[i] < confidence)
        data_points_by_sample.append({
            "sampleSize": int(sample_sizes[i]),
            "confidence": float(confidence_values[i]),
            "ciWidth": float(ci_widths[i]),
            "isUncertainty": is_uncertainty
        })
    
    # Format data for frontend display - by days
    data_points_by_day = []
    for i in range(len(days)):
        is_uncertainty = bool(i < target_index and confidence_values[i] < confidence)
        data_points_by_day.append({
            "day": int(days[i]),
            "confidence": float(confidence_values[i]),
            "ciWidth": float(ci_widths[i]),
            "isUncertainty": is_uncertainty
        })
    
    return {
        "dataPointsBySample": data_points_by_sample,
        "dataPointsByDay": data_points_by_day,
        "targetSampleSize": int(sample_sizes[target_index]) if target_index < len(sample_sizes) else int(total_sample_size),
        "targetDay": int(days[target_index]) if target_index < len(days) else int(days_needed),
        "target99SampleSize": int(sample_sizes[target_99_index]) if target_99_index < len(sample_sizes) else int(total_sample_size_99),
        "target99Day": int(days[target_99_index]) if target_99_index < len(days) else int(days[-1]),
        "totalSampleSize": int(total_sample_size),
        "totalDays": int(days_needed)
    } 