import axios from 'axios';

// Базовый URL API
const API_BASE_URL = '';

// Функция для загрузки данных о контейнерах
export const getContainers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/containers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching containers:', error);
    throw error;
  }
};

// Функция для загрузки данных об использовании API
export const getApiUsage = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/usage`);
    return response.data;
  } catch (error) {
    console.error('Error fetching API usage:', error);
    throw error;
  }
};

// Функция для принудительного обновления данных
export const forceRefreshData = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/refresh`);
    return response.data;
  } catch (error) {
    console.error('Error refreshing data:', error);
    throw error;
  }
};

// Функция для получения подробной статистики по сервису
export const getServiceStats = async (service) => {
  try {
    if (!['anthropic', 'openai', 'perplexity'].includes(service)) {
      throw new Error('Invalid service name');
    }
    
    const response = await axios.get(`${API_BASE_URL}/api/stats/${service}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${service} stats:`, error);
    throw error;
  }
}; 