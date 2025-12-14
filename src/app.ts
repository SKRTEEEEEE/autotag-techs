// src/app.ts


const POKEAPI_URL = 'https://pokeapi.co/api/v2/pokemon';

export const fetchPokemonData = async (offset: number, limit: number) => {
  try {
    const response = await fetch(`${POKEAPI_URL}?offset=${offset}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching Pokémon data:', error);
    throw error;
  }
};
