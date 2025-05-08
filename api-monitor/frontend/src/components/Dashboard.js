import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { RefreshCcw, Server, DollarSign, ExternalLink, CheckCircle, XCircle, Clock, Zap, Database } from 'lucide-react';
import { forceRefreshData, getServiceStats } from '../api';

// Simple UI components
const Tabs = ({ defaultValue, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  // Filter out the TabsList and TabsContent components
  const tabsList = children.find(child => child.type === TabsList);
  const tabsContent = children.filter(child => child.type === TabsContent);

  return (
    <div className="w-full">
      {React.cloneElement(tabsList, { activeTab, setActiveTab })}
      {tabsContent.find(content => content.props.value === activeTab)}
    </div>
  );
};

const TabsList = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="flex space-x-2 mb-4 border-b">
      {React.Children.map(children, child => 
        React.cloneElement(child, { 
          active: child.props.value === activeTab,
          onClick: () => setActiveTab(child.props.value)
        })
      )}
    </div>
  );
};

const TabsTrigger = ({ value, children, active, onClick }) => {
  return (
    <button 
      className={`px-4 py-2 ${active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`} 
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children }) => {
  return <div className="py-4">{children}</div>;
};

const Card = ({ children }) => {
  return <div className="bg-white rounded-lg shadow-md overflow-hidden">{children}</div>;
};

const CardHeader = ({ children }) => {
  return <div className="p-4 border-b">{children}</div>;
};

const CardTitle = ({ children }) => {
  return <h3 className="text-lg font-medium">{children}</h3>;
};

const CardDescription = ({ children }) => {
  return <p className="text-sm text-gray-500">{children}</p>;
};

const CardContent = ({ children }) => {
  return <div className="p-4">{children}</div>;
};

const APIKeyStatus = ({ status }) => {
  return (
    <div className="flex items-center mt-1 text-xs">
      {status === 'active' ? (
        <>
          <CheckCircle size={12} className="text-green-600 mr-1" />
          <span className="text-green-600">API ключ активен</span>
        </>
      ) : (
        <>
          <XCircle size={12} className="text-red-600 mr-1" />
          <span className="text-red-600">API ключ отсутствует</span>
        </>
      )}
    </div>
  );
};

