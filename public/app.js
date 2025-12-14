const baseURL = 'http://localhost:4001';

document.getElementById('fetchButton').addEventListener('click', async () => {
  try {
    const response = await fetch(`${baseURL}/pokemon`);
    const data = await response.json();

    document.getElementById('pokemonList').innerHTML = `
      <p>Showing Pokémon from ${data.from} to ${data.to}</p>
      <ul>
        ${data.data.map(pokemon => `<li>${pokemon.name}</li>`).join('')}
      </ul>
    `;
  } catch (error) {
    console.error('Error fetching Pokémon data:', error);
  }
});
