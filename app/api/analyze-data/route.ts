import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    // Récupérer les données de la requête
    const requestData = await request.json();
    
    // Déboguer les données reçues
    console.log("API analyze-data received:", JSON.stringify({
      file_type: requestData.file_type,
      kpi_type: requestData.kpi_type,
      exclude_outliers: requestData.exclude_outliers,
      users_per_variation: requestData.users_per_variation
    }));
    
    // Vérifier que les données utilisateur sont bien présentes et valides
    if (!requestData.users_per_variation) {
      return NextResponse.json(
        { error: 'Missing users_per_variation parameter' },
        { status: 400 }
      );
    }
    
    // Vérification des clés requises
    if (!('control' in requestData.users_per_variation)) {
      return NextResponse.json(
        { error: 'Missing control group in users_per_variation' },
        { status: 400 }
      );
    }
    
    if (!('variation' in requestData.users_per_variation)) {
      return NextResponse.json(
        { error: 'Missing variation group in users_per_variation' },
        { status: 400 }
      );
    }
    
    // Vérifier que les valeurs sont positives et des entiers
    for (const key in requestData.users_per_variation) {
      const value = requestData.users_per_variation[key];
      
      // Vérifier que c'est un nombre
      if (typeof value !== 'number') {
        return NextResponse.json(
          { error: `User count for ${key} must be a number, got ${typeof value}` },
          { status: 400 }
        );
      }
      
      // Vérifier que c'est un entier positif
      if (!Number.isInteger(value) || value <= 0) {
        return NextResponse.json(
          { error: `User count for ${key} must be a positive integer, got ${value}` },
          { status: 400 }
        );
      }
    }
    
    // Créer une copie de la requête avec exactement le format attendu
    const sanitizedRequest = {
      ...requestData,
      users_per_variation: {
        control: requestData.users_per_variation.control,
        variation: requestData.users_per_variation.variation
      }
    };
    
    console.log("API: Sending user values to backend:", JSON.stringify(sanitizedRequest.users_per_variation));
    
    // Envoyer les données au backend Python
    const response = await fetch(`${BACKEND_URL}/analyze-data/detailed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedRequest),
    });
    
    // Récupérer le corps de la réponse sous forme de texte pour le déboguer si nécessaire
    const responseText = await response.text();
    console.log("Backend response (start):", responseText.substring(0, 200));
    
    if (!response.ok) {
      let errorMessage = `Backend error: ${response.statusText}`;
      try {
        // Essayer de parser comme JSON
        const errorData = JSON.parse(responseText);
        if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch (e) {
        // Si ce n'est pas du JSON, utiliser le texte brut
        errorMessage = responseText || errorMessage;
      }
      
      console.error("Backend error response:", errorMessage);
      return NextResponse.json(
        { error: 'Failed to analyze data', message: errorMessage },
        { status: response.status }
      );
    }
    
    // Convertir le texte en JSON
    let analysisResults;
    try {
      analysisResults = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON response from backend', message: responseText },
        { status: 500 }
      );
    }
    
    // Retourner les résultats au client
    return NextResponse.json(analysisResults);
  } catch (error) {
    console.error('Data analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze data', message: (error as Error).message },
      { status: 500 }
    );
  }
} 