import http from "http"
import { fetchPokemonData } from "./app";
import { debounceHandler } from "./debounce";

let offset = 0;
const limit = 10;

const handleFetch = async (req:http.IncomingMessage, res:http.ServerResponse ) => {
    try {
        const data = await fetchPokemonData(offset, limit);
        const response = {
          from: offset + 1,
          to: offset + data.length,
          data
        };
        offset += limit;
  
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch Pokémon data' }));
      }
}

export const debouncedFetch = debounceHandler(handleFetch, 2000);