import React, { useEffect, useState } from 'react'
import Search from './components/Search'
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

  const fetchMovies = async(query = '') => {
    setIsLoading(true);
    setErrorMessage("");

    try{
      const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}` : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);

      if(!response.ok){
        throw new Error('Failed to Fetch Movies');
      }
      const data = await response.json();

      if(data.response == 'False'){
        setErrorMessage(data.Error || 'Failed to Fetch Movies');
        setErrorMessage('Error Fetching Movies. Please Try Again Later');
        setMovieList([]);
        return;
      }
      setMovieList(data.results || [])

      if(query && data.results.length > 0){
        await updateSearchCount(query, data.results[0]); 
      }

    } catch(error){
      console.error(`Error Fetching Movies: ${error}`);
    } finally{
      setIsLoading(false);
    }
  }
  
  const loadTrendingMovies = async() => {
    try{
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch(error){
      console.error(`Error Fetching Trending Movies: ${error}`);
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, [])
  
  return (
    <main>
      <title>MovieFinder - Discover Your Next Favorite Movie</title> 
      <link rel='icon' href='./logo.png' type='image/png' /> 
      <div className='pattern'/>

      <div className='wrapper'>
        <header>
          <div className="flex items-center justify-center gap-0 -mb-10">
            <img src='./logo.png' alt='MovieFinder Logo' className="h-12 w-12" />
            <h1 className="text-3xl font-bold text-white -ml-115">MovieFinder</h1>
          </div>
          <img src='./hero.png' alt='Hero Banner'/>
          <h1>Find <span className='text-gradient'>Movies</span> You'll Enjoy Without the Hassle</h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className='trending'>
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className='all-movies'>
          <h2>All Movies</h2>

          {isLoading ? (
            <p className='text-white'>Loading...</p>
          ) : errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
