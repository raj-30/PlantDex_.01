type PlantIdResponse = {
  suggestions: Array<{
    plant_name: string;
    plant_details: {
      scientific_name: string;
      wiki_description: {
        value: string;
      };
      taxonomy: {
        class: string;
      };
    };
  }>;
};

type IdentificationResult = {
  name: string;
  scientificName: string;
  habitat: string;
  careTips: string;
  confidence: number;
};

export async function identifyPlant(base64Image: string): Promise<IdentificationResult> {
  try {
    const response = await fetch('https://api.plant.id/v2/identify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': process.env.PLANT_ID_API_KEY!,
      },
      body: JSON.stringify({
        images: [base64Image.split(',')[1]], // Remove data:image/jpeg;base64, prefix
        plant_details: ["common_names", "taxonomy", "url", "wiki_description"],
      }),
    });

    if (!response.ok) {
      throw new Error(`Plant.id API error: ${response.statusText}`);
    }

    const data = await response.json() as PlantIdResponse;
    const suggestion = data.suggestions[0];

    if (!suggestion) {
      throw new Error('No plant matches found');
    }

    // Extract relevant information
    return {
      name: suggestion.plant_name,
      scientificName: suggestion.plant_details.scientific_name,
      habitat: `Native to regions where ${suggestion.plant_details.taxonomy.class} plants typically grow`,
      careTips: generateCareTips(suggestion.plant_details.wiki_description.value),
      confidence: suggestion.confidence || 0,
    };
  } catch (error) {
    console.error('Plant identification error:', error);
    throw error;
  }
}

function generateCareTips(description: string): string {
  // Extract a shorter version of the description for care tips
  const sentences = description.split('. ');
  return sentences.slice(0, 2).join('. ') + '.';
}
