import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { getContainers, getApiUsage } from './api';
import './App.css';

function App() {
  const [containers, setContainers] = useState([]);
  const [apiUsage, setApiUsage] = useState([]);
  const [dailyRequests, setDailyRequests] = useState([]);
  const [currentMonth, setCurrentMonth] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функция для загрузки данных
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Загружаем данные о Docker контейнерах
      const containersData = await getContainers();
      setContainers(containersData);
      
      // Загружаем данные об использовании API
      const apiData = await getApiUsage();
      
      // Обновляем состояние с новыми данными
      setApiUsage(apiData.monthlyData || []);
      setDailyRequests(apiData.dailyData || []);
      setCurrentMonth(apiData.currentMonth || {});
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Не удалось загрузить данные. Пожалуйста, убедитесь, что сервер запущен.');
    } finally {
      setLoading(false);
    }
  };

  // Загружаем данные при первом рендере
  useEffect(() => {
    fetchData();
    
    // Настраиваем автоматическое обновление каждые 5 минут
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    
    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="App bg-gray-50 min-h-screen">
      {error && (
        <div className="mx-auto max-w-6xl p-4 mt-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}
      <Dashboard 
        containers={containers} 
        apiUsage={apiUsage} 
        dailyRequests={dailyRequests} 
        currentMonth={currentMonth} 
        loading={loading} 
        onRefresh={fetchData} 
      />
    </div>
  );
}

export default App; 