// Компонент для отображения детальной статистики
const ApiDetails = ({ serviceName, data, loading }) => {
  if (loading) {
    return <div className="text-center py-8">Загрузка детальной статистики...</div>;
  }
  
  if (!data || !data.requestTypes || data.requestTypes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Нет доступных данных для отображения
      </div>
    );
  }
  
  // Подготовка данных для круговой диаграммы
  const pieData = data.requestTypes.map(item => ({
    name: item.model,
    value: item.count
  }));
  
  // Цвета для моделей
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];
  
  // Форматирование даты последнего обновления
  const formatDate = (dateString) => {
    if (!dateString) return 'Неизвестно';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{serviceName} - Детальная статистика</h3>
        <div className="flex items-center text-sm text-gray-500">
          <Clock size={14} className="mr-1" />
          Обновлено: {formatDate(data.lastUpdated)}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Всего токенов</div>
          <div className="text-2xl font-semibold">{data.totalTokens.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Всего запросов</div>
          <div className="text-2xl font-semibold">
            {data.requestTypes.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Средняя цена запроса</div>
          <div className="text-2xl font-semibold">
            ${(data.requestTypes.reduce((sum, item) => sum + (item.count * item.costPerRequest), 0) / 
               data.requestTypes.reduce((sum, item) => sum + item.count, 0)).toFixed(4)}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="text-md font-medium mb-4">Распределение запросов по моделям</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="text-md font-medium mb-4">Подробная информация по моделям</h4>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Модель</th>
                  <th className="px-3 py-2 text-right">Запросы</th>
                  <th className="px-3 py-2 text-right">Цена за запрос</th>
                  <th className="px-3 py-2 text-right">Всего</th>
                </tr>
              </thead>
              <tbody>
                {data.requestTypes.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-3 py-2">{item.model}</td>
                    <td className="px-3 py-2 text-right">{item.count.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">${item.costPerRequest.toFixed(4)}</td>
                    <td className="px-3 py-2 text-right">${(item.count * item.costPerRequest).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-3 py-2">Итого</td>
                  <td className="px-3 py-2 text-right">
                    {data.requestTypes.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right"></td>
                  <td className="px-3 py-2 text-right">
                    ${data.requestTypes.reduce((sum, item) => sum + (item.count * item.costPerRequest), 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ containers, apiUsage, dailyRequests, currentMonth, loading, onRefresh }) => {
  const [selectedService, setSelectedService] = useState(null);
  const [detailedStats, setDetailedStats] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Функция для принудительного обновления данных с сервера
  const handleForceRefresh = async () => {
    if (loading) return; // Предотвращаем двойной запрос
    
    try {
      await forceRefreshData();
      onRefresh(); // Вызываем основную функцию обновления из App.js
    } catch (error) {
      console.error('Error forcing refresh:', error);
    }
  };
  
  // Загрузка детальной статистики для сервиса
  useEffect(() => {
    if (!selectedService) {
      setDetailedStats(null);
      return;
    }
    
    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const serviceName = 
          selectedService === 'Anthropic' ? 'anthropic' : 
          selectedService === 'ChatGPT' ? 'openai' : 'perplexity';
          
        const data = await getServiceStats(serviceName);
        setDetailedStats(data);
      } catch (error) {
        console.error(`Error fetching details for ${selectedService}:`, error);
      } finally {
        setDetailsLoading(false);
      }
    };
    
    fetchDetails();
  }, [selectedService]);

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Docker и API Мониторинг</h1>
        <div className="flex space-x-2">
          <button 
            onClick={handleForceRefresh} 
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={loading}
          >
            <Zap size={16} />
            Принудительное обновление
          </button>
          <button 
            onClick={onRefresh} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Обновление..." : "Обновить"}
          </button>
        </div>
      </div>

      <Tabs defaultValue="docker">
        <TabsList>
          <TabsTrigger value="docker" className="flex items-center gap-1">
            <Server size={16} />
            Docker-сервисы
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-1">
            <DollarSign size={16} />
            API Затраты
          </TabsTrigger>
        </TabsList>

        <TabsContent value="docker">
          <Card>
            <CardHeader>
              <CardTitle>Локальные Docker-сервисы</CardTitle>
              <CardDescription>Все активные контейнеры с привязкой к локальным портам</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Имя</th>
                      <th className="p-2 text-left">Статус</th>
                      <th className="p-2 text-left">Образ</th>
                      <th className="p-2 text-left">Порты</th>
                      <th className="p-2 text-left">Создан</th>
                      <th className="p-2 text-left">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center">Загрузка данных...</td>
                      </tr>
                    ) : containers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center">Нет запущенных контейнеров</td>
                      </tr>
                    ) : (
                      containers.map(container => (
                        <tr key={container.id} className="border-t">
                          <td className="p-2">{container.name}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              container.status === 'running' ? 'bg-green-100 text-green-800' : 
                              container.status === 'exited' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {container.status}
                            </span>
                          </td>
                          <td className="p-2">{container.image}</td>
                          <td className="p-2">
                            {container.ports && container.ports.length > 0 ? (
                              container.ports.map((port, index) => (
                                <div key={index} className="flex items-center gap-1">
                                  <a 
                                    href={`http://${port.split(':')[0]}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    {port} <ExternalLink size={14} />
                                  </a>
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-500">Нет портов</span>
                            )}
                          </td>
                          <td className="p-2">{container.created}</td>
                          <td className="p-2">
                            <button className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-xs">
                              Перезапустить
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Anthropic API</CardTitle>
                <CardDescription>Claude & API использование</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Загрузка...</div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">${currentMonth?.Anthropic?.cost || 0}</div>
                    <div className="text-sm text-gray-500">Затраты за текущий месяц</div>
                    <div className="mt-2 text-sm text-green-600">+{currentMonth?.Anthropic?.change || 0}% по сравнению с предыдущим месяцем</div>
                    <APIKeyStatus status={currentMonth?.Anthropic?.keyStatus || 'missing'} />
                    <div className="mt-3 flex justify-between text-xs text-gray-600">
                      <div>
                        <div className="font-semibold">Запросы</div>
                        <div>{currentMonth?.Anthropic?.requests?.toLocaleString() || 0}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Токены</div>
                        <div>{currentMonth?.Anthropic?.tokens?.toLocaleString() || 0}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedService('Anthropic')}
                      className="mt-3 flex items-center justify-center gap-1 w-full px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100"
                    >
                      <Database size={14} />
                      Подробная статистика
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>ChatGPT API</CardTitle>
                <CardDescription>OpenAI платформа</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Загрузка...</div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">${currentMonth?.ChatGPT?.cost || 0}</div>
                    <div className="text-sm text-gray-500">Затраты за текущий месяц</div>
                    <div className="mt-2 text-sm text-green-600">+{currentMonth?.ChatGPT?.change || 0}% по сравнению с предыдущим месяцем</div>
                    <APIKeyStatus status={currentMonth?.ChatGPT?.keyStatus || 'missing'} />
                    <div className="mt-3 flex justify-between text-xs text-gray-600">
                      <div>
                        <div className="font-semibold">Запросы</div>
                        <div>{currentMonth?.ChatGPT?.requests?.toLocaleString() || 0}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Токены</div>
                        <div>{currentMonth?.ChatGPT?.tokens?.toLocaleString() || 0}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedService('ChatGPT')}
                      className="mt-3 flex items-center justify-center gap-1 w-full px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100"
                    >
                      <Database size={14} />
                      Подробная статистика
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Perplexity API</CardTitle>
                <CardDescription>Perplexity использование</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Загрузка...</div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">${currentMonth?.Perplexity?.cost || 0}</div>
                    <div className="text-sm text-gray-500">Затраты за текущий месяц</div>
                    <div className="mt-2 text-sm text-green-600">+{currentMonth?.Perplexity?.change || 0}% по сравнению с предыдущим месяцем</div>
                    <APIKeyStatus status={currentMonth?.Perplexity?.keyStatus || 'missing'} />
                    <div className="mt-3 flex justify-between text-xs text-gray-600">
                      <div>
                        <div className="font-semibold">Запросы</div>
                        <div>{currentMonth?.Perplexity?.requests?.toLocaleString() || 0}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Токены</div>
                        <div>{currentMonth?.Perplexity?.tokens?.toLocaleString() || 0}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedService('Perplexity')}
                      className="mt-3 flex items-center justify-center gap-1 w-full px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100"
                    >
                      <Database size={14} />
                      Подробная статистика
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {selectedService && (
            <div className="mt-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">Детальная статистика</h3>
                    <button 
                      onClick={() => setSelectedService(null)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Скрыть
                    </button>
                  </div>
                  <ApiDetails 
                    serviceName={selectedService} 
                    data={detailedStats} 
                    loading={detailsLoading}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Затраты по месяцам</CardTitle>
                <CardDescription>Сравнение затрат на API разных сервисов</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-80 flex items-center justify-center">Загрузка данных...</div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={apiUsage}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${value}`} />
                        <Legend />
                        <Bar dataKey="Anthropic" fill="#8884d8" />
                        <Bar dataKey="ChatGPT" fill="#82ca9d" />
                        <Bar dataKey="Perplexity" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Ежедневные запросы</CardTitle>
                <CardDescription>Количество запросов к каждому API сервису</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-80 flex items-center justify-center">Загрузка данных...</div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyRequests}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Anthropic" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="ChatGPT" stroke="#82ca9d" />
                        <Line type="monotone" dataKey="Perplexity" stroke="#ffc658" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard; 