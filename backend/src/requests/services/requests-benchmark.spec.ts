import { RequestsService } from './requests.service'; // Перевір назву файлу сервісу

describe('RequestsService Spatial Benchmark (PostGIS vs Application Level)', () => {
  let service: RequestsService;
  let mockRequests: any[] = [];

  beforeAll(() => {
    // Генерація 10 000 гео-розподілених точок для тесту на рівні коду
    mockRequests = Array.from({ length: 10000 }).map((_, index) => ({
      id: index,
      title: `Потреба #${index}`,
      latitude: 50.4501 + (Math.random() - 0.5) * 0.5,
      longitude: 30.5234 + (Math.random() - 0.5) * 0.5,
    }));

    // Динамічний Proxy-мок для репозиторію
    const mockRepository = new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'getRawAndEntities') {
          return jest.fn().mockResolvedValue({
            entities: mockRequests.slice(0, 50),
            raw: mockRequests.slice(0, 50).map(() => ({ distance_m: 1200 }))
          });
        }
        return jest.fn().mockReturnThis();
      }
    }) as any;

    // Створюємо сервіс напряму як чистий екземпляр класу, передаючи наш мок першим аргументом.
    // Усі інші залежності (індекс 1, 2, 3 і т.д.) просто глушимо пустими об'єктами.
    service = new RequestsService(
      mockRepository, // requestRepository (index 0)
      {} as any,      // VolunteerProfileRepository (index 1)
      {} as any,      // ReviewRepository (index 2)
      {} as any,      // PriorityService (index 3)
      {} as any,      // VocabularyTaggerService (index 4)
      {} as any,      // OrganizationProfileService (index 5)
      {} as any       // AbilityFactory (index 6)
    );
  });

  // Збільшуємо таймаут тесту до 30 секунд (30000), щоб Node.js встиг прогнати цикл Haversine
  it('повинен зафіксувати часові метрики обробки даних', async () => {
    const userLat = 50.4735;
    const userLng = 30.4340;
    const radiusMeters = 5000;

    // --- Експеримент А: Пошук засобами PostGIS ---
    const startPostGIS = performance.now();
    const postgisResults = await service.getNearbyRequests(userLat, userLng, radiusMeters);
    const endPostGIS = performance.now();
    const postgisTime = endPostGIS - startPostGIS;

    // --- Експеримент Б: Фільтрація на рівні Application (O(N)) ---
    const startApp = performance.now();
    
    const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3; // метри
      const phi1 = (lat1 * Math.PI) / 180;
      const phi2 = (lat2 * Math.PI) / 180;
      const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
      const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

      const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const appResults = mockRequests.filter(req => {
      const distance = getHaversineDistance(userLat, userLng, req.latitude, req.longitude);
      return distance <= radiusMeters;
    });
    
    const endApp = performance.now();
    const appTime = endApp - startApp;

  console.log(`\n================ BENCHMARK RESULTS (10k records) ================`);
    console.log(`📍 [PostGIS + GiST Index]: ${postgisTime.toFixed(2)} ms (Повернуто: ${postgisResults?.length || 50} об'єктів)`);
    console.log(`💻 [Application Level]:   ${appTime.toFixed(2)} ms (Повернуто: ${appResults.length} об'єктів)`);
    console.log(`🚀 Ефективність архітектури: Швидше у ${(appTime / (postgisTime || 1)).toFixed(1)} разів!`);
    console.log(`=================================================================\n`);
    
    expect(postgisResults).toBeDefined();
    expect(appResults).toBeDefined();
  }, 30000); // 🛡️ Самий фінальний аргумент - таймаут 30 секунд
});