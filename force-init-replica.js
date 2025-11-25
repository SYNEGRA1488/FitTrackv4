// Принудительная инициализация Replica Set
// Подключается напрямую к admin базе

const { MongoClient } = require('mongodb');

async function forceInitReplica() {
  // Пробуем подключиться с разными опциями
  const options = [
    { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 },
    { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, directConnection: true },
  ];

  for (const opts of options) {
    const uri = 'mongodb://127.0.0.1:27017/admin?directConnection=true';
    const client = new MongoClient(uri, opts);

    try {
      console.log('🔄 Попытка подключения...');
      await client.connect();
      console.log('✅ Подключено!');

      const admin = client.db('admin');

      // Пробуем инициализировать
      try {
        console.log('🔄 Инициализация Replica Set...');
        const result = await admin.command({
          replSetInitiate: {
            _id: 'rs0',
            members: [{ _id: 0, host: '127.0.0.1:27017' }]
          }
        });
        
        console.log('✅ Replica Set инициализирован!');
        console.log('Результат:', JSON.stringify(result, null, 2));
        console.log('⏳ Подождите 10-15 секунд для полной инициализации...');
        break;
      } catch (initError) {
        if (initError.message.includes('already initialized')) {
          console.log('✅ Replica Set уже инициализирован!');
          
          // Проверяем статус
          try {
            const status = await admin.command({ replSetGetStatus: 1 });
            console.log('Статус:', status.set);
            console.log('Члены:', status.members.map(m => `${m.name} (${m.stateStr})`).join(', '));
          } catch (e) {
            console.log('⚠️  Не удалось получить статус, но replica set инициализирован');
          }
          break;
        } else {
          console.error('❌ Ошибка инициализации:', initError.message);
        }
      }
    } catch (error) {
      console.error('❌ Ошибка подключения:', error.message);
      if (opts === options[options.length - 1]) {
        console.log('\n💡 MongoDB не может подключиться к самому себе.');
        console.log('Это происходит, когда MongoDB запущен с --replSet, но replica set не инициализирован.');
        console.log('\n📝 Решение:');
        console.log('1. Временно уберите секцию replication из mongod.cfg');
        console.log('2. Перезапустите MongoDB');
        console.log('3. Инициализируйте replica set');
        console.log('4. Верните секцию replication в конфиг');
        console.log('5. Перезапустите MongoDB');  
      }
    } finally {
      await client.close();
    }
  }
}

forceInitReplica();

