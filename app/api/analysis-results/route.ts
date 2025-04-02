import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  try {
    // Récupérer l'ID du fichier depuis les paramètres de la requête
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing fileId parameter' },
        { status: 400 }
      );
    }
    
    // Récupérer les résultats depuis le backend Python
    const response = await fetch(`${BACKEND_URL}/analyze-data/detailed?fileId=${fileId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Récupérer le corps de la réponse sous forme de texte pour le déboguer si nécessaire
    const responseText = await response.text();
    
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
        { error: 'Failed to retrieve analysis results', message: errorMessage },
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
    console.error('Error retrieving analysis results:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analysis results', message: (error as Error).message },
      { status: 500 }
    );
  }
} 