import axios from 'axios';
import { HomeResponseDto } from '../types/home';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const fetchHomeData = async (): Promise<HomeResponseDto> => {
  try {
    const response = await axios.get<HomeResponseDto>(`${API_BASE_URL}/public/home`);
    return response.data;
  } catch (error) {
    console.error('Error fetching home data:', error);
    throw error;
  }
};
