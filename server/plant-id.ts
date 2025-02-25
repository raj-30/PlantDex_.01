type PlantIdResponse = {
  suggestions: Array<{
    plant_name: string;
    probability: number;
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
};

export async function identifyPlant(base64Image: string): Promise<IdentificationResult> {
  try {
    // Extract the base64 data part from the data URL
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

    const response = await fetch('https://api.plant.id/v2/identify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': process.env.PLANT_ID_API_KEY!,
      },
      body: JSON.stringify({
        images: [base64Data],
        plant_details: ["common_names", "taxonomy", "url", "wiki_description"],
        modifiers: ["crops_fast"],
        plant_language: "en",
        disease_details: ["description", "treatment"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Plant.id API error response:', errorText);
      throw new Error(`Plant.id API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as PlantIdResponse;
    
    if (!data.suggestions || data.suggestions.length === 0) {
      throw new Error('No plant matches found');
    }
    
    const suggestion = data.suggestions[0];

    // Extract relevant information
    return {
      name: suggestion.plant_name,
      scientificName: suggestion.plant_details.scientific_name,
      habitat: `Native to regions where ${suggestion.plant_details.taxonomy.class} plants typically grow`,
      careTips: generateCareTips(suggestion.plant_details.wiki_description.value),
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